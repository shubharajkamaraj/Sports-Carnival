import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CricketDismissalType } from "@prisma/client";

export async function POST(
  req: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    // =========================================================
    // MATCH ID
    // =========================================================

    const { id } = await context.params;

    const matchId = Number(id);

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

    // =========================================================
    // REQUEST BODY
    // =========================================================

    const body = await req.json();

    const teamId = Number(body.teamId);

    const eventType = String(
      body.eventType || ""
    ).toUpperCase();

    const value = Number(
      body.value ?? 0
    );

    const strikerId =
      body.strikerId !== undefined &&
      body.strikerId !== null
        ? Number(body.strikerId)
        : null;

    const nonStrikerId =
      body.nonStrikerId !== undefined &&
      body.nonStrikerId !== null
        ? Number(body.nonStrikerId)
        : null;

    const bowlerId =
      body.bowlerId !== undefined &&
      body.bowlerId !== null
        ? Number(body.bowlerId)
        : null;

    const dismissedPlayerId =
      body.dismissedPlayerId !== undefined &&
      body.dismissedPlayerId !== null
        ? Number(body.dismissedPlayerId)
        : null;

    const dismissalType =
      body.dismissalType
        ? String(body.dismissalType).toUpperCase()
        : null;

    const fielderId =
      body.fielderId !== undefined &&
      body.fielderId !== null
        ? Number(body.fielderId)
        : null;

    if (
      !Number.isInteger(teamId) ||
      teamId <= 0 ||
      !eventType
    ) {
      return NextResponse.json(
        {
          error:
            "Team and event are required.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================
    // VALID EVENT TYPES
    // =========================================================

    const validEvents = [
      "RUN",
      "WIDE",
      "NO_BALL",
      "BYE",
      "LEG_BYE",
      "WICKET",
    ];

    if (
      !validEvents.includes(eventType)
    ) {
      return NextResponse.json(
        {
          error:
            `Unknown cricket event: ${eventType}`,
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================
    // GET MATCH
    // =========================================================

    const match =
      await prisma.match.findUnique({
        where: {
          id: matchId,
        },

        include: {
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
        {
          status: 404,
        }
      );
    }

    // =========================================================
    // MATCH STATUS
    // =========================================================

    if (
      match.status !== "LIVE"
    ) {
      return NextResponse.json(
        {
          error: "Match is not live.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================
    // CRICKET CHECK
    // =========================================================

    if (
      match.game.sportType !==
      "CRICKET"
    ) {
      return NextResponse.json(
        {
          error:
            "This scoring API is only for cricket.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================
    // CURRENT INNINGS
    // =========================================================

    let currentInnings =
      match.cricketInnings.length > 0
        ? match.cricketInnings[
            match.cricketInnings.length - 1
          ]
        : null;

    /*
     * If no innings exists yet, create innings 1.
     */

    if (!currentInnings) {
      currentInnings =
        await prisma.cricketInnings.create(
          {
            data: {
              matchId,

              inningsNumber: 1,

              battingTeamId:
                match.team1Id,

              bowlingTeamId:
                match.team2Id,
            },

            include: {
              ballEvents: true,
            },
          }
        );
    }

    const innings =
      currentInnings.inningsNumber;

    if (
      innings !== 1 &&
      innings !== 2
    ) {
      return NextResponse.json(
        {
          error: "Invalid innings.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================
    // MAX OVERS
    //
    // Current schema stores max overs on Match.
    // =========================================================

    const maxOvers =
      Number(match.overs) > 0
        ? Number(match.overs)
        : 2;

    if (
      maxOvers < 1 ||
      maxOvers > 5
    ) {
      return NextResponse.json(
        {
          error:
            "Maximum overs must be between 1 and 5.",
        },
        {
          status: 400,
        }
      );
    }

    const maximumLegalBalls =
      maxOvers * 6;

    // =========================================================
    // BATTING / BOWLING TEAM
    // =========================================================

    const battingTeam =
      innings === 1
        ? match.team1
        : match.team2;

    const bowlingTeam =
      innings === 1
        ? match.team2
        : match.team1;

    // =========================================================
    // EVENT TEAM
    // =========================================================

    if (
      teamId !== battingTeam.id
    ) {
      return NextResponse.json(
        {
          error:
            "Only the batting team can receive scoring events.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================
    // PLAYER VALIDATION
    // =========================================================

    if (!strikerId) {
      return NextResponse.json(
        {
          error:
            "Please select the striker.",
        },
        {
          status: 400,
        }
      );
    }

    if (!nonStrikerId) {
      return NextResponse.json(
        {
          error:
            "Please select the non-striker.",
        },
        {
          status: 400,
        }
      );
    }

    if (!bowlerId) {
      return NextResponse.json(
        {
          error:
            "Please select the bowler.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      strikerId === nonStrikerId
    ) {
      return NextResponse.json(
        {
          error:
            "Striker and non-striker cannot be the same player.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================
    // STRIKER VALIDATION
    // =========================================================

    const strikerExists =
      battingTeam.players.some(
        (player) =>
          player.id === strikerId
      );

    if (!strikerExists) {
      return NextResponse.json(
        {
          error:
            "Striker must belong to the batting team.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================
    // NON-STRIKER VALIDATION
    // =========================================================

    const nonStrikerExists =
      battingTeam.players.some(
        (player) =>
          player.id ===
          nonStrikerId
      );

    if (!nonStrikerExists) {
      return NextResponse.json(
        {
          error:
            "Non-striker must belong to the batting team.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================
    // BOWLER VALIDATION
    // =========================================================

    const bowlerExists =
      bowlingTeam.players.some(
        (player) =>
          player.id === bowlerId
      );

    if (!bowlerExists) {
      return NextResponse.json(
        {
          error:
            "Bowler must belong to the bowling team.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================
    // FIND DISMISSED PLAYERS
    // =========================================================

    const dismissedEvents =
      await prisma.cricketBallEvent.findMany(
        {
          where: {
            inningsId:
              currentInnings.id,

            isWicket: true,

            dismissedPlayerId: {
              not: null,
            },
          },

          select: {
            dismissedPlayerId: true,
          },
        }
      );

    const dismissedIds =
      new Set(
        dismissedEvents
          .map(
            (event) =>
              event.dismissedPlayerId
          )
          .filter(
            (
              value
            ): value is number =>
              value !== null
          )
      );

    // =========================================================
    // DO NOT ALLOW DISMISSED BATSMAN
    // =========================================================

    if (
      dismissedIds.has(strikerId)
    ) {
      return NextResponse.json(
        {
          error:
            "The striker has already been dismissed.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      dismissedIds.has(
        nonStrikerId
      )
    ) {
      return NextResponse.json(
        {
          error:
            "The non-striker has already been dismissed.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================
    // CURRENT SCORE
    // =========================================================

    let team1Score =
      match.team1Score;

    let team2Score =
      match.team2Score;

    let inningsRuns =
      currentInnings.totalRuns;

    let inningsWickets =
      currentInnings.totalWickets;

    let legalBalls =
      currentInnings.legalBalls;

    // =========================================================
    // CHECK MAX OVERS
    // =========================================================

    if (
      legalBalls >=
      maximumLegalBalls
    ) {
      return NextResponse.json(
        {
          error:
            `${maxOvers} overs have already been completed.`,
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================
    // VALIDATE VALUE
    // =========================================================

    if (
      !Number.isInteger(value) ||
      value < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Event value must be a valid non-negative number.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================
    // EVENT VALUES
    // =========================================================

    let runsOffBat = 0;
    let extraRuns = 0;
    let totalRuns = 0;

    let isLegalDelivery = true;
    let isWicket = false;

    // =========================================================
    // RUN
    // =========================================================

    if (eventType === "RUN") {
      if (
        ![0, 1, 2, 3, 4, 6].includes(
          value
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Runs must be 0, 1, 2, 3, 4 or 6.",
          },
          {
            status: 400,
          }
        );
      }

      runsOffBat = value;
      totalRuns = value;
      isLegalDelivery = true;
    }

    // =========================================================
    // WIDE
    // =========================================================

    else if (
      eventType === "WIDE"
    ) {
      const wideRuns =
        value > 0 ? value : 1;

      extraRuns = wideRuns;
      totalRuns = wideRuns;

      isLegalDelivery = false;
    }

    // =========================================================
    // NO BALL
    // =========================================================

    else if (
      eventType === "NO_BALL"
    ) {
      const noBallRuns =
        value > 0 ? value : 1;

      /*
       * Value represents total runs recorded
       * for this no-ball event.
       *
       * At minimum it is 1.
       */

      extraRuns = 1;

      runsOffBat =
        Math.max(
          noBallRuns - 1,
          0
        );

      totalRuns =
        noBallRuns;

      isLegalDelivery = false;
    }

    // =========================================================
    // BYE
    // =========================================================

    else if (
      eventType === "BYE"
    ) {
      if (value < 1) {
        return NextResponse.json(
          {
            error:
              "Bye must be at least 1.",
          },
          {
            status: 400,
          }
        );
      }

      extraRuns = value;
      totalRuns = value;

      isLegalDelivery = true;
    }

    // =========================================================
    // LEG BYE
    // =========================================================

    else if (
      eventType === "LEG_BYE"
    ) {
      if (value < 1) {
        return NextResponse.json(
          {
            error:
              "Leg bye must be at least 1.",
          },
          {
            status: 400,
          }
        );
      }

      extraRuns = value;
      totalRuns = value;

      isLegalDelivery = true;
    }

    // =========================================================
    // WICKET
    // =========================================================

    else if (
      eventType === "WICKET"
    ) {
      isWicket = true;
      isLegalDelivery = true;

      /*
       * Wicket can optionally have runs.
       * For normal wicket scoring this is 0.
       */

      if (value > 0) {
        totalRuns = value;
      }

      if (!dismissedPlayerId) {
        return NextResponse.json(
          {
            error:
              "Dismissed player is required for a wicket.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        dismissedPlayerId !==
          strikerId &&
        dismissedPlayerId !==
          nonStrikerId
      ) {
        return NextResponse.json(
          {
            error:
              "Dismissed player must be the striker or non-striker.",
          },
          {
            status: 400
          }
        );
      }

      if (!dismissalType) {
        return NextResponse.json(
          {
            error:
              "Dismissal type is required.",
          },
          {
            status: 400
          }
        );
      }

      const validDismissals = [
        "BOWLED",
        "CAUGHT",
        "LBW",
        "RUN_OUT",
        "STUMPED",
        "HIT_WICKET",
        "RETIRED_HURT",
        "RETIRED_OUT",
        "OBSTRUCTING_THE_FIELD",
      ];

      if (
        !validDismissals.includes(
          dismissalType
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid dismissal type.",
          },
          {
            status: 400
          }
        );
      }

      /*
       * Fielder is optional because not every dismissal
       * needs a fielder.
       */

      if (
        fielderId &&
        !bowlingTeam.players.some(
          (player) =>
            player.id ===
            fielderId
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Fielder must belong to the bowling team.",
          },
          {
            status: 400
          }
        );
      }
    }

    // =========================================================
    // UPDATE SCORE
    // =========================================================

    if (innings === 1) {
      team1Score += totalRuns;
    } else {
      team2Score += totalRuns;
    }

    inningsRuns += totalRuns;

    if (isWicket) {
      inningsWickets += 1;
    }

    if (isLegalDelivery) {
      legalBalls += 1;
    }

    // =========================================================
    // OVER / BALL NUMBER
    // =========================================================

    const overNumber =
      Math.floor(
        (legalBalls - 1) / 6
      );

    const ballNumber =
      ((legalBalls - 1) % 6) + 1;

    /*
     * For an invalid zero-ball situation, protect the value.
     */

    const safeOverNumber =
      Math.max(
        overNumber,
        0
      );

    const safeBallNumber =
      Math.max(
        ballNumber,
        1
      );

    // =========================================================
    // CREATE BALL EVENT
    // =========================================================

    const ballEvent =
      await prisma.cricketBallEvent.create(
        {
          data: {
            inningsId:
              currentInnings.id,

            overNumber:
              safeOverNumber,

            ballNumber:
              safeBallNumber,

            strikerId,

            nonStrikerId,

            bowlerId,

            runsOffBat,

            extraRuns,

            totalRuns,

            extraType:
              eventType === "WIDE"
                ? "WIDE"
                : eventType ===
                    "NO_BALL"
                  ? "NO_BALL"
                  : eventType ===
                      "BYE"
                    ? "BYE"
                    : eventType ===
                        "LEG_BYE"
                      ? "LEG_BYE"
                      : "NONE",

            isLegalDelivery,

            isWicket,

            dismissalType:
  isWicket && dismissalType
    ? (dismissalType as CricketDismissalType)
    : null,

            dismissedPlayerId:
              isWicket
                ? dismissedPlayerId
                : null,

            fielderId:
              isWicket
                ? fielderId
                : null,
          },
        }
      );

    // =========================================================
    // UPDATE INNINGS
    // =========================================================

    const updatedInnings =
      await prisma.cricketInnings.update(
        {
          where: {
            id: currentInnings.id,
          },

          data: {
            totalRuns:
              inningsRuns,

            totalWickets:
              inningsWickets,

            legalBalls,
          },
        }
      );

    // =========================================================
    // STRIKE CHANGE
    // =========================================================

    let nextStrikerId:
      number | null =
      strikerId;

    let nextNonStrikerId:
      number | null =
      nonStrikerId;

    let nextBowlerId:
      number | null =
      bowlerId;

    /*
     * Wicket:
     * If striker is dismissed, the new batsman will
     * replace the striker.
     *
     * If non-striker is dismissed, the new batsman
     * replaces the non-striker.
     *
     * Since admin selects the new batsman, we return
     * null for the dismissed position.
     */

    if (isWicket) {
      if (
        dismissedPlayerId ===
        strikerId
      ) {
        nextStrikerId = null;
      }

      if (
        dismissedPlayerId ===
        nonStrikerId
      ) {
        nextNonStrikerId = null;
      }
    }

    /*
     * Odd runs change strike.
     *
     * For WIDE there is no automatic strike change here.
     */

    if (
      !isWicket &&
      totalRuns % 2 === 1
    ) {
      const temp =
        nextStrikerId;

      nextStrikerId =
        nextNonStrikerId;

      nextNonStrikerId =
        temp;
    }

    // =========================================================
    // OVER COMPLETION
    // =========================================================

    let overCompleted = false;

    if (
      isLegalDelivery &&
      legalBalls > 0 &&
      legalBalls % 6 === 0
    ) {
      overCompleted = true;

      /*
       * Ends change after an over.
       */

      if (
        nextStrikerId !== null &&
        nextNonStrikerId !== null
      ) {
        const temp =
          nextStrikerId;

        nextStrikerId =
          nextNonStrikerId;

        nextNonStrikerId =
          temp;
      }

      /*
       * New bowler is selected by admin.
       */

      nextBowlerId = null;
    }

    // =========================================================
    // OVERS COMPLETED
    // =========================================================

    const inningsCompletedByOvers =
      legalBalls >=
      maximumLegalBalls;

    // =========================================================
    // MAX WICKETS
    // =========================================================

    const maxWickets =
      Math.max(
        battingTeam.players.length - 1,
        1
      );

    const allOut =
      inningsWickets >=
      maxWickets;

    // =========================================================
    // TARGET
    // =========================================================

    let targetReached = false;

    if (innings === 2) {
      const target =
        match.team1Score + 1;

      targetReached =
        team2Score >= target;
    }

    // =========================================================
    // INNINGS COMPLETE
    // =========================================================

    const inningsCompleted =
      allOut ||
      inningsCompletedByOvers ||
      targetReached;

    // =========================================================
    // INNINGS 1 → INNINGS 2
    // =========================================================

    let nextInnings =
      innings;

    let nextInningsRecord =
      updatedInnings;

    let nextBattingTeamId =
      battingTeam.id;

    let nextBowlingTeamId =
      bowlingTeam.id;

    if (
      innings === 1 &&
      inningsCompleted
    ) {
      nextInnings = 2;

      nextBattingTeamId =
        match.team2Id;

      nextBowlingTeamId =
        match.team1Id;

      /*
       * Create innings 2.
       */

      nextInningsRecord =
        await prisma.cricketInnings.create(
          {
            data: {
              matchId,

              inningsNumber: 2,

              battingTeamId:
                match.team2Id,

              bowlingTeamId:
                match.team1Id,

              totalRuns: 0,

              totalWickets: 0,

              legalBalls: 0,
            },
          }
        );

      nextStrikerId = null;
      nextNonStrikerId = null;
      nextBowlerId = null;
    }

    // =========================================================
    // MATCH COMPLETION
    // =========================================================

    const matchCompleted =
      innings === 2 &&
      inningsCompleted;

    // =========================================================
    // MATCH RESULT
    // =========================================================

    let result:
      | "TEAM1_WIN"
      | "TEAM2_WIN"
      | "TIE"
      | null = null;

    let winnerTeamId:
      number | null = null;

    if (matchCompleted) {
      if (
        team1Score >
        team2Score
      ) {
        result =
          "TEAM1_WIN";

        winnerTeamId =
          match.team1Id;
      } else if (
        team2Score >
        team1Score
      ) {
        result =
          "TEAM2_WIN";

        winnerTeamId =
          match.team2Id;
      } else {
        result = "TIE";
      }
    }

    // =========================================================
    // UPDATE MATCH
    // =========================================================

    const updatedMatch =
      await prisma.match.update({
        where: {
          id: matchId,
        },

        data: {
          team1Score,

          team2Score,

          status:
            matchCompleted
              ? "COMPLETED"
              : "LIVE",

          result,

          winnerTeamId,
        },

        include: {
          team1: true,
          team2: true,
          game: true,
        },
      });

    // =========================================================
    // MESSAGE
    // =========================================================

    let message =
      "Score updated.";

    if (
      targetReached
    ) {
      message =
        "Target reached. Match completed.";
    } else if (
      innings === 1 &&
      inningsCompleted
    ) {
      message =
        `${maxOvers} overs completed. Innings 2 started. Select Team 2 batsmen and Team 1 bowler.`;
    } else if (
      innings === 2 &&
      allOut
    ) {
      message =
        "Team 2 all out. Match completed.";
    } else if (
      innings === 2 &&
      inningsCompletedByOvers
    ) {
      message =
        `${maxOvers} overs completed. Match completed.`;
    } else if (
      overCompleted
    ) {
      message =
        "Over completed. Select the next bowler.";
    } else if (
      isWicket
    ) {
      message =
        "Wicket! Select a new batsman.";
    }

    // =========================================================
    // WINNING MARGIN
    // =========================================================

    let winningMargin:
      number | null = null;

    let winningMarginType:
      "RUNS" | "WICKETS" | null =
      null;

    if (matchCompleted) {
      if (
        result === "TEAM1_WIN"
      ) {
        winningMargin =
          team1Score -
          team2Score;

        winningMarginType =
          "RUNS";
      }

      if (
        result === "TEAM2_WIN"
      ) {
        const wicketsAvailable =
          Math.max(
            match.team2.players.length -
              1,
            1
          );

        const secondInnings =
          await prisma.cricketInnings.findFirst(
            {
              where: {
                matchId,

                inningsNumber: 2,
              },
            }
          );

        const wicketsLost =
          secondInnings
            ?.totalWickets ?? 0;

        winningMargin =
          Math.max(
            wicketsAvailable -
              wicketsLost,
            0
          );

        winningMarginType =
          "WICKETS";
      }
    }

    // =========================================================
    // FINAL RESPONSE
    // =========================================================

    return NextResponse.json({
      success: true,

      matchId,

      previousInnings:
        innings,

      innings:
        nextInnings,

      maxOvers,

      maximumLegalBalls,

      event: ballEvent,

      score: {
        team1Score,

        team2Score,

        innings:
          nextInnings,

        overs:
          Math.floor(
            nextInningsRecord.legalBalls /
              6
          ),

        balls:
          nextInningsRecord.legalBalls %
          6,

        wickets:
          nextInningsRecord.totalWickets,
      },

      currentInnings:
        nextInningsRecord,

      overCompleted,

      inningsCompleted,

      inningsCompletedByOvers,

      allOut,

      targetReached,

      matchCompleted,

      winner:
        matchCompleted &&
        winnerTeamId
          ? {
              id:
                winnerTeamId,

              name:
                winnerTeamId ===
                match.team1Id
                  ? match.team1.name
                  : match.team2.name,

              margin:
                winningMargin,

              marginType:
                winningMarginType,
            }
          : null,

      battingTeamId:
        nextBattingTeamId,

      bowlingTeamId:
        nextBowlingTeamId,

      battingScore:
        nextInnings === 1
          ? team1Score
          : team2Score,

      strikerId:
        nextStrikerId,

      nonStrikerId:
        nextNonStrikerId,

      bowlerId:
        nextBowlerId,

      match: updatedMatch,

      message,
    });
  } catch (error) {
    console.error(
      "CRICKET SCORING ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update cricket score.",
      },
      {
        status: 500,
      }
    );
  }
}