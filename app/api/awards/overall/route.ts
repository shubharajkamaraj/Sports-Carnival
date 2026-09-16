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
// GET OVERALL AWARDS
// =====================================================

export async function GET() {
  try {
    // =================================================
    // GET COMPLETED MATCHES
    // =================================================

    const matches =
      await prisma.match.findMany({
        where: {
          status: "COMPLETED",
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
    // PLAYER IDs USED IN COMPLETED MATCHES
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
    // PROCESS MATCHES
    // =====================================================

    for (const match of matches) {
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

              // =========================================
              // MATCH
              // =========================================

              stats.matches.add(
                match.id
              );

              // =========================================
              // INNINGS
              // =========================================

              stats.innings.add(
                innings.id
              );

              // =========================================
              // RUNS
              // =========================================

              /*
               * Only runs from the bat.
               *
               * Extras are not batter runs.
               */

              stats.runs +=
                ball.runsOffBat;

              // =========================================
              // BALLS
              // =========================================

              /*
               * Batter ball faced:
               *
               * Legal delivery = 1 ball.
               *
               * Wide = not counted.
               *
               * No-ball = not counted.
               *
               * Bye / leg-bye are legal deliveries,
               * therefore count as balls faced.
               */

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

            // =============================================
            // MATCH
            // =============================================

            bowlerStats.matches.add(
              match.id
            );

            // =============================================
            // LEGAL BALLS
            // =============================================

            if (
              ball.isLegalDelivery
            ) {
              bowlerStats.legalBalls +=
                1;
            }

            // =============================================
            // RUNS CONCEDED
            // =============================================

            /*
             * Bye and leg-bye are not charged
             * to the bowler.
             *
             * Wide and no-ball extras ARE charged.
             */

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

            // =============================================
            // WICKETS
            // =============================================

            /*
             * Count only dismissals credited
             * to the bowler.
             */

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

              // ===========================================
              // DEBUG
              // ===========================================

              console.log(
                "CRICKET WICKET COUNTED:",
                {
                  matchId:
                    match.id,

                  ballId:
                    ball.id,

                  bowlerId:
                    bowler.id,

                  bowlerName:
                    bowler.name,

                  dismissedPlayerId:
                    ball.dismissedPlayerId,

                  dismissalType:
                    dismissalType,

                  wickets:
                    bowlerStats.wickets,
                }
              );
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
          /*
           * Only normal GOAL events count.
           *
           * PENALTY GOAL -> excluded
           *
           * OWN GOAL -> excluded
           *
           * YELLOW CARD -> excluded
           *
           * RED CARD -> excluded
           */

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
          /*
           * Only normal goals count.
           *
           * Penalty goals excluded.
           */

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

          /*
           * Each successful throwball point
           * where this player is attacker
           * contributes 1 point.
           */

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
          // 1. Runs
          if (
            b.runs !==
            a.runs
          ) {
            return (
              b.runs -
              a.runs
            );
          }

          // 2. Strike rate
          if (
            b.strikeRate !==
            a.strikeRate
          ) {
            return (
              b.strikeRate -
              a.strikeRate
            );
          }

          // 3. Innings
          if (
            b.innings !==
            a.innings
          ) {
            return (
              b.innings -
              a.innings
            );
          }

          // 4. Matches
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
          // 1. Wickets
          if (
            b.wickets !==
            a.wickets
          ) {
            return (
              b.wickets -
              a.wickets
            );
          }

          // 2. Economy
          if (
            a.economy !==
            b.economy
          ) {
            return (
              a.economy -
              b.economy
            );
          }

          // 3. Legal balls
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
          // 1. Goals
          if (
            b.goals !==
            a.goals
          ) {
            return (
              b.goals -
              a.goals
            );
          }

          // 2. Matches
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
          // 1. Goals
          if (
            b.goals !==
            a.goals
          ) {
            return (
              b.goals -
              a.goals
            );
          }

          // 2. Matches
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
          // 1. Points
          if (
            b.points !==
            a.points
          ) {
            return (
              b.points -
              a.points
            );
          }

          // 2. Matches
          return (
            b.matches -
            a.matches
          );
        });

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
      footballLeaderboard[0] ??
      null;

    const bestHandballPlayer =
      handballLeaderboard[0] ??
      null;

    const bestThrowballPlayer =
      throwballLeaderboard[0] ??
      null;

    // =====================================================
    // DEBUG BOWLER LEADERBOARD
    // =====================================================

    console.log(
      "==============================================="
    );

    console.log(
      "CRICKET BOWLER LEADERBOARD"
    );

    console.log(
      bowlerLeaderboard
    );

    console.log(
      "==============================================="
    );

    // =====================================================
    // RESPONSE
    // =====================================================

    return NextResponse.json({
      success: true,

      summary: {
        completedMatches:
          matches.length,

        cricketMatches:
          matches.filter(
            (match) =>
              match.game
                .sportType ===
              "CRICKET"
          ).length,

        footballMatches:
          matches.filter(
            (match) =>
              match.game
                .sportType ===
              "FOOTBALL"
          ).length,

        handballMatches:
          matches.filter(
            (match) =>
              match.game
                .sportType ===
              "HANDBALL"
          ).length,

        throwballMatches:
          matches.filter(
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
    // ===================================================
    // ERROR
    // ===================================================

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