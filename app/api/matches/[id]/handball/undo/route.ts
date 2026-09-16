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
    const { id } = await context.params;

    const matchId = Number(id);

    if (
      !Number.isInteger(matchId) ||
      matchId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid match ID.",
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
      match.status === "COMPLETED" ||
      match.status === "CANCELLED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot undo events after the match is completed.",
        },
        {
          status: 400,
        }
      );
    }

    const lastEvent =
      await prisma.handballEvent.findFirst({
        where: {
          matchId,
        },

        orderBy: [
          {
            createdAt: "desc",
          },
          {
            id: "desc",
          },
        ],

        include: {
          player: true,
          team: true,
        },
      });

    if (!lastEvent) {
      return NextResponse.json(
        {
          success: false,
          error:
            "There are no events to undo.",
        },
        {
          status: 400,
        }
      );
    }

    await prisma.handballEvent.delete({
      where: {
        id: lastEvent.id,
      },
    });

    const score =
      await syncHandballScore(matchId);

    return NextResponse.json({
      success: true,

      undoneEvent: lastEvent,

      score,
    });
  } catch (error) {
    console.error(
      "HANDBALL UNDO ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to undo handball event.",
      },
      {
        status: 500,
      }
    );
  }
}