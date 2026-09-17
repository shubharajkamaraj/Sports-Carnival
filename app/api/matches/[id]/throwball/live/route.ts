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

const TARGET_POINTS = 11;
const WINNING_DIFFERENCE = 2;

/* =========================================================
   POST THROWBALL POINT
========================================================= */

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

    if (
      !Number.isInteger(matchId) ||
      matchId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid match ID.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       READ BODY
    ===================================================== */

    const body =
      (await request.json()) as ScoreRequest;

    if (
      body.team !== 1 &&
      body.team !== 2
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid team.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       NORMALIZE PLAYER IDS
    ===================================================== */

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

    const pointReason =
      String(
        body.pointReason ??
          "SUCCESSFUL_ATTACK"
      )
        .trim()
        .toUpperCase();

    /* =====================================================
       VALIDATE ATTACKER
    ===================================================== */

    if (
      attackerId !== null &&
      (!Number.isInteger(attackerId) ||
        attackerId <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid attacker.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDATE OPPONENT
    ===================================================== */

    if (
      opponentPlayerId !== null &&
      (!Number.isInteger(
        opponentPlayerId
      ) ||
        opponentPlayerId <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid opponent.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       LOAD MATCH
    ===================================================== */

    const match =
      await prisma.match.findUnique({
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

    /* =====================================================
       CHECK THROWBALL
    ===================================================== */

    const gameName =
      match.game?.name
        ?.trim()
        .toLowerCase() ?? "";

    const sportType =
      match.game?.sportType
        ?.trim()
        .toLowerCase() ?? "";

    const isThrowball =
      gameName.includes("throwball") ||
      sportType === "throwball";

    if (!isThrowball) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This match is not a Throwball match.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       GET SCORE
    ===================================================== */

    let score =
      match.throwballScore;

    /* =====================================================
       CREATE SCORE IF MISSING
    ===================================================== */

    if (!score) {
      score =
        await prisma.throwballMatchScore.create({
          data: {
            matchId,

            team1Id:
              match.team1Id,

            team2Id:
              match.team2Id,

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
        });
    }

    /* =====================================================
       CHECK COMPLETED
    ===================================================== */

    if (score.status === "COMPLETED") {
      return NextResponse.json(
        {
          success: false,

          error:
            "Throwball match is already completed.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDATE ATTACKER
    ===================================================== */

    if (attackerId !== null) {
      const attackingTeamPlayers =
        body.team === 1
          ? match.team1.players
          : match.team2.players;

      const attackerValid =
        attackingTeamPlayers.some(
          (player) =>
            player.id === attackerId
        );

      if (!attackerValid) {
        return NextResponse.json(
          {
            success: false,

            error:
              "Attacker must belong to the team winning the point.",
          },
          { status: 400 }
        );
      }
    }

    /* =====================================================
       VALIDATE OPPONENT
    ===================================================== */

    if (opponentPlayerId !== null) {
      const opponentTeamPlayers =
        body.team === 1
          ? match.team2.players
          : match.team1.players;

      const opponentValid =
        opponentTeamPlayers.some(
          (player) =>
            player.id ===
            opponentPlayerId
        );

      if (!opponentValid) {
        return NextResponse.json(
          {
            success: false,

            error:
              "Opponent must belong to the opposing team.",
          },
          { status: 400 }
        );
      }
    }

    /* =====================================================
       CURRENT SCORE
    ===================================================== */

    let team1Score =
      score.team1Score;

    let team2Score =
      score.team2Score;

    /* =====================================================
       ADD POINT
    ===================================================== */

    if (body.team === 1) {
      team1Score++;
    } else {
      team2Score++;
    }

    /* =====================================================
       CHECK WINNER
       
       Example:
       
       11 - 9  = winner
       11 - 10 = continue
       12 - 10 = winner
       12 - 11 = continue
    ===================================================== */

    const team1Winner =
      team1Score >= TARGET_POINTS &&
      team1Score - team2Score >=
        WINNING_DIFFERENCE;

    const team2Winner =
      team2Score >= TARGET_POINTS &&
      team2Score - team1Score >=
        WINNING_DIFFERENCE;

    const completed =
      team1Winner ||
      team2Winner;

    /* =====================================================
       WINNING TEAM
    ===================================================== */

    const winningTeamId =
      body.team === 1
        ? score.team1Id
        : score.team2Id;

    /* =====================================================
       POINT NUMBER
    ===================================================== */

    const existingPoints =
      await prisma.throwballPoint.count({
        where: {
          matchId,
        },
      });

    const pointNumber =
      existingPoints + 1;

    /* =====================================================
       SAVE POINT HISTORY
    ===================================================== */

    const point =
      await prisma.throwballPoint.create({
        data: {
          matchId,

          setNumber: 1,

          pointNumber,

          winningTeamId,

          attackerId,

          opponentPlayerId,

          pointReason,
        },
      });

    /* =====================================================
       MATCH COMPLETED
    ===================================================== */

    if (completed) {
      const winnerTeamId =
        team1Winner
          ? score.team1Id
          : score.team2Id;

      const result =
        winnerTeamId ===
        score.team1Id
          ? "TEAM1_WIN"
          : "TEAM2_WIN";

      /* ===================================================
         UPDATE THROWBALL SCORE
      =================================================== */

      const updatedScore =
        await prisma.throwballMatchScore.update({
          where: {
            matchId,
          },

          data: {
            team1Score,

            team2Score,

            currentSet: 1,

            team1Set1:
              team1Score,

            team2Set1:
              team2Score,

            status:
              "COMPLETED",

            winnerTeamId,
          },

          include: {
            team1: true,

            team2: true,

            winnerTeam: true,
          },
        });

      /* ===================================================
         UPDATE MAIN MATCH
      =================================================== */

      const updatedMatch =
        await prisma.match.update({
          where: {
            id: matchId,
          },

          data: {
            status:
              "COMPLETED",

            winnerTeamId,

            result,

            team1Score,

            team2Score,
          },

          include: {
            winnerTeam: true,
          },
        });

      /* ===================================================
         RETURN COMPLETED
      =================================================== */

      return NextResponse.json({
        success: true,

        completed: true,

        score:
          updatedScore,

        match:
          updatedMatch,

        point,
      });
    }

    /* =====================================================
       UPDATE LIVE SCORE
    ===================================================== */

    const updatedScore =
      await prisma.throwballMatchScore.update({
        where: {
          matchId,
        },

        data: {
          team1Score,

          team2Score,

          currentSet: 1,

          team1Set1:
            team1Score,

          team2Set1:
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

    /* =====================================================
       UPDATE MAIN MATCH LIVE SCORE
    ===================================================== */

    await prisma.match.update({
      where: {
        id: matchId,
      },

      data: {
        status: "LIVE",

        team1Score,

        team2Score,

        winnerTeamId: null,

        result: null,
      },
    });

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json({
      success: true,

      completed: false,

      score:
        updatedScore,

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