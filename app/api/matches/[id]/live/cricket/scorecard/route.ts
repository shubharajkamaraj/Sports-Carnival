import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
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
          error: "Invalid match ID.",
        },
        { status: 400 }
      );
    }

    const match = await prisma.match.findUnique({
      where: {
        id: matchId,
      },

      include: {
        team1: true,
        team2: true,
        game: true,

        cricketInnings: {
          orderBy: {
            inningsNumber: "asc",
          },

          include: {
            ballEvents: {
              orderBy: [
                {
                  overNumber: "asc",
                },
                {
                  ballNumber: "asc",
                },
              ],
            },
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json(
        {
          error: "Match not found.",
        },
        { status: 404 }
      );
    }

    /*
     * =========================================================
     * GET ALL PLAYER IDS USED IN BALL EVENTS
     * =========================================================
     */

    const playerIds = new Set<number>();

    for (const innings of match.cricketInnings) {
      for (const ball of innings.ballEvents) {
        playerIds.add(ball.strikerId);
        playerIds.add(ball.nonStrikerId);
        playerIds.add(ball.bowlerId);

        if (ball.dismissedPlayerId) {
          playerIds.add(ball.dismissedPlayerId);
        }

        if (ball.fielderId) {
          playerIds.add(ball.fielderId);
        }
      }
    }

    const players =
      playerIds.size > 0
        ? await prisma.player.findMany({
            where: {
              id: {
                in: Array.from(playerIds),
              },
            },
          })
        : [];

    const playerMap = new Map(
      players.map((player) => [
        player.id,
        player,
      ])
    );

    /*
     * =========================================================
     * BATTING STATS
     * =========================================================
     */

    const battingMap = new Map<
      number,
      {
        player: (typeof players)[number];
        innings: number;
        runs: number;
        balls: number;
        fours: number;
        sixes: number;
        isOut: boolean;
      }
    >();

    /*
     * =========================================================
     * BOWLING STATS
     * =========================================================
     */

    const bowlingMap = new Map<
      number,
      {
        player: (typeof players)[number];
        innings: number;
        balls: number;
        runs: number;
        wickets: number;
        wides: number;
        noBalls: number;
      }
    >();

    for (const innings of match.cricketInnings) {
      for (const ball of innings.ballEvents) {
        /*
         * -------------------------
         * BATTING
         * -------------------------
         */

        const striker =
          playerMap.get(ball.strikerId);

        if (striker) {
          const existing =
            battingMap.get(ball.strikerId);

          if (existing) {
            existing.runs +=
              ball.runsOffBat;

            if (ball.isLegalDelivery) {
              existing.balls += 1;
            }

            if (ball.runsOffBat === 4) {
              existing.fours += 1;
            }

            if (ball.runsOffBat === 6) {
              existing.sixes += 1;
            }

            if (
              ball.isWicket &&
              ball.dismissedPlayerId ===
                ball.strikerId
            ) {
              existing.isOut = true;
            }
          } else {
            battingMap.set(
              ball.strikerId,
              {
                player: striker,
                innings:
                  innings.inningsNumber,
                runs:
                  ball.runsOffBat,
                balls:
                  ball.isLegalDelivery
                    ? 1
                    : 0,
                fours:
                  ball.runsOffBat === 4
                    ? 1
                    : 0,
                sixes:
                  ball.runsOffBat === 6
                    ? 1
                    : 0,
                isOut:
                  ball.isWicket &&
                  ball.dismissedPlayerId ===
                    ball.strikerId,
              }
            );
          }
        }

        /*
         * -------------------------
         * BOWLING
         * -------------------------
         */

        const bowler =
          playerMap.get(ball.bowlerId);

        if (bowler) {
          const existing =
            bowlingMap.get(ball.bowlerId);

          /*
           * Bowler is charged with:
           * - runs off bat
           * - wides
           * - no-ball extra
           *
           * Bye and leg-bye are not charged
           * to the bowler.
           */

          const bowlerRuns =
            ball.extraType === "BYE" ||
            ball.extraType === "LEG_BYE"
              ? 0
              : ball.totalRuns;

          if (existing) {
            if (ball.isLegalDelivery) {
              existing.balls += 1;
            }

            existing.runs += bowlerRuns;

            if (
              ball.extraType === "WIDE"
            ) {
              existing.wides +=
                ball.extraRuns;
            }

            if (
              ball.extraType === "NO_BALL"
            ) {
              existing.noBalls += 1;
            }

            if (
              ball.isWicket &&
              ball.dismissalType &&
              ball.dismissalType !==
                "RUN_OUT" &&
              ball.dismissalType !==
                "RETIRED_HURT" &&
              ball.dismissalType !==
                "RETIRED_OUT" &&
              ball.dismissalType !==
                "OBSTRUCTING_THE_FIELD"
            ) {
              existing.wickets += 1;
            }
          } else {
            bowlingMap.set(
              ball.bowlerId,
              {
                player: bowler,
                innings:
                  innings.inningsNumber,
                balls:
                  ball.isLegalDelivery
                    ? 1
                    : 0,
                runs:
                  bowlerRuns,
                wickets:
                  ball.isWicket &&
                  ball.dismissalType &&
                  ball.dismissalType !==
                    "RUN_OUT" &&
                  ball.dismissalType !==
                    "RETIRED_HURT" &&
                  ball.dismissalType !==
                    "RETIRED_OUT" &&
                  ball.dismissalType !==
                    "OBSTRUCTING_THE_FIELD"
                    ? 1
                    : 0,
                wides:
                  ball.extraType ===
                  "WIDE"
                    ? ball.extraRuns
                    : 0,
                noBalls:
                  ball.extraType ===
                  "NO_BALL"
                    ? 1
                    : 0,
              }
            );
          }
        }
      }
    }

    /*
     * =========================================================
     * FORMAT BATTING
     * =========================================================
     */

    const batting = Array.from(
      battingMap.values()
    )
      .sort(
        (a, b) => b.runs - a.runs
      )
      .map((stat) => ({
        player: stat.player,
        innings: stat.innings,
        runs: stat.runs,
        balls: stat.balls,
        fours: stat.fours,
        sixes: stat.sixes,
        isOut: stat.isOut,
      }));

    /*
     * =========================================================
     * FORMAT BOWLING
     * =========================================================
     */

    const bowling = Array.from(
      bowlingMap.values()
    )
      .sort((a, b) => {
        if (b.wickets !== a.wickets) {
          return b.wickets - a.wickets;
        }

        return a.runs - b.runs;
      })
      .map((stat) => ({
        player: stat.player,
        innings: stat.innings,
        overs: `${Math.floor(
          stat.balls / 6
        )}.${stat.balls % 6}`,
        balls: stat.balls,
        runs: stat.runs,
        wickets: stat.wickets,
        wides: stat.wides,
        noBalls: stat.noBalls,
      }));

    /*
     * =========================================================
     * INNINGS SUMMARY
     * =========================================================
     */

    const innings = match.cricketInnings.map(
      (item) => ({
        id: item.id,
        inningsNumber:
          item.inningsNumber,
        battingTeamId:
          item.battingTeamId,
        bowlingTeamId:
          item.bowlingTeamId,
        totalRuns:
          item.totalRuns,
        totalWickets:
          item.totalWickets,
        legalBalls:
          item.legalBalls,
      })
    );

    return NextResponse.json({
      matchId: match.id,

      teams: {
        team1: match.team1,
        team2: match.team2,
      },

      game: match.game,

      innings,

      batting,

      bowling,
    });
  } catch (error) {
    console.error(
      "CRICKET SCORECARD ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load cricket scorecard.",
      },
      { status: 500 }
    );
  }
}