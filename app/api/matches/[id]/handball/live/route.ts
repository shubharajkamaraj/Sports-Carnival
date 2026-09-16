import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncHandballScore } from "../../../../../../lib/handballScore";

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    // =====================================================
    // GET MATCH ID
    // =====================================================

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

    // =====================================================
    // GET MATCH
    // =====================================================

    const match =
      await prisma.match.findUnique({
        where: {
          id: matchId,
        },

        include: {
          // =================================================
          // GAME
          // =================================================

          game: true,

          // =================================================
          // TEAM 1
          // =================================================

          team1: {
            include: {
              players: {
                orderBy: {
                  jerseyNo: "asc",
                },
              },
            },
          },

          // =================================================
          // TEAM 2
          // =================================================

          team2: {
            include: {
              players: {
                orderBy: {
                  jerseyNo: "asc",
                },
              },
            },
          },

          // =================================================
          // HANDBALL SCORE
          // =================================================

          handballScore: true,

          // =================================================
          // HANDBALL EVENTS
          // =================================================

          handballEvents: {
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

    // =====================================================
    // MATCH NOT FOUND
    // =====================================================

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

    // =====================================================
    // ALWAYS RECALCULATE SCORE
    //
    // This is important because:
    //
    // GOAL
    // OWN_GOAL
    // PENALTY + GOAL
    // PENALTY + MISSED
    //
    // are calculated from the current events.
    // =====================================================

    const score =
      await syncHandballScore(matchId);

    // =====================================================
    // CREATE CLEAN EVENTS RESPONSE
    // =====================================================

    const events =
      match.handballEvents.map(
        (event) => ({
          id: event.id,

          matchId:
            event.matchId,

          teamId:
            event.teamId,

          playerId:
            event.playerId,

          // IMPORTANT
          eventType:
            event.eventType,

          // IMPORTANT
          //
          // PENALTY + GOAL
          //     = Penalty Scored
          //
          // PENALTY + MISSED
          //     = Penalty Missed
          //
          penaltyResult:
            event.penaltyResult,

          minute:
            event.minute,

          description:
            event.description,

          // =================================================
          // TEAM
          // =================================================

          team: {
            id:
              event.team.id,

            name:
              event.team.name,
          },

          // =================================================
          // PLAYER
          // =================================================

          player:
            event.player
              ? {
                  id:
                    event.player.id,

                  name:
                    event.player.name,

                  jerseyNo:
                    event.player.jerseyNo,

                  role:
                    event.player.role,

                  photo:
                    event.player.photo,

                  teamId:
                    event.player.teamId,
                }
              : null,

          createdAt:
            event.createdAt,
        })
      );

    // =====================================================
    // RESPONSE
    // =====================================================

    return NextResponse.json({
      success: true,

      match: {
        id:
          match.id,

        status:
          match.status,

        result:
          match.result,

        winnerTeamId:
          match.winnerTeamId,

        // =================================================
        // GAME
        // =================================================

        game:
          match.game,

        // =================================================
        // TEAMS
        // =================================================

        team1:
          match.team1,

        team2:
          match.team2,

        // =================================================
        // CURRENT SCORE
        // =================================================

        team1Score:
          score.team1Score,

        team2Score:
          score.team2Score,

        // =================================================
        // HANDBALL SCORE
        // =================================================

        handballScore: {
          team1Id:
            match.team1Id,

          team2Id:
            match.team2Id,

          team1Score:
            score.team1Score,

          team2Score:
            score.team2Score,
        },

        // =================================================
        // EVENTS
        // =================================================

        handballEvents:
          events,
      },
    });
  } catch (error) {
    console.error(
      "HANDBALL LIVE GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to load handball match.",
      },
      {
        status: 500,
      }
    );
  }
}