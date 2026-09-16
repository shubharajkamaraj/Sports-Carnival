import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
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
      body.inningsNumber ?? 1
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

    // =====================================================
    // FIND MATCH
    // =====================================================

    const match = await prisma.match.findUnique({
      where: {
        id: matchId,
      },
      include: {
        game: true,
        team1: true,
        team2: true,
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

    // =====================================================
    // CHECK GAME
    // =====================================================

    if (
      !match.game ||
      match.game.sportType !== "CRICKET"
    ) {
      return NextResponse.json(
        {
          error: "This match is not a cricket match.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // BATTTING / BOWLING TEAM
    // =====================================================

    let battingTeamId =
      body.battingTeamId
        ? Number(body.battingTeamId)
        : Number(match.team1Id);

    let bowlingTeamId =
      body.bowlingTeamId
        ? Number(body.bowlingTeamId)
        : Number(match.team2Id);

    if (
      !Number.isInteger(battingTeamId) ||
      !Number.isInteger(bowlingTeamId)
    ) {
      return NextResponse.json(
        {
          error: "Invalid batting or bowling team",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // TEAMS MUST BE DIFFERENT
    // =====================================================

    if (
      battingTeamId === bowlingTeamId
    ) {
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

    // =====================================================
    // MAKE SURE TEAMS BELONG TO MATCH
    // =====================================================

    const validTeamIds = [
      match.team1Id,
      match.team2Id,
    ];

    if (
      !validTeamIds.includes(battingTeamId) ||
      !validTeamIds.includes(bowlingTeamId)
    ) {
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

    // =====================================================
    // CHECK EXISTING INNINGS
    // =====================================================

    const existingInnings =
      await prisma.cricketInnings.findUnique({
        where: {
          matchId_inningsNumber: {
            matchId,
            inningsNumber,
          },
        },
        include: {
          battingTeam: true,
          bowlingTeam: true,
        },
      });

    // =====================================================
    // IF ALREADY EXISTS
    // RETURN EXISTING INNINGS
    // =====================================================

    if (existingInnings) {
      return NextResponse.json({
        message:
          `Innings ${inningsNumber} already exists.`,
        inningsId: existingInnings.id,
        innings: existingInnings,
        existing: true,
      });
    }

    // =====================================================
    // CREATE NEW INNINGS
    // =====================================================

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

    // =====================================================
    // UPDATE MATCH STATUS
    // =====================================================

    await prisma.match.update({
      where: {
        id: matchId,
      },
      data: {
        status: "LIVE",
      },
    });

    // =====================================================
    // RESPONSE
    // =====================================================

    return NextResponse.json(
      {
        message: "Match started successfully.",
        inningsId: innings.id,
        innings,
        existing: false,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/matches/[id]/cricket/start ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to start cricket match.",
      },
      {
        status: 500,
      }
    );
  }
}