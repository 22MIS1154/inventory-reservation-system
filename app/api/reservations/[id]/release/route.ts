import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } =
      await context.params;

    const reservationId =
      parseInt(id);

    const result =
      await prisma.$transaction(
        async (tx) => {
          // Find reservation
          const reservation =
            await tx.reservation.findUnique(
              {
                where: {
                  id: reservationId,
                },
              }
            );

          if (!reservation) {
            const error: any =
              new Error(
                "Reservation not found"
              );

            error.status = 404;

            throw error;
          }

          // Already released
          if (
            reservation.status ===
            "RELEASED"
          ) {
            const error: any =
              new Error(
                "Reservation already released"
              );

            error.status = 400;

            throw error;
          }

          // Find inventory
          const inventory =
            await tx.inventory.findFirst(
              {
                where: {
                  productId:
                    reservation.productId,
                  warehouseId:
                    reservation.warehouseId,
                },
              }
            );

          // Return stock
          if (inventory) {
            await tx.inventory.update({
              where: {
                id: inventory.id,
              },
              data: {
                reservedStock: {
                  decrement:
                    reservation.quantity,
                },
              },
            });
          }

          // Update reservation status
          const updatedReservation =
            await tx.reservation.update({
              where: {
                id: reservationId,
              },
              data: {
                status: "RELEASED",
              },
            });

          return updatedReservation;
        }
      );

    return NextResponse.json({
      message:
        "Reservation released successfully",

      reservation: result,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error.message ||
          "Release failed",
      },
      {
        status:
          error.status || 500,
      }
    );
  }
}