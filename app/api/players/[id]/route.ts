import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// GET SINGLE PLAYER
export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const player = await prisma.player.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        team: true,
      },
    });

    if (!player) {
      return NextResponse.json(
        {
          error: "Player not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error("GET PLAYER ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to load player",
      },
      {
        status: 500,
      }
    );
  }
}

// UPDATE PLAYER
export async function PUT(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const body = await request.json();

    const playerId = Number(id);
    const teamId = Number(body.teamId);

    const name = String(body.name ?? "").trim();

    if (!name || !teamId) {
      return NextResponse.json(
        {
          error: "Player name and team are required.",
        },
        {
          status: 400,
        }
      );
    }

    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
      },
    });

    if (!team) {
      return NextResponse.json(
        {
          error: "Team not found.",
        },
        {
          status: 404,
        }
      );
    }

    const jerseyNo =
      body.jerseyNo === null ||
      body.jerseyNo === undefined ||
      body.jerseyNo === ""
        ? null
        : Number(body.jerseyNo);

    const role =
      body.role === null ||
      body.role === undefined ||
      body.role === ""
        ? null
        : String(body.role).trim();

    const photo =
      body.photo === null ||
      body.photo === undefined ||
      body.photo === ""
        ? null
        : String(body.photo).trim();

    const updated = await prisma.player.update({
      where: {
        id: playerId,
      },

      data: {
        name,
        jerseyNo,
        role,
        photo,
        teamId,
      },

      include: {
        team: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("UPDATE PLAYER ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update player",
      },
      {
        status: 500,
      }
    );
  }
}

// DELETE PLAYER
export async function DELETE(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    await prisma.player.delete({
      where: {
        id: Number(id),
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE PLAYER ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to delete player",
      },
      {
        status: 500,
      }
    );
  }
}