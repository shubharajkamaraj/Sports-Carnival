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

  setsWon: number;
  setsLost: number;
  setDifference: number;
};

export async function GET(req: Request) {
  try {
    // =====================================================
    // OPTIONAL TOURNAMENT FILTER
    // =====================================================

    const { searchParams } =
      new URL(req.url);

    const tournamentIdParam =
      searchParams.get(
        "tournamentId"
      );

    const tournamentId =
      tournamentIdParam
        ? Number(tournamentIdParam)
        : null;

    if (
      tournamentIdParam &&
      (!Number.isInteger(
        tournamentId
      ) ||
        tournamentId! <= 0)
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

    // =====================================================
    // LOAD THROWBALL MATCHES
    // =====================================================

    const scores =
      await prisma.throwballMatchScore.findMany(
        {
          where: {
            status: "COMPLETED",

            ...(tournamentId
              ? {
                  match: {
                    tournamentId:
                      tournamentId,
                  },
                }
              : {}),
          },

          include: {
            team1: true,
            team2: true,
            match: true,
          },

          orderBy: {
            updatedAt: "desc",
          },
        }
      );

    // =====================================================
    // TEAM STATS
    // =====================================================

    const teamMap =
      new Map<
        number,
        TeamStats
      >();

    function createTeam(
      teamId: number,
      teamName: string
    ) {
      if (
        !teamMap.has(teamId)
      ) {
        teamMap.set(
          teamId,
          {
            teamId,
            teamName,

            played: 0,
            won: 0,
            lost: 0,
            tied: 0,
            noResult: 0,

            points: 0,

            setsWon: 0,
            setsLost: 0,
            setDifference: 0,
          }
        );
      }

      return teamMap.get(
        teamId
      )!;
    }

    // =====================================================
    // PROCESS EACH MATCH
    // =====================================================

    for (const score of scores) {
      const team1 =
        createTeam(
          score.team1Id,
          score.team1.name
        );

      const team2 =
        createTeam(
          score.team2Id,
          score.team2.name
        );

      // ---------------------------------------------------
      // MATCH PLAYED
      // ---------------------------------------------------

      team1.played += 1;
      team2.played += 1;

      // ---------------------------------------------------
      // SET STATISTICS
      // ---------------------------------------------------

      team1.setsWon +=
        score.team1SetsWon;

      team1.setsLost +=
        score.team2SetsWon;

      team2.setsWon +=
        score.team2SetsWon;

      team2.setsLost +=
        score.team1SetsWon;

      // ---------------------------------------------------
      // WINNER
      // ---------------------------------------------------

      if (
        score.winnerTeamId ===
        score.team1Id
      ) {
        team1.won += 1;

        team2.lost += 1;

        // Throwball win = 2 points
        team1.points += 2;
      }

      // ---------------------------------------------------
      // TEAM 2 WIN
      // ---------------------------------------------------

      else if (
        score.winnerTeamId ===
        score.team2Id
      ) {
        team2.won += 1;

        team1.lost += 1;

        // Throwball win = 2 points
        team2.points += 2;
      }

      // ---------------------------------------------------
      // TIE
      // ---------------------------------------------------

      else if (
        score.team1Score ===
        score.team2Score
      ) {
        team1.tied += 1;
        team2.tied += 1;

        // Tie = 1 point each
        team1.points += 1;
        team2.points += 1;
      }

      // ---------------------------------------------------
      // NO RESULT
      // ---------------------------------------------------

      else {
        /*
         * If the match is completed but
         * there is no winner, treat it
         * as a no-result.
         */

        team1.noResult += 1;
        team2.noResult += 1;

        // No Result = 1 point each
        team1.points += 1;
        team2.points += 1;
      }
    }

    // =====================================================
    // CALCULATE SET DIFFERENCE
    // =====================================================

    for (const team of teamMap.values()) {
      team.setDifference =
        team.setsWon -
        team.setsLost;
    }

    // =====================================================
    // SORT TABLE
    // =====================================================
    //
    // 1. Points
    // 2. Set Difference
    // 3. Sets Won
    //

    const teams =
      Array.from(
        teamMap.values()
      )
        .sort(
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
              b.setDifference !==
              a.setDifference
            ) {
              return (
                b.setDifference -
                a.setDifference
              );
            }

            return (
              b.setsWon -
              a.setsWon
            );
          }
        )
        .map(
          (team, index) => ({
            position:
              index + 1,

            teamId:
              team.teamId,

            teamName:
              team.teamName,

            played:
              team.played,

            won:
              team.won,

            lost:
              team.lost,

            tied:
              team.tied,

            noResult:
              team.noResult,

            points:
              team.points,

            setsWon:
              team.setsWon,

            setsLost:
              team.setsLost,

            setDifference:
              team.setDifference,
          })
        );

    // =====================================================
    // RESPONSE
    // =====================================================

    return NextResponse.json(
      {
        success: true,

        tournamentId:
          tournamentId,

        matchesPlayed:
          scores.length,

        teams,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "THROWBALL POINTS TABLE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to load Throwball points table.",
      },
      {
        status: 500,
      }
    );
  }
}