import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncFootballScore } from "../../../../../../lib/footballScore";

export async function GET(
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

        include: {
          game: true,

          team1: {
            include: {
              players: {
                orderBy: {
                  jerseyNo: "asc",
                },
              },
            },
          },

          team2: {
            include: {
              players: {
                orderBy: {
                  jerseyNo: "asc",
                },
              },
            },
          },

          footballScore: true,

          footballEvents: {
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
          },
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
       ALWAYS RECALCULATE SCORE FROM EVENTS
       
       This prevents stale score problems.
    ===================================================== */

    const score =
      await syncFootballScore(matchId);

    return NextResponse.json({
      success: true,

      match: {
        id: match.id,

        status: match.status,

        result: match.result,

        winnerTeamId:
          match.winnerTeamId,

        game: match.game,

        team1: match.team1,

        team2: match.team2,

        team1Score:
          score.team1Score,

        team2Score:
          score.team2Score,

        footballScore: {
          team1Id:
            match.team1Id,

          team2Id:
            match.team2Id,

          team1Score:
            score.team1Score,

          team2Score:
            score.team2Score,
        },

        footballEvents:
          match.footballEvents.map(
            (event) => ({
              id: event.id,

              matchId:
                event.matchId,

              teamId:
                event.teamId,

              playerId:
                event.playerId,

              eventType:
                event.eventType,

              penaltyResult:
                event.penaltyResult,

              minute:
                event.minute,

              description:
                event.description,

              createdAt:
                event.createdAt,

              player:
                event.player,

              team:
                event.team,
            })
          ),
      },
    });
  } catch (error) {
    console.error(
      "FOOTBALL LIVE GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to load football match.",
      },
      {
        status: 500,
      }
    );
  }
}