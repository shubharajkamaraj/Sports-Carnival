import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// UPDATE GAME
export async function PUT(
  req: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const gameId = Number(id);
    const body = await req.json();

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json(
        { error: "Invalid game ID" },
        { status: 400 }
      );
    }

    if (
      !body.name ||
      !body.category ||
      !body.tournamentId
    ) {
      return NextResponse.json(
        {
          error:
            "Game name, category and tournament are required",
        },
        { status: 400 }
      );
    }

    const game = await prisma.game.update({
      where: {
        id: gameId,
      },
      data: {
        name: body.name,
        category: body.category,
        sportType: body.sportType || null,
        tournamentId: Number(body.tournamentId),
        gameOrder: body.gameOrder
          ? Number(body.gameOrder)
          : null,
      },
    });

    return NextResponse.json(game);
  } catch (error) {
    console.error("UPDATE GAME ERROR:", error);

    return NextResponse.json(
      { error: "Failed to update game" },
      { status: 500 }
    );
  }
}

// DELETE GAME
export async function DELETE(
  req: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const gameId = Number(id);

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json(
        { error: "Invalid game ID" },
        { status: 400 }
      );
    }

    await prisma.game.delete({
      where: {
        id: gameId,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE GAME ERROR:", error);

    return NextResponse.json(
      { error: "Failed to delete game" },
      { status: 500 }
    );
  }
}