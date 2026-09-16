import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// =====================================================
// GET PARTICIPATION
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

    // ---------------------------------------------------
    // GAME
    // ---------------------------------------------------

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

    // ---------------------------------------------------
    // ALL TEAMS + PLAYERS
    // ---------------------------------------------------

    const teams = await prisma.team.findMany({
      orderBy: {
        name: "asc",
      },

      include: {
        players: true,
      },
    });

    // ---------------------------------------------------
    // PARTICIPATING TEAMS
    // ---------------------------------------------------

    const participations =
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

    // ---------------------------------------------------
    // DEBUG
    // ---------------------------------------------------

    console.log(
      "===================================="
    );

    console.log(
      "COMPETITION GAME ID:",
      gameId
    );

    console.log(
      "ALL TEAMS:",
      JSON.stringify(teams, null, 2)
    );

    console.log(
      "PARTICIPATIONS:",
      JSON.stringify(
        participations,
        null,
        2
      )
    );

    console.log(
      "===================================="
    );

    // ---------------------------------------------------
    // RESPONSE
    // ---------------------------------------------------

    return NextResponse.json({
      success: true,

      game,

      teams,

      participatingTeams:
        participations.map(
          (item) => item.team
        ),
    });
  } catch (error) {
    console.error(
      "GET COMPETITION PARTICIPATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to load participating teams.",
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

    const body = await request.json();

    const teamIds = Array.isArray(body.teamIds)
      ? body.teamIds
          .map(Number)
          .filter(
            (id: number) =>
              Number.isInteger(id) && id > 0
          )
      : [];

    // ---------------------------------------------------
    // EXACTLY 4 TEAMS
    // ---------------------------------------------------

    if (teamIds.length !== 4) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Exactly 4 participating teams are required.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------
    // DUPLICATE CHECK
    // ---------------------------------------------------

    if (new Set(teamIds).size !== 4) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The same team cannot be selected more than once.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------
    // GAME
    // ---------------------------------------------------

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

    // ---------------------------------------------------
    // TEAMS
    // ---------------------------------------------------

    const teams = await prisma.team.findMany({
      where: {
        id: {
          in: teamIds,
        },
      },

      include: {
        players: true,
      },
    });

    if (teams.length !== 4) {
      return NextResponse.json(
        {
          success: false,
          error:
            "One or more selected teams do not exist.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------
    // SAVE
    // ---------------------------------------------------

    await prisma.$transaction(
      async (tx) => {
        await tx.competitionGameParticipation.deleteMany(
          {
            where: {
              gameId,
            },
          }
        );

        await tx.competitionGameParticipation.createMany(
          {
            data: teamIds.map(
              (teamId: number) => ({
                gameId,
                teamId,
              })
            ),
          }
        );

        // Team changes invalidate previous results
        await tx.competitionGameResult.deleteMany(
          {
            where: {
              gameId,
            },
          }
        );
      }
    );

    // ---------------------------------------------------
    // RETURN TEAMS WITH PLAYERS
    // ---------------------------------------------------

    const participatingTeams =
      await prisma.competitionGameParticipation.findMany(
        {
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
        }
      );

    return NextResponse.json({
      success: true,

      participatingTeams:
        participatingTeams.map(
          (item) => item.team
        ),
    });
  } catch (error) {
    console.error(
      "SAVE COMPETITION PARTICIPATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to save participating teams.",
      },
      { status: 500 }
    );
  }
}