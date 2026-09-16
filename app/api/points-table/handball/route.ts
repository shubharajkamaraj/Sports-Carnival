import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Standing = {
  teamId: number;
  teamName: string;

  played: number;
  won: number;
  drawn: number;
  lost: number;

  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;

  points: number;
};

export async function GET() {
  try {
    // =====================================================
    // GET ALL COMPLETED HANDBALL MATCHES
    // =====================================================

    const matches = await prisma.match.findMany({
      where: {
        status: "COMPLETED",

        game: {
          sportType: "HANDBALL",
        },
      },

      include: {
        game: true,

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

        handballScore: true,
      },

      orderBy: {
        id: "asc",
      },
    });

    // =====================================================
    // STANDINGS MAP
    // =====================================================

    const standingsMap = new Map<number, Standing>();

    // =====================================================
    // CREATE TEAM ENTRY
    // =====================================================

    function getTeamStanding(
      teamId: number,
      teamName: string
    ): Standing {
      const existing = standingsMap.get(teamId);

      if (existing) {
        return existing;
      }

      const standing: Standing = {
        teamId,
        teamName,

        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,

        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,

        points: 0,
      };

      standingsMap.set(teamId, standing);

      return standing;
    }

    // =====================================================
    // PROCESS MATCHES
    // =====================================================

    for (const match of matches) {
      const team1 = getTeamStanding(
        match.team1.id,
        match.team1.name
      );

      const team2 = getTeamStanding(
        match.team2.id,
        match.team2.name
      );

      // ===================================================
      // SCORE
      // ===================================================

      const team1Score =
        match.handballScore?.team1Score ??
        match.team1Score ??
        0;

      const team2Score =
        match.handballScore?.team2Score ??
        match.team2Score ??
        0;

      // ===================================================
      // PLAYED
      // ===================================================

      team1.played += 1;
      team2.played += 1;

      // ===================================================
      // GOALS FOR / AGAINST
      // ===================================================

      team1.goalsFor += team1Score;
      team1.goalsAgainst += team2Score;

      team2.goalsFor += team2Score;
      team2.goalsAgainst += team1Score;

      // ===================================================
      // RESULT
      // =====================================================

      if (team1Score > team2Score) {
        // Team 1 wins

        team1.won += 1;
        team1.points += 3;

        team2.lost += 1;
      } else if (team2Score > team1Score) {
        // Team 2 wins

        team2.won += 1;
        team2.points += 3;

        team1.lost += 1;
      } else {
        // Draw

        team1.drawn += 1;
        team2.drawn += 1;

        team1.points += 1;
        team2.points += 1;
      }
    }

    // =====================================================
    // CONVERT MAP TO ARRAY
    // =====================================================

    const standings = Array.from(
      standingsMap.values()
    );

    // =====================================================
    // GOAL DIFFERENCE
    // =====================================================

    for (const team of standings) {
      team.goalDifference =
        team.goalsFor -
        team.goalsAgainst;
    }

    // =====================================================
    // SORT
    //
    // 1. Points
    // 2. Goal Difference
    // 3. Goals For
    // 4. Team Name
    // =====================================================

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

    // =====================================================
    // RESPONSE
    // =====================================================

    return NextResponse.json({
      success: true,
      standings,
    });
  } catch (error) {
    console.error(
      "HANDBALL POINTS TABLE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to load handball points table.",

        standings: [],
      },
      {
        status: 500,
      }
    );
  }
}