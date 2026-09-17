import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// =====================================================
// GET CRICKET INNINGS
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
        { status: 400 }
      );
    }

    const innings =
      await prisma.cricketInnings.findMany({
        where: {
          matchId,
        },

        include: {
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

        orderBy: {
          inningsNumber: "asc",
        },
      });

    // Collect all player IDs from ball events
    const playerIds = Array.from(
      new Set(
        innings.flatMap((inning) =>
          inning.ballEvents.flatMap((ball) => [
            ball.strikerId,
            ball.nonStrikerId,
            ball.bowlerId,
            ...(ball.dismissedPlayerId
              ? [ball.dismissedPlayerId]
              : []),
            ...(ball.fielderId
              ? [ball.fielderId]
              : []),
          ])
        )
      )
    );

    const players =
      playerIds.length > 0
        ? await prisma.player.findMany({
            where: {
              id: {
                in: playerIds,
              },
            },
          })
        : [];

    const playerMap = new Map(
      players.map((player) => [player.id, player])
    );

    const result = innings.map((inning) => ({
      ...inning,

      ballEvents: inning.ballEvents.map(
        (ball) => ({
          ...ball,

          striker:
            playerMap.get(ball.strikerId) ?? null,

          nonStriker:
            playerMap.get(ball.nonStrikerId) ?? null,

          bowler:
            playerMap.get(ball.bowlerId) ?? null,

          dismissedPlayer:
            ball.dismissedPlayerId
              ? playerMap.get(
                  ball.dismissedPlayerId
                ) ?? null
              : null,

          fielder:
            ball.fielderId
              ? playerMap.get(
                  ball.fielderId
                ) ?? null
              : null,
        })
      ),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "GET CRICKET INNINGS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load cricket innings",
      },
      { status: 500 }
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
        { status: 400 }
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
        { status: 400 }
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
        { status: 400 }
      );
    }

    if (battingTeamId === bowlingTeamId) {
      return NextResponse.json(
        {
          error:
            "Batting and bowling teams must be different.",
        },
        { status: 400 }
      );
    }

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
        { status: 404 }
      );
    }

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
        { status: 400 }
      );
    }

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
        { status: 409 }
      );
    }

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
      { status: 201 }
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
      { status: 500 }
    );
  }
}