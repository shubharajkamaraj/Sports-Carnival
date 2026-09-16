import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncHandballScore } from "@/lib/handballScore";

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

    const handballEventId =
      Number(eventId);

    if (
      !Number.isInteger(
        matchId
      ) ||
      !Number.isInteger(
        handballEventId
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
      await prisma.handballEvent.findFirst({
        where: {
          id: handballEventId,
          matchId,
        },
      });

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Handball event not found.",
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
            "Cannot delete events after the match is completed.",
        },
        {
          status: 400,
        }
      );
    }

    await prisma.handballEvent.delete({
      where: {
        id: handballEventId,
      },
    });

    const score =
      await syncHandballScore(
        matchId
      );

    return NextResponse.json({
      success: true,

      deletedEventId:
        handballEventId,

      score,
    });
  } catch (error) {
    console.error(
      "HANDBALL EVENT DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to delete handball event.",
      },
      {
        status: 500,
      }
    );
  }
}
