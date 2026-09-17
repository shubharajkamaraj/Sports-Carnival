import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(
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

    const body = await req.json().catch(() => ({}));

    const strikerId = body.strikerId
      ? Number(body.strikerId)
      : null;

    const nonStrikerId = body.nonStrikerId
      ? Number(body.nonStrikerId)
      : null;

    const bowlerId = body.bowlerId
      ? Number(body.bowlerId)
      : null;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
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
        game: true,
        tournament: true,
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    if (match.game.sportType !== "CRICKET") {
      return NextResponse.json(
        { error: "This endpoint is only for cricket matches" },
        { status: 400 }
      );
    }

    // The first innings is always batting team 1.
    let innings = await prisma.cricketInnings.findUnique({
      where: {
        matchId_inningsNumber: {
          matchId,
          inningsNumber: 1,
        },
      },
    });

    if (!innings) {
      innings = await prisma.cricketInnings.create({
        data: {
          matchId,
          inningsNumber: 1,
          battingTeamId: match.team1Id,
          bowlingTeamId: match.team2Id,
        },
      });
    }

    const battingPlayerIds = match.team1.players.map(
      (player) => player.id
    );

    const bowlingPlayerIds = match.team2.players.map(
      (player) => player.id
    );

    // Validate selected players if supplied.
    if (
      strikerId !== null &&
      !battingPlayerIds.includes(strikerId)
    ) {
      return NextResponse.json(
        { error: "Striker must belong to the batting team" },
        { status: 400 }
      );
    }

    if (
      nonStrikerId !== null &&
      !battingPlayerIds.includes(nonStrikerId)
    ) {
      return NextResponse.json(
        { error: "Non-striker must belong to the batting team" },
        { status: 400 }
      );
    }

    if (
      strikerId !== null &&
      nonStrikerId !== null &&
      strikerId === nonStrikerId
    ) {
      return NextResponse.json(
        { error: "Striker and non-striker cannot be the same player" },
        { status: 400 }
      );
    }

    if (
      bowlerId !== null &&
      !bowlingPlayerIds.includes(bowlerId)
    ) {
      return NextResponse.json(
        { error: "Bowler must belong to the bowling team" },
        { status: 400 }
      );
    }

    // Check whether selected batting players are already dismissed.
    const dismissedEvents = await prisma.cricketBallEvent.findMany({
      where: {
        inningsId: innings.id,
        isWicket: true,
        dismissedPlayerId: {
          not: null,
        },
      },
      select: {
        dismissedPlayerId: true,
      },
    });

    const dismissedPlayerIds = dismissedEvents
      .map((event) => event.dismissedPlayerId)
      .filter((value): value is number => value !== null);

    if (
      strikerId !== null &&
      dismissedPlayerIds.includes(strikerId)
    ) {
      return NextResponse.json(
        { error: "Striker has already been dismissed" },
        { status: 400 }
      );
    }

    if (
      nonStrikerId !== null &&
      dismissedPlayerIds.includes(nonStrikerId)
    ) {
      return NextResponse.json(
        { error: "Non-striker has already been dismissed" },
        { status: 400 }
      );
    }

    // Mark match as live.
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: "LIVE",
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
        game: true,
        tournament: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Cricket match started",
      match: updatedMatch,
      innings,
      score: {
        innings: innings.inningsNumber,
        totalRuns: innings.totalRuns,
        totalWickets: innings.totalWickets,
        legalBalls: innings.legalBalls,
        strikerId,
        nonStrikerId,
        bowlerId,
        maxOvers: match.overs,
      },
    });
  } catch (error) {
    console.error("START CRICKET MATCH ERROR:", error);

    return NextResponse.json(
      { error: "Failed to start cricket match" },
      { status: 500 }
    );
  }
}