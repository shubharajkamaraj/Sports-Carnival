import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncFootballScore } from "@/lib/footballScore";

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{
      id: string;
      eventId: string;
    }>;
  }
) {
  try {
    const {
      id,
      eventId,
    } = await context.params;

    const matchId =
      Number(id);

    const footballEventId =
      Number(eventId);

    if (
      !Number.isInteger(
        matchId
      ) ||
      !Number.isInteger(
        footballEventId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid match or event ID.",
        },
        {
          status: 400,
        }
      );
    }

    const event =
      await prisma.footballEvent.findFirst({
        where: {
          id: footballEventId,

          matchId,
        },
      });

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Football event not found.",
        },
        {
          status: 404,
        }
      );
    }

    const match =
      await prisma.match.findUnique({
        where: {
          id: matchId,
        },

        select: {
          status: true,
        },
      });

    if (!match) {
      return NextResponse.json(
        {
          success: false,
          error: "Match not found.",
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
            "Cannot delete events after the match is completed.",
        },
        {
          status: 400,
        }
      );
    }

    await prisma.footballEvent.delete({
      where: {
        id: footballEventId,
      },
    });

    /* =====================================================
       RECALCULATE SCORE
    ===================================================== */

    const score =
      await syncFootballScore(
        matchId
      );

    return NextResponse.json({
      success: true,

      deletedEventId:
        footballEventId,

      score,
    });
  } catch (error) {
    console.error(
      "FOOTBALL EVENT DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to delete football event.",
      },
      {
        status: 500,
      }
    );
  }
}