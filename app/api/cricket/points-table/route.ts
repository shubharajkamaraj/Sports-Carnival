import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* =========================================================
   TYPES
========================================================= */

type TeamStats = {
  teamId: number;
  teamName: string;

  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;

  points: number;

  runsFor: number;
  ballsFaced: number;

  runsAgainst: number;
  ballsBowled: number;

  nrr: number;
};

type InningsData = {
  id: number;

  inningsNumber: number;

  battingTeamId: number;
  bowlingTeamId: number;

  totalRuns: number;
  totalWickets: number;

  legalBalls: number;
};

/* =========================================================
   NRR HELPERS
========================================================= */

/**
 * Cricket NRR:
 *
 * NRR =
 *
 * (Runs scored / Overs faced)
 * -
 * (Runs conceded / Overs bowled)
 *
 * We store balls instead of decimal overs.
 *
 * Therefore:
 *
 * Run Rate =
 * runs * 6 / legal balls
 *
 * ========================================================
 *
 * IMPORTANT:
 *
 * If a team is all out before completing its
 * allotted overs, the full allotted overs are
 * used for NRR calculation.
 */
function getEffectiveBalls(
  innings: InningsData,
  matchOvers: number
): number {
  const maximumBalls =
    Math.max(0, matchOvers) * 6;

  /*
   * If the team is all out before the
   * allotted overs, use the complete quota.
   */
  if (
    innings.totalWickets >= 10 &&
    innings.legalBalls < maximumBalls
  ) {
    return maximumBalls;
  }

  /*
   * Otherwise use actual legal deliveries.
   */
  return innings.legalBalls;
}

/* =========================================================
   CALCULATE NRR
========================================================= */

function calculateNRR(
  runsFor: number,
  ballsFaced: number,
  runsAgainst: number,
  ballsBowled: number
): number {
  if (
    ballsFaced <= 0 ||
    ballsBowled <= 0
  ) {
    return 0;
  }

  /*
   * Runs per over scored.
   */
  const runRateFor =
    (runsFor * 6) / ballsFaced;

  /*
   * Runs per over conceded.
   */
  const runRateAgainst =
    (runsAgainst * 6) / ballsBowled;

  /*
   * Net Run Rate.
   */
  return (
    runRateFor -
    runRateAgainst
  );
}

/* =========================================================
   ROUND NRR
========================================================= */

function roundNRR(
  value: number
): number {
  return Number(
    value.toFixed(3)
  );
}

/* =========================================================
   GET POINTS TABLE
========================================================= */

