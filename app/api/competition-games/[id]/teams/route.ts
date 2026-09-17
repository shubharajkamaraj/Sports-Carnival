import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type TeamRequest = {
  teamIds: number[];
};

// =====================================================
// GET PARTICIPATING TEAMS
// =====================================================
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const gameId = Number(id);

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid game ID.",
        },
        { status: 400 }
      );
    }

    // Check if game exists
    const game = await prisma.game.findUnique({
      where: {
        id: gameId,
      },
    });

    if (!game) {
      return NextResponse.json(
        {
          success: false,
          error: "Game not found.",
        },
        { status: 404 }
      );
    }

    // Get participating teams
    const teams =
      await prisma.competitionGameParticipation.findMany({
        where: {
          gameId,
        },
        include: {
          team: {
            include: {
              players: true,
            },
          },
        },
        orderBy: {
          id: "asc",
        },
      });

    return NextResponse.json({
      success: true,
      teams,
    });
  } catch (error) {
    console.error("GET PARTICIPATING TEAMS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load participating teams.",
      },
      { status: 500 }
    );
  }
}

// =====================================================
// SAVE PARTICIPATING TEAMS
// =====================================================
export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const gameId = Number(id);

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid game ID.",
        },
        { status: 400 }
      );
    }

    const body = (await request.json()) as TeamRequest;

    // Validate teamIds
    if (!Array.isArray(body.teamIds)) {
      return NextResponse.json(
        {
          success: false,
          error: "teamIds must be an array.",
        },
        { status: 400 }
      );
    }

    // Exactly 4 teams are required
    if (body.teamIds.length !== 4) {
      return NextResponse.json(
        {
          success: false,
          error: "Exactly 4 teams are required.",
        },
        { status: 400 }
      );
    }

    const teamIds = body.teamIds.map(Number);

    // Validate IDs
    if (
      teamIds.some(
        (teamId) =>
          !Number.isInteger(teamId) ||
          teamId <= 0
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid team ID.",
        },
        { status: 400 }
      );
    }

    // Prevent duplicate teams
    const uniqueTeamIds = new Set(teamIds);

    if (uniqueTeamIds.size !== 4) {
      return NextResponse.json(
        {
          success: false,
          error: "The same team cannot be selected twice.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // CHECK GAME
    // =====================================================

    const game = await prisma.game.findUnique({
      where: {
        id: gameId,
      },
    });

    if (!game) {
      return NextResponse.json(
        {
          success: false,
          error: "Game not found.",
        },
        { status: 404 }
      );
    }

    // =====================================================
    // CHECK TEAMS
    // =====================================================

    const teams = await prisma.team.findMany({
      where: {
        id: {
          in: teamIds,
        },
      },
    });

    if (teams.length !== 4) {
      return NextResponse.json(
        {
          success: false,
          error: "One or more teams were not found.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // DELETE OLD + SAVE NEW TEAMS
    // =====================================================

    await prisma.$transaction(async (tx) => {
      // Remove existing participating teams
      await tx.competitionGameParticipation.deleteMany({
        where: {
          gameId,
        },
      });

      // Add selected teams
      await tx.competitionGameParticipation.createMany({
        data: teamIds.map((teamId) => ({
          gameId,
          teamId,
        })),
      });
    });

    // =====================================================
    // GET SAVED TEAMS
    // =====================================================

    const saved =
      await prisma.competitionGameParticipation.findMany({
        where: {
          gameId,
        },
        include: {
          team: {
            include: {
              players: true,
            },
          },
        },
        orderBy: {
          id: "asc",
        },
      });

    return NextResponse.json({
      success: true,
      teams: saved,
    });
  } catch (error) {
    console.error(
      "SAVE PARTICIPATING TEAMS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to save participating teams.",
      },
      { status: 500 }
    );
  }
}