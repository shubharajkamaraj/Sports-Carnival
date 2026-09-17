import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      teams,
      players,
      games,
      matches,
      upcomingMatches,
      liveMatches,
      completedMatches,
      pointResults,
    ] = await Promise.all([
      prisma.team.count(),

      prisma.player.count(),

      prisma.game.count(),

      prisma.match.count(),

      prisma.match.count({
        where: {
          status: "UPCOMING",
        },
      }),

      prisma.match.count({
        where: {
          status: "LIVE",
        },
      }),

      prisma.match.count({
        where: {
          status: "COMPLETED",
        },
      }),

      prisma.competitionGameResult.findMany({
        include: {
          team: true,
          game: true,
        },
      }),
    ]);

    /* ===================================================== */
    /* TOURNAMENT STANDINGS */
    /* ===================================================== */

    const teamMap = new Map<
      number,
      {
        teamId: number;
        teamName: string;
        points: number;
        games: Set<number>;
      }
    >();

    for (const result of pointResults) {
      if (!teamMap.has(result.teamId)) {
        teamMap.set(result.teamId, {
          teamId: result.teamId,
          teamName: result.team.name,
          points: 0,
          games: new Set<number>(),
        });
      }

      const team = teamMap.get(result.teamId)!;

      team.points += result.points;
      team.games.add(result.gameId);
    }

    const standings = Array.from(teamMap.values())
      .map((team) => ({
        teamId: team.teamId,
        teamName: team.teamName,
        points: team.points,
        gamesPlayed: team.games.size,
      }))
      .sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points;
        }

        return a.teamName.localeCompare(b.teamName);
      })
      .map((team, index) => ({
        rank: index + 1,
        ...team,
      }));

    /* ===================================================== */
    /* UPCOMING MATCHES */
    /* ===================================================== */

    const matchesList = await prisma.match.findMany({
      where: {
        status: {
          in: ["UPCOMING", "LIVE"],
        },
      },

      include: {
        game: true,
        team1: true,
        team2: true,
      },

      orderBy: {
        id: "asc",
      },

      take: 10,
    });

    const formattedMatches = matchesList.map((match) => ({
      id: match.id,

      matchNumber: match.matchNumber,

      stage: match.stage,

      status: match.status,

      game: {
        id: match.game.id,
        name: match.game.name,
        sportType: match.game.sportType,
      },

      team1: {
        id: match.team1.id,
        name: match.team1.name,
      },

      team2: {
        id: match.team2.id,
        name: match.team2.name,
      },
    }));

    return NextResponse.json({
      stats: {
        teams,
        players,
        games,
        matches,
        upcomingMatches,
        liveMatches,
        completedMatches,
      },

      standings,

      upcomingMatches: formattedMatches,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);

    return NextResponse.json(
      {
        error: "Failed to load dashboard data",
      },
      {
        status: 500,
      }
    );
  }
}