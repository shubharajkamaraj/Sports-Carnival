import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const matchId = Number(id);

    /* =====================================================
       VALIDATE MATCH ID
    ===================================================== */

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
       LOAD MATCH
    ===================================================== */

    const match = await prisma.match.findUnique({
      where: {
        id: matchId,
      },

      include: {
        team1: true,
        team2: true,

        game: true,

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
       CHECK GAME
       
       IMPORTANT:
       Match.game is a Game relation in your schema.
       Therefore use match.game.name.
    ===================================================== */

    const gameName =
      match.game?.name?.trim().toLowerCase() ?? "";

    const sportType =
      match.game?.sportType
        ?.trim()
        .toUpperCase() ?? "";

    const isThrowball =
      sportType === "THROWBALL" ||
      gameName.includes("throwball");

    if (!isThrowball) {
      return NextResponse.json(
        {
          success: false,
          error: "This match is not a Throwball match.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       CHECK EXISTING SCORE
       
       This makes the API safe to call multiple times.
    ===================================================== */

    if (match.throwballScore) {
      return NextResponse.json(
        {
          success: true,
          alreadyStarted: true,
          score: match.throwballScore,
        },
        { status: 200 }
      );
    }

    /* =====================================================
       CREATE THROWBALL SCORE
    ===================================================== */

    const score =
      await prisma.throwballMatchScore.create({
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

          winnerTeamId: null,
        },

        include: {
          team1: true,
          team2: true,
          winnerTeam: true,
        },
      });

    /* =====================================================
       UPDATE MAIN MATCH STATUS
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

        message:
          "Throwball match started successfully.",

        score,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "THROWBALL START ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to start Throwball match.",
      },
      { status: 500 }
    );
  }
}