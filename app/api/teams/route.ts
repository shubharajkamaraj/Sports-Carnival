import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { players } from "@/data/players";

// =====================================================
// GET ALL TEAMS
// =====================================================

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      orderBy: {
        id: "asc",
      },
    });

    const result = teams.map((team) => {
      const selectedPlayers = team.playerIds
        .map((playerId: number) =>
          players.find(
            (player) => player.id === playerId
          )
        )
        .filter(
          (player): player is (typeof players)[number] =>
            player !== undefined
        );

      return {
        ...team,
        players: selectedPlayers,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET TEAMS ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to load teams",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// CREATE TEAM
// =====================================================

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();

    const captain = String(
      body.captain ?? ""
    ).trim();

    const playerIds: number[] = Array.isArray(
      body.playerIds
    )
      ? body.playerIds
          .map(Number)
          .filter((id: number) =>
            Number.isInteger(id)
          )
      : [];

    // -------------------------------------------------
    // Validation
    // -------------------------------------------------

    if (!name) {
      return NextResponse.json(
        {
          error: "Team name is required.",
        },
        {
          status: 400,
        }
      );
    }


    if (playerIds.length === 0) {
      return NextResponse.json(
        {
          error:
            "Please select at least one player.",
        },
        {
          status: 400,
        }
      );
    }

    // -------------------------------------------------
    // Validate static players
    // -------------------------------------------------

    const invalidPlayerIds =
      playerIds.filter(
        (playerId: number) =>
          !players.some(
            (player) =>
              player.id === playerId
          )
      );

    if (invalidPlayerIds.length > 0) {
      return NextResponse.json(
        {
          error:
            "One or more selected players are invalid.",
          invalidPlayerIds,
        },
        {
          status: 400,
        }
      );
    }

    // Remove duplicate IDs
    const uniquePlayerIds = [
      ...new Set(playerIds),
    ];

    // -------------------------------------------------
    // Create team
    // -------------------------------------------------

    const team = await prisma.team.create({
      data: {
        name,
        captain: captain || null,
        playerIds: uniquePlayerIds,
      },
    });

    // Return selected players too
    const selectedPlayers =
      uniquePlayerIds
        .map((playerId: number) =>
          players.find(
            (player) =>
              player.id === playerId
          )
        )
        .filter(
          (
            player
          ): player is (typeof players)[number] =>
            player !== undefined
        );

    return NextResponse.json(
      {
        ...team,
        players: selectedPlayers,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE TEAM ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create team",
      },
      {
        status: 500,
      }
    );
  }
}