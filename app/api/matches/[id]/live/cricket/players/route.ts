import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const matchId = Number(id);

    if (!Number.isInteger(matchId)) {
      return NextResponse.json(
        {
          error: "Invalid match ID.",
        },
        { status: 400 }
      );
    }

    const body = await req.json();

    const strikerId = Number(body.strikerId);
    const nonStrikerId = Number(
      body.nonStrikerId
    );
    const bowlerId = Number(body.bowlerId);

    if (
      !Number.isInteger(strikerId) ||
      !Number.isInteger(nonStrikerId) ||
      !Number.isInteger(bowlerId)
    ) {
      return NextResponse.json(
        {
          error:
            "Striker, non-striker and bowler are required.",
        },
        { status: 400 }
      );
    }

    if (strikerId === nonStrikerId) {
      return NextResponse.json(
        {
          error:
            "Striker and non-striker must be different.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // GET MATCH
    // =====================================================

    const match =
      await prisma.match.findUnique({
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

          cricketInnings: {
            orderBy: {
              inningsNumber: "desc",
            },

            take: 1,
          },
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

    // =====================================================
    // CURRENT INNINGS
    // =====================================================

    const currentInnings =
      match.cricketInnings[0];

    if (!currentInnings) {
      return NextResponse.json(
        {
          error:
            "No cricket innings has been created for this match yet.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // DETERMINE TEAMS
    // =====================================================

    const battingTeam =
      currentInnings.battingTeamId ===
      match.team1Id
        ? match.team1
        : match.team2;

    const bowlingTeam =
      currentInnings.bowlingTeamId ===
      match.team1Id
        ? match.team1
        : match.team2;

    // =====================================================
    // PLAYER IDS
    // =====================================================

    const battingPlayerIds =
      battingTeam.players.map(
        (player) => player.id
      );

    const bowlingPlayerIds =
      bowlingTeam.players.map(
        (player) => player.id
      );

    // =====================================================
    // VALIDATE STRIKER
    // =====================================================

    if (
      !battingPlayerIds.includes(strikerId)
    ) {
      return NextResponse.json(
        {
          error:
            `Striker must belong to ${battingTeam.name}.`,
        },
        { status: 400 }
      );
    }

    // =====================================================
    // VALIDATE NON-STRIKER
    // =====================================================

    if (
      !battingPlayerIds.includes(
        nonStrikerId
      )
    ) {
      return NextResponse.json(
        {
          error:
            `Non-striker must belong to ${battingTeam.name}.`,
        },
        { status: 400 }
      );
    }

    // =====================================================
    // VALIDATE BOWLER
    // =====================================================

    if (
      !bowlingPlayerIds.includes(bowlerId)
    ) {
      return NextResponse.json(
        {
          error:
            `Bowler must belong to ${bowlingTeam.name}.`,
        },
        { status: 400 }
      );
    }

    // =====================================================
    // CHECK DISMISSED PLAYERS
    // =====================================================

    const dismissedBalls =
      await prisma.cricketBallEvent.findMany({
        where: {
          inningsId: currentInnings.id,
          isWicket: true,
          dismissedPlayerId: {
            not: null,
          },
        },

        select: {
          dismissedPlayerId: true,
        },
      });

    const dismissedPlayerIds =
      dismissedBalls
        .map(
          (ball) => ball.dismissedPlayerId
        )
        .filter(
          (playerId): playerId is number =>
            playerId !== null
        );

    // A dismissed player cannot be selected
    // as striker or non-striker.
    if (
      dismissedPlayerIds.includes(strikerId)
    ) {
      return NextResponse.json(
        {
          error:
            "A dismissed player cannot be the striker.",
        },
        { status: 400 }
      );
    }

    if (
      dismissedPlayerIds.includes(
        nonStrikerId
      )
    ) {
      return NextResponse.json(
        {
          error:
            "A dismissed player cannot be the non-striker.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // GET PLAYER DETAILS
    // =====================================================

    const selectedPlayers =
      await prisma.player.findMany({
        where: {
          id: {
            in: [
              strikerId,
              nonStrikerId,
              bowlerId,
            ],
          },
        },
      });

    // =====================================================
    // RETURN SELECTED PLAYERS
    // =====================================================

    return NextResponse.json({
      success: true,

      message:
        "Cricket players updated successfully.",

      innings: currentInnings.inningsNumber,

      inningsId: currentInnings.id,

      battingTeam: {
        id: battingTeam.id,
        name: battingTeam.name,
      },

      bowlingTeam: {
        id: bowlingTeam.id,
        name: bowlingTeam.name,
      },

      players: {
        strikerId,
        nonStrikerId,
        bowlerId,
      },

      selectedPlayers,

      dismissedPlayerIds,
    });
  } catch (error) {
    console.error(
      "CRICKET PLAYERS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update cricket players.",
      },
      { status: 500 }
    );
  }
}