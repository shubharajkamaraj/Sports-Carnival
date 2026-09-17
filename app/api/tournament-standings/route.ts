import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const results = await prisma.competitionGameResult.findMany({
      orderBy: [
        {
          game: {
            gameOrder: "asc",
          },
        },
        {
          position: "asc",
        },
      ],
      select: {
        id: true,
        gameId: true,
        teamId: true,
        position: true,
        points: true,

        game: {
          select: {
            id: true,
            name: true,
            gameOrder: true,
          },
        },

        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const teamsMap = new Map<
      number,
      {
        teamId: number;
        teamName: string;
        totalPoints: number;
        gamesPlayed: number;
        games: Record<string, number>;
      }
    >();

    for (const result of results) {
      if (!teamsMap.has(result.teamId)) {
        teamsMap.set(result.teamId, {
          teamId: result.teamId,
          teamName: result.team.name,
          totalPoints: 0,
          gamesPlayed: 0,
          games: {},
        });
      }

      const team = teamsMap.get(result.teamId)!;

      team.totalPoints += result.points;
      team.gamesPlayed += 1;

      team.games[result.game.name] =
        (team.games[result.game.name] ?? 0) + result.points;
    }

    const standings = Array.from(teamsMap.values())
      .sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints;
        }

        return a.teamName.localeCompare(b.teamName);
      })
      .map((team, index) => ({
        rank: index + 1,
        teamId: team.teamId,
        teamName: team.teamName,
        totalPoints: team.totalPoints,
        gamesPlayed: team.gamesPlayed,
        games: team.games,
      }));

    const games = Array.from(
      new Map(
        results.map((result) => [
          result.gameId,
          {
            id: result.game.id,
            name: result.game.name,
            gameOrder: result.game.gameOrder,
          },
        ])
      ).values()
    ).sort((a, b) => {
      if (a.gameOrder === null && b.gameOrder === null) {
        return a.id - b.id;
      }

      if (a.gameOrder === null) return 1;
      if (b.gameOrder === null) return -1;

      return a.gameOrder - b.gameOrder;
    });

    return NextResponse.json({
      success: true,
      games,
      standings,
    });
  } catch (error) {
    console.error("TOURNAMENT STANDINGS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load tournament standings.",
      },
      {
        status: 500,
      }
    );
  }
}