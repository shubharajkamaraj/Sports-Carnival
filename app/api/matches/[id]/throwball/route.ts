import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/* =========================================================
   CHECK WHETHER GAME IS THROWBALL
========================================================= */

function isThrowballGame(game: {
  name: string;
  sportType?: string | null;
}) {
  const name = game.name?.trim().toLowerCase() ?? "";
  const sportType = game.sportType?.trim().toLowerCase() ?? "";

  return (
    sportType === "throwball" ||
    name === "throwball" ||
    name.includes("throwball")
  );
}

/* =========================================================
   GET THROWBALL MATCH
========================================================= */

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const matchId = Number(id);

    if (!Number.isInteger(matchId) || matchId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid match ID.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       LOAD MATCH + TEAMS + PLAYERS
    ===================================================== */

    const match = await prisma.match.findUnique({
      where: {
        id: matchId,
      },

      include: {
        game: true,

        team1: {
          include: {
            players: {
              orderBy: {
                name: "asc",
              },
            },
          },
        },

        team2: {
          include: {
            players: {
              orderBy: {
                name: "asc",
              },
            },
          },
        },

        throwballScore: {
          include: {
            team1: true,
            team2: true,
            winnerTeam: true,
          },
        },

        throwballEvents: true,
        throwballPoints: true,
      },
    });

    /* =====================================================
       MATCH NOT FOUND
    ===================================================== */

    if (!match) {
      return NextResponse.json(
        {
          success: false,
          error: "Match not found.",
        },
        { status: 404 }
      );
    }

    /* =====================================================
       CHECK THROWBALL
    ===================================================== */

    if (!isThrowballGame(match.game)) {
      return NextResponse.json(
        {
          success: false,

          error: "This match is not a Throwball match.",

          debug: {
            matchId: match.id,
            gameId: match.gameId,
            gameName: match.game?.name ?? null,
            sportType: match.game?.sportType ?? null,
          },
        },
        { status: 400 }
      );
    }

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        match,

        /* Easy access for frontend */
        teams: {
          team1: {
            id: match.team1.id,
            name: match.team1.name,
            captain: match.team1.captain,
            players: match.team1.players,
          },

          team2: {
            id: match.team2.id,
            name: match.team2.name,
            captain: match.team2.captain,
            players: match.team2.players,
          },
        },

        players: {
          team1: match.team1.players,
          team2: match.team2.players,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("THROWBALL GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to load Throwball match.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   CREATE THROWBALL SCORE
========================================================= */

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const matchId = Number(id);

    if (!Number.isInteger(matchId) || matchId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid match ID.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       LOAD MATCH + GAME
    ===================================================== */

    const match = await prisma.match.findUnique({
      where: {
        id: matchId,
      },

      include: {
        game: true,

        team1: {
          include: {
            players: {
              orderBy: {
                name: "asc",
              },
            },
          },
        },

        team2: {
          include: {
            players: {
              orderBy: {
                name: "asc",
              },
            },
          },
        },

        throwballScore: true,
      },
    });

    /* =====================================================
       MATCH NOT FOUND
    ===================================================== */

    if (!match) {
      return NextResponse.json(
        {
          success: false,
          error: "Match not found.",
        },
        { status: 404 }
      );
    }

    /* =====================================================
       CHECK THROWBALL
    ===================================================== */

    if (!isThrowballGame(match.game)) {
      return NextResponse.json(
        {
          success: false,

          error: "This match is not a Throwball match.",

          debug: {
            matchId: match.id,
            gameId: match.gameId,
            gameName: match.game?.name ?? null,
            sportType: match.game?.sportType ?? null,
          },
        },
        { status: 400 }
      );
    }

    /* =====================================================
       ALREADY CREATED
    ===================================================== */

    if (match.throwballScore) {
      return NextResponse.json(
        {
          success: true,

          alreadyStarted: true,

          score: match.throwballScore,

          players: {
            team1: match.team1.players,
            team2: match.team2.players,
          },
        },
        { status: 200 }
      );
    }

    /* =====================================================
       CREATE THROWBALL SCORE
    ===================================================== */

    const score = await prisma.throwballMatchScore.create({
      data: {
        matchId,

        team1Id: match.team1Id,
        team2Id: match.team2Id,

        team1Score: 0,
        team2Score: 0,

        currentSet: 1,

        team1Set1: 0,
        team2Set1: 0,

        team1SetsWon: 0,
        team2SetsWon: 0,

        status: "LIVE",
      },

      include: {
        team1: true,
        team2: true,
        winnerTeam: true,
      },
    });

    /* =====================================================
       UPDATE MAIN MATCH
    ===================================================== */

    await prisma.match.update({
      where: {
        id: matchId,
      },

      data: {
        status: "LIVE",
      },
    });

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        alreadyStarted: false,

        score,

        players: {
          team1: match.team1.players,
          team2: match.team2.players,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("THROWBALL START ERROR:", error);

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to create Throwball score.",
      },
      { status: 500 }
    );
  }
}