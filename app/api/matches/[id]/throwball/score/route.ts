import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ScoreRequest = {
  team: 1 | 2;
  attackerId?: number | null;
  opponentPlayerId?: number | null;
  pointReason?: string;
};

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const matchId = Number(id);

    // =====================================================
    // VALIDATE MATCH ID
    // =====================================================

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
    // READ REQUEST
    // =====================================================

    const body = (await request.json()) as ScoreRequest;

    if (body.team !== 1 && body.team !== 2) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid team.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // PLAYER DATA
    // =====================================================

    const attackerId =
      body.attackerId !== undefined &&
      body.attackerId !== null
        ? Number(body.attackerId)
        : null;

    const opponentPlayerId =
      body.opponentPlayerId !== undefined &&
      body.opponentPlayerId !== null
        ? Number(body.opponentPlayerId)
        : null;

    const pointReason = String(
      body.pointReason ?? "SUCCESSFUL_ATTACK"
    )
      .trim()
      .toUpperCase();

    // =====================================================
    // VALIDATE ATTACKER
    // =====================================================

    if (
      attackerId !== null &&
      (!Number.isInteger(attackerId) || attackerId <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid attacker.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // VALIDATE OPPONENT
    // =====================================================

    if (
      opponentPlayerId !== null &&
      (!Number.isInteger(opponentPlayerId) ||
        opponentPlayerId <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid opponent player.",
        },
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
        game: true,

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

    const gameName =
      match.game?.name?.trim().toLowerCase() ?? "";

    const sportType =
      match.game?.sportType?.trim().toUpperCase() ?? "";

    const isThrowball =
      gameName === "throwball" ||
      sportType === "THROWBALL";

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
    // GET THROWBALL SCORE
    // =====================================================

    let score =
      await prisma.throwballMatchScore.findUnique({
        where: {
          matchId,
        },
      });

    // =====================================================
    // CREATE SCORE IF MISSING
    // =====================================================

    if (!score) {
      score =
        await prisma.throwballMatchScore.create({
          data: {
            matchId,

            team1Id: match.team1Id,
            team2Id: match.team2Id,

            team1Score: 0,
            team2Score: 0,

            status: "LIVE",

            winnerTeamId: null,
          },
        });
    }

    // =====================================================
    // CHECK COMPLETED
    // =====================================================

    if (score.status === "COMPLETED") {
      return NextResponse.json(
        {
          success: false,
          error: "Throwball match is already completed.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // WINNING TEAM FOR THIS POINT
    // =====================================================

    const winningTeamId =
      body.team === 1
        ? score.team1Id
        : score.team2Id;

    // =====================================================
    // VALIDATE ATTACKER
    // =====================================================

    if (attackerId !== null) {
      const winningTeamPlayers =
        body.team === 1
          ? match.team1.players
          : match.team2.players;

      const attackerBelongsToWinningTeam =
        winningTeamPlayers.some(
          (player) => player.id === attackerId
        );

      if (!attackerBelongsToWinningTeam) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Attacker must belong to the team that won the point.",
          },
          { status: 400 }
        );
      }
    }

    // =====================================================
    // VALIDATE OPPONENT
    // =====================================================

    if (opponentPlayerId !== null) {
      const opponentPlayers =
        body.team === 1
          ? match.team2.players
          : match.team1.players;

      const opponentBelongsToOtherTeam =
        opponentPlayers.some(
          (player) => player.id === opponentPlayerId
        );

      if (!opponentBelongsToOtherTeam) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Opponent player must belong to the opposing team.",
          },
          { status: 400 }
        );
      }
    }

    // =====================================================
    // CURRENT SCORES
    // =====================================================

    let team1Score = score.team1Score;
    let team2Score = score.team2Score;

    // =====================================================
    // ADD ONE POINT
    // =====================================================

    if (body.team === 1) {
      team1Score++;
    } else {
      team2Score++;
    }

    // =====================================================
    // CHECK WINNER
    //
    // RULE:
    // - First team must reach at least 11
    // - Must have a 2-point lead
    //
    // Examples:
    //
    // 11 - 9  -> Team 1 wins
    // 11 - 10 -> NOT complete
    // 12 - 10 -> Team 1 wins
    // 12 - 11 -> NOT complete
    // 13 - 11 -> Team 1 wins
    // =====================================================

    let completed = false;
    let winnerTeamId: number | null = null;

    if (
      team1Score >= 11 &&
      team1Score - team2Score >= 2
    ) {
      completed = true;
      winnerTeamId = score.team1Id;
    }

    if (
      team2Score >= 11 &&
      team2Score - team1Score >= 2
    ) {
      completed = true;
      winnerTeamId = score.team2Id;
    }

    // =====================================================
    // POINT NUMBER
    // =====================================================

    const pointCount =
      await prisma.throwballPoint.count({
        where: {
          matchId,
        },
      });

    const pointNumber = pointCount + 1;

    // =====================================================
    // SAVE POINT
    // =====================================================

    const point =
      await prisma.throwballPoint.create({
        data: {
          matchId,

          pointNumber,

          winningTeamId,

          attackerId,

          opponentPlayerId,

          pointReason,
        },
      });

    // =====================================================
    // MATCH COMPLETED
    // =====================================================

    if (completed && winnerTeamId !== null) {
      const matchResult =
        winnerTeamId === score.team1Id
          ? "TEAM1_WIN"
          : "TEAM2_WIN";

      // ===================================================
      // UPDATE THROWBALL SCORE
      // ===================================================

      const updatedScore =
        await prisma.throwballMatchScore.update({
          where: {
            matchId,
          },

          data: {
            team1Score,
            team2Score,

            status: "COMPLETED",

            winnerTeamId,
          },

          include: {
            team1: true,
            team2: true,
            winnerTeam: true,
          },
        });

      // ===================================================
      // UPDATE MAIN MATCH
      // ===================================================

      const updatedMatch =
        await prisma.match.update({
          where: {
            id: matchId,
          },

          data: {
            status: "COMPLETED",

            winnerTeamId,

            result: matchResult,

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

      // ===================================================
      // RETURN COMPLETED
      // ===================================================

      return NextResponse.json({
        success: true,

        completed: true,

        score: updatedScore,

        match: updatedMatch,

        point,
      });
    }

    // =====================================================
    // UPDATE LIVE SCORE
    // =====================================================

    const updatedScore =
      await prisma.throwballMatchScore.update({
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

    // =====================================================
    // UPDATE MAIN MATCH SCORE
    // =====================================================

    await prisma.match.update({
      where: {
        id: matchId,
      },

      data: {
        team1Score,
        team2Score,
      },
    });

    // =====================================================
    // RETURN LIVE SCORE
    // =====================================================

    return NextResponse.json({
      success: true,

      completed: false,

      score: updatedScore,

      point,
    });
  } catch (error) {
    console.error(
      "THROWBALL SCORE API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to update Throwball score.",
      },
      { status: 500 }
    );
  }
}