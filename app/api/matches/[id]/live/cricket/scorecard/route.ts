import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const matchId = Number(id);

    if (!matchId) {
      return NextResponse.json(
        {
          error: "Invalid match ID.",
        },
        { status: 400 }
      );
    }

    const match = await prisma.match.findUnique({
      where: {
        id: matchId,
      },

      include: {
        team1: true,
        team2: true,
        score: true,

        cricketBattingStats: {
          include: {
            player: true,
          },

          orderBy: {
            runs: "desc",
          },
        },

        cricketBowlingStats: {
          include: {
            player: true,
          },

          orderBy: [
            {
              wickets: "desc",
            },
            {
              runs: "asc",
            },
          ],
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

    return NextResponse.json({
      matchId: match.id,

      teams: {
        team1: match.team1,
        team2: match.team2,
      },

      score: match.score,

      batting: match.cricketBattingStats,

      bowling: match.cricketBowlingStats,
    });
  } catch (error) {
    console.error(
      "CRICKET SCORECARD ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load cricket scorecard.",
      },
      { status: 500 }
    );
  }
}