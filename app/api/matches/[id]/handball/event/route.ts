import { NextResponse } from "next/server";
import {
  HandballEventType,
  HandballPenaltyResult,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { syncHandballScore } from "@/lib/handballScore";

export async function POST(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
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

    const body = await request.json();

    const {
      eventType,
      teamId,
      playerId,
      penaltyResult,
      minute,
      description,
    } = body;

    // =====================================================
    // GET MATCH
    // =====================================================

    const match = await prisma.match.findUnique({
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
          success: false,
          error: "Match not found.",
        },
        { status: 404 }
      );
    }

    // =====================================================
    // CHECK SPORT
    // =====================================================

    if (match.game.sportType !== "HANDBALL") {
      return NextResponse.json(
        {
          success: false,
          error: "This is not a handball match.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // CHECK MATCH STATUS
    // =====================================================

    if (
      match.status === "COMPLETED" ||
      match.status === "CANCELLED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot add events after the match is completed.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // TEAM
    // =====================================================

    const numericTeamId = Number(teamId);

    if (
      !Number.isInteger(numericTeamId) ||
      (numericTeamId !== match.team1Id &&
        numericTeamId !== match.team2Id)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid team.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // EVENT TYPE
    // =====================================================

    const validEventTypes = [
      "GOAL",
      "YELLOW_CARD",
      "RED_CARD",
      "OWN_GOAL",
      "PENALTY",
    ];

    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid handball event type.",
        },
        { status: 400 }
      );
    }

    const finalEventType =
      eventType as HandballEventType;

    // =====================================================
    // PENALTY RESULT
    // =====================================================

    let finalPenaltyResult:
      | HandballPenaltyResult
      | null = null;

    if (
      finalEventType ===
      HandballEventType.PENALTY
    ) {
      if (
        penaltyResult !== "GOAL" &&
        penaltyResult !== "MISSED"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Penalty result must be GOAL or MISSED.",
          },
          { status: 400 }
        );
      }

      finalPenaltyResult =
        penaltyResult === "GOAL"
          ? HandballPenaltyResult.GOAL
          : HandballPenaltyResult.MISSED;
    }

    // =====================================================
    // PLAYER
    // =====================================================

    let finalPlayerId: number | null = null;

    if (
      playerId !== null &&
      playerId !== undefined &&
      playerId !== ""
    ) {
      finalPlayerId = Number(playerId);

      if (
        !Number.isInteger(finalPlayerId) ||
        finalPlayerId <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid player ID.",
          },
          { status: 400 }
        );
      }

      const player = await prisma.player.findUnique({
        where: {
          id: finalPlayerId,
        },
      });

      if (!player) {
        return NextResponse.json(
          {
            success: false,
            error: "Player not found.",
          },
          { status: 404 }
        );
      }

      if (player.teamId !== numericTeamId) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Selected player does not belong to this team.",
          },
          { status: 400 }
        );
      }
    }

    // =====================================================
    // MINUTE
    // =====================================================

    let finalMinute: number | null = null;

    if (
      minute !== null &&
      minute !== undefined &&
      minute !== ""
    ) {
      finalMinute = Number(minute);

      if (
        !Number.isInteger(finalMinute) ||
        finalMinute < 0 ||
        finalMinute > 120
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Minute must be between 0 and 120.",
          },
          { status: 400 }
        );
      }
    }

    // =====================================================
    // CREATE EVENT
    // =====================================================

    const event =
      await prisma.handballEvent.create({
        data: {
          matchId,

          teamId: numericTeamId,

          playerId: finalPlayerId,

          eventType: finalEventType,

          penaltyResult:
            finalPenaltyResult,

          minute: finalMinute,

          description:
            description?.trim() || null,
        },

        include: {
          player: true,
          team: true,
        },
      });

    // =====================================================
    // RECALCULATE SCORE
    // =====================================================

    const score =
      await syncHandballScore(matchId);

    // =====================================================
    // RESPONSE
    // =====================================================

    return NextResponse.json(
      {
        success: true,

        event: {
          id: event.id,
          matchId: event.matchId,
          playerId: event.playerId,
          teamId: event.teamId,
          eventType: event.eventType,

          // IMPORTANT
          penaltyResult:
            event.penaltyResult,

          minute: event.minute,
          description: event.description,
          createdAt: event.createdAt,

          player: event.player,
          team: event.team,
        },

        score: {
          team1Score:
            score.team1Score,

          team2Score:
            score.team2Score,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "HANDBALL EVENT CREATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create handball event.",
      },
      { status: 500 }
    );
  }
}