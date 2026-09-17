import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { players } from "@/data/players";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// =====================================================
// GET SINGLE TEAM
// =====================================================

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const teamId = Number(id);

    if (!Number.isInteger(teamId)) {
      return NextResponse.json(
        {
          error: "Invalid team ID",
        },
        {
          status: 400,
        }
      );
    }

    const team =
      await prisma.team.findUnique({
        where: {
          id: teamId,
        },
      });

    if (!team) {
      return NextResponse.json(
        {
          error: "Team not found",
        },
        {
          status: 404,
        }
      );
    }

    const selectedPlayers =
      team.playerIds
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

    return NextResponse.json({
      ...team,
      players: selectedPlayers,
    });
  } catch (error) {
    console.error(
      "GET TEAM ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load team",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// UPDATE TEAM
// =====================================================

export async function PUT(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const teamId = Number(id);

    if (!Number.isInteger(teamId)) {
      return NextResponse.json(
        {
          error: "Invalid team ID",
        },
        {
          status: 400,
        }
      );
    }

    const body = await request.json();

    const name = String(
      body.name ?? ""
    ).trim();

    const captain = String(
      body.captain ?? ""
    ).trim();

    const playerIds: number[] =
      Array.isArray(body.playerIds)
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
    // Validate players
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

    const uniquePlayerIds = [
      ...new Set(playerIds),
    ];

    // -------------------------------------------------
    // Update
    // -------------------------------------------------

    const updated =
      await prisma.team.update({
        where: {
          id: teamId,
        },

        data: {
          name,
          captain: captain || null,
          playerIds: uniquePlayerIds,
        },
      });

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

    return NextResponse.json({
      ...updated,
      players: selectedPlayers,
    });
  } catch (error) {
    console.error(
      "UPDATE TEAM ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update team",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// DELETE TEAM
// =====================================================

export async function DELETE(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const teamId = Number(id);

    if (!Number.isInteger(teamId)) {
      return NextResponse.json(
        {
          error: "Invalid team ID",
        },
        {
          status: 400,
        }
      );
    }

    // -------------------------------------------------
    // Check matches
    // -------------------------------------------------

    const matches =
      await prisma.match.findMany({
        where: {
          OR: [
            {
              team1Id: teamId,
            },
            {
              team2Id: teamId,
            },
          ],
        },

        select: {
          id: true,
          status: true,
        },
      });

    if (matches.length > 0) {
      return NextResponse.json(
        {
          error:
            "This team cannot be deleted because it is already used in a match.",
          matches,
        },
        {
          status: 409,
        }
      );
    }

    // -------------------------------------------------
    // Delete team
    // -------------------------------------------------

    await prisma.team.delete({
      where: {
        id: teamId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Team deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE TEAM ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to delete team",
      },
      {
        status: 500,
      }
    );
  }
}