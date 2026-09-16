import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    if (!matchId || Number.isNaN(matchId)) {
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

    const value = Number(body.value ?? 0);

    if (!teamId || !eventType) {
      return NextResponse.json(
        {
          error: "Team and event are required.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================
    // GET MATCH
    // =========================================================

    const match = await prisma.match.findUnique({
      where: {
        id: matchId,
      },

      include: {
        game: true,

        score: true,

        team1: {
          include: {
            playerList: true,
          },
        },

        team2: {
          include: {
            playerList: true,
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

    if (match.status !== "LIVE") {
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
    // SCORE
    // =========================================================

    if (!match.score) {
      return NextResponse.json(
        {
          error: "Live score has not been started.",
        },
        {
          status: 400,
        }
      );
    }

    const score = match.score;

    // =========================================================
    // CRICKET CHECK
    // =========================================================

    const gameName =
      match.game?.name?.toLowerCase() ?? "";

    if (!gameName.includes("cricket")) {
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

    const innings = score.innings;

    if (innings !== 1 && innings !== 2) {
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
    // Uses EXISTING MatchScore.maxOvers
    //
    // Allowed:
    // 1
    // 2
    // 3
    // 4
    // 5
    // =========================================================

    const maxOvers =
      Number(score.maxOvers) > 0
        ? Number(score.maxOvers)
        : 5;

    if (maxOvers < 1 || maxOvers > 5) {
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

    // =========================================================
    // TEAMS
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

    if (teamId !== battingTeam.id) {
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
    // CURRENT PLAYERS
    // =========================================================

    let strikerId =
      score.strikerId ?? null;

    let nonStrikerId =
      score.nonStrikerId ?? null;

    let bowlerId =
      score.bowlerId ?? null;

    // =========================================================
    // PLAYER VALIDATION
    // =========================================================

    if (!strikerId) {
      return NextResponse.json(
        {
          error: "Please select the striker.",
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
          error: "Please select the bowler.",
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
      battingTeam.playerList.some(
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
    // NON STRIKER VALIDATION
    // =========================================================

    const nonStrikerExists =
      battingTeam.playerList.some(
        (player) =>
          player.id === nonStrikerId
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

    if (strikerId === nonStrikerId) {
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
    // BOWLER VALIDATION
    // =========================================================

    const bowlerExists =
      bowlingTeam.playerList.some(
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
    // CURRENT SCORE
    // =========================================================

    let team1Score =
      score.team1Score;

    let team2Score =
      score.team2Score;

    let overs =
      score.overs;

    let balls =
      score.balls;

    let wickets =
      score.wickets;

    // =========================================================
    // VALID EVENTS
    // =========================================================

    const validEvents = [
      "RUN",
      "WIDE",
      "NO_BALL",
      "BYE",
      "LEG_BYE",
      "WICKET",
    ];

    if (!validEvents.includes(eventType)) {
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
    // LEGAL DELIVERY
    // =========================================================

    const isLegalDelivery =
      eventType === "RUN" ||
      eventType === "BYE" ||
      eventType === "LEG_BYE" ||
      eventType === "WICKET";

    // =========================================================
    // MAX BALLS
    //
    // Example:
    //
    // maxOvers = 2
    // maximumLegalBalls = 12
    //
    // maxOvers = 5
    // maximumLegalBalls = 30
    // =========================================================

    const maximumLegalBalls =
      maxOvers * 6;

    const currentLegalBalls =
      overs * 6 + balls;

    // =========================================================
    // DO NOT ALLOW BALL AFTER MAX OVERS
    // =========================================================

    if (
      currentLegalBalls >=
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
    // BATTING STAT
    // =========================================================

    let battingStat =
      await prisma.cricketBattingStat.findUnique({
        where: {
          matchId_playerId_innings: {
            matchId,
            playerId: strikerId,
            innings,
          },
        },
      });

    if (!battingStat) {
      battingStat =
        await prisma.cricketBattingStat.create({
          data: {
            matchId,
            playerId: strikerId,
            innings,

            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            isOut: false,
          },
        });
    }

    // =========================================================
    // BOWLING STAT
    // =========================================================

    let bowlingStat =
      await prisma.cricketBowlingStat.findUnique({
        where: {
          matchId_playerId_innings: {
            matchId,
            playerId: bowlerId,
            innings,
          },
        },
      });

    if (!bowlingStat) {
      bowlingStat =
        await prisma.cricketBowlingStat.create({
          data: {
            matchId,
            playerId: bowlerId,
            innings,

            overs: 0,
            balls: 0,
            runs: 0,
            wickets: 0,
            wides: 0,
            noBalls: 0,
          },
        });
    }

    // =========================================================
    // RUN
    // =========================================================

    if (eventType === "RUN") {
      if (
        ![0, 1, 2, 3, 4, 6].includes(value)
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

      if (innings === 1) {
        team1Score += value;
      } else {
        team2Score += value;
      }

      await prisma.cricketBattingStat.update({
        where: {
          id: battingStat.id,
        },

        data: {
          runs: {
            increment: value,
          },

          balls: {
            increment: 1,
          },

          fours: {
            increment:
              value === 4 ? 1 : 0,
          },

          sixes: {
            increment:
              value === 6 ? 1 : 0,
          },
        },
      });

      await prisma.cricketBowlingStat.update({
        where: {
          id: bowlingStat.id,
        },

        data: {
          runs: {
            increment: value,
          },
        },
      });

      balls += 1;

      // Change strike for odd runs
      if (value % 2 === 1) {
        const temp = strikerId;

        strikerId = nonStrikerId;

        nonStrikerId = temp;
      }
    }

    // =========================================================
    // WIDE
    // =========================================================

    else if (eventType === "WIDE") {
      const wideRuns =
        value > 0 ? value : 1;

      if (innings === 1) {
        team1Score += wideRuns;
      } else {
        team2Score += wideRuns;
      }

      await prisma.cricketBowlingStat.update({
        where: {
          id: bowlingStat.id,
        },

        data: {
          runs: {
            increment: wideRuns,
          },

          wides: {
            increment: wideRuns,
          },
        },
      });

      // Wide is NOT a legal ball.
    }

    // =========================================================
    // NO BALL
    // =========================================================

    else if (
      eventType === "NO_BALL"
    ) {
      const noBallRuns =
        value > 0 ? value : 1;

      if (innings === 1) {
        team1Score += noBallRuns;
      } else {
        team2Score += noBallRuns;
      }

      await prisma.cricketBowlingStat.update({
        where: {
          id: bowlingStat.id,
        },

        data: {
          runs: {
            increment: noBallRuns,
          },

          noBalls: {
            increment: 1,
          },
        },
      });

      // No-ball is NOT a legal ball.
    }

    // =========================================================
    // BYE
    // =========================================================

    else if (eventType === "BYE") {
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

      if (innings === 1) {
        team1Score += value;
      } else {
        team2Score += value;
      }

      await prisma.cricketBattingStat.update({
        where: {
          id: battingStat.id,
        },

        data: {
          balls: {
            increment: 1,
          },
        },
      });

      balls += 1;

      if (value % 2 === 1) {
        const temp = strikerId;

        strikerId = nonStrikerId;

        nonStrikerId = temp;
      }
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

      if (innings === 1) {
        team1Score += value;
      } else {
        team2Score += value;
      }

      await prisma.cricketBattingStat.update({
        where: {
          id: battingStat.id,
        },

        data: {
          balls: {
            increment: 1,
          },
        },
      });

      balls += 1;

      if (value % 2 === 1) {
        const temp = strikerId;

        strikerId = nonStrikerId;

        nonStrikerId = temp;
      }
    }

    // =========================================================
    // WICKET
    // =========================================================

    else if (
      eventType === "WICKET"
    ) {
      balls += 1;
      wickets += 1;

      await prisma.cricketBattingStat.update({
        where: {
          id: battingStat.id,
        },

        data: {
          balls: {
            increment: 1,
          },

          isOut: true,
        },
      });

      await prisma.cricketBowlingStat.update({
        where: {
          id: bowlingStat.id,
        },

        data: {
          wickets: {
            increment: 1,
          },
        },
      });

      // New batsman will be selected by admin.
      strikerId = null;
    }

    // =========================================================
    // UPDATE BOWLER LEGAL BALLS
    //
    // IMPORTANT:
    // Unique variable names are used here.
    //
    // This fixes:
    // Cannot redeclare block-scoped variable
    // 'newBowlerBalls'
    // =========================================================

    if (isLegalDelivery) {
      const bowlerLegalBallsBefore =
        bowlingStat.overs * 6 +
        bowlingStat.balls;

      const bowlerLegalBallsAfter =
        bowlerLegalBallsBefore + 1;

      const updatedBowlerOvers =
        Math.floor(
          bowlerLegalBallsAfter / 6
        );

      const updatedBowlerBalls =
        bowlerLegalBallsAfter % 6;

      await prisma.cricketBowlingStat.update({
        where: {
          id: bowlingStat.id,
        },

        data: {
          overs: updatedBowlerOvers,

          balls: updatedBowlerBalls,
        },
      });
    }

    // =========================================================
    // CHECK OVER COMPLETION
    // =========================================================

    let overCompleted = false;

    if (balls >= 6) {
      overs += 1;
      balls = 0;

      overCompleted = true;

      // Change ends after over
      if (
        strikerId !== null &&
        nonStrikerId !== null
      ) {
        const temp = strikerId;

        strikerId = nonStrikerId;

        nonStrikerId = temp;
      }

      // New bowler required
      bowlerId = null;
    }

    // =========================================================
    // MAX WICKETS
    // =========================================================

    const maxWickets =
      Math.max(
        battingTeam.playerList.length - 1,
        1
      );

    const allOut =
      wickets >= maxWickets;

    // =========================================================
    // MAX OVERS COMPLETED
    //
    // THIS IS THE IMPORTANT PART
    //
    // If maxOvers = 2:
    //
    // 1.5 -> still LIVE
    // 2.0 -> INNINGS COMPLETE
    //
    // If maxOvers = 5:
    //
    // 4.5 -> still LIVE
    // 5.0 -> INNINGS COMPLETE
    // =========================================================

    const inningsCompletedByOvers =
      overs >= maxOvers;

    // =========================================================
    // TARGET
    // =========================================================

    let targetReached = false;

    if (innings === 2) {
      const target =
        team1Score + 1;

      targetReached =
        team2Score >= target;
    }

    // =========================================================
    // INNINGS COMPLETED
    // =========================================================

    const inningsCompleted =
      allOut ||
      inningsCompletedByOvers ||
      targetReached;

    // =========================================================
    // SCORE STATUS
    // =========================================================

    let scoreStatus:
      | "LIVE"
      | "TARGET_REACHED"
      | "ALL_OUT"
      | "INNINGS_COMPLETE" =
      "LIVE";

    if (targetReached) {
      scoreStatus =
        "TARGET_REACHED";
    } else if (allOut) {
      scoreStatus = "ALL_OUT";
    } else if (
      inningsCompletedByOvers
    ) {
      scoreStatus =
        "INNINGS_COMPLETE";
    }

    // =========================================================
    // CREATE EVENT
    // =========================================================

    const event =
      await prisma.matchEvent.create({
        data: {
          matchId,

          teamId,

          eventType,

          value,

          period: score.period,

          clock: score.clock,
        },
      });

    // =========================================================
    // NEXT VALUES
    // =========================================================

    let nextInnings =
      innings;

    let nextOvers =
      overs;

    let nextBalls =
      balls;

    let nextWickets =
      wickets;

    let nextStrikerId:
      number | null =
      strikerId;

    let nextNonStrikerId:
      number | null =
      nonStrikerId;

    let nextBowlerId:
      number | null =
      bowlerId;

    let nextStatus =
      inningsCompleted
        ? scoreStatus
        : "LIVE";

    // =========================================================
    // INNINGS 1 COMPLETED
    // =========================================================

    if (
      innings === 1 &&
      inningsCompleted
    ) {
      // Move to innings 2
      nextInnings = 2;

      // Reset innings counters
      nextOvers = 0;

      nextBalls = 0;

      nextWickets = 0;

      // Admin selects new players
      nextStrikerId = null;

      nextNonStrikerId = null;

      nextBowlerId = null;

      // Match is still LIVE
      nextStatus = "LIVE";
    }

    // =========================================================
    // INNINGS 2 COMPLETED
    // =========================================================

    if (
      innings === 2 &&
      inningsCompleted
    ) {
      nextInnings = 2;

      nextStatus =
        scoreStatus;

      nextStrikerId = null;

      nextNonStrikerId = null;

      nextBowlerId = null;
    }

    // =========================================================
    // UPDATE SCORE
    // =========================================================

    const updatedScore =
      await prisma.matchScore.update({
        where: {
          matchId,
        },

        data: {
          team1Score,

          team2Score,

          innings:
            nextInnings,

          overs:
            nextOvers,

          balls:
            nextBalls,

          wickets:
            nextWickets,

          strikerId:
            nextStrikerId,

          nonStrikerId:
            nextNonStrikerId,

          bowlerId:
            nextBowlerId,

          status:
            nextStatus,
        },
      });

    // =========================================================
    // MATCH COMPLETED
    // =========================================================

    const matchCompleted =
      innings === 2 &&
      inningsCompleted;

    if (matchCompleted) {
      await prisma.match.update({
        where: {
          id: matchId,
        },

        data: {
          status: "COMPLETED",
        },
      });
    }

    // =========================================================
    // WINNER
    // =========================================================

    let winnerTeamId:
      number | null = null;

    let winnerTeamName:
      string | null = null;

    let loserTeamId:
      number | null = null;

    let loserTeamName:
      string | null = null;

    let winningMargin:
      number | null = null;

    let winningMarginType:
      "RUNS" | "WICKETS" | null =
      null;

    if (matchCompleted) {
      // =======================================================
      // TEAM 1 WINS
      // =======================================================

      if (
        team1Score >
        team2Score
      ) {
        winnerTeamId =
          match.team1.id;

        winnerTeamName =
          match.team1.name;

        loserTeamId =
          match.team2.id;

        loserTeamName =
          match.team2.name;

        winningMargin =
          team1Score -
          team2Score;

        winningMarginType =
          "RUNS";
      }

      // =======================================================
      // TEAM 2 WINS
      // =======================================================

      else if (
        team2Score >
        team1Score
      ) {
        winnerTeamId =
          match.team2.id;

        winnerTeamName =
          match.team2.name;

        loserTeamId =
          match.team1.id;

        loserTeamName =
          match.team1.name;

        // IMPORTANT:
        // wickets variable is innings 2 wickets.
        //
        // Example:
        // Team has 11 players.
        // 3 wickets lost.
        // Remaining = 10 - 3 = 7 wickets.
        const wicketsAvailable =
          Math.max(
            battingTeam.playerList.length - 1,
            1
          );

        const wicketsRemaining =
          Math.max(
            wicketsAvailable -
              wickets,
            0
          );

        winningMargin =
          wicketsRemaining;

        winningMarginType =
          "WICKETS";
      }

      // =======================================================
      // TIE
      // =======================================================

      else {
        winnerTeamId = null;
        winnerTeamName = null;

        loserTeamId = null;
        loserTeamName = null;

        winningMargin = null;
        winningMarginType = null;
      }
    }

    // =========================================================
    // MESSAGE
    // =========================================================

    let message =
      "Score updated.";

    // Target reached has highest priority
    if (targetReached) {
      message =
        "Target reached. Match completed.";
    }

    // All out
    else if (allOut) {
      if (innings === 1) {
        message =
          "Innings 1 completed. Innings 2 started. Select Team 2 batsmen and Team 1 bowler.";
      } else {
        message =
          "Team 2 all out. Match completed.";
      }
    }

    // MAX OVERS
    else if (
      inningsCompletedByOvers
    ) {
      if (innings === 1) {
        message =
          `${maxOvers} overs completed. Innings 2 started. Select Team 2 batsmen and Team 1 bowler.`;
      } else {
        message =
          `${maxOvers} overs completed. Match completed.`;
      }
    }

    // Over completed but innings not completed
    else if (overCompleted) {
      message =
        "Over completed. Select the next bowler.";
    }

    // Wicket
    else if (
      eventType === "WICKET"
    ) {
      message =
        "Wicket! Select a new batsman.";
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

      event,

      score: updatedScore,

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
              id: winnerTeamId,

              name:
                winnerTeamName,

              margin:
                winningMargin,

              marginType:
                winningMarginType,
            }
          : null,

      loser:
        matchCompleted &&
        loserTeamId
          ? {
              id: loserTeamId,

              name:
                loserTeamName,
            }
          : null,

      battingTeamId:
        nextInnings === 1
          ? match.team1.id
          : match.team2.id,

      bowlingTeamId:
        nextInnings === 1
          ? match.team2.id
          : match.team1.id,

      battingScore:
        nextInnings === 1
          ? team1Score
          : team2Score,

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