import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;

    const matchId = Number(id);

    if (!matchId) {
      return NextResponse.json(
        { error: "Invalid match ID" },
        { status: 400 }
      );
    }

    const match = await prisma.match.findUnique({
      where: {
        id: matchId,
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    const score = await prisma.matchScore.upsert({
      where: {
        matchId,
      },

      update: {
        status: "LIVE",
      },

      create: {
        matchId,
        status: "LIVE",
      },
    });

    await prisma.match.update({
      where: {
        id: matchId,
      },

      data: {
        status: "LIVE",
      },
    });

    return NextResponse.json(score);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Unable to start live match" },
      { status: 500 }
    );
  }
}