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

    const game = await prisma.game.update({
      where: {
        id: Number(id),
      },
      data: {
        name: body.name,
        category: body.category,
        teamSize: Number(body.teamSize),
        venue: body.venue,
      },
    });

    return NextResponse.json(game);
  } catch (error) {
    console.error(error);

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

    await prisma.game.delete({
      where: {
        id: Number(id),
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to delete game" },
      { status: 500 }
    );
  }
}