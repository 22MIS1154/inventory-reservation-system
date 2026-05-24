import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const expiredReservations =
      await prisma.reservation.findMany({
        where: {
          status: "PENDING",
          expiresAt: {
            lt: new Date(),
          },
        },
      });

    for (const reservation of expiredReservations) {
      const inventory = await prisma.inventory.findFirst({
        where: {
          productId: reservation.productId,
          warehouseId: reservation.warehouseId,
        },
      });

      if (inventory) {
        await prisma.inventory.update({
          where: {
            id: inventory.id,
          },
          data: {
            reservedStock:
              inventory.reservedStock -
              reservation.quantity,
          },
        });
      }

      await prisma.reservation.update({
        where: {
          id: reservation.id,
        },
        data: {
          status: "RELEASED",
        },
      });
    }

    return NextResponse.json({
      message: "Expired reservations released",
      count: expiredReservations.length,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to release reservations" },
      { status: 500 }
    );
  }
}