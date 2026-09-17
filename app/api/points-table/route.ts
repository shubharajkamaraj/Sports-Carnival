import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type TeamStats = {
  teamId: number;

  teamName: string;

  played: number;

  won: number;

  lost: number;

  tied: number;

  noResult: number;

  points: number;
};

export async function GET(
  request: Request
) {
  try {
    const {
      searchParams,
    } = new URL(request.url);

    const tournamentIdParam =
      searchParams.get(
        "tournamentId"
      );

    let tournamentId:
      | number
      | null = null;

    /* =====================================================
       TOURNAMENT
    ===================================================== */

    if (
      tournamentIdParam !==
      null
    ) {
      const parsed =
        Number(
          tournamentIdParam
        );

      if (
        !Number.isInteger(
          parsed
        ) ||
        parsed <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid tournament ID.",
          },
          {
            status: 400,
          }
        );
      }

      tournamentId = parsed;
    }

    /* =====================================================
       LOAD COMPLETED MATCHES
       
       ALL SPORTS
    ===================================================== */

    const matches =
      await prisma.match.findMany({
        where: {
          status: "COMPLETED",

          ...(tournamentId !==
          null
            ? {
                tournamentId,
              }
            : {}),
        },

        select: {
          id: true,

          team1Id: true,

          team2Id: true,

          winnerTeamId: true,

          result: true,

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

        orderBy: {
          id: "asc",
        },
      });

    /* =====================================================
       TEAM MAP
    ===================================================== */

    const teamMap =
      new Map<
        number,
        TeamStats
      >();

    function ensureTeam(
      teamId: number,
      teamName: string
    ) {
      const existing =
        teamMap.get(teamId);

      if (existing) {
        return existing;
      }

      const team: TeamStats = {
        teamId,

        teamName,

        played: 0,

        won: 0,

        lost: 0,

        tied: 0,

        noResult: 0,

        points: 0,
      };

      teamMap.set(
        teamId,
        team
      );

      return team;
    }

    /* =====================================================
       PROCESS MATCHES
    ===================================================== */

    for (
      const match of matches
    ) {
      const team1 =
        ensureTeam(
          match.team1.id,
          match.team1.name
        );

      const team2 =
        ensureTeam(
          match.team2.id,
          match.team2.name
        );

      /* ===================================================
         PLAYED
      =================================================== */

      team1.played += 1;

      team2.played += 1;

      /* ===================================================
         NO RESULT
      =================================================== */

      if (
        match.result ===
        "NO_RESULT"
      ) {
        team1.noResult += 1;

        team2.noResult += 1;

        team1.points += 1;

        team2.points += 1;

        continue;
      }

      /* ===================================================
         TIE
      =================================================== */

      if (
        match.result ===
        "TIE"
      ) {
        team1.tied += 1;

        team2.tied += 1;

        team1.points += 1;

        team2.points += 1;

        continue;
      }

      /* ===================================================
         TEAM 1 WIN
      =================================================== */

      if (
        match.winnerTeamId ===
        match.team1Id
      ) {
        team1.won += 1;

        team2.lost += 1;

        team1.points += 2;

        continue;
      }

      /* ===================================================
         TEAM 2 WIN
      =================================================== */

      if (
        match.winnerTeamId ===
        match.team2Id
      ) {
        team2.won += 1;

        team1.lost += 1;

        team2.points += 2;

        continue;
      }
    }

    /* =====================================================
       SORT
       
       1. POINTS
       2. WINS
       3. TEAM NAME
    ===================================================== */

    const table =
      Array.from(
        teamMap.values()
      ).sort(
        (a, b) => {
          if (
            b.points !==
            a.points
          ) {
            return (
              b.points -
              a.points
            );
          }

          if (
            b.won !==
            a.won
          ) {
            return (
              b.won -
              a.won
            );
          }

          return a.teamName.localeCompare(
            b.teamName
          );
        }
      );

    /* =====================================================
       ADD POSITION
    ===================================================== */

    const rankedTable =
      table.map(
        (team, index) => ({
          position:
            index + 1,

          ...team,
        })
      );

    return NextResponse.json({
      success: true,

      tournamentId,

      matchesPlayed:
        matches.length,

      teams:
        rankedTable,
    });
  } catch (error) {
    console.error(
      "POINTS TABLE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to load points table.",
      },
      {
        status: 500,
      }
    );
  }
}