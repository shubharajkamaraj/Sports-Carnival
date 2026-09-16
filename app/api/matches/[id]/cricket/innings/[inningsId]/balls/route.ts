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

    if (!Number.isInteger(inningsId) || inningsId <= 0) {
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
    // REQUEST BODY
    // =====================================================

    const body = await req.json();

    const strikerId = Number(body.strikerId);
    const nonStrikerId = Number(body.nonStrikerId);
    const bowlerId = Number(body.bowlerId);

    const runsOffBat = Number(body.runsOffBat ?? 0);
    const extraRuns = Number(body.extraRuns ?? 0);

    const totalRuns = Number(
      body.totalRuns ?? runsOffBat + extraRuns
    );

    const extraType = String(
      body.extraType ?? "NONE"
    ).toUpperCase();

    const isLegalDelivery =
      body.isLegalDelivery === true;

    const isWicket =
      body.isWicket === true;

    const dismissalType = body.dismissalType
      ? String(body.dismissalType).toUpperCase()
      : null;

    const dismissedPlayerId =
      body.dismissedPlayerId
        ? Number(body.dismissedPlayerId)
        : null;

    const fielderId =
      body.fielderId
        ? Number(body.fielderId)
        : null;

    // =====================================================
    // BASIC VALIDATION
    // =====================================================

    if (
      !Number.isInteger(strikerId) ||
      strikerId <= 0 ||
      !Number.isInteger(nonStrikerId) ||
      nonStrikerId <= 0 ||
      !Number.isInteger(bowlerId) ||
      bowlerId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Striker, non-striker and bowler are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (strikerId === nonStrikerId) {
      return NextResponse.json(
        {
          error:
            "Striker and non-striker must be different.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      runsOffBat < 0 ||
      extraRuns < 0 ||
      totalRuns < 0
    ) {
      return NextResponse.json(
        {
          error: "Runs cannot be negative.",
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

          cricketInnings: {
            include: {
              ballEvents: true,

              battingTeam: {
                include: {
                  players: true,
                },
              },

              bowlingTeam: {
                include: {
                  players: true,
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
    // MAX OVERS
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

    const maximumLegalBalls =
      maxOvers * 6;

    // =====================================================
    // CHECK CURRENT INNINGS ALREADY COMPLETE
    // =====================================================

    if (
      innings.legalBalls >=
      maximumLegalBalls
    ) {
      return NextResponse.json(
        {
          error: `Innings ${innings.inningsNumber} is already completed.`,

          inningsCompleted: true,

          completionReason:
            "OVERS_COMPLETED",

          nextInnings:
            innings.inningsNumber === 1
              ? match.cricketInnings.find(
                  (item) =>
                    item.inningsNumber === 2
                ) ?? null
              : null,

          matchCompleted:
            innings.inningsNumber === 2,

          // IMPORTANT
          legalBalls:
            innings.legalBalls,

          ballCount:
            innings.legalBalls % 6,
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // VALIDATE BATTING PLAYERS
    // =====================================================

    const battingPlayerIds =
      innings.battingTeam.players.map(
        (player) => player.id
      );

    const bowlingPlayerIds =
      innings.bowlingTeam.players.map(
        (player) => player.id
      );

    if (
      !battingPlayerIds.includes(
        strikerId
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Striker does not belong to the batting team.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !battingPlayerIds.includes(
        nonStrikerId
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Non-striker does not belong to the batting team.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !bowlingPlayerIds.includes(
        bowlerId
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Bowler does not belong to the bowling team.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // WICKET VALIDATION
    // =====================================================

    if (isWicket) {
      if (!dismissedPlayerId) {
        return NextResponse.json(
          {
            error:
              "Dismissed player is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        dismissedPlayerId !== strikerId &&
        dismissedPlayerId !== nonStrikerId
      ) {
        return NextResponse.json(
          {
            error:
              "Dismissed player must be striker or non-striker.",
          },
          {
            status: 400,
          }
        );
      }
    }

    // =====================================================
    // CURRENT OVER
    // =====================================================

    const overNumber = Math.floor(
      innings.legalBalls / 6
    );

    const legalBallsInCurrentOver =
      innings.ballEvents.filter(
        (ball) =>
          ball.overNumber ===
            overNumber &&
          ball.isLegalDelivery
      ).length;

    const ballNumber =
      legalBallsInCurrentOver + 1;

    // =====================================================
    // TRANSACTION
    // =====================================================

    const result =
      await prisma.$transaction(
        async (tx) => {
          // =================================================
          // CREATE BALL
          // =================================================

          const ball =
            await tx.cricketBallEvent.create({
              data: {
                inningsId,

                overNumber,

                ballNumber,

                strikerId,

                nonStrikerId,

                bowlerId,

                runsOffBat,

                extraRuns,

                totalRuns,

                extraType:
                  extraType as any,

                isLegalDelivery,

                isWicket,

                dismissalType:
                  dismissalType as any,

                dismissedPlayerId,

                fielderId,
              },
            });

          // =================================================
          // NEW INNINGS VALUES
          // =================================================

          const newTotalRuns =
            innings.totalRuns +
            totalRuns;

          const newTotalWickets =
            innings.totalWickets +
            (isWicket ? 1 : 0);

          const newLegalBalls =
            innings.legalBalls +
            (isLegalDelivery
              ? 1
              : 0);

          // =================================================
          // IMPORTANT: BALL COUNT
          // =================================================
          //
          // This is the number of legal balls in the
          // current over AFTER this delivery.
          //
          // Example:
          // 1,2,3,4,5,6 => 6
          //
          // Wide/no-ball does not increase it.
          //

          const currentOverBallCount =
            newLegalBalls % 6;

          // If exactly 6, this is the end of an over.
          const isEndOfOver =
            isLegalDelivery &&
            currentOverBallCount === 0;

          // =================================================
          // ALL OUT
          // =================================================

          const numberOfBatters =
            innings.battingTeam
              .players.length;

          const wicketsRequiredForAllOut =
            Math.max(
              numberOfBatters - 1,
              1
            );

          const allOut =
            newTotalWickets >=
            wicketsRequiredForAllOut;

          // =================================================
          // OVERS COMPLETED
          // =================================================

          const oversCompleted =
            newLegalBalls >=
            maximumLegalBalls;

          // =================================================
          // TARGET CHECK
          // =================================================

          let targetChased = false;
          let target: number | null = null;

          let innings1 =
            null;

          if (
            innings.inningsNumber === 2
          ) {
            innings1 =
              match.cricketInnings.find(
                (item) =>
                  item.inningsNumber === 1
              ) ?? null;

            if (innings1) {
              console.log(
                "========== TARGET DEBUG =========="
              );

              console.log(
                "INNINGS 1 ID:",
                innings1.id
              );

              console.log(
                "INNINGS 1 RUNS:",
                innings1.totalRuns
              );

              console.log(
                "INNINGS 2 RUNS:",
                newTotalRuns
              );

              target =
                innings1.totalRuns + 1;

              targetChased =
                newTotalRuns >=
                target;
            }
          }

          // =================================================
          // INNINGS COMPLETED
          // =================================================

          const inningsCompleted =
            allOut ||
            oversCompleted ||
            targetChased;

          // =================================================
          // UPDATE INNINGS
          // =================================================

          const updatedInnings =
            await tx.cricketInnings.update({
              where: {
                id: inningsId,
              },

              data: {
                totalRuns:
                  newTotalRuns,

                totalWickets:
                  newTotalWickets,

                legalBalls:
                  newLegalBalls,
              },
            });

          // =================================================
          // INNINGS STILL RUNNING
          // =================================================

          if (!inningsCompleted) {
            return {
              ball,

              updatedInnings,

              inningsCompleted:
                false,

              completionReason:
                null,

              nextInnings:
                null,

              matchCompleted:
                false,

              targetChased:
                false,

              target,

              // IMPORTANT
              legalBalls:
                newLegalBalls,

              ballCount:
                currentOverBallCount,

              isEndOfOver,
            };
          }

          // =================================================
          // INNINGS 1 COMPLETED
          // =================================================

          if (
            innings.inningsNumber === 1
          ) {
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
                await tx.cricketInnings.create({
                  data: {
                    matchId,

                    inningsNumber:
                      2,

                    battingTeamId:
                      innings.bowlingTeamId,

                    bowlingTeamId:
                      innings.battingTeamId,

                    totalRuns: 0,

                    totalWickets: 0,

                    legalBalls: 0,
                  },
                });

              innings2 =
                createdInnings2 as any;
            }

            // -----------------------------------------------
            // RETURN INNINGS 2
            // -----------------------------------------------

            return {
              ball,

              updatedInnings,

              inningsCompleted:
                true,

              completionReason:
                allOut
                  ? "ALL_OUT"
                  : "OVERS_COMPLETED",

              nextInnings: {
                id:
                  innings2?.id,

                inningsNumber:
                  innings2?.inningsNumber,

                battingTeamId:
                  innings2?.battingTeamId,

                bowlingTeamId:
                  innings2?.bowlingTeamId,

                totalRuns:
                  innings2?.totalRuns,

                totalWickets:
                  innings2?.totalWickets,

                legalBalls:
                  innings2?.legalBalls,
              },

              matchCompleted:
                false,

              targetChased:
                false,

              target,

              // IMPORTANT
              legalBalls:
                newLegalBalls,

              ballCount:
                currentOverBallCount,

              isEndOfOver,
            };
          }

          // =================================================
          // INNINGS 2 COMPLETED
          // =================================================

          const team1Score =
            innings.battingTeamId ===
            match.team1Id
              ? newTotalRuns
              : innings1?.totalRuns ?? 0;

          const team2Score =
            innings.battingTeamId ===
            match.team2Id
              ? newTotalRuns
              : innings1?.totalRuns ?? 0;

          // =================================================
          // DETERMINE WINNER
          // =================================================

          let winnerTeamId:
            | number
            | null = null;

          let matchResult:
            | "TEAM1_WIN"
            | "TEAM2_WIN"
            | "DRAW"
            | "TIE"
            | "NO_RESULT";

          // =================================================
          // TARGET CHASED
          // =================================================

          if (targetChased) {
            winnerTeamId =
              innings.battingTeamId;

            matchResult =
              winnerTeamId ===
              match.team1Id
                ? "TEAM1_WIN"
                : "TEAM2_WIN";
          }

          // =================================================
          // INNINGS 2 FINISHED WITHOUT CHASING
          // =================================================

          else if (
            newTotalRuns >
            (innings1?.totalRuns ?? 0)
          ) {
            winnerTeamId =
              innings.battingTeamId;

            matchResult =
              winnerTeamId ===
              match.team1Id
                ? "TEAM1_WIN"
                : "TEAM2_WIN";
          }

          // =================================================
          // TIE
          // =================================================

          else if (
            newTotalRuns ===
            (innings1?.totalRuns ?? 0)
          ) {
            // winnerTeamId = null;

            // matchResult = "TIE";

             // The team that batted first is the winner
  winnerTeamId =
    innings1?.battingTeamId ?? null;

  matchResult =
    winnerTeamId === match.team1Id
      ? "TEAM1_WIN"
      : "TEAM2_WIN";
          }

          // =================================================
          // FIRST INNINGS TEAM WINS
          // =================================================

          else {
            winnerTeamId =
              innings.bowlingTeamId;

            matchResult =
              winnerTeamId ===
              match.team1Id
                ? "TEAM1_WIN"
                : "TEAM2_WIN";
          }

          // =================================================
          // MATCH COMPLETED
          // =================================================

          await tx.match.update({
            where: {
              id: matchId,
            },

            data: {
              status:
                "COMPLETED",

              result:
                matchResult,

              winnerTeamId,

              team1Score,

              team2Score,
            },
          });

          // =================================================
          // FINAL RESPONSE
          // =================================================

          return {
            ball,

            updatedInnings,

            inningsCompleted:
              true,

            completionReason:
              targetChased
                ? "TARGET_CHASED"
                : allOut
                  ? "ALL_OUT"
                  : "OVERS_COMPLETED",

            nextInnings:
              null,

            matchCompleted:
              true,

            targetChased,

            target,

            winnerTeamId,

            result:
              matchResult,

            team1Score,

            team2Score,

            // IMPORTANT
            legalBalls:
              newLegalBalls,

            ballCount:
              currentOverBallCount,

            isEndOfOver,
          };
        }
      );

    // =====================================================
    // RESPONSE
    // =====================================================

    return NextResponse.json(
      {
        success: true,

        ...result,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ADD CRICKET BALL ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save cricket ball.",
      },
      {
        status: 500,
      }
    );
  }
}