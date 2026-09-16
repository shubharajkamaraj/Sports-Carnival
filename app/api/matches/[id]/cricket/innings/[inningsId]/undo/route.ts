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

    if (!Number.isInteger(matchId) || matchId <= 0) {
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
    // LOAD MATCH
    // =====================================================

    const match =
      await prisma.match.findUnique({
        where: {
          id: matchId,
        },

        include: {
          cricketInnings: {
            include: {
              ballEvents: {
                orderBy: {
                  id: "desc",
                },
              },
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
        {
          status: 404,
        }
      );
    }

    // =====================================================
    // FIND INNINGS
    // =====================================================

    const innings =
      match.cricketInnings.find(
        (item) => item.id === inningsId
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
    // FIND LAST BALL
    // =====================================================

    const lastBall =
      innings.ballEvents[0];

    if (!lastBall) {
      return NextResponse.json(
        {
          error: "There is no ball to undo.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // SAFETY
    // =====================================================

    /*
     * We only allow undo for the current innings.
     *
     * If another innings exists after this innings,
     * undoing an older innings could make the match state
     * inconsistent.
     */

    const latestInnings =
      match.cricketInnings[
        match.cricketInnings.length - 1
      ];

    if (
      latestInnings &&
      latestInnings.id !== innings.id
    ) {
      return NextResponse.json(
        {
          error:
            "You can only undo the last ball of the current innings.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // MATCH OVERS
    // =====================================================

    const maxOvers = Number(
      match.overs ?? 0
    );

    if (
      !Number.isInteger(maxOvers) ||
      maxOvers <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Match overs are not configured correctly.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // VALUES TO REVERSE
    // =====================================================

    const runsToRemove =
      Number(lastBall.totalRuns ?? 0);

    const wicketToRemove =
      lastBall.isWicket ? 1 : 0;

    const legalBallToRemove =
      lastBall.isLegalDelivery ? 1 : 0;

    // =====================================================
    // PREVIOUS INNINGS STATE
    // =====================================================

    const previousTotalRuns =
      Math.max(
        0,
        innings.totalRuns -
          runsToRemove
      );

    const previousTotalWickets =
      Math.max(
        0,
        innings.totalWickets -
          wicketToRemove
      );

    const previousLegalBalls =
      Math.max(
        0,
        innings.legalBalls -
          legalBallToRemove
      );

    // =====================================================
    // TRANSACTION
    // =====================================================

    const result =
      await prisma.$transaction(
        async (tx) => {
          // =================================================
          // DELETE LAST BALL
          // =================================================

          await tx.cricketBallEvent.delete({
            where: {
              id: lastBall.id,
            },
          });

          // =================================================
          // UPDATE INNINGS
          // =================================================

          const updatedInnings =
            await tx.cricketInnings.update({
              where: {
                id: innings.id,
              },

              data: {
                totalRuns:
                  previousTotalRuns,

                totalWickets:
                  previousTotalWickets,

                legalBalls:
                  previousLegalBalls,
              },
            });

          // =================================================
          // REOPEN MATCH IF IT WAS COMPLETED
          // =================================================

          if (
            match.status === "COMPLETED"
          ) {
            await tx.match.update({
              where: {
                id: matchId,
              },

              data: {
                status: "LIVE",

                /*
                 * If your Prisma schema has result
                 * and winnerTeamId as nullable fields,
                 * these can be reset to null.
                 */
                result: null,

                winnerTeamId: null,

                team1Score:
        match.cricketInnings.find(
          (item) =>
            item.inningsNumber === 1 &&
            item.battingTeamId === match.team1Id
        )?.totalRuns ?? 0,

      team2Score:
        match.cricketInnings.find(
          (item) =>
            item.inningsNumber === 1 &&
            item.battingTeamId === match.team2Id
        )?.totalRuns ?? 0,
              },
            });
          }

          // =================================================
          // INNINGS 2 UNDO
          // =================================================

          if (
            innings.inningsNumber === 2
          ) {
            /*
             * Recalculate the first innings score.
             */

            const innings1 =
              match.cricketInnings.find(
                (item) =>
                  item.inningsNumber === 1
              );

            const target =
              innings1
                ? innings1.totalRuns + 1
                : null;

            const chaseStillPossible =
              target !== null &&
              previousTotalRuns <
                target;

            return {
              success: true,

              undoneBallId:
                lastBall.id,

              inningsId:
                innings.id,

              inningsNumber:
                innings.inningsNumber,

              updatedInnings,

              removedRuns:
                runsToRemove,

              removedWicket:
                lastBall.isWicket,

              removedLegalBall:
                lastBall.isLegalDelivery,

              totalRuns:
                previousTotalRuns,

              totalWickets:
                previousTotalWickets,

              legalBalls:
                previousLegalBalls,

              ballCount:
                previousLegalBalls % 6,

              overNumber:
                Math.floor(
                  previousLegalBalls / 6
                ),

              target,

              targetChased:
                false,

              matchCompleted:
                false,

              matchStatus:
                "LIVE",

              chaseStillPossible,
            };
          }

          // =================================================
          // INNINGS 1 UNDO
          // =================================================

          /*
           * If the last ball completed innings 1,
           * your POST API may have created innings 2.
           *
           * Since innings 2 is only automatically created
           * when innings 1 finishes, remove it here if it
           * has zero balls.
           */

          const innings2 =
            match.cricketInnings.find(
              (item) =>
                item.inningsNumber === 2
            );

          let removedInnings2 =
            false;

          if (innings2) {
            const innings2BallCount =
              await tx.cricketBallEvent.count({
                where: {
                  inningsId:
                    innings2.id,
                },
              });

            /*
             * Only delete innings 2 if it has no balls.
             *
             * This protects us from deleting a real innings
             * that already contains scoring data.
             */

            if (
              innings2BallCount === 0
            ) {
              await tx.cricketInnings.delete({
                where: {
                  id: innings2.id,
                },
              });

              removedInnings2 = true;
            }
          }

          return {
            success: true,

            undoneBallId:
              lastBall.id,

            inningsId:
              innings.id,

            inningsNumber:
              innings.inningsNumber,

            updatedInnings,

            removedRuns:
              runsToRemove,

            removedWicket:
              lastBall.isWicket,

            removedLegalBall:
              lastBall.isLegalDelivery,

            totalRuns:
              previousTotalRuns,

            totalWickets:
              previousTotalWickets,

            legalBalls:
              previousLegalBalls,

            ballCount:
              previousLegalBalls % 6,

            overNumber:
              Math.floor(
                previousLegalBalls / 6
              ),

            inningsCompleted:
              false,

            matchCompleted:
              false,

            matchStatus:
              "LIVE",

            removedInnings2,
          };
        }
      );

    // =====================================================
    // RESPONSE
    // =====================================================

    return NextResponse.json(
      {

        message:
          "Last ball undone successfully.",

        ...result,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "UNDO LAST CRICKET BALL ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to undo last cricket ball.",
      },
      {
        status: 500,
      }
    );
  }
}