import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
    inningsId: string;
  }>;
};

export async function POST(
  req: Request,
  context: RouteContext
) {
  try {
    // =====================================================
    // PARAMS
    // =====================================================

    const {
      id,
      inningsId: inningsIdParam,
    } = await context.params;

    const matchId = Number(id);
    const inningsId = Number(inningsIdParam);

    if (
      !Number.isInteger(matchId) ||
      matchId <= 0
    ) {
      return NextResponse.json(
        {
          error: "Invalid match ID.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(inningsId) ||
      inningsId <= 0
    ) {
      return NextResponse.json(
        {
          error: "Invalid innings ID.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // LOAD MATCH + INNINGS
    // =====================================================

    const match =
      await prisma.match.findUnique({
        where: {
          id: matchId,
        },

        include: {
          cricketInnings: {
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
        {
          status: 404,
        }
      );
    }

    // =====================================================
    // MATCH MUST BE LIVE
    // =====================================================

    if (match.status !== "LIVE") {
      return NextResponse.json(
        {
          error: "This match is not live.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // FIND CURRENT INNINGS
    // =====================================================

    const innings =
      match.cricketInnings.find(
        (item) =>
          item.id === inningsId
      );

    if (!innings) {
      return NextResponse.json(
        {
          error: "Cricket innings not found.",
        },
        {
          status: 404,
        }
      );
    }

    // =====================================================
    // ONLY INNINGS 1 OR 2
    // =====================================================

    if (
      innings.inningsNumber !== 1 &&
      innings.inningsNumber !== 2
    ) {
      return NextResponse.json(
        {
          error: "Invalid innings number.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // CHECK WHETHER ALREADY COMPLETED
    // =====================================================

    const maxOvers = Number(
      match.overs ?? 0
    );

    const maximumLegalBalls =
      maxOvers * 6;

    if (
      innings.legalBalls >=
      maximumLegalBalls
    ) {
      // It may already have been completed
      // automatically.

      if (
        innings.inningsNumber === 1
      ) {
        let innings2 =
          match.cricketInnings.find(
            (item) =>
              item.inningsNumber === 2
          );

        if (!innings2) {
          innings2 =
            await prisma.cricketInnings.create(
              {
                data: {
                  matchId,

                  inningsNumber: 2,

                  battingTeamId:
                    innings.bowlingTeamId,

                  bowlingTeamId:
                    innings.battingTeamId,

                  totalRuns: 0,

                  totalWickets: 0,

                  legalBalls: 0,
                },
              }
            );
        }

        return NextResponse.json(
          {
            success: true,

            inningsCompleted: true,

            nextInnings: {
              id: innings2.id,

              inningsNumber:
                innings2.inningsNumber,

              battingTeamId:
                innings2.battingTeamId,

              bowlingTeamId:
                innings2.bowlingTeamId,

              totalRuns:
                innings2.totalRuns,

              totalWickets:
                innings2.totalWickets,

              legalBalls:
                innings2.legalBalls,
            },

            matchCompleted: false,
          },
          {
            status: 200,
          }
        );
      }

      return NextResponse.json(
        {
          success: true,

          inningsCompleted: true,

          nextInnings: null,

          matchCompleted: true,
        },
        {
          status: 200,
        }
      );
    }

    // =====================================================
    // TRANSACTION
    // =====================================================

    const result =
      await prisma.$transaction(
        async (tx) => {
          // =================================================
          // INNINGS 1
          // =================================================

          if (
            innings.inningsNumber === 1
          ) {
            // -----------------------------------------------
            // CHECK EXISTING INNINGS 2
            // -----------------------------------------------

            let innings2 =
              match.cricketInnings.find(
                (item) =>
                  item.inningsNumber === 2
              );

            // -----------------------------------------------
            // CREATE INNINGS 2
            // -----------------------------------------------

            if (!innings2) {
              const createdInnings2 =
                await tx.cricketInnings.create(
                  {
                    data: {
                      matchId,

                      inningsNumber: 2,

                      // Team that bowled
                      // Innings 1 now bats.
                      battingTeamId:
                        innings.bowlingTeamId,

                      // Team that batted
                      // Innings 1 now bowls.
                      bowlingTeamId:
                        innings.battingTeamId,

                      totalRuns: 0,

                      totalWickets: 0,

                      legalBalls: 0,
                    },
                  }
                );

              innings2 =
                createdInnings2;
            }

            // -----------------------------------------------
            // RETURN
            // -----------------------------------------------

            return {
              nextInnings: {
                id: innings2.id,

                inningsNumber:
                  innings2.inningsNumber,

                battingTeamId:
                  innings2.battingTeamId,

                bowlingTeamId:
                  innings2.bowlingTeamId,

                totalRuns:
                  innings2.totalRuns,

                totalWickets:
                  innings2.totalWickets,

                legalBalls:
                  innings2.legalBalls,
              },

              matchCompleted: false,
            };
          }

          // =================================================
          // INNINGS 2
          // =================================================

          return {
            nextInnings: null,

            matchCompleted: true,
          };
        }
      );

    // =====================================================
    // RETURN
    // =====================================================

    return NextResponse.json(
      {
        success: true,

        inningsCompleted: true,

        currentInnings: {
          id: innings.id,

          inningsNumber:
            innings.inningsNumber,

          totalRuns:
            innings.totalRuns,

          totalWickets:
            innings.totalWickets,

          legalBalls:
            innings.legalBalls,
        },

        nextInnings:
          result.nextInnings,

        matchCompleted:
          result.matchCompleted,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "END CRICKET INNINGS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to end innings.",
      },
      {
        status: 500,
      }
    );
  }
}