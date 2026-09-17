import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{ sport: string }>;
};

export async function GET(
  req: Request,
  { params }: Params
) {
  try {
    const { sport } = await params;

    const sportType = sport.toUpperCase();

    // Get games for this sport
    const games = await prisma.game.findMany({
      where: {
        sportType: sportType as any,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (games.length === 0) {
      return NextResponse.json({
        success: true,
        sport: sportType,
        standings: [],
      });
    }

    const gameIds = games.map((game) => game.id);

    // Get matches for these games
    const matches = await prisma.match.findMany({
      where: {
        gameId: {
          in: gameIds,
        },
        status: "COMPLETED",
      },
      select: {
        id: true,
        gameId: true,
        team1Id: true,
        team2Id: true,
        team1Score: true,
        team2Score: true,
        winnerTeamId: true,

        team1: {
          select: {
            id: true,
            name: true,
          },
        },

        team2: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    type Standing = {
      teamId: number;
      teamName: string;
      played: number;
      won: number;
      lost: number;
      drawn: number;
      points: number;
      scoreFor: number;
      scoreAgainst: number;
    };

    const standingsMap = new Map<number, Standing>();

    function getTeam(teamId: number, teamName: string) {
      if (!standingsMap.has(teamId)) {
        standingsMap.set(teamId, {
          teamId,
          teamName,
          played: 0,
          won: 0,
          lost: 0,
          drawn: 0,
          points: 0,
          scoreFor: 0,
          scoreAgainst: 0,
        });
      }

      return standingsMap.get(teamId)!;
    }

    for (const match of matches) {
      const team1 = getTeam(
        match.team1Id,
        match.team1.name
      );

      const team2 = getTeam(
        match.team2Id,
        match.team2.name
      );

      team1.played += 1;
      team2.played += 1;

      team1.scoreFor += match.team1Score;
      team1.scoreAgainst += match.team2Score;

      team2.scoreFor += match.team2Score;
      team2.scoreAgainst += match.team1Score;

      if (match.winnerTeamId === match.team1Id) {
        team1.won += 1;
        team1.points += 2;

        team2.lost += 1;
      } else if (match.winnerTeamId === match.team2Id) {
        team2.won += 1;
        team2.points += 2;

        team1.lost += 1;
      } else {
        team1.drawn += 1;
        team2.drawn += 1;

        team1.points += 1;
        team2.points += 1;
      }
    }

    const standings = Array.from(
      standingsMap.values()
    ).sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }

      const aDifference =
        a.scoreFor - a.scoreAgainst;

      const bDifference =
        b.scoreFor - b.scoreAgainst;

      return bDifference - aDifference;
    });

    return NextResponse.json({
      success: true,
      sport: sportType,
      standings,
    });
  } catch (error) {
    console.error(
      "GET STANDINGS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to fetch standings",
      },
      {
        status: 500,
      }
    );
  }
}