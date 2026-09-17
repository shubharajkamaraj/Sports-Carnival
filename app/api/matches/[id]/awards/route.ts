import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;
    const matchId = Number(id);

    if (!Number.isInteger(matchId) || matchId <= 0) {
      return NextResponse.json(
        { error: "Invalid match ID." },
        { status: 400 }
      );
    }

    const awards = await prisma.matchAward.findMany({
      where: {
        matchId,
      },
      include: {
        player: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      awards,
    });
  } catch (error) {
    console.error("GET MATCH AWARDS ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to load match awards.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  _request: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;
    const matchId = Number(id);

    if (!Number.isInteger(matchId) || matchId <= 0) {
      return NextResponse.json(
        {
          error: "Invalid match ID.",
        },
        { status: 400 }
      );
    }

    console.log(
      "========== GENERATE MATCH AWARDS =========="
    );

    /*
     * =====================================================
     * LOAD MATCH
     * =====================================================
     */

    const match = await prisma.match.findUnique({
      where: {
        id: matchId,
      },

      include: {
        cricketInnings: {
          include: {
            ballEvents: true,
            battingTeam: true,
            bowlingTeam: true,
          },

          orderBy: {
            inningsNumber: "asc",
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
     * Awards should only be generated
     * after the match is completed.
     */

    if (match.status !== "COMPLETED") {
      return NextResponse.json(
        {
          error:
            "Awards can only be generated after the match is completed.",
        },
        { status: 400 }
      );
    }

    /*
     * =====================================================
     * FIND TOURNAMENT
     * =====================================================
     */

    const tournamentId =
      match.tournamentId;

    /*
     * =====================================================
     * PLAYER STATISTICS
     * =====================================================
     */

    type PlayerBattingStats = {
      playerId: number;
      runs: number;
    };

    type PlayerBowlingStats = {
      playerId: number;
      wickets: number;
      runsConceded: number;
    };

    const battingStats =
      new Map<
        number,
        PlayerBattingStats
      >();

    const bowlingStats =
      new Map<
        number,
        PlayerBowlingStats
      >();

    /*
     * =====================================================
     * PROCESS EVERY BALL
     * =====================================================
     */

    for (const innings of match.cricketInnings) {
      for (const ball of innings.ballEvents) {
        /*
         * -----------------------------
         * BATTER
         * -----------------------------
         */

        const striker =
          battingStats.get(
            ball.strikerId
          ) ?? {
            playerId:
              ball.strikerId,
            runs: 0,
          };

        striker.runs +=
          ball.runsOffBat;

        battingStats.set(
          ball.strikerId,
          striker
        );

        /*
         * -----------------------------
         * BOWLER
         * -----------------------------
         */

        const bowler =
          bowlingStats.get(
            ball.bowlerId
          ) ?? {
            playerId:
              ball.bowlerId,
            wickets: 0,
            runsConceded: 0,
          };

        /*
         * Bowler gets charged for:
         *
         * - normal runs
         * - no-ball runs
         *
         * But not byes/leg-byes.
         */

        if (
          ball.extraType !==
            "BYE" &&
          ball.extraType !==
            "LEG_BYE"
        ) {
          bowler.runsConceded +=
            ball.totalRuns;
        }

        /*
         * Count wickets.
         *
         * Do not count run-outs,
         * retired hurt, etc. as bowler wickets.
         */

        if (
          ball.isWicket &&
          ball.dismissalType !==
            "RUN_OUT" &&
          ball.dismissalType !==
            "RETIRED_HURT"
        ) {
          bowler.wickets += 1;
        }

        bowlingStats.set(
          ball.bowlerId,
          bowler
        );
      }
    }

    /*
     * =====================================================
     * FIND BEST BATTER
     * =====================================================
     */

    let bestBatter:
      | PlayerBattingStats
      | null = null;

    for (const stats of battingStats.values()) {
      if (
        !bestBatter ||
        stats.runs >
          bestBatter.runs
      ) {
        bestBatter = stats;
      }
    }

    /*
     * =====================================================
     * FIND BEST BOWLER
     * =====================================================
     */

    let bestBowler:
      | PlayerBowlingStats
      | null = null;

    for (const stats of bowlingStats.values()) {
      if (!bestBowler) {
        bestBowler = stats;
        continue;
      }

      /*
       * First priority:
       * wickets
       *
       * Second priority:
       * fewer runs conceded
       */

      if (
        stats.wickets >
        bestBowler.wickets
      ) {
        bestBowler = stats;
      } else if (
        stats.wickets ===
          bestBowler.wickets &&
        stats.runsConceded <
          bestBowler.runsConceded
      ) {
        bestBowler = stats;
      }
    }

    /*
     * =====================================================
     * LOAD PLAYER NAMES
     * =====================================================
     */

    const playerIds =
      Array.from(
        new Set([
          ...Array.from(
            battingStats.keys()
          ),
          ...Array.from(
            bowlingStats.keys()
          ),
        ])
      );

    const players =
      await prisma.player.findMany({
        where: {
          id: {
            in: playerIds,
          },
        },
      });

    const playerMap =
      new Map(
        players.map(
          (player) => [
            player.id,
            player,
          ]
        )
      );

    /*
     * =====================================================
     * BEST BATTER
     * =====================================================
     */

    if (bestBatter) {
      const player =
        playerMap.get(
          bestBatter.playerId
        );

      if (player) {
        await prisma.matchAward.upsert({
          where: {
            matchId_awardType: {
              matchId,
              awardType:
                "BEST_PLAYER",
            },
          },

          update: {
            playerId:
              bestBatter.playerId,

            tournamentId,

            reason: `${player.name} scored ${bestBatter.runs} runs.`,
          },

          create: {
            matchId,

            playerId:
              bestBatter.playerId,

            tournamentId,

            awardType:
              "BEST_PLAYER",

            reason: `${player.name} scored ${bestBatter.runs} runs.`,
          },
        });
      }
    }

    /*
     * =====================================================
     * BEST BOWLER
     * =====================================================
     */

    if (bestBowler) {
      const player =
        playerMap.get(
          bestBowler.playerId
        );

      if (player) {
        await prisma.matchAward.upsert({
          where: {
            matchId_awardType: {
              matchId,
              awardType:
                "BEST_BOWLER",
            },
          },

          update: {
            playerId:
              bestBowler.playerId,

            tournamentId,

            reason:
              `${player.name} took ${bestBowler.wickets} wickets and conceded ${bestBowler.runsConceded} runs.`,
          },

          create: {
            matchId,

            playerId:
              bestBowler.playerId,

            tournamentId,

            awardType:
              "BEST_BOWLER",

            reason:
              `${player.name} took ${bestBowler.wickets} wickets and conceded ${bestBowler.runsConceded} runs.`,
          },
        });
      }
    }

    /*
     * =====================================================
     * MAN OF THE MATCH
     * =====================================================
     *
     * Simple scoring system:
     *
     * Batter:
     *     runs
     *
     * Bowler:
     *     wickets × 20
     *     - runs conceded × 0.25
     *
     * This gives wickets significant weight while
     * still allowing a strong batting performance
     * to win Man of the Match.
     */

    let manOfTheMatchId:
      number | null = null;

    let manOfTheMatchScore =
      -Infinity;

    /*
     * Evaluate batters.
     */

    for (const stats of battingStats.values()) {
      const score =
        stats.runs;

      if (
        score >
        manOfTheMatchScore
      ) {
        manOfTheMatchScore =
          score;

        manOfTheMatchId =
          stats.playerId;
      }
    }

    /*
     * Evaluate bowlers.
     */

    for (const stats of bowlingStats.values()) {
      const score =
        stats.wickets * 20 -
        stats.runsConceded *
          0.25;

      if (
        score >
        manOfTheMatchScore
      ) {
        manOfTheMatchScore =
          score;

        manOfTheMatchId =
          stats.playerId;
      }
    }

    /*
     * =====================================================
     * CREATE MAN OF THE MATCH
     * =====================================================
     */

    if (
      manOfTheMatchId !== null
    ) {
      const player =
        playerMap.get(
          manOfTheMatchId
        );

      if (player) {
        let reason =
          `${player.name} was selected as Man of the Match.`;

        const batterStats =
          battingStats.get(
            manOfTheMatchId
          );

        const bowlerStats =
          bowlingStats.get(
            manOfTheMatchId
          );

        if (batterStats) {
          reason =
            `${player.name} scored ${batterStats.runs} runs and was selected as Man of the Match.`;
        }

        if (
          bowlerStats &&
          bowlerStats.wickets > 0
        ) {
          reason =
            `${player.name} took ${bowlerStats.wickets} wickets and was selected as Man of the Match.`;
        }

        await prisma.matchAward.upsert({
          where: {
            matchId_awardType: {
              matchId,
              awardType:
                "MAN_OF_THE_MATCH",
            },
          },

          update: {
            playerId:
              manOfTheMatchId,

            tournamentId,

            reason,
          },

          create: {
            matchId,

            playerId:
              manOfTheMatchId,

            tournamentId,

            awardType:
              "MAN_OF_THE_MATCH",

            reason,
          },
        });
      }
    }

    /*
     * =====================================================
     * LOAD FINAL AWARDS
     * =====================================================
     */

    const awards =
      await prisma.matchAward.findMany({
        where: {
          matchId,
        },

        include: {
          player: true,
        },

        orderBy: {
          createdAt: "asc",
        },
      });

    console.log(
      "FINAL MATCH AWARDS:",
      awards
    );

    console.log(
      "=========================================="
    );

    return NextResponse.json({
      success: true,
      awards,
    });
  } catch (error) {
    console.error(
      "POST MATCH AWARDS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate match awards.",
      },
      {
        status: 500,
      }
    );
  }
}