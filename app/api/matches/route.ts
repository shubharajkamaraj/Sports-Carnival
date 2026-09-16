import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =====================================================
// GET ALL MATCHES
// =====================================================

export async function GET() {
  try {
    const matches = await prisma.match.findMany({
      include: {
        tournament: true,
        game: true,
        team1: true,
        team2: true,
        winnerTeam: true,
      },

      orderBy: {
        id: "asc",
      },
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error("GET MATCHES ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch matches",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// CREATE MATCH
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      tournamentId,
      gameId,
      team1Id,
      team2Id,
      matchNumber,
      stage,
      status,
      overs,
    } = body;

    // -------------------------------------------------
    // BASIC VALIDATION
    // -------------------------------------------------

    if (
      !tournamentId ||
      !gameId ||
      !team1Id ||
      !team2Id ||
      !stage
    ) {
      return NextResponse.json(
        {
          error:
            "Tournament, game, teams and match stage are required.",
        },
        {
          status: 400,
        }
      );
    }

    // -------------------------------------------------
    // VALIDATE STAGE
    // -------------------------------------------------

    const validStages = [
      "LEAGUE",
      "THIRD_PLACE",
      "FINAL",
    ];

    if (!validStages.includes(stage)) {
      return NextResponse.json(
        {
          error:
            "Invalid match stage. Use League, Third Place or Final.",
        },
        {
          status: 400,
        }
      );
    }

    // -------------------------------------------------
    // OVERS VALIDATION
    // -------------------------------------------------

    const oversNumber = Number(overs);

    if (
      !Number.isInteger(oversNumber) ||
      ![2, 3, 4, 5].includes(oversNumber)
    ) {
      return NextResponse.json(
        {
          error:
            "Overs must be 2, 3, 4, or 5.",
        },
        {
          status: 400,
        }
      );
    }

    // -------------------------------------------------
    // CONVERT IDS
    // -------------------------------------------------

    const tournamentIdNumber =
      Number(tournamentId);

    const gameIdNumber =
      Number(gameId);

    const team1IdNumber =
      Number(team1Id);

    const team2IdNumber =
      Number(team2Id);

    // -------------------------------------------------
    // VALIDATE IDS
    // -------------------------------------------------

    if (
      !Number.isInteger(
        tournamentIdNumber
      ) ||
      !Number.isInteger(gameIdNumber) ||
      !Number.isInteger(team1IdNumber) ||
      !Number.isInteger(team2IdNumber)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid tournament, game or team ID.",
        },
        {
          status: 400,
        }
      );
    }

    // -------------------------------------------------
    // SAME TEAM CHECK
    // -------------------------------------------------

    if (
      team1IdNumber === team2IdNumber
    ) {
      return NextResponse.json(
        {
          error:
            "Team 1 and Team 2 cannot be the same.",
        },
        {
          status: 400,
        }
      );
    }

    // -------------------------------------------------
    // CHECK TOURNAMENT
    // -------------------------------------------------

    const tournament =
      await prisma.tournament.findUnique({
        where: {
          id: tournamentIdNumber,
        },
      });

    if (!tournament) {
      return NextResponse.json(
        {
          error:
            "Tournament not found.",
        },
        {
          status: 404,
        }
      );
    }

    // -------------------------------------------------
    // CHECK GAME
    // -------------------------------------------------

    const game =
      await prisma.game.findUnique({
        where: {
          id: gameIdNumber,
        },
      });

    if (!game) {
      return NextResponse.json(
        {
          error: "Game not found.",
        },
        {
          status: 404,
        }
      );
    }

    // -------------------------------------------------
    // CHECK TEAM 1
    // -------------------------------------------------

    const team1 =
      await prisma.team.findUnique({
        where: {
          id: team1IdNumber,
        },
      });

    if (!team1) {
      return NextResponse.json(
        {
          error:
            "Team 1 not found.",
        },
        {
          status: 404,
        }
      );
    }

    // -------------------------------------------------
    // CHECK TEAM 2
    // -------------------------------------------------

    const team2 =
      await prisma.team.findUnique({
        where: {
          id: team2IdNumber,
        },
      });

    if (!team2) {
      return NextResponse.json(
        {
          error:
            "Team 2 not found.",
        },
        {
          status: 404,
        }
      );
    }

    // -------------------------------------------------
    // CREATE MATCH
    // -------------------------------------------------

    const match =
      await prisma.match.create({
        data: {
          tournamentId:
            tournamentIdNumber,

          gameId:
            gameIdNumber,

          team1Id:
            team1IdNumber,

          team2Id:
            team2IdNumber,

          matchNumber:
            matchNumber !== undefined &&
            matchNumber !== null &&
            matchNumber !== ""
              ? Number(matchNumber)
              : null,

          // -------------------------------------------
          // MATCH STAGE
          // -------------------------------------------

          stage: stage,

          // -------------------------------------------
          // STATUS
          // -------------------------------------------

          status:
            status ?? "UPCOMING",

          // -------------------------------------------
          // SCORES
          // -------------------------------------------

          team1Score: 0,

          team2Score: 0,

          // -------------------------------------------
          // OVERS
          // -------------------------------------------

          overs: oversNumber,
        },

        include: {
          tournament: true,
          game: true,
          team1: true,
          team2: true,
          winnerTeam: true,
        },
      });

    return NextResponse.json(
      match,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE MATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create match.",
      },
      {
        status: 500,
      }
    );
  }
}