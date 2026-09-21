import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =====================================================
// TYPES
// =====================================================

type CricketBatterStats = {
  playerId: number;
  playerName: string;
  teamId: number;
  teamName: string;

  matches: Set<number>;
  innings: Set<number>;

  runs: number;
  balls: number;
};

type CricketBowlerStats = {
  playerId: number;
  playerName: string;
  teamId: number;
  teamName: string;

  matches: Set<number>;

  wickets: number;
  runsConceded: number;
  legalBalls: number;
};

type PlayerSportStats = {
  playerId: number;
  playerName: string;
  teamId: number;
  teamName: string;

  matches: Set<number>;

  goals: number;
  points: number;
};

type FootballHandballAwardPlayer = {
  playerId: number;
  playerName: string;
  teamId: number;
  teamName: string;
  matches: number;
  goals: number;
};

type FootballHandballAward = FootballHandballAwardPlayer & {
  tiedPlayerCount: number;
};

type FootballHandballAwardResult = {
  bestPlayer: FootballHandballAward | null;
  tiedPlayers: FootballHandballAward[];
  finalStarted: boolean;
  finalCompleted: boolean;
  finalTeamIds: number[];
  highestGoals: number;
};

// =====================================================
// CONSTANTS
// =====================================================

/*
 * Only these dismissals are credited to the bowler.
 *
 * NOT credited:
 * - RUN_OUT
 * - RETIRED_HURT
 * - RETIRED_OUT
 * - OBSTRUCTING_THE_FIELD
 */
const BOWLER_WICKET_TYPES = new Set([
  "BOWLED",
  "CAUGHT",
  "LBW",
  "STUMPED",
  "HIT_WICKET",
]);

// =====================================================
// HELPERS
// =====================================================

function getStrikeRate(
  runs: number,
  balls: number
): number {
  if (balls <= 0) {
    return 0;
  }

  return (runs / balls) * 100;
}

function getEconomy(
  runsConceded: number,
  legalBalls: number
): number {
  if (legalBalls <= 0) {
    return 0;
  }

  return (runsConceded / legalBalls) * 6;
}

function roundNumber(
  value: number,
  decimals = 2
): number {
  return Number(
    value.toFixed(decimals)
  );
}

// =====================================================
// FOOTBALL / HANDBALL TEAM MATCH COUNT
// =====================================================

/*
 * Counts the number of matches played by the player's
 * TEAM.
 *
 * IMPORTANT:
 *
 * We do NOT count every League match.
 *
 * We only count matches where:
 *
 *   match.team1Id === player.teamId
 *   OR
 *   match.team2Id === player.teamId
 *
 * This fixes cases such as:
 *
 * Lisha:
 *   Match #29 -> Victory Warriors vs Faith Strikers
 *                NOT Christ Kingdom -> NOT counted
 *
 *   Match #30 -> Christ Kingdom vs Hope Warriors
 *                Christ Kingdom -> counted
 *
 *   Match #31 -> Christ Kingdom vs Victory Warriors
 *                Christ Kingdom -> counted
 *
 * Result:
 *   Matches = 2
 *
 * The Set prevents the same match from being counted
 * more than once.
 */
function getTeamMatchCount(
  matches: any[],
  sportType: "FOOTBALL" | "HANDBALL",
  teamId: number,
  finalMatchId?: number
): number {
  const matchIds = new Set<number>();

  for (const match of matches) {
    // -----------------------------------------------
    // CORRECT SPORT
    // -----------------------------------------------

    if (
      match.game?.sportType !== sportType
    ) {
      continue;
    }

    // -----------------------------------------------
    // ONLY COMPLETED MATCHES
    // -----------------------------------------------

    if (
      match.status !== "COMPLETED"
    ) {
      continue;
    }

    // -----------------------------------------------
    // PLAYER'S TEAM MUST ACTUALLY BE IN THE MATCH
    // -----------------------------------------------

    if (
      match.team1Id !== teamId &&
      match.team2Id !== teamId
    ) {
      continue;
    }

    // -----------------------------------------------
    // LEAGUE MATCH
    // -----------------------------------------------

    if (
      match.stage === "LEAGUE"
    ) {
      matchIds.add(match.id);
      continue;
    }

    // -----------------------------------------------
    // CURRENT FINAL
    // -----------------------------------------------

    if (
      match.stage === "FINAL" &&
      match.id === finalMatchId
    ) {
      matchIds.add(match.id);
    }
  }

  return matchIds.size;
}

