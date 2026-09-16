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

    if (!matchId || Number.isNaN(matchId)) {
      return NextResponse.json(
        { error: "Invalid match ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      strikerId,
      nonStrikerId,
      bowlerId,
    } = body;

    if (
      !strikerId ||
      !nonStrikerId ||
      !bowlerId
    ) {
      return NextResponse.json(
        {
          error:
            "Striker, non-striker and bowler are required",
        },
        { status: 400 }
      );
    }

    const score = await prisma.matchScore.upsert({
      where: {
        matchId,
      },

      update: {
        strikerId: Number(strikerId),
        nonStrikerId: Number(nonStrikerId),
        bowlerId: Number(bowlerId),
        status: "LIVE",
      },

      create: {
        matchId,

        team1Score: 0,
        team2Score: 0,

        innings: 1,

        overs: 0,
        balls: 0,
        wickets: 0,

        strikerId: Number(strikerId),
        nonStrikerId: Number(nonStrikerId),
        bowlerId: Number(bowlerId),

        status: "LIVE",
      },
    });

    return NextResponse.json(score);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to setup cricket players",
      },
      {
        status: 500,
      }
    );
  }
}