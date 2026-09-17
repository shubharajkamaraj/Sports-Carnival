import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    /*
     * ============================================================
     * GET COMPLETED FOOTBALL MATCHES
     * ============================================================
     */

    const matches = await prisma.match.findMany({
      where: {
        status: "COMPLETED",

        game: {
          sportType: "FOOTBALL",
        },
      },

      include: {
        team1: true,
        team2: true,

        footballScore: true,
      },

      orderBy: {
        id: "asc",
      },
    });

    /*
     * ============================================================
     * CREATE TEAM MAP
     * ============================================================
     */

    const teams = new Map<
      number,
      {
        teamId: number;
        teamName: string;

        played: number;
        won: number;
        drawn: number;
        lost: number;

        goalsFor: number;
        goalsAgainst: number;

        points: number;
      }
    >();

    /*
     * Add teams from completed football matches
     */

    for (const match of matches) {
      if (!teams.has(match.team1Id)) {
        teams.set(match.team1Id, {
          teamId: match.team1Id,
          teamName: match.team1.name,

          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,

          goalsFor: 0,
          goalsAgainst: 0,

          points: 0,
        });
      }

      if (!teams.has(match.team2Id)) {
        teams.set(match.team2Id, {
          teamId: match.team2Id,
          teamName: match.team2.name,

          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,

          goalsFor: 0,
          goalsAgainst: 0,

          points: 0,
        });
      }
    }

    /*
     * ============================================================
     * CALCULATE STANDINGS
     * ============================================================
     */

    for (const match of matches) {
      const team1 = teams.get(match.team1Id);
      const team2 = teams.get(match.team2Id);

      if (!team1 || !team2) {
        continue;
      }

      /*
       * FootballMatchScore is the main football score source.
       *
       * Fallback to Match score if FootballMatchScore is missing.
       */

      const team1Score =
        match.footballScore?.team1Score ??
        match.team1Score ??
        0;

      const team2Score =
        match.footballScore?.team2Score ??
        match.team2Score ??
        0;

      /*
       * Played
       */

      team1.played += 1;
      team2.played += 1;

      /*
       * Goals For / Against
       */

      team1.goalsFor += team1Score;
      team1.goalsAgainst += team2Score;

      team2.goalsFor += team2Score;
      team2.goalsAgainst += team1Score;

      /*
       * ==========================================================
       * WIN / DRAW / LOSS
       * ==========================================================
       *
       * 3 points = Win
       * 1 point  = Draw
       * 0 points = Loss
       */

      if (team1Score > team2Score) {
        team1.won += 1;
        team1.points += 3;

        team2.lost += 1;
      } else if (team2Score > team1Score) {
        team2.won += 1;
        team2.points += 3;

        team1.lost += 1;
      } else {
        team1.drawn += 1;
        team2.drawn += 1;

        team1.points += 1;
        team2.points += 1;
      }
    }

    /*
     * ============================================================
     * CONVERT MAP TO ARRAY
     * ============================================================
     */

    const standings = Array.from(
      teams.values()
    ).map((team) => ({
      ...team,

      goalDifference:
        team.goalsFor -
        team.goalsAgainst,
    }));

    /*
     * ============================================================
     * SORT TABLE
     * ============================================================
     *
     * 1. Points
     * 2. Goal Difference
     * 3. Goals For
     * 4. Team name
     */

    standings.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }

      if (
        b.goalDifference !==
        a.goalDifference
      ) {
        return (
          b.goalDifference -
          a.goalDifference
        );
      }

      if (b.goalsFor !== a.goalsFor) {
        return b.goalsFor - a.goalsFor;
      }

      return a.teamName.localeCompare(
        b.teamName
      );
    });

    /*
     * ============================================================
     * RESPONSE
     * ============================================================
     */

    return NextResponse.json({
      success: true,
      standings,
    });
  } catch (error) {
    console.error(
      "Football points table error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        standings: [],
        message:
          error instanceof Error
            ? error.message
            : "Failed to load football points table.",
      },
      {
        status: 500,
      }
    );
  }
}
