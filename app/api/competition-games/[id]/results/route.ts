import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type FinalResultInput = {
  position: number;
  teamId: number;
  playerId: number;
};

const FINAL_POINTS: Record<number, number> = {
  1: 50,
  2: 30,
  3: 10,
  4: 0,
};

// =====================================================
// GET FINAL RESULTS
// =====================================================

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    console.log(
      "===================================="
    );

    console.log(
      "GET COMPETITION FINAL RESULTS"
    );

    console.log("RAW ID:", id);

    const gameId = Number(id);

    console.log("PARSED GAME ID:", gameId);

    console.log(
      "===================================="
    );

    if (
      !Number.isInteger(gameId) ||
      gameId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid competition game ID: ${id}`,
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // CHECK GAME
    // -------------------------------------------------

    const game = await prisma.game.findUnique({
      where: {
        id: gameId,
      },
      select: {
        id: true,
        name: true,
        sportType: true,
      },
    });

    console.log("FOUND GAME:", game);

    if (!game) {
      return NextResponse.json(
        {
          success: false,
          message: `Competition game ${gameId} not found.`,
        },
        { status: 404 }
      );
    }

    // -------------------------------------------------
    // GET ONLY FINAL
    //
    // Preliminary rounds are NOT stored in DB.
    //
    // Final = round 1
    // -------------------------------------------------

    const results =
      await prisma.competitionGameResult.findMany({
        where: {
          gameId,
          round: 1,
        },

        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },

          player: {
            select: {
              id: true,
              name: true,
              jerseyNo: true,
            },
          },
        },

        orderBy: {
          position: "asc",
        },
      });

    console.log(
      "FINAL RESULTS:",
      results
    );

    return NextResponse.json({
      success: true,
      game,
      results,
    });
  } catch (error) {
    console.error(
      "GET COMPETITION FINAL RESULTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load Final results.",
      },
      { status: 500 }
    );
  }
}

// =====================================================
// POST FINAL RESULTS
// =====================================================

// =====================================================
// POST FINAL RESULTS
// =====================================================

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const gameId = Number(id);

    console.log("====================================");
    console.log("POST COMPETITION FINAL RESULTS");
    console.log("GAME ID:", gameId);

    // -------------------------------------------------
    // VALIDATE GAME ID
    // -------------------------------------------------

    if (
      !Number.isInteger(gameId) ||
      gameId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid competition game ID: ${id}`,
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // READ BODY
    // -------------------------------------------------

    const body = await request.json();

    console.log(
      "FINAL RESULT BODY:",
      body
    );

    const results: FinalResultInput[] =
      Array.isArray(body?.results)
        ? body.results.map((item: any) => ({
            position: Number(item?.position),
            teamId: Number(item?.teamId),
            playerId: Number(item?.playerId),
          }))
        : [];

    console.log(
      "PARSED FINAL RESULTS:",
      results
    );

    // -------------------------------------------------
    // EXACTLY 4 FINAL PLAYERS
    // -------------------------------------------------

    if (results.length !== 4) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Exactly 4 Final players are required.",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // VALIDATE POSITIONS
    // -------------------------------------------------

    const positions = results.map(
      (result) => result.position
    );

    const expectedPositions = [1, 2, 3, 4];

    const uniquePositions =
      new Set(positions);

    if (uniquePositions.size !== 4) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Each Final position must be unique.",
        },
        { status: 400 }
      );
    }

    for (const position of expectedPositions) {
      if (!uniquePositions.has(position)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Final positions must be exactly 1st, 2nd, 3rd and 4th.",
          },
          { status: 400 }
        );
      }
    }

    // -------------------------------------------------
    // VALIDATE TEAM IDS
    // -------------------------------------------------

    for (const result of results) {
      if (
        !Number.isInteger(result.teamId) ||
        result.teamId <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Every Final player must have a valid team.",
          },
          { status: 400 }
        );
      }
    }

    // -------------------------------------------------
    // VALIDATE PLAYER IDS
    // -------------------------------------------------

    for (const result of results) {
      if (
        !Number.isInteger(result.playerId) ||
        result.playerId <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Every Final result must have a valid player.",
          },
          { status: 400 }
        );
      }
    }

    // -------------------------------------------------
    // SAME PLAYER CHECK
    //
    // Same player cannot appear twice.
    // -------------------------------------------------

    const playerIds = results.map(
      (result) => result.playerId
    );

    if (
      new Set(playerIds).size !== 4
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The same player cannot appear twice in the Final.",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // CHECK GAME
    // -------------------------------------------------

    const game = await prisma.game.findUnique({
      where: {
        id: gameId,
      },

      select: {
        id: true,
        name: true,
        sportType: true,
      },
    });

    if (!game) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Competition game ${gameId} not found.`,
        },
        { status: 404 }
      );
    }

    // -------------------------------------------------
    // GET PARTICIPATING TEAMS
    //
    // If explicit participation records exist,
    // use them.
    //
    // If there are no participation records and
    // the game has exactly 4 teams, use those 4 teams.
    //
    // IMPORTANT:
    // We DO NOT require 4 DIFFERENT finalist teams.
    //
    // Example:
    //
    // Player A -> Team 1
    // Player B -> Team 1
    // Player C -> Team 2
    // Player D -> Team 3
    //
    // This is VALID.
    // -------------------------------------------------

    const participations =
      await prisma.competitionGameParticipation.findMany(
        {
          where: {
            gameId,
          },

          select: {
            teamId: true,
          },
        }
      );

    let participatingTeamIds: Set<number>;

    // -------------------------------------------------
    // CASE 1:
    // Explicit participation records exist
    // -------------------------------------------------

    if (participations.length > 0) {
      participatingTeamIds = new Set(
        participations.map(
          (item) => item.teamId
        )
      );

      // The participation table should contain
      // exactly 4 unique teams.
      if (
        participatingTeamIds.size !== 4
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "The game must have exactly 4 participating teams.",
          },
          { status: 400 }
        );
      }
    }

    // -------------------------------------------------
    // CASE 2:
    // No participation records
    //
    // Use the game's teams if exactly 4 exist.
    // -------------------------------------------------

    else {
      const gameTeams =
        await prisma.team.findMany({
          where: {
            // Get teams that actually have players
            players: {
              some: {},
            },
          },

          select: {
            id: true,
          },

          orderBy: {
            id: "asc",
          },
        });

      if (gameTeams.length !== 4) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Exactly 4 teams must be available for this game before saving the Final.",
          },
          { status: 400 }
        );
      }

      participatingTeamIds = new Set(
        gameTeams.map(
          (team) => team.id
        )
      );
    }

    console.log(
      "PARTICIPATING TEAM IDS:",
      [...participatingTeamIds]
    );

    // -------------------------------------------------
    // VALIDATE FINAL TEAM MEMBERSHIP
    //
    // Team IDs may repeat.
    // -------------------------------------------------

    for (const result of results) {
      if (
        !participatingTeamIds.has(
          result.teamId
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Every Final player must belong to one of the participating teams.",
          },
          { status: 400 }
        );
      }
    }

    /*
     * IMPORTANT:
     *
     * DO NOT check:
     *
     * new Set(results.map(r => r.teamId)).size === 4
     *
     * because multiple players from the same
     * team are allowed in the Final.
     */

    // -------------------------------------------------
    // GET PLAYERS
    // -------------------------------------------------

    const players =
      await prisma.player.findMany({
        where: {
          id: {
            in: playerIds,
          },
        },

        select: {
          id: true,
          name: true,
          teamId: true,
          jerseyNo: true,
        },
      });

    if (players.length !== 4) {
      return NextResponse.json(
        {
          success: false,
          message:
            "One or more selected Final players were not found.",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // PLAYER MUST BELONG TO SELECTED TEAM
    // -------------------------------------------------

    for (const result of results) {
      const player = players.find(
        (item) =>
          item.id === result.playerId
      );

      if (!player) {
        return NextResponse.json(
          {
            success: false,
            message:
              `Player ${result.playerId} was not found.`,
          },
          { status: 400 }
        );
      }

      if (
        player.teamId !== result.teamId
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              `${player.name} does not belong to the selected team.`,
          },
          { status: 400 }
        );
      }
    }

    // -------------------------------------------------
    // CHECK IF FINAL ALREADY EXISTS
    // -------------------------------------------------

    const existingFinal =
      await prisma.competitionGameResult.findFirst(
        {
          where: {
            gameId,
            round: 1,
          },

          select: {
            id: true,
          },
        }
      );

    if (existingFinal) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Final results have already been saved for this game.",
        },
        { status: 409 }
      );
    }

    // -------------------------------------------------
    // SAVE FINAL
    // -------------------------------------------------

    const savedResults =
      await prisma.$transaction(
        async (tx) => {
          await tx.competitionGameResult.createMany(
            {
              data: results.map(
                (result) => ({
                  gameId,

                  teamId:
                    result.teamId,

                  playerId:
                    result.playerId,

                  // Final is stored as round 1
                  round: 1,

                  position:
                    result.position,

                  points:
                    FINAL_POINTS[
                      result.position
                    ],
                })
              ),
            }
          );

          return tx.competitionGameResult.findMany(
            {
              where: {
                gameId,
                round: 1,
              },

              include: {
                team: {
                  select: {
                    id: true,
                    name: true,
                  },
                },

                player: {
                  select: {
                    id: true,
                    name: true,
                    jerseyNo: true,
                  },
                },
              },

              orderBy: {
                position: "asc",
              },
            }
          );
        }
      );

    console.log(
      "FINAL SAVED:",
      savedResults
    );

    return NextResponse.json(
      {
        success: true,

        message:
          "Final results saved successfully.",

        game,

        results: savedResults,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST COMPETITION FINAL RESULTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to save Final results.",
      },
      { status: 500 }
    );
  }
}