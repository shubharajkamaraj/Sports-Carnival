import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      inningsId: string;
    }>;
  }
) {
  try {
    const { id, inningsId } = await params;

    const matchId = Number(id);
    const inningsIdNumber = Number(inningsId);

    if (!Number.isInteger(matchId)) {
      return NextResponse.json(
        { error: "Invalid match ID" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(inningsIdNumber)) {
      return NextResponse.json(
        { error: "Invalid innings ID" },
        { status: 400 }
      );
    }

    const innings = await prisma.cricketInnings.findFirst({
      where: {
        id: inningsIdNumber,
        matchId,
      },
      include: {
        match: {
          include: {
            tournament: true,
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
          },
        },

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
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!innings) {
      return NextResponse.json(
        {
          error: "Innings not found",
          matchId,
          inningsId: inningsIdNumber,
        },
        { status: 404 }
      );
    }

    // Get all player IDs used in ball events
    const playerIds = Array.from(
      new Set(
        innings.ballEvents.flatMap((ball) => [
          ball.strikerId,
          ball.nonStrikerId,
          ball.bowlerId,
          ...(ball.dismissedPlayerId
            ? [ball.dismissedPlayerId]
            : []),
          ...(ball.fielderId ? [ball.fielderId] : []),
        ])
      )
    );

    // Fetch players separately because CricketBallEvent
    // only stores player IDs.
    const players = await prisma.player.findMany({
      where: {
        id: {
          in: playerIds,
        },
      },
    });

    const playerMap = new Map(
      players.map((player) => [player.id, player])
    );

    const ballEvents = innings.ballEvents.map((ball) => ({
      ...ball,
      striker: playerMap.get(ball.strikerId) ?? null,
      nonStriker:
        playerMap.get(ball.nonStrikerId) ?? null,
      bowler: playerMap.get(ball.bowlerId) ?? null,
      dismissedPlayer: ball.dismissedPlayerId
        ? playerMap.get(ball.dismissedPlayerId) ?? null
        : null,
      fielder: ball.fielderId
        ? playerMap.get(ball.fielderId) ?? null
        : null,
    }));

    return NextResponse.json({
      ...innings,
      ballEvents,
    });
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