// =====================================================
// FOOTBALL / HANDBALL AWARD LOGIC
// =====================================================

function calculateFootballHandballAward(
  playersMap: Map<
    number,
    PlayerSportStats
  >,
  matches: any[],
  sportType: "FOOTBALL" | "HANDBALL"
): FootballHandballAwardResult {
  // ===================================================
  // FIND FINAL
  // ===================================================

  /*
   * FINAL may be:
   * - UPCOMING
   * - LIVE
   * - COMPLETED
   */

  const finalMatch =
    matches
      .filter(
        (match) =>
          match.game?.sportType ===
            sportType &&
          match.stage === "FINAL"
      )
      .sort(
        (a, b) =>
          b.id - a.id
      )[0] ?? null;

  // ===================================================
  // NO FINAL CREATED YET
  // ===================================================

  if (!finalMatch) {
    const leagueStats =
      new Map<
        number,
        FootballHandballAwardPlayer
      >();

    for (const match of matches) {
      if (
        match.game?.sportType !==
          sportType ||
        match.stage !== "LEAGUE" ||
        match.status !== "COMPLETED"
      ) {
        continue;
      }

      const events =
        sportType === "FOOTBALL"
          ? match.footballEvents
          : match.handballEvents;

      for (const event of events) {
        if (
          event.eventType !== "GOAL" ||
          !event.playerId
        ) {
          continue;
        }

        const player =
          playersMap.get(
            event.playerId
          );

        if (!player) {
          continue;
        }

        let stats =
          leagueStats.get(
            player.playerId
          );

        if (!stats) {
          stats = {
            playerId:
              player.playerId,

            playerName:
              player.playerName,

            teamId:
              player.teamId,

            teamName:
              player.teamName,

            matches: 0,

            goals: 0,
          };

          leagueStats.set(
            player.playerId,
            stats
          );
        }

        stats.goals += 1;
      }
    }

    // =================================================
    // FIX: CALCULATE TEAM MATCH COUNT
    // =================================================

    for (
      const player of
      leagueStats.values()
    ) {
      player.matches =
        getTeamMatchCount(
          matches,
          sportType,
          player.teamId
        );
    }

    const leaderboard =
      Array.from(
        leagueStats.values()
      )
        .map((player) => ({
          ...player,
          tiedPlayerCount: 1,
        }))
        .sort((a, b) => {
          if (
            b.goals !==
            a.goals
          ) {
            return (
              b.goals -
              a.goals
            );
          }

          return (
            a.playerName.localeCompare(
              b.playerName
            )
          );
        });

    const highestGoals =
      leaderboard[0]?.goals ?? 0;

    const tiedPlayers =
      leaderboard.filter(
        (player) =>
          player.goals ===
          highestGoals
      );

    return {
      bestPlayer:
        tiedPlayers[0] ??
        null,

      tiedPlayers,

      finalStarted: false,

      finalCompleted: false,

      finalTeamIds: [],

      highestGoals,
    };
  }

  // ===================================================
  // FINAL EXISTS
  // ===================================================

  const finalStarted =
    finalMatch.status ===
      "LIVE" ||
    finalMatch.status ===
      "COMPLETED";

  const finalCompleted =
    finalMatch.status ===
    "COMPLETED";

  const finalTeamIds = [
    finalMatch.team1Id,
    finalMatch.team2Id,
  ];

  // ===================================================
  // FINAL NOT STARTED
  // ===================================================

  if (!finalStarted) {
    const leagueStats =
      new Map<
        number,
        FootballHandballAwardPlayer
      >();

    for (const match of matches) {
      if (
        match.game?.sportType !==
          sportType ||
        match.stage !== "LEAGUE" ||
        match.status !== "COMPLETED"
      ) {
        continue;
      }

      const events =
        sportType === "FOOTBALL"
          ? match.footballEvents
          : match.handballEvents;

      for (const event of events) {
        if (
          event.eventType !== "GOAL" ||
          !event.playerId
        ) {
          continue;
        }

        const player =
          playersMap.get(
            event.playerId
          );

        if (!player) {
          continue;
        }

        let stats =
          leagueStats.get(
            player.playerId
          );

        if (!stats) {
          stats = {
            playerId:
              player.playerId,

            playerName:
              player.playerName,

            teamId:
              player.teamId,

            teamName:
              player.teamName,

            matches: 0,

            goals: 0,
          };

          leagueStats.set(
            player.playerId,
            stats
          );
        }

        stats.goals += 1;
      }
    }

    // =================================================
    // FIX: CALCULATE TEAM MATCH COUNT
    // =================================================

    for (
      const player of
      leagueStats.values()
    ) {
      player.matches =
        getTeamMatchCount(
          matches,
          sportType,
          player.teamId
        );
    }

    const leaderboard =
      Array.from(
        leagueStats.values()
      )
        .map((player) => ({
          ...player,
          tiedPlayerCount: 1,
        }))
        .sort((a, b) => {
          if (
            b.goals !==
            a.goals
          ) {
            return (
              b.goals -
              a.goals
            );
          }

          return (
            a.playerName.localeCompare(
              b.playerName
            )
          );
        });

    const highestGoals =
      leaderboard[0]?.goals ?? 0;

    const tiedPlayers =
      leaderboard.filter(
        (player) =>
          player.goals ===
          highestGoals
      );

    return {
      bestPlayer:
        tiedPlayers[0] ??
        null,

      tiedPlayers,

      finalStarted: false,

      finalCompleted: false,

      finalTeamIds,

      highestGoals,
    };
  }

  // ===================================================
  // FINAL LIVE OR COMPLETED
  // ===================================================

  const statsMap =
    new Map<
      number,
      FootballHandballAwardPlayer
    >();

  for (const match of matches) {
    if (
      match.game?.sportType !==
      sportType
    ) {
      continue;
    }

    // ===============================================
    // LEAGUE
    // ===============================================

    if (
      match.stage ===
        "LEAGUE" &&
      match.status ===
        "COMPLETED"
    ) {
      const events =
        sportType === "FOOTBALL"
          ? match.footballEvents
          : match.handballEvents;

      for (const event of events) {
        if (
          event.eventType !==
            "GOAL" ||
          !event.playerId
        ) {
          continue;
        }

        const player =
          playersMap.get(
            event.playerId
          );

        if (!player) {
          continue;
        }

        if (
          !finalTeamIds.includes(
            player.teamId
          )
        ) {
          continue;
        }

        let stats =
          statsMap.get(
            player.playerId
          );

        if (!stats) {
          stats = {
            playerId:
              player.playerId,

            playerName:
              player.playerName,

            teamId:
              player.teamId,

            teamName:
              player.teamName,

            matches: 0,

            goals: 0,
          };

          statsMap.set(
            player.playerId,
            stats
          );
        }

        stats.goals += 1;
      }
    }

    // ===============================================
    // FINAL
    // ===============================================

    if (
      match.stage ===
        "FINAL" &&
      match.id ===
        finalMatch.id &&
      (
        match.status ===
          "LIVE" ||
        match.status ===
          "COMPLETED"
      )
    ) {
      const events =
        sportType === "FOOTBALL"
          ? match.footballEvents
          : match.handballEvents;

      for (const event of events) {
        if (
          event.eventType !==
            "GOAL" ||
          !event.playerId
        ) {
          continue;
        }

        const player =
          playersMap.get(
            event.playerId
          );

        if (!player) {
          continue;
        }

        if (
          !finalTeamIds.includes(
            player.teamId
          )
        ) {
          continue;
        }

        let stats =
          statsMap.get(
            player.playerId
          );

        if (!stats) {
          stats = {
            playerId:
              player.playerId,

            playerName:
              player.playerName,

            teamId:
              player.teamId,

            teamName:
              player.teamName,

            matches: 0,

            goals: 0,
          };

          statsMap.set(
            player.playerId,
            stats
          );
        }

        stats.goals += 1;
      }
    }
  }

  // ===================================================
  // FIX: CALCULATE TEAM MATCH COUNTS
  // ===================================================

  for (
    const player of
    statsMap.values()
  ) {
    player.matches =
      getTeamMatchCount(
        matches,
        sportType,
        player.teamId,
        finalMatch.id
      );
  }

  // ===================================================
  // LEADERBOARD
  // ===================================================

  const leaderboard =
    Array.from(
      statsMap.values()
    )
      .map((player) => ({
        ...player,
        tiedPlayerCount: 1,
      }))
      .sort((a, b) => {
        if (
          b.goals !==
          a.goals
        ) {
          return (
            b.goals -
            a.goals
          );
        }

        return (
          a.playerName.localeCompare(
            b.playerName
          )
        );
      });

  // ===================================================
  // NO GOALS
  // ===================================================

  if (
    leaderboard.length ===
      0
  ) {
    return {
      bestPlayer: null,

      tiedPlayers: [],

      finalStarted: true,

      finalCompleted,

      finalTeamIds,

      highestGoals: 0,
    };
  }

  // ===================================================
  // HIGHEST GOALS
  // ===================================================

  const highestGoals =
    leaderboard[0].goals;

  const tiedPlayers =
    leaderboard
      .filter(
        (player) =>
          player.goals ===
          highestGoals
      )
      .map((player) => ({
        ...player,
        tiedPlayerCount:
          1,
      }));

  // ===================================================
  // ONLY ONE HIGHEST SCORER
  // ===================================================

  if (
    tiedPlayers.length ===
    1
  ) {
    return {
      bestPlayer:
        tiedPlayers[0],

      tiedPlayers,

      finalStarted: true,

      finalCompleted,

      finalTeamIds,

      highestGoals,
    };
  }

  // ===================================================
  // MULTIPLE HIGHEST SCORERS
  // ===================================================

  const tiedTeamIds =
    new Set(
      tiedPlayers.map(
        (player) =>
          player.teamId
      )
    );

  // ===================================================
  // TIE FROM SAME TEAM
  // ===================================================

  if (
    tiedTeamIds.size ===
    1
  ) {
    const count =
      tiedPlayers.length;

    const sameTeamPlayers =
      tiedPlayers.map(
        (player) => ({
          ...player,
          tiedPlayerCount:
            count,
        })
      );

    return {
      bestPlayer:
        sameTeamPlayers[0],

      tiedPlayers:
        sameTeamPlayers,

      finalStarted: true,

      finalCompleted,

      finalTeamIds,

      highestGoals,
    };
  }

  // ===================================================
  // TIE FROM DIFFERENT FINAL TEAMS
  // ===================================================

  if (
    finalCompleted &&
    finalMatch.winnerTeamId
  ) {
    const winningPlayer =
      tiedPlayers.find(
        (player) =>
          player.teamId ===
          finalMatch.winnerTeamId
      );

    if (winningPlayer) {
      return {
        bestPlayer: {
          ...winningPlayer,
          tiedPlayerCount:
            tiedPlayers.length,
        },

        tiedPlayers,

        finalStarted: true,

        finalCompleted: true,

        finalTeamIds,

        highestGoals,
      };
    }
  }

  // ===================================================
  // FINAL LIVE / NO WINNER YET
  // ===================================================

  return {
    bestPlayer: null,

    tiedPlayers,

    finalStarted: true,

    finalCompleted,

    finalTeamIds,

    highestGoals,
  };
}