export async function GET(
  request: Request
) {
  try {
    /* =====================================================
       READ QUERY PARAMETER
    ===================================================== */

    const { searchParams } =
      new URL(request.url);

    const tournamentIdParam =
      searchParams.get(
        "tournamentId"
      );

    let tournamentId:
      number | null = null;

    /* =====================================================
       VALIDATE TOURNAMENT ID
    ===================================================== */

    if (
      tournamentIdParam !== null
    ) {
      const parsed =
        Number(
          tournamentIdParam
        );

      if (
        !Number.isInteger(parsed) ||
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
       LOAD COMPLETED CRICKET MATCHES
    ===================================================== */

    const matches =
      await prisma.match.findMany({
        where: {
          /*
           * Only completed matches count
           * in the points table.
           */
          status: "COMPLETED",

          /*
           * If tournamentId was supplied,
           * restrict matches to that tournament.
           */
          ...(tournamentId !== null
            ? {
                tournamentId,
              }
            : {}),

          /*
           * Only cricket matches.
           *
           * A cricket match has at least
           * one CricketInnings record.
           */
          cricketInnings: {
            some: {},
          },
        },

        include: {
          /* =============================================
             TEAMS
          ============================================= */

          team1: true,

          team2: true,

          /* =============================================
             CRICKET INNINGS
          ============================================= */

          cricketInnings: {
            orderBy: {
              inningsNumber:
                "asc",
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

    /* =====================================================
       ENSURE TEAM
    ===================================================== */

    function ensureTeam(
      teamId: number,
      teamName: string
    ): TeamStats {
      const existing =
        teamMap.get(teamId);

      if (existing) {
        return existing;
      }

      const newTeam: TeamStats = {
        teamId,

        teamName,

        played: 0,

        won: 0,

        lost: 0,

        tied: 0,

        noResult: 0,

        points: 0,

        runsFor: 0,

        ballsFaced: 0,

        runsAgainst: 0,

        ballsBowled: 0,

        nrr: 0,
      };

      teamMap.set(
        teamId,
        newTeam
      );

      return newTeam;
    }

    /* =====================================================
       PROCESS EACH MATCH
    ===================================================== */

    for (const match of matches) {
      /* ===================================================
         GET TEAMS
      =================================================== */

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
         RESULT / POINTS
      =================================================== */

      if (
        match.result ===
        "NO_RESULT"
      ) {
        /*
         * No result:
         *
         * 1 point each
         */

        team1.noResult += 1;

        team2.noResult += 1;

        team1.points += 1;

        team2.points += 1;
      } else if (
        match.result === "TIE"
      ) {
        /*
         * Tie:
         *
         * 1 point each
         */

        team1.tied += 1;

        team2.tied += 1;

        team1.points += 1;

        team2.points += 1;
      } else if (
        match.winnerTeamId ===
        match.team1.id
      ) {
        /*
         * Team 1 won
         */

        team1.won += 1;

        team2.lost += 1;

        team1.points += 2;
      } else if (
        match.winnerTeamId ===
        match.team2.id
      ) {
        /*
         * Team 2 won
         */

        team2.won += 1;

        team1.lost += 1;

        team2.points += 2;
      }

      /* ===================================================
         INNINGS
      =================================================== */

      const innings =
        match.cricketInnings as InningsData[];

      if (
        innings.length === 0
      ) {
        continue;
      }

      /* ===================================================
         PROCESS EACH INNINGS
      =================================================== */

      for (
        const currentInnings of innings
      ) {
        /* ===============================================
           BATTING TEAM
        =============================================== */

        const battingTeam =
          teamMap.get(
            currentInnings.battingTeamId
          );

        /* ===============================================
           BOWLING TEAM
        =============================================== */

        const bowlingTeam =
          teamMap.get(
            currentInnings.bowlingTeamId
          );

        if (
          !battingTeam ||
          !bowlingTeam
        ) {
          continue;
        }

        /* ===============================================
           EFFECTIVE BALLS
        =============================================== */

        const effectiveBalls =
          getEffectiveBalls(
            currentInnings,
            match.overs
          );

        // /* ===============================================
        //    RUNS FOR
        // =============================================== */

        // battingTeam.runsFor +=
        //   currentInnings.totalRuns;

        // battingTeam.ballsFaced +=
        //   effectiveBalls;

        // /* ===============================================
        //    RUNS AGAINST
        // =============================================== */

        // bowlingTeam.runsAgainst +=
        //   currentInnings.totalRuns;

        // bowlingTeam.ballsBowled +=
        //   effectiveBalls;
        /* ===============================================
   TIE-BREAK +1 RUN FOR NRR
================================================ */

let nrrRuns =
  currentInnings.totalRuns;

/*
 * If the match was originally tied and the
 * first-batting team is declared the winner,
 * give that team +1 run ONLY for NRR.
 *
 * Actual innings total remains unchanged.
 */
if (
  match.result === "TEAM1_WIN" ||
  match.result === "TEAM2_WIN"
) {
  const firstInnings =
    innings.find(
      (i) => i.inningsNumber === 1
    );

  const secondInnings =
    innings.find(
      (i) => i.inningsNumber === 2
    );

  if (
    firstInnings &&
    secondInnings &&
    firstInnings.totalRuns ===
      secondInnings.totalRuns &&
    firstInnings.battingTeamId ===
      match.winnerTeamId &&
    currentInnings.battingTeamId ===
      match.winnerTeamId
  ) {
    nrrRuns += 1;
  }
}

/* ===============================================
   RUNS FOR
================================================ */

battingTeam.runsFor +=
  nrrRuns;

battingTeam.ballsFaced +=
  effectiveBalls;

/* ===============================================
   RUNS AGAINST
================================================ */

bowlingTeam.runsAgainst +=
  nrrRuns;

bowlingTeam.ballsBowled +=
  effectiveBalls;
      }
    }

    /* =====================================================
       CALCULATE FINAL NRR
    ===================================================== */

    const table =
      Array.from(
        teamMap.values()
      ).map((team) => {
        const calculatedNRR =
          calculateNRR(
            team.runsFor,
            team.ballsFaced,
            team.runsAgainst,
            team.ballsBowled
          );

        const finalNRR =
          roundNRR(
            calculatedNRR
          );

        /*
         * Save calculated NRR.
         */

        team.nrr =
          finalNRR;

        return {
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

          /*
           * NRR shown to UI.
           */
          nrr:
            finalNRR,

          /*
           * Debug information.
           *
           * You can remove these later
           * if you don't want them returned.
           */
          runsFor:
            team.runsFor,

          ballsFaced:
            team.ballsFaced,

          runsAgainst:
            team.runsAgainst,

          ballsBowled:
            team.ballsBowled,

          oversFaced:
            Number(
              (
                team.ballsFaced / 6
              ).toFixed(2)
            ),

          oversBowled:
            Number(
              (
                team.ballsBowled / 6
              ).toFixed(2)
            ),
        };
      });

    /* =====================================================
       SORT POINTS TABLE
    ===================================================== */

    table.sort(
      (a, b) => {
        /*
         * 1. POINTS
         */

        if (
          b.points !==
          a.points
        ) {
          return (
            b.points -
            a.points
          );
        }

        /*
         * 2. NRR
         */

        if (
          b.nrr !==
          a.nrr
        ) {
          return (
            b.nrr -
            a.nrr
          );
        }

        /*
         * 3. WINS
         */

        if (
          b.won !==
          a.won
        ) {
          return (
            b.won -
            a.won
          );
        }

        /*
         * 4. TEAM NAME
         */

        return a.teamName.localeCompare(
          b.teamName
        );
      }
    );

    /* =====================================================
       ADD RANK
    ===================================================== */

    const rankedTable =
      table.map(
        (team, index) => ({
          position:
            index + 1,

          ...team,
        })
      );

    /* =====================================================
       DEBUG TERMINAL
    ===================================================== */

    console.log(
      "================================================="
    );

    console.log(
      "CRICKET POINTS TABLE"
    );

    console.log(
      "Tournament:",
      tournamentId
    );

    console.log(
      "Completed cricket matches:",
      matches.length
    );

    console.log(
      "================================================="
    );

    for (
      const team of rankedTable
    ) {
      console.log({
        rank:
          team.position,

        team:
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

        runsFor:
          team.runsFor,

        ballsFaced:
          team.ballsFaced,

        oversFaced:
          team.oversFaced,

        runsAgainst:
          team.runsAgainst,

        ballsBowled:
          team.ballsBowled,

        oversBowled:
          team.oversBowled,

        nrr:
          team.nrr,
      });
    }

    console.log(
      "================================================="
    );

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        tournamentId,

        matchesPlayed:
          matches.length,

        teams:
          rankedTable,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    /* =====================================================
       ERROR
    ===================================================== */

    console.error(
      "CRICKET POINTS TABLE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to load cricket points table.",
      },
      {
        status: 500,
      }
    );
  }
}