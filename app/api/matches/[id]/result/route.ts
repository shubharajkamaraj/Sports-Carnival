import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;

    const matchId = Number(id);

    if (!matchId || Number.isNaN(matchId)) {
      return NextResponse.json(
        {
          error: "Invalid match ID",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ----------------------------------------
     * GET MATCH
     * ----------------------------------------
     */

    const match = await prisma.match.findUnique({
      where: {
        id: matchId,
      },

      include: {
        game: true,

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

        score: true,
      },
    });

    if (!match) {
      return NextResponse.json(
        {
          error: "Match not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * ----------------------------------------
     * CHECK SCORE
     * ----------------------------------------
     */

    if (!match.score) {
      return NextResponse.json(
        {
          error: "Match score not found",
        },
        {
          status: 404,
        }
      );
    }

    const score = match.score;

    /*
     * ----------------------------------------
     * MATCH MUST BE COMPLETED
     * ----------------------------------------
     */

    if (match.status !== "COMPLETED") {
      return NextResponse.json(
        {
          error: "Match is not completed yet.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ----------------------------------------
     * DETERMINE WINNER
     * ----------------------------------------
     */

    let winnerTeam = null;
    let loserTeam = null;

    let winnerScore = 0;
    let loserScore = 0;

    if (score.team1Score > score.team2Score) {
      winnerTeam = match.team1;
      loserTeam = match.team2;

      winnerScore = score.team1Score;
      loserScore = score.team2Score;
    } else if (score.team2Score > score.team1Score) {
      winnerTeam = match.team2;
      loserTeam = match.team1;

      winnerScore = score.team2Score;
      loserScore = score.team1Score;
    }

    /*
     * ----------------------------------------
     * TIE
     * ----------------------------------------
     */

    if (!winnerTeam) {
      return NextResponse.json({
        success: true,

        match: {
          id: match.id,
          game: match.game,
          team1: match.team1,
          team2: match.team2,
        },

        result: {
          type: "TIE",
          winner: null,
          loser: null,
          winnerScore: score.team1Score,
          loserScore: score.team2Score,
          message: "Match tied",
        },

        bestBatsman: null,
        bestBowler: null,
      });
    }

    /*
     * ----------------------------------------
     * DETERMINE WINNER / LOSER INNINGS
     * ----------------------------------------
     */

    const winnerWasTeam1 =
      winnerTeam.id === match.team1.id;

    const winnerBattingInnings =
      winnerWasTeam1 ? 1 : 2;

    const winnerBowlingInnings =
      winnerWasTeam1 ? 2 : 1;

    /*
     * ----------------------------------------
     * GET BATTING STATS
     * ----------------------------------------
     */

    const battingStats =
      await prisma.cricketBattingStat.findMany({
        where: {
          matchId,

          innings: winnerBattingInnings,

          playerId: {
            in: winnerTeam.playerList.map(
              (player) => player.id
            ),
          },
        },

        orderBy: [
          {
            runs: "desc",
          },
          {
            balls: "asc",
          },
        ],

        include: {
          player: true,
        },
      });

    /*
     * ----------------------------------------
     * BEST BATSMAN
     * ----------------------------------------
     */

    const bestBatsman =
      battingStats.length > 0
        ? battingStats[0]
        : null;

    /*
     * ----------------------------------------
     * GET BOWLING STATS
     * ----------------------------------------
     */

    const bowlingStats =
      await prisma.cricketBowlingStat.findMany({
        where: {
          matchId,

          innings: winnerBowlingInnings,

          playerId: {
            in: winnerTeam.playerList.map(
              (player) => player.id
            ),
          },
        },

        orderBy: [
          {
            wickets: "desc",
          },
          {
            runs: "asc",
          },
        ],

        include: {
          player: true,
        },
      });

    /*
     * ----------------------------------------
     * BEST BOWLER
     * ----------------------------------------
     *
     * Priority:
     *
     * 1. Most wickets
     * 2. Fewest runs conceded
     */

    const bestBowler =
      bowlingStats.length > 0
        ? bowlingStats[0]
        : null;

    /*
     * ----------------------------------------
     * RESULT MESSAGE
     * ----------------------------------------
     */

    let resultMessage = "";

    /*
     * If team batting second wins,
     * result is by wickets.
     */

    if (!winnerWasTeam1) {
      const wicketsRemaining =
        Math.max(
          winnerTeam.playerList.length -
            1 -
            score.wickets,
          0
        );

      resultMessage =
        `${winnerTeam.name} won by ${wicketsRemaining} wickets`;
    } else {
      /*
       * Team 1 batted first.
       *
       * Winning margin is runs.
       */

      const runMargin =
        winnerScore - loserScore;

      resultMessage =
        `${winnerTeam.name} won by ${runMargin} runs`;
    }

    /*
     * ----------------------------------------
     * RETURN RESULT
     * ----------------------------------------
     */

    return NextResponse.json({
      success: true,

      match: {
        id: match.id,

        game: match.game,

        date: match.matchDate,

        venue: match.venue,

        status: match.status,
      },

      teams: {
        team1: {
          id: match.team1.id,
          name: match.team1.name,
          score: score.team1Score,
        },

        team2: {
          id: match.team2.id,
          name: match.team2.name,
          score: score.team2Score,
        },
      },

      result: {
        type: "WIN",

        winner: {
          id: winnerTeam.id,
          name: winnerTeam.name,
          score: winnerScore,
        },

        loser: {
          id: loserTeam?.id,
          name: loserTeam?.name,
          score: loserScore,
        },

        message: resultMessage,
      },

      bestBatsman: bestBatsman
        ? {
            player: bestBatsman.player,

            runs: bestBatsman.runs,

            balls: bestBatsman.balls,

            fours: bestBatsman.fours,

            sixes: bestBatsman.sixes,

            isOut: bestBatsman.isOut,
          }
        : null,

      bestBowler: bestBowler
        ? {
            player: bestBowler.player,

            overs: bestBowler.overs,

            balls: bestBowler.balls,

            runs: bestBowler.runs,

            wickets: bestBowler.wickets,

            wides: bestBowler.wides,

            noBalls: bestBowler.noBalls,
          }
        : null,

      allBattingStats: battingStats,

      allBowlingStats: bowlingStats,
    });
  } catch (error) {
    console.error(
      "MATCH RESULT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load match result",
      },
      {
        status: 500,
      }
    );
  }
}