import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      inningsId: string;
    }>;
  }
) {
  try {
    const { id, inningsId } = await params;

    const matchId = Number(id);
    const inningsIdNumber = Number(inningsId);

    if (!Number.isInteger(matchId)) {
      return NextResponse.json(
        {
          error: "Invalid match ID",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(inningsIdNumber)) {
      return NextResponse.json(
        {
          error: "Invalid innings ID",
        },
        { status: 400 }
      );
    }

    console.log(
      "GET CRICKET INNINGS:",
      {
        matchId,
        inningsId: inningsIdNumber,
      }
    );

    const innings = await prisma.cricketInnings.findFirst({
      where: {
        id: inningsIdNumber,
        matchId: matchId,
      },
      include: {
        match: {
          include: {
            tournament: true,
            game: true,

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
          },
        },

        battingTeam: {
          include: {
            players: true,
          },
        },

        bowlingTeam: {
          include: {
            players: true,
          },
        },

        ballEvents: {
          include: {
            striker: true,
            nonStriker: true,
            bowler: true,
            dismissedPlayer: true,
          },

          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!innings) {
      return NextResponse.json(
        {
          error: "Innings not found",
          matchId,
          inningsId: inningsIdNumber,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(innings);
  } catch (error) {
    console.error(
      "GET CRICKET INNINGS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load cricket innings",
      },
      {
        status: 500,
      }
    );
  }
}