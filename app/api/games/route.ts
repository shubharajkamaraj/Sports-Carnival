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
    console.error(error);

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

    if (
      !body.name ||
      !body.category ||
      !body.teamSize ||
      !body.venue
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const game = await prisma.game.create({
      data: {
        name: body.name,
        category: body.category,
        teamSize: Number(body.teamSize),
        venue: body.venue,
      },
    });

    return NextResponse.json(game, {
      status: 201,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to create game" },
      { status: 500 }
    );
  }
}