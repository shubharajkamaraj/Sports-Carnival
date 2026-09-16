import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncHandballScore } from "@/lib/handballScore";

// =====================================================
// TYPES
// =====================================================

type HandballEvent = {
  id: number;

  matchId: number;

  playerId: number | null;

  teamId: number;

  eventType: string;

  penaltyResult:
    | "GOAL"
    | "MISSED"
    | null;

  minute: number | null;

  description: string | null;

  createdAt: Date;

  player: {
    id: number;
    name: string;
    jerseyNo: number | null;
    role: string | null;
    photo: string | null;
    teamId: number;
  } | null;

  team: {
    id: number;
    name: string;
  };
};

// =====================================================
// GET SUMMARY
// =====================================================

export async function GET(
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

    // ===================================================
    // GET MATCH
    // ===================================================

    const match =
      await prisma.match.findUnique({
        where: {
          id: matchId,
        },

        include: {
          tournament: true,

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

          handballScore: true,

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

    if (!match) {
      return NextResponse.json(
        {
          success: false,
          error: "Match not found.",
        },
        { status: 404 }
      );
    }

    // ===================================================
    // CHECK SPORT
    // ===================================================

    if (match.game.sportType !== "HANDBALL") {
      return NextResponse.json(
        {
          success: false,
          error:
            "This is not a handball match.",
        },
        { status: 400 }
      );
    }

    // ===================================================
    // SYNC CURRENT SCORE
    // ===================================================

    const score =
      await syncHandballScore(matchId);

    // ===================================================
    // EVENTS
    // ===================================================

    const handballEvents =
      match.handballEvents as unknown as HandballEvent[];

    // ===================================================
    // FORMAT EVENTS
    // =====================================================

    const events =
      handballEvents.map(
        (event: HandballEvent) => ({
          id: event.id,

          eventType:
            event.eventType,

          // IMPORTANT
          penaltyResult:
            event.penaltyResult,

          minute:
            event.minute,

          description:
            event.description,

          team: {
            id:
              event.team.id,

            name:
              event.team.name,
          },

          player:
            event.player
              ? {
                  id:
                    event.player.id,

                  name:
                    event.player.name,

                  jerseyNo:
                    event.player
                      .jerseyNo,

                  role:
                    event.player.role,

                  photo:
                    event.player.photo,

                  teamId:
                    event.player
                      .teamId,
                }
              : null,

          createdAt:
            event.createdAt,
        })
      );

    // ===================================================
    // NORMAL GOALS
    // ===================================================

    const normalGoalEvents =
      handballEvents.filter(
        (event) =>
          event.eventType ===
          "GOAL"
      );

    // ===================================================
    // SUCCESSFUL PENALTIES
    // ===================================================

    const penaltyGoalEvents =
      handballEvents.filter(
        (event) =>
          event.eventType ===
            "PENALTY" &&
          event.penaltyResult ===
            "GOAL"
      );

    // ===================================================
    // MISSED PENALTIES
    // ===================================================

    const penaltyMissedEvents =
      handballEvents.filter(
        (event) =>
          event.eventType ===
            "PENALTY" &&
          event.penaltyResult ===
            "MISSED"
      );

    // ===================================================
    // OWN GOALS
    // ===================================================

    const ownGoalEvents =
      handballEvents.filter(
        (event) =>
          event.eventType ===
          "OWN_GOAL"
      );

    // ===================================================
    // CARDS
    // ===================================================

    const yellowCardEvents =
      handballEvents.filter(
        (event) =>
          event.eventType ===
          "YELLOW_CARD"
      );

    const redCardEvents =
      handballEvents.filter(
        (event) =>
          event.eventType ===
          "RED_CARD"
      );

    // ===================================================
    // GOAL SCORERS
    // IMPORTANT:
    //
    // Normal GOAL only.
    //
    // Penalty goals are NOT included.
    // Own goals are NOT credited to player.
    // ===================================================

    const scorerMap =
      new Map<
        number,
        {
          playerId: number;
          playerName: string;
          jerseyNo: number | null;
          teamId: number;
          teamName: string;
          goals: number;
        }
      >();

    for (
      const event of normalGoalEvents
    ) {
      if (!event.player) {
        continue;
      }

      const existing =
        scorerMap.get(
          event.player.id
        );

      if (existing) {
        existing.goals += 1;
      } else {
        scorerMap.set(
          event.player.id,
          {
            playerId:
              event.player.id,

            playerName:
              event.player.name,

            jerseyNo:
              event.player.jerseyNo,

            teamId:
              event.team.id,

            teamName:
              event.team.name,

            goals: 1,
          }
        );
      }
    }

    const goalScorers =
      Array.from(
        scorerMap.values()
      ).sort(
        (a, b) =>
          b.goals - a.goals
      );

    // ===================================================
    // TEAM STATISTICS
    // ===================================================

    function buildTeamStats(
      teamId: number
    ) {
      const teamEvents =
        handballEvents.filter(
          (event) =>
            event.teamId ===
            teamId
        );

      const goals =
        teamEvents.filter(
          (event) =>
            event.eventType ===
            "GOAL"
        ).length;

      const penaltyGoals =
        teamEvents.filter(
          (event) =>
            event.eventType ===
              "PENALTY" &&
            event.penaltyResult ===
              "GOAL"
        ).length;

      const penaltyMissed =
        teamEvents.filter(
          (event) =>
            event.eventType ===
              "PENALTY" &&
            event.penaltyResult ===
              "MISSED"
        ).length;

      const ownGoals =
        teamEvents.filter(
          (event) =>
            event.eventType ===
            "OWN_GOAL"
        ).length;

      const yellowCards =
        teamEvents.filter(
          (event) =>
            event.eventType ===
            "YELLOW_CARD"
        ).length;

      const redCards =
        teamEvents.filter(
          (event) =>
            event.eventType ===
            "RED_CARD"
        ).length;

      return {
        teamId,

        goals,

        normalGoals:
          goals,

        penaltyGoals,

        penaltyMissed,

        ownGoals,

        totalGoals:
          goals +
          penaltyGoals,

        yellowCards,

        redCards,

        totalEvents:
          teamEvents.length,
      };
    }

    const team1Stats =
      buildTeamStats(
        match.team1Id
      );

    const team2Stats =
      buildTeamStats(
        match.team2Id
      );

    // ===================================================
    // WINNER
    // ===================================================

  // ===================================================
// WINNER
//
// Final score includes:
//
// NORMAL GOALS
// + SUCCESSFUL PENALTY GOALS
// + OWN GOALS CREDITED TO OPPONENT
//
// MISSED PENALTIES = 0
// =====================================================

let winnerTeamId: number | null = null;

let result: string | null = null;

// -----------------------------------------------------
// NORMAL GOALS
// -----------------------------------------------------

const team1NormalGoals =
  normalGoalEvents.filter(
    (event) =>
      event.teamId === match.team1Id
  ).length;

const team2NormalGoals =
  normalGoalEvents.filter(
    (event) =>
      event.teamId === match.team2Id
  ).length;

// -----------------------------------------------------
// SUCCESSFUL PENALTIES
// -----------------------------------------------------

const team1PenaltyGoals =
  penaltyGoalEvents.filter(
    (event) =>
      event.teamId === match.team1Id
  ).length;

const team2PenaltyGoals =
  penaltyGoalEvents.filter(
    (event) =>
      event.teamId === match.team2Id
  ).length;

// -----------------------------------------------------
// OWN GOALS
//
// If Team 1 scores an own goal,
// Team 2 receives the goal.
//
// If Team 2 scores an own goal,
// Team 1 receives the goal.
// -----------------------------------------------------

const team1OwnGoalsReceived =
  ownGoalEvents.filter(
    (event) =>
      event.teamId === match.team2Id
  ).length;

const team2OwnGoalsReceived =
  ownGoalEvents.filter(
    (event) =>
      event.teamId === match.team1Id
  ).length;

// -----------------------------------------------------
// FINAL CALCULATED SCORE
// -----------------------------------------------------

const team1FinalScore =
  team1NormalGoals +
  team1PenaltyGoals +
  team1OwnGoalsReceived;

const team2FinalScore =
  team2NormalGoals +
  team2PenaltyGoals +
  team2OwnGoalsReceived;

// -----------------------------------------------------
// WINNER
// -----------------------------------------------------

if (
  team1FinalScore >
  team2FinalScore
) {
  winnerTeamId =
    match.team1Id;

  result = "TEAM1_WIN";
} else if (
  team2FinalScore >
  team1FinalScore
) {
  winnerTeamId =
    match.team2Id;

  result = "TEAM2_WIN";
} else {
  winnerTeamId = null;

  result = "DRAW";
}

    // ===================================================
    // RESPONSE
    // ===================================================

    return NextResponse.json({
      success: true,

 match: {
  id: match.id,

  status: match.status,

  result,

  winnerTeamId,

  winner:
    winnerTeamId === match.team1Id
      ? {
          id: match.team1.id,
          name: match.team1.name,
        }
      : winnerTeamId === match.team2Id
        ? {
            id: match.team2.id,
            name: match.team2.name,
          }
        : null,

  game: match.game,

  tournament: match.tournament,

  team1: {
    ...match.team1,
    score: score.team1Score,
  },

  team2: {
    ...match.team2,
    score: score.team2Score,
  },

  team1Score: score.team1Score,

  team2Score: score.team2Score,
},

      // =================================================
      // EVENTS
      // =================================================

      events,

      // =================================================
      // GOAL SCORERS
      // =================================================

      goalScorers,

      // =================================================
      // NORMAL GOALS
      // =================================================

      normalGoals:
        normalGoalEvents.map(
          (event) => ({
            id: event.id,

            teamId:
              event.teamId,

            teamName:
              event.team.name,

            player:
              event.player
                ? {
                    id:
                      event.player.id,

                    name:
                      event.player
                        .name,

                    jerseyNo:
                      event.player
                        .jerseyNo,
                  }
                : null,

            minute:
              event.minute,

            createdAt:
              event.createdAt,
          })
        ),

      // =================================================
      // SUCCESSFUL PENALTIES
      // =================================================

      penaltyGoals:
        penaltyGoalEvents.map(
          (event) => ({
            id: event.id,

            teamId:
              event.teamId,

            teamName:
              event.team.name,

            player:
              event.player
                ? {
                    id:
                      event.player.id,

                    name:
                      event.player
                        .name,

                    jerseyNo:
                      event.player
                        .jerseyNo,
                  }
                : null,

            minute:
              event.minute,

            penaltyResult:
              event.penaltyResult,

            createdAt:
              event.createdAt,
          })
        ),

      // =================================================
      // MISSED PENALTIES
      // =================================================

      penaltyMissed:
        penaltyMissedEvents.map(
          (event) => ({
            id: event.id,

            teamId:
              event.teamId,

            teamName:
              event.team.name,

            player:
              event.player
                ? {
                    id:
                      event.player.id,

                    name:
                      event.player
                        .name,

                    jerseyNo:
                      event.player
                        .jerseyNo,
                  }
                : null,

            minute:
              event.minute,

            penaltyResult:
              event.penaltyResult,

            createdAt:
              event.createdAt,
          })
        ),

      // =================================================
      // OWN GOALS
      // =================================================

      ownGoals:
        ownGoalEvents.map(
          (event) => ({
            id: event.id,

            teamId:
              event.teamId,

            teamName:
              event.team.name,

            player:
              event.player
                ? {
                    id:
                      event.player.id,

                    name:
                      event.player
                        .name,

                    jerseyNo:
                      event.player
                        .jerseyNo,
                  }
                : null,

            minute:
              event.minute,

            createdAt:
              event.createdAt,
          })
        ),

      // =================================================
      // CARDS
      // =================================================

      yellowCards:
        yellowCardEvents.map(
          (event) => ({
            id: event.id,

            teamId:
              event.teamId,

            teamName:
              event.team.name,

            player:
              event.player
                ? {
                    id:
                      event.player.id,

                    name:
                      event.player
                        .name,

                    jerseyNo:
                      event.player
                        .jerseyNo,
                  }
                : null,

            minute:
              event.minute,

            createdAt:
              event.createdAt,
          })
        ),

      redCards:
        redCardEvents.map(
          (event) => ({
            id: event.id,

            teamId:
              event.teamId,

            teamName:
              event.team.name,

            player:
              event.player
                ? {
                    id:
                      event.player.id,

                    name:
                      event.player
                        .name,

                    jerseyNo:
                      event.player
                        .jerseyNo,
                  }
                : null,

            minute:
              event.minute,

            createdAt:
              event.createdAt,
          })
        ),

      // =================================================
      // TEAM STATS
      // =================================================

      teamStats: {
        team1:
          team1Stats,

        team2:
          team2Stats,
      },

      // =================================================
      // COUNTS
      // =================================================

      counts: {
        totalEvents:
          handballEvents.length,

        normalGoals:
          normalGoalEvents.length,

        penaltyGoals:
          penaltyGoalEvents.length,

        penaltyMissed:
          penaltyMissedEvents.length,

        ownGoals:
          ownGoalEvents.length,

        yellowCards:
          yellowCardEvents.length,

        redCards:
          redCardEvents.length,
      },
    });
  } catch (error) {
    console.error(
      "HANDBALL SUMMARY ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load handball summary.",
      },
      { status: 500 }
    );
  }
}