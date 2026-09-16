import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const games =
      await prisma.game.findMany({
        where: {
          category: {
            not: null,
          },
        },

        select: {
          id: true,
          name: true,
          category: true,
          gameOrder: true,
          sportType: true,
        },

        orderBy: [
          {
            category: "asc",
          },
          {
            gameOrder: "asc",
          },
        ],
      });

    return NextResponse.json({
      success: true,
      games,
    });
  } catch (error) {
    console.error(
      "COMPETITION GAMES API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch competition games.",
      },
      {
        status: 500,
      }
    );
  }
}