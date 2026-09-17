import { NextResponse } from "next/server";
import {
  FootballEventType,
  FootballPenaltyResult,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { syncFootballScore } from "../../../../../../lib/footballScore";

/* =====================================================
   VALID FOOTBALL EVENTS
===================================================== */

const VALID_EVENTS = [
  "GOAL",
  "OWN_GOAL",
  "PENALTY",
  "YELLOW_CARD",
  "RED_CARD",
] as const;

type FootballEventTypeValue =
  (typeof VALID_EVENTS)[number];

/* =====================================================
   POST - ADD FOOTBALL EVENT
===================================================== */

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    /* =====================================================
       GET MATCH ID
    ===================================================== */

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

    /* =====================================================
       READ REQUEST BODY
    ===================================================== */

    const body = await request.json();

    const {
      eventType,
      teamId,
      playerId,
      penaltyResult,
      minute,
      description,
    } = body;

    /* =====================================================
       VALIDATE EVENT TYPE
    ===================================================== */

    if (
      !VALID_EVENTS.includes(
        eventType as FootballEventTypeValue
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid football event.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       FIND MATCH
    ===================================================== */

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

    /* =====================================================
       DON'T ADD EVENTS AFTER MATCH COMPLETION
    ===================================================== */

    if (
      match.status === "COMPLETED" ||
      match.status === "CANCELLED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot add an event after the match is completed.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       VALIDATE TEAM
    ===================================================== */

    const numericTeamId = Number(teamId);

    if (
      !Number.isInteger(numericTeamId) ||
      (
        numericTeamId !== match.team1Id &&
        numericTeamId !== match.team2Id
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Selected team does not belong to this match.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       VALIDATE PLAYER
    ===================================================== */

    let numericPlayerId: number | null = null;

    if (
      playerId !== null &&
      playerId !== undefined &&
      playerId !== ""
    ) {
      numericPlayerId = Number(playerId);

      if (
        !Number.isInteger(numericPlayerId) ||
        numericPlayerId <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid player ID.",
          },
          {
            status: 400,
          }
        );
      }

      const player =
        await prisma.player.findFirst({
          where: {
            id: numericPlayerId,
            teamId: numericTeamId,
          },
        });

      if (!player) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Selected player does not belong to the selected team.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /* =====================================================
       PLAYER REQUIRED

       GOAL
       PENALTY
       YELLOW_CARD
       RED_CARD

       Own goal can be stored without player.
    ===================================================== */

    if (
      eventType === "GOAL" ||
      eventType === "PENALTY" ||
      eventType === "YELLOW_CARD" ||
      eventType === "RED_CARD"
    ) {
      if (numericPlayerId === null) {
        return NextResponse.json(
          {
            success: false,
            error: "Please select a player.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /* =====================================================
       PENALTY RESULT

       Prisma enum:

       GOAL
       MISSED
    ===================================================== */

    let finalPenaltyResult:
      | FootballPenaltyResult
      | null = null;

    if (eventType === "PENALTY") {
      if (
        penaltyResult !== "GOAL" &&
        penaltyResult !== "MISSED"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Please select whether the penalty was scored or missed.",
          },
          {
            status: 400,
          }
        );
      }

      if (penaltyResult === "GOAL") {
        finalPenaltyResult =
          FootballPenaltyResult.GOAL;
      } else {
        finalPenaltyResult =
          FootballPenaltyResult.MISSED;
      }
    }

    /* =====================================================
       MINUTE
    ===================================================== */

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
          {
            status: 400,
          }
        );
      }
    }

    /* =====================================================
       DESCRIPTION
    ===================================================== */

    const finalDescription =
      typeof description === "string"
        ? description.trim() || null
        : null;

    /* =====================================================
       CONVERT EVENT TYPE TO PRISMA ENUM
    ===================================================== */

    let finalEventType: FootballEventType;

    switch (eventType) {
      case "GOAL":
        finalEventType =
          FootballEventType.GOAL;
        break;

      case "OWN_GOAL":
        finalEventType =
          FootballEventType.OWN_GOAL;
        break;

      case "PENALTY":
        finalEventType =
          FootballEventType.PENALTY;
        break;

      case "YELLOW_CARD":
        finalEventType =
          FootballEventType.YELLOW_CARD;
        break;

      case "RED_CARD":
        finalEventType =
          FootballEventType.RED_CARD;
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid football event.",
          },
          {
            status: 400,
          }
        );
    }

    /* =====================================================
       CREATE EVENT
    ===================================================== */

    const event =
      await prisma.footballEvent.create({
        data: {
          matchId,

          teamId:
            numericTeamId,

          playerId:
            numericPlayerId,

          eventType:
            finalEventType,

          penaltyResult:
            finalPenaltyResult,

          minute:
            finalMinute,

          description:
            finalDescription,
        },

        include: {
          player: true,
          team: true,
        },
      });

    /* =====================================================
       RECALCULATE SCORE
    ===================================================== */

    const score =
      await syncFootballScore(matchId);

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json(
      {
        success: true,
        event,
        score,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "FOOTBALL EVENT POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to add football event.",
      },
      {
        status: 500,
      }
    );
  }
}

