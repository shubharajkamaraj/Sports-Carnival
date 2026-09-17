import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ResultInput = {
  position: number;
  teamId: number;
  playerId: number;
};

const POINTS: Record<number, number> = {
  1: 50,
  2: 30,
  3: 10,
};

// =====================================================
// GET RESULTS
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
    // CHECK GAME
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
    // GET ALL RESULTS
    // ---------------------------------------------------
    //
    // IMPORTANT:
    //
    // We DO NOT only return one result set.
    //
    // The same game can have:
    //
    // Round 1
    // Round 2
    // Round 3
    //
    // Every round earns its own points.
    // ---------------------------------------------------

    const results =
      await prisma.competitionGameResult.findMany({
        where: {
          gameId,
        },

        include: {
          team: true,
          player: true,
        },

        orderBy: [
          {
            round: "asc",
          },
          {
            position: "asc",
          },
        ],
      });

    // ---------------------------------------------------
    // GROUP RESULTS BY ROUND
    // ---------------------------------------------------

    const roundsMap = new Map<
      number,
      typeof results
    >();

    for (const result of results) {
      const existing =
        roundsMap.get(result.round);

      if (existing) {
        existing.push(result);
      } else {
        roundsMap.set(result.round, [
          result,
        ]);
      }
    }

    const rounds = Array.from(
      roundsMap.entries()
    ).map(
      ([round, roundResults]) => ({
        round,
        results: roundResults,
        totalPoints: roundResults.reduce(
          (sum, result) =>
            sum + result.points,
          0
        ),
      })
    );

    return NextResponse.json({
      success: true,

      game,

      results,

      rounds,
    });
  } catch (error) {
    console.error(
      "GET COMPETITION RESULTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to load results.",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// SAVE RESULTS
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

    // =================================================
    // READ REQUEST
    // =================================================

    const body = await request.json();

    const results: ResultInput[] =
      Array.isArray(body.results)
        ? body.results.map(
            (item: unknown) => {
              const result =
                item as Record<
                  string,
                  unknown
                >;

              return {
                position: Number(
                  result.position
                ),

                teamId: Number(
                  result.teamId
                ),

                playerId: Number(
                  result.playerId
                ),
              };
            }
          )
        : [];

    console.log(
      "RECEIVED COMPETITION RESULTS:",
      results
    );

    // =================================================
    // EXACTLY 3 RESULTS
    // =================================================

    if (results.length !== 3) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Exactly 3 results are required.",
        },
        { status: 400 }
      );
    }

    // =================================================
    // VALIDATE BASIC VALUES
    // =================================================

    for (const result of results) {
      if (
        !Number.isInteger(
          result.position
        ) ||
        result.position < 1 ||
        result.position > 3
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Each result must have a valid position: 1, 2 or 3.",
          },
          { status: 400 }
        );
      }

      if (
        !Number.isInteger(
          result.teamId
        ) ||
        result.teamId <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid team.",
          },
          { status: 400 }
        );
      }

      if (
        !Number.isInteger(
          result.playerId
        ) ||
        result.playerId <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid player.",
          },
          { status: 400 }
        );
      }
    }

    // =================================================
    // VALIDATE POSITIONS
    // =================================================

    const positions = results.map(
      (result) => result.position
    );

    const uniquePositions =
      new Set(positions);

    if (
      uniquePositions.size !== 3 ||
      !uniquePositions.has(1) ||
      !uniquePositions.has(2) ||
      !uniquePositions.has(3)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Results must contain 1st, 2nd and 3rd place.",
        },
        { status: 400 }
      );
    }

    // =================================================
    // GET GAME
    // =================================================

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

    // =================================================
    // GET PARTICIPATING TEAMS
    // =================================================

    const participations =
      await prisma.competitionGameParticipation.findMany(
        {
          where: {
            gameId,
          },
        }
      );

    if (participations.length !== 4) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please select 4 participating teams first.",
        },
        { status: 400 }
      );
    }

    const participatingTeamIds =
      new Set(
        participations.map(
          (item) => item.teamId
        )
      );

    // =================================================
    // VALIDATE RESULT TEAMS
    // =================================================

    const teamIds = results.map(
      (result) => result.teamId
    );

    // Same team cannot occupy multiple
    // positions in the same round.

    if (new Set(teamIds).size !== 3) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The same team cannot occupy multiple places.",
        },
        { status: 400 }
      );
    }

    for (const teamId of teamIds) {
      if (
        !participatingTeamIds.has(
          teamId
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Result team must be one of the 4 participating teams.",
          },
          { status: 400 }
        );
      }
    }

    // =================================================
    // VALIDATE PLAYERS
    // =================================================

    const playerIds = results.map(
      (result) => result.playerId
    );

    // Same player cannot occupy multiple
    // positions in the same round.

    if (
      new Set(playerIds).size !== 3
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The same player cannot occupy multiple positions.",
        },
        { status: 400 }
      );
    }

    for (const result of results) {
      const player =
        await prisma.player.findUnique({
          where: {
            id: result.playerId,
          },
        });

      if (!player) {
        return NextResponse.json(
          {
            success: false,
            error:
              `Player with ID ${result.playerId} does not exist.`,
          },
          { status: 400 }
        );
      }

      // -------------------------------------------------
      // PLAYER MUST BELONG TO TEAM
      // -------------------------------------------------

      if (
        player.teamId !==
        result.teamId
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              `${player.name} does not belong to the selected team.`,
          },
          { status: 400 }
        );
      }
    }

    // =================================================
    // FIND NEXT ROUND
    // =================================================
    //
    // IMPORTANT:
    //
    // DO NOT DELETE PREVIOUS RESULTS.
    //
    // Example:
    //
    // Game 5
    //
    // Round 1:
    // Alpha 1st = 50
    // Beta  2nd = 30
    // Gamma 3rd = 10
    //
    // Round 2:
    // Beta  1st = 50
    // Alpha 2nd = 30
    // GC    3rd = 10
    //
    // Both rounds remain in DB.
    // =================================================

    const lastResult =
      await prisma.competitionGameResult.findFirst(
        {
          where: {
            gameId,
          },

          orderBy: {
            round: "desc",
          },

          select: {
            round: true,
          },
        }
      );

    const nextRound = lastResult
      ? lastResult.round + 1
      : 1;

    console.log(
      `Saving competition game ${gameId}, round ${nextRound}`
    );

    // =================================================
    // SAVE NEW ROUND
    // =================================================

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

                round: nextRound,

                position:
                  result.position,

                points:
                  POINTS[
                    result.position
                  ],
              })
            ),
          }
        );
      }
    );

    // =================================================
    // GET SAVED ROUND
    // =================================================

    const savedResults =
      await prisma.competitionGameResult.findMany(
        {
          where: {
            gameId,
            round: nextRound,
          },

          include: {
            team: true,
            player: true,
          },

          orderBy: {
            position: "asc",
          },
        }
      );

    // =================================================
    // GET ALL GAME RESULTS
    // =================================================

    const allResults =
      await prisma.competitionGameResult.findMany(
        {
          where: {
            gameId,
          },

          include: {
            team: true,
            player: true,
          },

          orderBy: [
            {
              round: "asc",
            },
            {
              position: "asc",
            },
          ],
        }
      );

    // =================================================
    // RETURN
    // =================================================

    return NextResponse.json({
      success: true,

      message: `Round ${nextRound} saved successfully.`,

      game,

      round: nextRound,

      results: savedResults,

      allResults,
    });
  } catch (error) {
    console.error(
      "SAVE COMPETITION RESULTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to save competition results.",
      },
      {
        status: 500,
      }
    );
  }
}