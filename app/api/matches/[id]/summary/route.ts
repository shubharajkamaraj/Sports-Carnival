import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  req: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const matchId = Number(id);

    if (!Number.isInteger(matchId) || matchId <= 0) {
      return NextResponse.json(
        {
          error: "Invalid match ID.",
        },
        {
          status: 400,
        }
      );
    }

    const match = await prisma.match.findUnique({
      where: {
        id: matchId,
      },

      include: {
        team1: {
          include: {
            players: true,
          },
        },

        team2: {
          include: {
            players: true,
          },
        },

        winnerTeam: true,

        cricketInnings: {
          include: {
            battingTeam: {
              include: {
                players: true,
              },
            },

            bowlingTeam: {
              include: {
                players: true,
              },
            },

            ballEvents: {
              orderBy: [
                {
                  overNumber: "asc",
                },
                {
                  ballNumber: "asc",
                },
                {
                  id: "asc",
                },
              ],
            },
          },

          orderBy: {
            inningsNumber: "asc",
          },
        },

        awards: {
          include: {
            player: true,
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json(
        {
          error: "Match not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        match,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "MATCH SUMMARY API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load match summary.",
      },
      {
        status: 500,
      }
    );
  }
}