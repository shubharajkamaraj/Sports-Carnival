import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// =====================================================
// GET MATCH PLAYERS
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
        { error: "Invalid match ID" },
        { status: 400 }
      );
    }

    const match = await prisma.match.findUnique({
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
        players: {
          include: {
            player: true,
            team: true,
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

    return NextResponse.json({
      matchId: match.id,

      team1: {
        id: match.team1.id,
        name: match.team1.name,
        players: match.team1.players,
      },

      team2: {
        id: match.team2.id,
        name: match.team2.name,
        players: match.team2.players,
      },

      matchPlayers: match.players,
    });
  } catch (error) {
    console.error(
      "GET MATCH PLAYERS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load match players",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// ADD PLAYERS TO MATCH
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
        { error: "Invalid match ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const playerIds: number[] = Array.isArray(
      body.playerIds
    )
      ? body.playerIds
          .map(Number)
          .filter((id: number) =>
            Number.isInteger(id)
          )
      : [];

    if (playerIds.length === 0) {
      return NextResponse.json(
        {
          error:
            "Please select at least one player.",
        },
        { status: 400 }
      );
    }

    const match = await prisma.match.findUnique({
      where: {
        id: matchId,
      },
      include: {
        team1: true,
        team2: true,
      },
    });

    if (!match) {
      return NextResponse.json(
        {
          error: "Match not found",
        },
        { status: 404 }
      );
    }

    // -------------------------------------------------
    // Load selected database players
    // -------------------------------------------------

    const selectedPlayers =
      await prisma.player.findMany({
        where: {
          id: {
            in: playerIds,
          },
        },
      });

    if (
      selectedPlayers.length !==
      new Set(playerIds).size
    ) {
      return NextResponse.json(
        {
          error:
            "One or more selected players do not exist.",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // Make sure players belong to Match teams
    // -------------------------------------------------

    const validPlayers =
      selectedPlayers.filter(
        (player) =>
          player.teamId === match.team1Id ||
          player.teamId === match.team2Id
      );

    if (
      validPlayers.length !==
      selectedPlayers.length
    ) {
      return NextResponse.json(
        {
          error:
            "A selected player does not belong to either team in this match.",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // Create MatchPlayer records
    // -------------------------------------------------

    await prisma.matchPlayer.createMany({
      data: validPlayers.map((player) => ({
        matchId,
        playerId: player.id,
        teamId: player.teamId,
      })),
      skipDuplicates: true,
    });

    // -------------------------------------------------
    // Return updated players
    // -------------------------------------------------

    const matchPlayers =
      await prisma.matchPlayer.findMany({
        where: {
          matchId,
        },
        include: {
          player: true,
          team: true,
        },
        orderBy: {
          playerId: "asc",
        },
      });

    return NextResponse.json(
      {
        success: true,
        matchId,
        players: matchPlayers,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "ADD MATCH PLAYERS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to add match players",
      },
      {
        status: 500,
      }
    );
  }
}