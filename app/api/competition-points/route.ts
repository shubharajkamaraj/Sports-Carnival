import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =====================================================
// POINT SYSTEM
// =====================================================

const POINTS: Record<number, number> = {
  1: 50,
  2: 30,
  3: 10,
};

// =====================================================
// TYPES
// =====================================================

type GameResult = {
  gameId: number;
  gameName: string;
  category: string | null;

  position: number;
  points: number;

  playerName: string;
};

type TeamStats = {
  teamId: number;
  teamName: string;

  totalPoints: number;

  firstPlace: number;
  secondPlace: number;
  thirdPlace: number;

  gamesPlayed: number;

  games: GameResult[];
};

// =====================================================
// GET COMPETITION POINTS
// =====================================================

export async function GET() {
  try {
    console.log("======================================");
    console.log("GET COMPETITION POINTS");
    console.log("======================================");

    // ===================================================
    // GET ALL TEAMS
    // ===================================================

    const teams = await prisma.team.findMany({
      orderBy: {
        name: "asc",
      },
    });

    // ===================================================
    // GET ALL RESULTS
    // ===================================================

    const results =
      await prisma.competitionGameResult.findMany({
        include: {
          team: true,
          player: true,
          game: true,
        },

        orderBy: [
          {
            gameId: "asc",
          },
          {
            position: "asc",
          },
        ],
      });

    console.log(
      "Competition results found:",
      results.length
    );

    // ===================================================
    // DEBUG DATABASE RESULTS
    // ===================================================

    for (const result of results) {
      const calculatedPoints =
        POINTS[result.position] ?? 0;

      console.log(
        `Game ${result.gameId} | ${result.game.name} | ` +
          `${result.team.name} | Position ${result.position} | ` +
          `DB points=${result.points} | ` +
          `Calculated points=${calculatedPoints}`
      );
    }

    // ===================================================
    // CREATE TEAM MAP
    // ===================================================

    const teamMap = new Map<number, TeamStats>();

    // Add every team so even teams with zero points appear.

    for (const team of teams) {
      teamMap.set(team.id, {
        teamId: team.id,
        teamName: team.name,

        totalPoints: 0,

        firstPlace: 0,
        secondPlace: 0,
        thirdPlace: 0,

        gamesPlayed: 0,

        games: [],
      });
    }

    // ===================================================
    // TRACK UNIQUE GAMES PER TEAM
    // ===================================================

    const teamGames = new Map<number, Set<number>>();

    // ===================================================
    // PROCESS RESULTS
    // ===================================================

    for (const result of results) {
      let stats = teamMap.get(result.teamId);

      // -------------------------------------------------
      // SAFETY FALLBACK
      // -------------------------------------------------

      if (!stats) {
        stats = {
          teamId: result.teamId,
          teamName: result.team.name,

          totalPoints: 0,

          firstPlace: 0,
          secondPlace: 0,
          thirdPlace: 0,

          gamesPlayed: 0,

          games: [],
        };

        teamMap.set(result.teamId, stats);
      }

      // -------------------------------------------------
      // CALCULATE POINTS FROM POSITION
      // -------------------------------------------------

      const calculatedPoints =
        POINTS[result.position] ?? 0;

      // Ignore invalid positions.

      if (calculatedPoints === 0) {
        console.warn(
          `Invalid position ${result.position} ` +
            `for result ${result.id}`
        );

        continue;
      }

      // -------------------------------------------------
      // TOTAL POINTS
      // -------------------------------------------------

      stats.totalPoints += calculatedPoints;

      // -------------------------------------------------
      // POSITION COUNTS
      // -------------------------------------------------

      if (result.position === 1) {
        stats.firstPlace += 1;
      } else if (result.position === 2) {
        stats.secondPlace += 1;
      } else if (result.position === 3) {
        stats.thirdPlace += 1;
      }

      // -------------------------------------------------
      // UNIQUE GAME TRACKING
      // -------------------------------------------------

      if (!teamGames.has(result.teamId)) {
        teamGames.set(
          result.teamId,
          new Set<number>()
        );
      }

      teamGames
        .get(result.teamId)!
        .add(result.gameId);

      // -------------------------------------------------
      // GAME DETAILS
      // -------------------------------------------------

      stats.games.push({
        gameId: result.gameId,

        gameName: result.game.name,

        category:
          result.game.category ?? null,

        position: result.position,

        points: calculatedPoints,

        // playerId is optional in the schema,
        // so safely handle a missing player.
        playerName:
          result.player?.name ?? "Unknown Player",
      });
    }

    // ===================================================
    // SET UNIQUE GAMES PLAYED
    // ===================================================

    for (const [teamId, games] of teamGames) {
      const stats = teamMap.get(teamId);

      if (stats) {
        stats.gamesPlayed = games.size;
      }
    }

    // ===================================================
    // SORT LEADERBOARD
    // ===================================================

    const leaderboard = Array.from(
      teamMap.values()
    ).sort((a, b) => {
      // 1. Highest points
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }

      // 2. More 1st places
      if (b.firstPlace !== a.firstPlace) {
        return b.firstPlace - a.firstPlace;
      }

      // 3. More 2nd places
      if (b.secondPlace !== a.secondPlace) {
        return b.secondPlace - a.secondPlace;
      }

      // 4. More 3rd places
      if (b.thirdPlace !== a.thirdPlace) {
        return b.thirdPlace - a.thirdPlace;
      }

      // 5. Alphabetical
      return a.teamName.localeCompare(b.teamName);
    });

    // ===================================================
    // ADD RANK
    // ===================================================

    const rankedLeaderboard = leaderboard.map(
      (team, index) => ({
        rank: index + 1,
        ...team,
      })
    );

    // ===================================================
    // TOTAL GAMES
    // ===================================================

    const totalGames = new Set(
      results.map((result) => result.gameId)
    ).size;

    // ===================================================
    // COMPLETED RESULTS
    // ===================================================

    const completedResults = results.length;

    // ===================================================
    // TOTAL POINTS
    // =====================================================

    const totalPoints = results.reduce(
      (sum, result) => {
        const points =
          POINTS[result.position] ?? 0;

        return sum + points;
      },
      0
    );

    // ===================================================
    // DEBUG FINAL LEADERBOARD
    // ===================================================

    console.log(
      "\n========== FINAL LEADERBOARD =========="
    );

    for (const team of rankedLeaderboard) {
      console.log(
        `#${team.rank} ${team.teamName} = ${team.totalPoints} points`
      );
    }

    console.log("Total points:", totalPoints);
    console.log("Total games:", totalGames);
    console.log(
      "Completed results:",
      completedResults
    );

    // ===================================================
    // RESPONSE
    // ===================================================

    return NextResponse.json({
      success: true,

      leaderboard: rankedLeaderboard,

      summary: {
        totalTeams: teams.length,

        totalGames,

        completedResults,

        totalPoints,
      },
    });
  } catch (error) {
    console.error(
      "GET COMPETITION POINTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to load competition points.",
      },
      {
        status: 500,
      }
    );
  }
}