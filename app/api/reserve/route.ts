import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { productId, warehouseName } =
      body;

    const result =
      await prisma.$transaction(
        async (tx: any) => {
          // Find inventory
          const inventory =
            await tx.inventory.findFirst({
              where: {
                productId,
                warehouse: {
                  name: warehouseName,
                },
              },
              include: {
                warehouse: true,
              },
            });

          // Inventory not found
          if (!inventory) {
            const error: any =
              new Error(
                "Inventory not found"
              );

            error.status = 404;

            throw error;
          }

          // Calculate available stock
          const availableStock =
            inventory.totalStock -
            inventory.reservedStock;

          // Out of stock check
          if (availableStock <= 0) {
            const error: any =
              new Error("Out of stock");

            error.status = 409;

            throw error;
          }

          // Update reserved stock safely
          const updatedInventory =
            await tx.inventory.update({
              where: {
                id: inventory.id,
              },
              data: {
                reservedStock: {
                  increment: 1,
                },
              },
            });

          // Create reservation
          const reservation =
            await tx.reservation.create({
              data: {
                productId,

                warehouseId:
                  inventory.warehouseId,

                quantity: 1,

                status: "PENDING",

                expiresAt: new Date(
                  Date.now() +
                    30 * 1000
                ),

                inventoryId:
                  inventory.id,
              },
            });

          return {
            updatedInventory,
            reservation,
          };
        }
      );

    return NextResponse.json({
      message:
        "Reservation successful",

      reservation:
        result.reservation,

      expiresAt:
        result.reservation.expiresAt,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error.message ||
          "Reservation failed",
      },
      {
        status:
          error.status || 500,
      }
    );
  }
}