import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const gameId = Number(id);

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid game ID.",
        },
        {
          status: 400,
        }
      );
    }

    const game = await prisma.game.findUnique({
      where: {
        id: gameId,
      },
      include: {
        competitionGameParticipations: {
          include: {
            team: {
              include: {
                players: true,
              },
            },
          },
          orderBy: {
            id: "asc",
          },
        },

        competitionGameResults: {
          include: {
            team: true,
            player: true,
          },
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    if (!game) {
      return NextResponse.json(
        {
          success: false,
          error: "Game not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      game,
    });
  } catch (error) {
    console.error("GET COMPETITION GAME ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load game.",
      },
      {
        status: 500,
      }
    );
  }
}