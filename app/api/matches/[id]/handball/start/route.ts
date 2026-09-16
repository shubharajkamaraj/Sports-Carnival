import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncHandballScore } from "../../../../../../lib/handballScore";

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } =
      await context.params;

    const matchId =
      Number(id);

    if (
      !Number.isInteger(
        matchId
      ) ||
      matchId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid match ID.",
        },
        {
          status: 400,
        }
      );
    }

    const match =
      await prisma.match.findUnique({
        where: {
          id: matchId,
        },

        select: {
          id: true,

          status: true,

          team1Id: true,

          team2Id: true,

          handballScore: true,

          handballEvents: {
            select: {
              id: true,
            },
          },
        },
      });

    if (!match) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Match not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      match.status ===
        "COMPLETED" ||
      match.status ===
        "CANCELLED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This match cannot be started.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       IMPORTANT:

       DO NOT RESET SCORE.
       DO NOT DELETE EVENTS.
    ===================================================== */

    await prisma.match.update({
      where: {
        id: matchId,
      },

      data: {
        status: "LIVE",

        result: null,

        winnerTeamId: null,
      },
    });

    /* =====================================================
       CREATE SCORE ONLY IF MISSING
    ===================================================== */

    if (!match.handballScore) {
      await prisma.handballMatchScore.create({
        data: {
          matchId,

          team1Id:
            match.team1Id,

          team2Id:
            match.team2Id,

          team1Score: 0,

          team2Score: 0,
        },
      });
    }

    /* =====================================================
       SYNC EXISTING EVENTS
    ===================================================== */

    const score =
      await syncHandballScore(
        matchId
      );

    return NextResponse.json({
      success: true,

      matchId,

      status: "LIVE",

      score,
    });
  } catch (error) {
    console.error(
      "HANDBALL START ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to start handball match.",
      },
      {
        status: 500,
      }
    );
  }
}
