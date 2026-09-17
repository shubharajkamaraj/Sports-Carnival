import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET ALL GAMES
export async function GET() {
  try {
    const games = await prisma.game.findMany({
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json(games);
  } catch (error) {
    console.error("GET GAMES ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch games" },
      { status: 500 }
    );
  }
}

// ADD GAME
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.name || !body.category || !body.tournamentId) {
      return NextResponse.json(
        {
          error: "Game name, category and tournament are required",
        },
        { status: 400 }
      );
    }

    const game = await prisma.game.create({
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

    return NextResponse.json(game, {
      status: 201,
    });
  } catch (error) {
    console.error("CREATE GAME ERROR:", error);

    return NextResponse.json(
      { error: "Failed to create game" },
      { status: 500 }
    );
  }
}