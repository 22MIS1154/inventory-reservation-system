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

    const reservation =
      await prisma.reservation.findUnique(
        {
          where: {
            id: reservationId,
          },
        }
      );

    if (!reservation) {
      return NextResponse.json(
        {
          error:
            "Reservation not found",
        },
        {
          status: 404,
        }
      );
    }

    if (
      reservation.status ===
      "CONFIRMED"
    ) {
      return NextResponse.json(
        {
          error:
            "Already confirmed",
        },
        {
          status: 400,
        }
      );
    }

    if (
      reservation.status ===
      "RELEASED"
    ) {
      return NextResponse.json(
        {
          error:
            "Reservation already released",
        },
        {
          status: 400,
        }
      );
    }

    if (
      new Date() >
      reservation.expiresAt
    ) {
      return NextResponse.json(
        {
          error:
            "Reservation expired",
        },
        {
          status: 400,
        }
      );
    }

    const updatedReservation =
      await prisma.reservation.update(
        {
          where: {
            id: reservationId,
          },
          data: {
            status: "CONFIRMED",
          },
        }
      );

    return NextResponse.json({
      message:
        "Reservation confirmed successfully",

      reservation:
        updatedReservation,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error.message ||
          "Confirmation failed",
      },
      {
        status: 500,
      }
    );
  }
}