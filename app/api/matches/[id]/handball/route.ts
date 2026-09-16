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
    // =====================================================
    // MATCH ID
    // =====================================================

    const { id } = await params;

    const matchId = Number(id);

    if (!matchId || Number.isNaN(matchId)) {
      return NextResponse.json(
        { error: "Invalid match ID." },
        { status: 400 }
      );
    }

    // =====================================================
    // GET MATCH
    // =====================================================

    const match = await prisma.match.findUnique({
      where: {
        id: matchId,
      },

      include: {
        // =================================================
        // GAME
        // =================================================

        game: true,

        // =================================================
        // TEAM 1
        // =================================================

        team1: {
          include: {
            players: {
              orderBy: {
                jerseyNo: "asc",
              },
            },
          },
        },

        // =================================================
        // TEAM 2
        // =================================================

        team2: {
          include: {
            players: {
              orderBy: {
                jerseyNo: "asc",
              },
            },
          },
        },

        // =================================================
        // HANDBALL SCORE
        // =================================================

        handballScore: true,

        // =================================================
        // HANDBALL EVENTS
        // =================================================

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

    // =====================================================
    // MATCH NOT FOUND
    // =====================================================

    if (!match) {
      return NextResponse.json(
        { error: "Match not found." },
        { status: 404 }
      );
    }

    // =====================================================
    // CHECK HANDBALL
    // =====================================================

    if (match.game.sportType !== "HANDBALL") {
      return NextResponse.json(
        { error: "This is not a handball match." },
        { status: 400 }
      );
    }

    // =====================================================
    // RETURN HANDBALL MATCH
    // =====================================================

    return NextResponse.json({
      id: match.id,

      status: match.status,

      matchDate: match.matchDate,

      venue: match.venue,

      // ===================================================
      // GAME
      // ===================================================

      game: match.game,

      // ===================================================
      // TEAM 1
      // ===================================================

      team1: match.team1,

      // ===================================================
      // TEAM 2
      // ===================================================

      team2: match.team2,

      // ===================================================
      // HANDBALL SCORE
      // ===================================================

      handballScore: match.handballScore,

      // ===================================================
      // HANDBALL EVENTS
      // ===================================================

      handballEvents: match.handballEvents,
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
      {
        status: 500,
      }
    );
  }
}