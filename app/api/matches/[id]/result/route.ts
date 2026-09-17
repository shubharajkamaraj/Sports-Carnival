import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(
  req: Request,
  { params }: Params
) {
  try {
    const { id } = await params;
    const matchId = Number(id);

    if (!Number.isInteger(matchId)) {
      return NextResponse.json(
        { error: "Invalid match ID" },
        { status: 400 }
      );
    }

    const match = await prisma.match.findUnique({
      where: {
        id: matchId,
      },
      include: {
        game: true,
        tournament: true,

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

        winnerTeam: true,

        cricketInnings: {
          orderBy: {
            inningsNumber: "asc",
          },

          include: {
            battingTeam: true,
            bowlingTeam: true,

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

        awards: {
          include: {
            player: true,
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    /*
     * ---------------------------------------------------------
     * PLAYER LOOKUP
     * ---------------------------------------------------------
     */

    const allPlayers = [
      ...match.team1.players,
      ...match.team2.players,
    ];

    const playerMap = new Map(
      allPlayers.map((player) => [player.id, player])
    );

    /*
     * ---------------------------------------------------------
     * CRICKET STATISTICS
     * ---------------------------------------------------------
     *
     * We calculate batting and bowling statistics directly
     * from CricketBallEvent because the current Prisma schema
     * does not have CricketBattingStat or CricketBowlingStat.
     */

    const battingStats = new Map<
      number,
      {
        playerId: number;
        playerName: string;
        runs: number;
        balls: number;
        fours: number;
        sixes: number;
        dismissed: boolean;
        dismissalType: string | null;
      }
    >();

    const bowlingStats = new Map<
      number,
      {
        playerId: number;
        playerName: string;
        balls: number;
        runs: number;
        wickets: number;
        wides: number;
        noBalls: number;
      }
    >();

    /*
     * Create batting entries for every player.
     */
    for (const player of allPlayers) {
      battingStats.set(player.id, {
        playerId: player.id,
        playerName: player.name,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        dismissed: false,
        dismissalType: null,
      });

      bowlingStats.set(player.id, {
        playerId: player.id,
        playerName: player.name,
        balls: 0,
        runs: 0,
        wickets: 0,
        wides: 0,
        noBalls: 0,
      });
    }

    /*
     * ---------------------------------------------------------
     * PROCESS BALL EVENTS
     * ---------------------------------------------------------
     */

    for (const innings of match.cricketInnings) {
      for (const ball of innings.ballEvents) {
        const striker = battingStats.get(ball.strikerId);

        if (striker) {
          /*
           * Batter receives runs only from bat.
           */
          striker.runs += ball.runsOffBat;

          /*
           * Legal deliveries count as balls faced.
           */
          if (ball.isLegalDelivery) {
            striker.balls += 1;
          }

          if (ball.runsOffBat === 4) {
            striker.fours += 1;
          }

          if (ball.runsOffBat === 6) {
            striker.sixes += 1;
          }
        }

        /*
         * Bowling statistics.
         */
        const bowler = bowlingStats.get(ball.bowlerId);

        if (bowler) {
          /*
           * Bowler is charged with runs except byes
           * and leg-byes.
           */
          if (
            ball.extraType !== "BYE" &&
            ball.extraType !== "LEG_BYE"
          ) {
            bowler.runs += ball.totalRuns;
          }

          if (ball.isLegalDelivery) {
            bowler.balls += 1;
          }

          if (ball.extraType === "WIDE") {
            bowler.wides += ball.extraRuns;
          }

          if (ball.extraType === "NO_BALL") {
            bowler.noBalls += ball.extraRuns;
          }

          /*
           * Count wickets that are credited to the bowler.
           *
           * Run out, retired hurt, retired out and
           * obstructing the field are not bowler wickets.
           */
          if (
            ball.isWicket &&
            ball.dismissalType &&
            ball.dismissalType !== "RUN_OUT" &&
            ball.dismissalType !== "RETIRED_HURT" &&
            ball.dismissalType !== "RETIRED_OUT" &&
            ball.dismissalType !== "OBSTRUCTING_THE_FIELD"
          ) {
            bowler.wickets += 1;
          }
        }

        /*
         * Mark dismissed player.
         */
        if (ball.isWicket && ball.dismissedPlayerId) {
          const dismissed = battingStats.get(
            ball.dismissedPlayerId
          );

          if (dismissed) {
            dismissed.dismissed = true;
            dismissed.dismissalType =
              ball.dismissalType ?? null;
          }
        }
      }
    }

    /*
     * ---------------------------------------------------------
     * CONVERT MAPS TO ARRAYS
     * ---------------------------------------------------------
     */

    const batting = Array.from(
      battingStats.values()
    ).filter((player) => {
      const team1Player = match.team1.players.some(
        (p) => p.id === player.playerId
      );

      const team2Player = match.team2.players.some(
        (p) => p.id === player.playerId
      );

      return team1Player || team2Player;
    });

    const bowling = Array.from(
      bowlingStats.values()
    ).filter((player) => {
      return player.balls > 0 ||
        player.wickets > 0 ||
        player.runs > 0 ||
        player.wides > 0 ||
        player.noBalls > 0;
    });

    /*
     * ---------------------------------------------------------
     * INNINGS SUMMARY
     * ---------------------------------------------------------
     */

    const inningsSummary = match.cricketInnings.map(
      (innings) => ({
        id: innings.id,
        inningsNumber: innings.inningsNumber,

        battingTeamId: innings.battingTeamId,
        battingTeamName: innings.battingTeam.name,

        bowlingTeamId: innings.bowlingTeamId,
        bowlingTeamName: innings.bowlingTeam.name,

        totalRuns: innings.totalRuns,
        totalWickets: innings.totalWickets,
        legalBalls: innings.legalBalls,

        overs: `${Math.floor(
          innings.legalBalls / 6
        )}.${innings.legalBalls % 6}`,
      })
    );

    /*
     * ---------------------------------------------------------
     * RESULT
     * ---------------------------------------------------------
     */

    let resultText = "Match not completed";

    if (match.status === "COMPLETED") {
      if (match.result === "TEAM1_WIN") {
        resultText = `${match.team1.name} won`;
      } else if (match.result === "TEAM2_WIN") {
        resultText = `${match.team2.name} won`;
      } else if (match.result === "DRAW") {
        resultText = "Match drawn";
      } else if (match.result === "TIE") {
        resultText = "Match tied";
      } else if (match.result === "NO_RESULT") {
        resultText = "No result";
      }
    }

    /*
     * ---------------------------------------------------------
     * RESPONSE
     * ---------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      match: {
        id: match.id,
        status: match.status,
        result: match.result,
        resultText,

        matchNumber: match.matchNumber,
        stage: match.stage,

        overs: match.overs,

        team1Score: match.team1Score,
        team2Score: match.team2Score,

        winnerTeamId: match.winnerTeamId,

        game: {
          id: match.game.id,
          name: match.game.name,
          sportType: match.game.sportType,
          category: match.game.category,
          gameOrder: match.game.gameOrder,
        },

        tournament: {
          id: match.tournament.id,
          name: match.tournament.name,
          season: match.tournament.season,
        },

        team1: {
          id: match.team1.id,
          name: match.team1.name,
          captain: match.team1.captain,
          players: match.team1.players,
        },

        team2: {
          id: match.team2.id,
          name: match.team2.name,
          captain: match.team2.captain,
          players: match.team2.players,
        },

        winnerTeam: match.winnerTeam
          ? {
              id: match.winnerTeam.id,
              name: match.winnerTeam.name,
            }
          : null,
      },

      innings: inningsSummary,

      batting,

      bowling,

      awards: match.awards.map((award) => ({
        id: award.id,
        awardType: award.awardType,
        reason: award.reason,
        player: {
          id: award.player.id,
          name: award.player.name,
          jerseyNo: award.player.jerseyNo,
        },
      })),
    });
  } catch (error) {
    console.error("GET MATCH RESULT ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch match result",
      },
      {
        status: 500,
      }
    );
  }
}