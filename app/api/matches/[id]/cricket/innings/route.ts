import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// =====================================================
// GET CURRENT CRICKET INNINGS
// =====================================================

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const matchId = Number(id);

    if (!Number.isInteger(matchId)) {
      return NextResponse.json(
        {
          error: "Invalid match ID",
        },
        {
          status: 400,
        }
      );
    }

    const innings =
      await prisma.cricketInnings.findMany({
        where: {
          matchId,
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

            include: {
              striker: true,
              nonStriker: true,
              bowler: true,
              dismissedPlayer: true,
            },
          },
        },

        orderBy: {
          inningsNumber: "asc",
        },
      });

    return NextResponse.json(innings);
  } catch (error) {
    console.error(
      "GET CRICKET INNINGS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load cricket innings",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// CREATE CRICKET INNINGS
// =====================================================

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const matchId = Number(id);

    if (!Number.isInteger(matchId)) {
      return NextResponse.json(
        {
          error: "Invalid match ID",
        },
        {
          status: 400,
        }
      );
    }

    const body = await request.json();

    const inningsNumber = Number(
      body.inningsNumber
    );

    const battingTeamId = Number(
      body.battingTeamId
    );

    const bowlingTeamId = Number(
      body.bowlingTeamId
    );

    if (
      !Number.isInteger(inningsNumber) ||
      inningsNumber < 1
    ) {
      return NextResponse.json(
        {
          error: "Invalid innings number",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(battingTeamId) ||
      !Number.isInteger(bowlingTeamId)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid batting or bowling team.",
        },
        {
          status: 400,
        }
      );
    }

    if (battingTeamId === bowlingTeamId) {
      return NextResponse.json(
        {
          error:
            "Batting and bowling teams must be different.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // CHECK MATCH
    // =================================================

    const match =
      await prisma.match.findUnique({
        where: {
          id: matchId,
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

    // =================================================
    // MAKE SURE TEAMS BELONG TO MATCH
    // =================================================

    const validTeams =
      (battingTeamId === match.team1Id ||
        battingTeamId === match.team2Id) &&
      (bowlingTeamId === match.team1Id ||
        bowlingTeamId === match.team2Id);

    if (!validTeams) {
      return NextResponse.json(
        {
          error:
            "Selected teams do not belong to this match.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // CHECK WHETHER INNINGS ALREADY EXISTS
    // =================================================

    const existing =
      await prisma.cricketInnings.findUnique({
        where: {
          matchId_inningsNumber: {
            matchId,
            inningsNumber,
          },
        },
      });

    if (existing) {
      return NextResponse.json(
        {
          error:
            `Innings ${inningsNumber} already exists.`,
        },
        {
          status: 409,
        }
      );
    }

    // =================================================
    // CREATE INNINGS
    // =================================================

    const innings =
      await prisma.cricketInnings.create({
        data: {
          matchId,
          inningsNumber,
          battingTeamId,
          bowlingTeamId,
          totalRuns: 0,
          totalWickets: 0,
          legalBalls: 0,
        },

        include: {
          battingTeam: true,
          bowlingTeam: true,
        },
      });

    return NextResponse.json(
      innings,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE CRICKET INNINGS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create cricket innings",
      },
      {
        status: 500,
      }
    );
  }
}