import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    // =====================================================
    // PARAMS
    // =====================================================

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

    // =====================================================
    // GET MATCH + SCORE
    // =====================================================

    const match = await prisma.match.findUnique({
      where: {
        id: matchId,
      },

      include: {
        game: true,
        team1: true,
        team2: true,

        throwballScore: true,
      },
    });

    if (!match) {
      return NextResponse.json(
        {
          success: false,
          error: "Match not found.",
        },
        { status: 404 }
      );
    }

    // =====================================================
    // CHECK THROWBALL
    // =====================================================

    const sportType =
      match.game?.sportType
        ?.trim()
        .toUpperCase() ?? "";

    const gameName =
      match.game?.name
        ?.trim()
        .toLowerCase() ?? "";

    const isThrowball =
      sportType === "THROWBALL" ||
      gameName === "throwball";

    if (!isThrowball) {
      return NextResponse.json(
        {
          success: false,
          error: "This match is not a Throwball match.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // SCORE MUST EXIST
    // =====================================================

    const score =
      match.throwballScore;

    if (!score) {
      return NextResponse.json(
        {
          success: false,
          error: "Throwball score not found.",
        },
        { status: 404 }
      );
    }

    // =====================================================
    // DO NOT UNDO COMPLETED MATCH
    // =====================================================

    if (score.status === "COMPLETED") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot undo a point after the Throwball match is completed.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // FIND LAST POINT
    // =====================================================

    const lastPoint =
      await prisma.throwballPoint.findFirst({
        where: {
          matchId,
        },

        orderBy: [
          {
            pointNumber: "desc",
          },
          {
            id: "desc",
          },
        ],
      });

    // =====================================================
    // NO POINT TO UNDO
    // =====================================================

    if (!lastPoint) {
      return NextResponse.json(
        {
          success: false,
          error: "There is no point to undo.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // DETERMINE TEAM THAT WON LAST POINT
    // =====================================================

    let team1Score =
      score.team1Score;

    let team2Score =
      score.team2Score;

    if (
      lastPoint.winningTeamId ===
      score.team1Id
    ) {
      team1Score = Math.max(
        0,
        team1Score - 1
      );
    } else if (
      lastPoint.winningTeamId ===
      score.team2Id
    ) {
      team2Score = Math.max(
        0,
        team2Score - 1
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error:
            "Last point belongs to an invalid team.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // TRANSACTION
    // =====================================================

    const result =
      await prisma.$transaction(
        async (tx) => {
          // -----------------------------------------------
          // DELETE LAST POINT
          // -----------------------------------------------

          await tx.throwballPoint.delete({
            where: {
              id: lastPoint.id,
            },
          });

          // -----------------------------------------------
          // UPDATE THROWBALL SCORE
          // -----------------------------------------------

          const updatedScore =
            await tx.throwballMatchScore.update({
              where: {
                matchId,
              },

              data: {
                team1Score,
                team2Score,

                status: "LIVE",

                winnerTeamId: null,
              },

              include: {
                team1: true,
                team2: true,
                winnerTeam: true,
              },
            });

          // -----------------------------------------------
          // UPDATE MAIN MATCH
          // -----------------------------------------------

          const updatedMatch =
            await tx.match.update({
              where: {
                id: matchId,
              },

              data: {
                status: "LIVE",

                winnerTeamId: null,

                result: null,

                team1Score,

                team2Score,
              },

              include: {
                game: true,
                team1: true,
                team2: true,
                winnerTeam: true,
              },
            });

          return {
            updatedScore,
            updatedMatch,
          };
        }
      );

    // =====================================================
    // GET UPDATED POINT HISTORY
    // =====================================================

    const remainingPoints =
      await prisma.throwballPoint.findMany({
        where: {
          matchId,
        },

        orderBy: {
          pointNumber: "asc",
        },

        include: {
          winningTeam: true,
          attacker: true,
          opponentPlayer: true,
        },
      });

    // =====================================================
    // RESPONSE
    // =====================================================

    return NextResponse.json({
      success: true,

      message:
        `Point #${lastPoint.pointNumber} undone successfully.`,

      deletedPoint: {
        id: lastPoint.id,
        pointNumber:
          lastPoint.pointNumber,
        winningTeamId:
          lastPoint.winningTeamId,
        attackerId:
          lastPoint.attackerId,
        opponentPlayerId:
          lastPoint.opponentPlayerId,
        pointReason:
          lastPoint.pointReason,
      },

      score:
        result.updatedScore,

      match:
        result.updatedMatch,

      points:
        remainingPoints,
    });
  } catch (error) {
    console.error(
      "THROWBALL UNDO ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to undo last Throwball point.",
      },
      { status: 500 }
    );
  }
}