import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  _request: Request,
  { params }: Params
) {
  try {
    // =====================================================
    // GET MATCH ID
    // =====================================================

    const { id } = await params;

    const matchId = Number(id);

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

    // =====================================================
    // GET MATCH
    //
    // IMPORTANT:
    // This only loads the match and cricket innings.
    // It does NOT change scoring logic.
    // =====================================================

    const match = await prisma.match.findUnique({
      where: {
        id: matchId,
      },

      include: {
        // =================================================
        // GAME
        // =================================================

        game: true,

        // =================================================
        // TEAM 1
        // =================================================

        team1: {
          include: {
            players: {
              orderBy: {
                jerseyNo: "asc",
              },
            },
          },
        },

        // =================================================
        // TEAM 2
        // =================================================

        team2: {
          include: {
            players: {
              orderBy: {
                jerseyNo: "asc",
              },
            },
          },
        },

        // =================================================
        // CRICKET INNINGS
        // =================================================

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
      },
    });

    // =====================================================
    // MATCH NOT FOUND
    // =====================================================

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
    // MAKE SURE THIS IS CRICKET
    // =====================================================

    if (match.game.sportType !== "CRICKET") {
      return NextResponse.json(
        {
          error: "This is not a cricket match.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // CURRENT INNINGS
    // =====================================================

    const currentInnings =
      match.cricketInnings.length > 0
        ? match.cricketInnings[
            match.cricketInnings.length - 1
          ]
        : null;

    // =====================================================
    // ALL PLAYERS
    //
    // Uses current Prisma field:
    // team.players
    // =====================================================

    const allPlayers = [
      ...match.team1.players,
      ...match.team2.players,
    ];

    // =====================================================
    // CURRENT PLAYER IDS
    //
    // CricketBallEvent stores these values:
    //
    // strikerId
    // nonStrikerId
    // bowlerId
    // =====================================================

    const lastBall =
      currentInnings?.ballEvents?.length
        ? currentInnings.ballEvents[
            currentInnings.ballEvents.length - 1
          ]
        : null;

    const strikerId =
      lastBall?.strikerId ?? null;

    const nonStrikerId =
      lastBall?.nonStrikerId ?? null;

    const bowlerId =
      lastBall?.bowlerId ?? null;

    // =====================================================
    // FIND CURRENT PLAYERS
    // =====================================================

    const striker =
      strikerId !== null
        ? allPlayers.find(
            (player) =>
              player.id === strikerId
          ) ?? null
        : null;

    const nonStriker =
      nonStrikerId !== null
        ? allPlayers.find(
            (player) =>
              player.id === nonStrikerId
          ) ?? null
        : null;

    const bowler =
      bowlerId !== null
        ? allPlayers.find(
            (player) =>
              player.id === bowlerId
          ) ?? null
        : null;

    // =====================================================
    // BATTING / BOWLING TEAM
    // =====================================================

    const battingTeam =
      currentInnings?.battingTeam ??
      match.team1;

    const bowlingTeam =
      currentInnings?.bowlingTeam ??
      match.team2;

    // =====================================================
    // RETURN LIVE CRICKET MATCH
    // =====================================================

    return NextResponse.json({
      id: match.id,

      status: match.status,

      venue: match.venue,

      matchDate: match.matchDate,

      game: match.game,

      // ===================================================
      // TEAMS
      // ===================================================

      team1: match.team1,

      team2: match.team2,

      // ===================================================
      // CRICKET INNINGS
      //
      // This is the actual cricket data from your schema.
      // ===================================================

      cricketInnings: match.cricketInnings,

      // ===================================================
      // CURRENT INNINGS
      // ===================================================

      currentInnings,

      // ===================================================
      // CURRENT PLAYERS
      // ===================================================

      cricket: {
        striker,

        nonStriker,

        bowler,

        battingTeamId:
          battingTeam.id,

        bowlingTeamId:
          bowlingTeam.id,

        battingTeamName:
          battingTeam.name,

        bowlingTeamName:
          bowlingTeam.name,

        inningsNumber:
          currentInnings?.inningsNumber ?? 1,

        totalRuns:
          currentInnings?.totalRuns ?? 0,

        totalWickets:
          currentInnings?.totalWickets ?? 0,

        legalBalls:
          currentInnings?.legalBalls ?? 0,
      },
    });
  } catch (error) {
    console.error(
      "GET LIVE CRICKET MATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load live cricket match.",
      },
      {
        status: 500,
      }
    );
  }
}