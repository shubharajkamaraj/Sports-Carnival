import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  _request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;

    const matchId = Number(id);

    if (!Number.isInteger(matchId)) {
      return NextResponse.json(
        {
          error: "Invalid match ID.",
        },
        { status: 400 }
      );
    }

    const match =
      await prisma.match.findUnique({
        where: {
          id: matchId,
        },

        include: {
          game: true,

          team1: {
            include: {
              players: {
                orderBy: {
                  jerseyNo: "asc",
                },
              },
            },
          },

          team2: {
            include: {
              players: {
                orderBy: {
                  jerseyNo: "asc",
                },
              },
            },
          },

          handballScore: true,

          handballEvents: {
            include: {
              player: true,
              team: true,
            },

            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

    if (!match) {
      return NextResponse.json(
        {
          error: "Match not found.",
        },
        { status: 404 }
      );
    }

    if (match.game.sportType !== "HANDBALL") {
      return NextResponse.json(
        {
          error:
            "This is not a handball match.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      id: match.id,

      status: match.status,

      game: match.game,

      team1: match.team1,

      team2: match.team2,

      handballScore:
        match.handballScore,

      handballEvents:
        match.handballEvents,
    });
  } catch (error) {
    console.error(
      "GET HANDBALL MATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load handball match.",
      },
      { status: 500 }
    );
  }
}