// =====================================================
// GET OVERALL AWARDS
// =====================================================

export async function GET() {
  try {
    // =================================================
    // GET MATCHES
    // =================================================

    const matches =
      await prisma.match.findMany({
        where: {
          status: {
            in: [
              "UPCOMING",
              "LIVE",
              "COMPLETED",
            ],
          },
        },

        include: {
          // =================================================
          // GAME
          // =================================================

          game: true,

          // =================================================
          // TEAMS
          // =================================================

          team1: true,

          team2: true,

          // =================================================
          // CRICKET
          // =================================================

          cricketInnings: {
            include: {
              ballEvents: true,
            },

            orderBy: {
              inningsNumber: "asc",
            },
          },

          // =================================================
          // FOOTBALL
          // =================================================

          footballEvents: true,

          // =================================================
          // HANDBALL
          // =================================================

          handballEvents: true,

          // =================================================
          // THROWBALL
          // =================================================

          throwballEvents: true,

          throwballPoints: true,
        },

        orderBy: {
          id: "asc",
        },
      });

    // =====================================================
    // COMPLETED MATCHES
    // =====================================================

    const completedMatches =
      matches.filter(
        (match) =>
          match.status ===
          "COMPLETED"
      );

    // =====================================================
    // STAT MAPS
    // =====================================================

    const cricketBatters =
      new Map<
        number,
        CricketBatterStats
      >();

    const cricketBowlers =
      new Map<
        number,
        CricketBowlerStats
      >();

    const footballPlayers =
      new Map<
        number,
        PlayerSportStats
      >();

    const handballPlayers =
      new Map<
        number,
        PlayerSportStats
      >();

    const throwballPlayers =
      new Map<
        number,
        PlayerSportStats
      >();

    // =====================================================
    // PLAYER IDs USED IN MATCHES
    // =====================================================

    const playerIds =
      new Set<number>();

    // =====================================================
    // COLLECT PLAYER IDs
    // =====================================================

    for (const match of matches) {
      // ===================================================
      // CRICKET
      // ===================================================

      for (
        const innings of
        match.cricketInnings
      ) {
        for (
          const ball of
          innings.ballEvents
        ) {
          if (
            ball.strikerId
          ) {
            playerIds.add(
              ball.strikerId
            );
          }

          if (
            ball.nonStrikerId
          ) {
            playerIds.add(
              ball.nonStrikerId
            );
          }

          if (
            ball.bowlerId
          ) {
            playerIds.add(
              ball.bowlerId
            );
          }

          if (
            ball.dismissedPlayerId
          ) {
            playerIds.add(
              ball.dismissedPlayerId
            );
          }

          if (
            ball.fielderId
          ) {
            playerIds.add(
              ball.fielderId
            );
          }
        }
      }

      // ===================================================
      // FOOTBALL
      // ===================================================

      for (
        const event of
        match.footballEvents
      ) {
        if (
          event.playerId
        ) {
          playerIds.add(
            event.playerId
          );
        }
      }

      // ===================================================
      // HANDBALL
      // ===================================================

      for (
        const event of
        match.handballEvents
      ) {
        if (
          event.playerId
        ) {
          playerIds.add(
            event.playerId
          );
        }
      }

      // ===================================================
      // THROWBALL EVENTS
      // ===================================================

      for (
        const event of
        match.throwballEvents
      ) {
        if (
          event.playerId
        ) {
          playerIds.add(
            event.playerId
          );
        }
      }

      // ===================================================
      // THROWBALL POINTS
      // ===================================================

      for (
        const point of
        match.throwballPoints
      ) {
        if (
          point.attackerId
        ) {
          playerIds.add(
            point.attackerId
          );
        }

        if (
          point.opponentPlayerId
        ) {
          playerIds.add(
            point.opponentPlayerId
          );
        }
      }
    }

    // =====================================================
    // GET PLAYERS
    // =====================================================

    const players =
      playerIds.size > 0
        ? await prisma.player.findMany({
            where: {
              id: {
                in:
                  Array.from(
                    playerIds
                  ),
              },
            },

            include: {
              team: true,
            },
          })
        : [];

    // =====================================================
    // PLAYER MAP
    // =====================================================

    const playerMap =
      new Map(
        players.map(
          (player) => [
            player.id,
            player,
          ]
        )
      );

    // =====================================================
    // PROCESS COMPLETED MATCHES
    // =====================================================

    /*
     * CRICKET AND THROWBALL LOGIC BELOW IS KEPT AS-IS.
     */

    for (const match of completedMatches) {
      const sport =
        match.game.sportType;

      // ===================================================
      // CRICKET
      // ===================================================

      if (
        sport === "CRICKET"
      ) {
        for (
          const innings of
          match.cricketInnings
        ) {
          for (
            const ball of
            innings.ballEvents
          ) {
            // =============================================
            // BATTER
            // =============================================

            const striker =
              playerMap.get(
                ball.strikerId
              );

            if (striker) {
              let stats =
                cricketBatters.get(
                  striker.id
                );

              if (!stats) {
                stats = {
                  playerId:
                    striker.id,

                  playerName:
                    striker.name,

                  teamId:
                    striker.teamId,

                  teamName:
                    striker.team.name,

                  matches:
                    new Set<number>(),

                  innings:
                    new Set<number>(),

                  runs: 0,

                  balls: 0,
                };

                cricketBatters.set(
                  striker.id,
                  stats
                );
              }

              stats.matches.add(
                match.id
              );

              stats.innings.add(
                innings.id
              );

              stats.runs +=
                ball.runsOffBat;

              if (
                ball.isLegalDelivery
              ) {
                stats.balls += 1;
              }
            }

            // =============================================
            // BOWLER
            // =============================================

            const bowler =
              playerMap.get(
                ball.bowlerId
              );

            if (!bowler) {
              continue;
            }

            let bowlerStats =
              cricketBowlers.get(
                bowler.id
              );

            if (!bowlerStats) {
              bowlerStats = {
                playerId:
                  bowler.id,

                playerName:
                  bowler.name,

                teamId:
                  bowler.teamId,

                teamName:
                  bowler.team.name,

                matches:
                  new Set<number>(),

                wickets: 0,

                runsConceded: 0,

                legalBalls: 0,
              };

              cricketBowlers.set(
                bowler.id,
                bowlerStats
              );
            }

            bowlerStats.matches.add(
              match.id
            );

            if (
              ball.isLegalDelivery
            ) {
              bowlerStats.legalBalls +=
                1;
            }

            if (
              ball.extraType !==
                "BYE" &&
              ball.extraType !==
                "LEG_BYE"
            ) {
              bowlerStats.runsConceded +=
                ball.runsOffBat +
                ball.extraRuns;
            }

            const dismissalType =
              ball.dismissalType;

            if (
              ball.isWicket === true &&
              dismissalType &&
              BOWLER_WICKET_TYPES.has(
                dismissalType
              )
            ) {
              bowlerStats.wickets +=
                1;
            }
          }
        }
      }

      // ===================================================
      // FOOTBALL
      // ===================================================

      if (
        sport === "FOOTBALL"
      ) {
        for (
          const event of
          match.footballEvents
        ) {
          if (
            event.eventType !==
              "GOAL" ||
            !event.playerId
          ) {
            continue;
          }

          const player =
            playerMap.get(
              event.playerId
            );

          if (!player) {
            continue;
          }

          let stats =
            footballPlayers.get(
              player.id
            );

          if (!stats) {
            stats = {
              playerId:
                player.id,

              playerName:
                player.name,

              teamId:
                player.teamId,

              teamName:
                player.team.name,

              matches:
                new Set<number>(),

              goals: 0,

              points: 0,
            };

            footballPlayers.set(
              player.id,
              stats
            );
          }

          stats.matches.add(
            match.id
          );

          stats.goals +=
            1;
        }
      }

      // ===================================================
      // HANDBALL
      // ===================================================

      if (
        sport === "HANDBALL"
      ) {
        for (
          const event of
          match.handballEvents
        ) {
          if (
            event.eventType !==
              "GOAL" ||
            !event.playerId
          ) {
            continue;
          }

          const player =
            playerMap.get(
              event.playerId
            );

          if (!player) {
            continue;
          }

          let stats =
            handballPlayers.get(
              player.id
            );

          if (!stats) {
            stats = {
              playerId:
                player.id,

              playerName:
                player.name,

              teamId:
                player.teamId,

              teamName:
                player.team.name,

              matches:
                new Set<number>(),

              goals: 0,

              points: 0,
            };

            handballPlayers.set(
              player.id,
              stats
            );
          }

          stats.matches.add(
            match.id
          );

          stats.goals +=
            1;
        }
      }

      // ===================================================
      // THROWBALL
      // ===================================================

      if (
        sport === "THROWBALL"
      ) {
        for (
          const point of
          match.throwballPoints
        ) {
          if (
            !point.attackerId
          ) {
            continue;
          }

          const player =
            playerMap.get(
              point.attackerId
            );

          if (!player) {
            continue;
          }

          let stats =
            throwballPlayers.get(
              player.id
            );

          if (!stats) {
            stats = {
              playerId:
                player.id,

              playerName:
                player.name,

              teamId:
                player.teamId,

              teamName:
                player.team.name,

              matches:
                new Set<number>(),

              goals: 0,

              points: 0,
            };

            throwballPlayers.set(
              player.id,
              stats
            );
          }

          stats.matches.add(
            match.id
          );

          stats.points +=
            1;
        }
      }
    }

    // =====================================================
    // CRICKET BATTER LEADERBOARD
    // =====================================================

    const batterLeaderboard =
      Array.from(
        cricketBatters.values()
      )
        .map((stats) => ({
          playerId:
            stats.playerId,

          playerName:
            stats.playerName,

          teamId:
            stats.teamId,

          teamName:
            stats.teamName,

          matches:
            stats.matches.size,

          innings:
            stats.innings.size,

          runs:
            stats.runs,

          balls:
            stats.balls,

          strikeRate:
            roundNumber(
              getStrikeRate(
                stats.runs,
                stats.balls
              )
            ),
        }))
        .sort((a, b) => {
          if (
            b.runs !==
            a.runs
          ) {
            return (
              b.runs -
              a.runs
            );
          }

          if (
            b.strikeRate !==
            a.strikeRate
          ) {
            return (
              b.strikeRate -
              a.strikeRate
            );
          }

          if (
            b.innings !==
            a.innings
          ) {
            return (
              b.innings -
              a.innings
            );
          }

          return (
            b.matches -
            a.matches
          );
        });

    // =====================================================
    // CRICKET BOWLER LEADERBOARD
    // =====================================================

    const bowlerLeaderboard =
      Array.from(
        cricketBowlers.values()
      )
        .map((stats) => ({
          playerId:
            stats.playerId,

          playerName:
            stats.playerName,

          teamId:
            stats.teamId,

          teamName:
            stats.teamName,

          matches:
            stats.matches.size,

          wickets:
            stats.wickets,

          runsConceded:
            stats.runsConceded,

          legalBalls:
            stats.legalBalls,

          overs:
            `${Math.floor(
              stats.legalBalls /
                6
            )}.${stats.legalBalls % 6}`,

          economy:
            roundNumber(
              getEconomy(
                stats.runsConceded,
                stats.legalBalls
              )
            ),
        }))
        .sort((a, b) => {
          if (
            b.wickets !==
            a.wickets
          ) {
            return (
              b.wickets -
              a.wickets
            );
          }

          if (
            a.economy !==
            b.economy
          ) {
            return (
              a.economy -
              b.economy
            );
          }

          return (
            b.legalBalls -
            a.legalBalls
          );
        });

    // =====================================================
    // FOOTBALL LEADERBOARD
    // =====================================================

    const footballLeaderboard =
      Array.from(
        footballPlayers.values()
      )
        .map((stats) => ({
          playerId:
            stats.playerId,

          playerName:
            stats.playerName,

          teamId:
            stats.teamId,

          teamName:
            stats.teamName,

          matches:
            stats.matches.size,

          goals:
            stats.goals,
        }))
        .sort((a, b) => {
          if (
            b.goals !==
            a.goals
          ) {
            return (
              b.goals -
              a.goals
            );
          }

          return (
            b.matches -
            a.matches
          );
        });

    // =====================================================
    // HANDBALL LEADERBOARD
    // =====================================================

    const handballLeaderboard =
      Array.from(
        handballPlayers.values()
      )
        .map((stats) => ({
          playerId:
            stats.playerId,

          playerName:
            stats.playerName,

          teamId:
            stats.teamId,

          teamName:
            stats.teamName,

          matches:
            stats.matches.size,

          goals:
            stats.goals,
        }))
        .sort((a, b) => {
          if (
            b.goals !==
            a.goals
          ) {
            return (
              b.goals -
              a.goals
            );
          }

          return (
            b.matches -
            a.matches
          );
        });

    // =====================================================
    // THROWBALL LEADERBOARD
    // =====================================================

    const throwballLeaderboard =
      Array.from(
        throwballPlayers.values()
      )
        .map((stats) => ({
          playerId:
            stats.playerId,

          playerName:
            stats.playerName,

          teamId:
            stats.teamId,

          teamName:
            stats.teamName,

          matches:
            stats.matches.size,

          points:
            stats.points,
        }))
        .sort((a, b) => {
          if (
            b.points !==
            a.points
          ) {
            return (
              b.points -
              a.points
            );
          }

          return (
            b.matches -
            a.matches
          );
        });

    // =====================================================
    // CONVERT PLAYER MAPS FOR AWARD CALCULATION
    // =====================================================

    const footballAwardPlayers =
      new Map<
        number,
        PlayerSportStats
      >();

    for (
      const stats of
      footballPlayers.values()
    ) {
      footballAwardPlayers.set(
        stats.playerId,
        {
          ...stats,
          matches:
            new Set(
              stats.matches
            ),
        }
      );
    }

    const handballAwardPlayers =
      new Map<
        number,
        PlayerSportStats
      >();

    for (
      const stats of
      handballPlayers.values()
    ) {
      handballAwardPlayers.set(
        stats.playerId,
        {
          ...stats,
          matches:
            new Set(
              stats.matches
            ),
        }
      );
    }

    // =====================================================
    // ADD PLAYERS FROM FINAL TEAMS
    // =====================================================

    for (const match of matches) {
      if (
        match.stage !==
          "FINAL" ||
        (
          match.status !==
            "LIVE" &&
          match.status !==
            "COMPLETED"
        )
      ) {
        continue;
      }

      if (
        match.game?.sportType ===
        "FOOTBALL"
      ) {
        for (
          const player of
          players
        ) {
          if (
            player.teamId !==
              match.team1Id &&
            player.teamId !==
              match.team2Id
          ) {
            continue;
          }

          if (
            !footballAwardPlayers.has(
              player.id
            )
          ) {
            footballAwardPlayers.set(
              player.id,
              {
                playerId:
                  player.id,

                playerName:
                  player.name,

                teamId:
                  player.teamId,

                teamName:
                  player.team.name,

                matches:
                  new Set<number>(),

                goals: 0,

                points: 0,
              }
            );
          }
        }
      }

      if (
        match.game?.sportType ===
        "HANDBALL"
      ) {
        for (
          const player of
          players
        ) {
          if (
            player.teamId !==
              match.team1Id &&
            player.teamId !==
              match.team2Id
          ) {
            continue;
          }

          if (
            !handballAwardPlayers.has(
              player.id
            )
          ) {
            handballAwardPlayers.set(
              player.id,
              {
                playerId:
                  player.id,

                playerName:
                  player.name,

                teamId:
                  player.teamId,

                teamName:
                  player.team.name,

                matches:
                  new Set<number>(),

                goals: 0,

                points: 0,
              }
            );
          }
        }
      }
    }

    // =====================================================
    // FOOTBALL OVERALL AWARD
    // =====================================================

    const footballAward =
      calculateFootballHandballAward(
        footballAwardPlayers,
        matches,
        "FOOTBALL"
      );

    // =====================================================
    // HANDBALL OVERALL AWARD
    // =====================================================

    const handballAward =
      calculateFootballHandballAward(
        handballAwardPlayers,
        matches,
        "HANDBALL"
      );

    // =====================================================
    // BEST PLAYERS
    // =====================================================

    const bestBatter =
      batterLeaderboard[0] ??
      null;

    const bestBowler =
      bowlerLeaderboard[0] ??
      null;

    const bestFootballPlayer =
      footballAward.bestPlayer;

    const bestHandballPlayer =
      handballAward.bestPlayer;

    const bestThrowballPlayer =
      throwballLeaderboard[0] ??
      null;

    // =====================================================
    // RESPONSE
    // =====================================================

    return NextResponse.json({
      success: true,

      summary: {
        completedMatches:
          completedMatches.length,

        cricketMatches:
          completedMatches.filter(
            (match) =>
              match.game
                .sportType ===
              "CRICKET"
          ).length,

        footballMatches:
          completedMatches.filter(
            (match) =>
              match.game
                .sportType ===
              "FOOTBALL"
          ).length,

        handballMatches:
          completedMatches.filter(
            (match) =>
              match.game
                .sportType ===
              "HANDBALL"
          ).length,

        throwballMatches:
          completedMatches.filter(
            (match) =>
              match.game
                .sportType ===
              "THROWBALL"
          ).length,
      },

      // ===================================================
      // AWARDS
      // ===================================================

      awards: {
        bestBatter,

        bestBowler,

        bestFootballPlayer,

        bestHandballPlayer,

        bestThrowballPlayer,

        football: {
          bestPlayer:
            footballAward.bestPlayer,

          tiedPlayers:
            footballAward.tiedPlayers,

          tiedPlayerCount:
            footballAward.tiedPlayers.length,

          finalStarted:
            footballAward.finalStarted,

          finalCompleted:
            footballAward.finalCompleted,

          finalTeamIds:
            footballAward.finalTeamIds,

          highestGoals:
            footballAward.highestGoals,
        },

        handball: {
          bestPlayer:
            handballAward.bestPlayer,

          tiedPlayers:
            handballAward.tiedPlayers,

          tiedPlayerCount:
            handballAward.tiedPlayers.length,

          finalStarted:
            handballAward.finalStarted,

          finalCompleted:
            handballAward.finalCompleted,

          finalTeamIds:
            handballAward.finalTeamIds,

          highestGoals:
            handballAward.highestGoals,
        },
      },

      // ===================================================
      // LEADERBOARDS
      // ===================================================

      leaderboards: {
        cricketBatters:
          batterLeaderboard,

        cricketBowlers:
          bowlerLeaderboard,

        football:
          footballLeaderboard,

        handball:
          handballLeaderboard,

        throwball:
          throwballLeaderboard,
      },
    });
  } catch (error) {
    console.error(
      "OVERALL AWARDS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to calculate overall awards.",
      },
      {
        status: 500,
      }
    );
  }
}