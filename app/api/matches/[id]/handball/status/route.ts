import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// =====================================================
// HANDBALL MATCH STATUS API
// =====================================================
//
// START
//   UPCOMING -> LIVE
//
// END
//   LIVE -> COMPLETED
//
// PAUSED is intentionally not used because it does not
// exist in the MatchStatus Prisma enum.
// =====================================================

export async function POST(
  request: Request,
  { params }: Params
) {
  try {
    // ===================================================
    // MATCH ID
    // ===================================================

    const { id } = await params;

    const matchId = Number(id);

    if (
      !Number.isInteger(matchId) ||
      matchId <= 0
    ) {
      return NextResponse.json(
        {
          error: "Invalid match ID.",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // REQUEST BODY
    // ===================================================

    let body: {
      action?: string;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid request body.",
        },
        {
          status: 400,
        }
      );
    }

    const action = body.action;

    // ===================================================
    // VALID ACTIONS
    // ===================================================

    const validActions = [
      "START",
      "END",
    ];

    if (
      !action ||
      !validActions.includes(action)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid action. Use START or END.",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // GET MATCH
    // ===================================================

    const match =
      await prisma.match.findUnique({
        where: {
          id: matchId,
        },

        include: {
          game: true,
          team1: true,
          team2: true,
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

    // ===================================================
    // CHECK HANDBALL MATCH
    // ===================================================

    if (
      match.game.sportType !==
      "HANDBALL"
    ) {
      return NextResponse.json(
        {
          error:
            "This is not a handball match.",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // CURRENT STATUS
    // ===================================================

    const currentStatus =
      String(match.status).toUpperCase();

    // ===================================================
    // START MATCH
    // ===================================================

    if (action === "START") {
      // -------------------------------------------------
      // ALREADY LIVE
      // -------------------------------------------------

      if (
        currentStatus === "LIVE" ||
        currentStatus === "IN_PROGRESS"
      ) {
        return NextResponse.json(
          {
            error:
              "Match has already started.",
          },
          {
            status: 400,
          }
        );
      }

      // -------------------------------------------------
      // ALREADY COMPLETED
      // -------------------------------------------------

      if (
        currentStatus === "COMPLETED" ||
        currentStatus === "FINISHED"
      ) {
        return NextResponse.json(
          {
            error:
              "This match has already been completed.",
          },
          {
            status: 400,
          }
        );
      }

      // -------------------------------------------------
      // CANCELLED
      // -------------------------------------------------

      if (
        currentStatus === "CANCELLED"
      ) {
        return NextResponse.json(
          {
            error:
              "This match is cancelled.",
          },
          {
            status: 400,
          }
        );
      }

      // -------------------------------------------------
      // UPDATE STATUS TO LIVE
      // -------------------------------------------------

      const updatedMatch =
        await prisma.match.update({
          where: {
            id: matchId,
          },

          data: {
            status: "LIVE",
          },

          include: {
            game: true,
            team1: true,
            team2: true,
          },
        });

      return NextResponse.json(
        {
          success: true,

          message:
            "Handball match started.",

          match: updatedMatch,
        },
        {
          status: 200,
        }
      );
    }

    // ===================================================
    // END MATCH
    // ===================================================

    if (action === "END") {
      // -------------------------------------------------
      // ALREADY COMPLETED
      // -------------------------------------------------

      if (
        currentStatus === "COMPLETED" ||
        currentStatus === "FINISHED"
      ) {
        return NextResponse.json(
          {
            error:
              "Match has already been completed.",
          },
          {
            status: 400,
          }
        );
      }

      // -------------------------------------------------
      // CANCELLED
      // -------------------------------------------------

      if (
        currentStatus === "CANCELLED"
      ) {
        return NextResponse.json(
          {
            error:
              "This match is cancelled.",
          },
          {
            status: 400,
          }
        );
      }

      // -------------------------------------------------
      // MATCH SHOULD BE LIVE
      // -------------------------------------------------

      if (
        currentStatus !== "LIVE" &&
        currentStatus !== "IN_PROGRESS"
      ) {
        return NextResponse.json(
          {
            error:
              "Only a live handball match can be completed.",
          },
          {
            status: 400,
          }
        );
      }

      // -------------------------------------------------
      // UPDATE STATUS TO COMPLETED
      // -------------------------------------------------

      const updatedMatch =
        await prisma.match.update({
          where: {
            id: matchId,
          },

          data: {
            status: "COMPLETED",
          },

          include: {
            game: true,
            team1: true,
            team2: true,
          },
        });

      return NextResponse.json(
        {
          success: true,

          message:
            "Handball match completed.",

          match: updatedMatch,
        },
        {
          status: 200,
        }
      );
    }

    // ===================================================
    // FALLBACK
    // ===================================================

    return NextResponse.json(
      {
        error:
          "Unable to update match status.",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    // ===================================================
    // ERROR
    // ===================================================

    console.error(
      "HANDBALL MATCH STATUS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update handball match status.",
      },
      {
        status: 500,
      }
    );
  }
}