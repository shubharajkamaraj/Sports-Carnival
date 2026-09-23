import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* =========================================================
   TYPES
========================================================= */

type AssignmentInput = {
  position: number;
  teamId: number | null;
  points: number | null;
};

/* =========================================================
   GET
   /api/points-assignment?gameId=1
========================================================= */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const gameIdParam = searchParams.get("gameId");

    /*
     * -------------------------------------------------------
     * LOAD GAMES
     * -------------------------------------------------------
     */

    const games = await prisma.game.findMany({
      orderBy: [
        {
          gameOrder: "asc",
        },
        {
          id: "asc",
        },
      ],
      select: {
        id: true,
        name: true,
        sportType: true,
        category: true,
        tournamentId: true,
      },
    });

    /*
     * -------------------------------------------------------
     * LOAD TEAMS
     * -------------------------------------------------------
     *
     * We intentionally load all teams.
     *
     * A team can be selected more than once on the
     * assignment page.
     */

    const teams = await prisma.team.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        captain: true,
      },
    });

    /*
     * -------------------------------------------------------
     * NO GAME SELECTED
     * -------------------------------------------------------
     */

    if (!gameIdParam) {
      return NextResponse.json({
        success: true,
        games,
        teams,
        assignments: [],
      });
    }

    const gameId = Number(gameIdParam);

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid game ID.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * CHECK GAME
     * -------------------------------------------------------
     */

    const game = await prisma.game.findUnique({
      where: {
        id: gameId,
      },
      select: {
        id: true,
        name: true,
        sportType: true,
        category: true,
        tournamentId: true,
      },
    });

    if (!game) {
      return NextResponse.json(
        {
          success: false,
          error: "Game not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * LOAD ASSIGNMENTS
     * -------------------------------------------------------
     *
     * Multiple rounds are preserved.
     */

    const results =
      await prisma.competitionGameResult.findMany({
        where: {
          gameId,
        },
        orderBy: [
          {
            round: "desc",
          },
          {
            position: "asc",
          },
        ],
        select: {
          id: true,
          gameId: true,
          teamId: true,
          playerId: true,
          round: true,
          position: true,
          points: true,

          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

    /*
     * -------------------------------------------------------
     * GROUP BY ROUND
     * -------------------------------------------------------
     */

    const roundsMap = new Map<
      number,
      {
        round: number;
        assignments: Array<{
          id: number;
          position: number;
          teamId: number;
          teamName: string;
          points: number;
        }>;
      }
    >();

    for (const result of results) {
      if (!roundsMap.has(result.round)) {
        roundsMap.set(result.round, {
          round: result.round,
          assignments: [],
        });
      }

      roundsMap.get(result.round)!.assignments.push({
        id: result.id,
        position: result.position,
        teamId: result.teamId,
        teamName: result.team.name,
        points: result.points,
      });
    }

    const rounds = Array.from(roundsMap.values());

    /*
     * -------------------------------------------------------
     * LATEST ROUND
     * -------------------------------------------------------
     */

    const latestRound =
      rounds.length > 0
        ? rounds[0].round
        : 0;

    return NextResponse.json({
      success: true,
      game,
      games,
      teams,
      latestRound,
      rounds,
      assignments:
        rounds.length > 0
          ? rounds[0].assignments
          : [],
    });
  } catch (error) {
    console.error(
      "POINTS ASSIGNMENT GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load points assignment data.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST
   /api/points-assignment
========================================================= */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const gameId = Number(body.gameId);

    const requestedRound =
      body.round === undefined ||
      body.round === null ||
      body.round === ""
        ? null
        : Number(body.round);

    const assignments =
      body.assignments as AssignmentInput[];

    /*
     * -------------------------------------------------------
     * VALIDATE GAME
     * -------------------------------------------------------
     */

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Please select a valid game.",
        },
        {
          status: 400,
        }
      );
    }

    const game = await prisma.game.findUnique({
      where: {
        id: gameId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!game) {
      return NextResponse.json(
        {
          success: false,
          error: "Selected game does not exist.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * VALIDATE FOUR POSITIONS
     * -------------------------------------------------------
     */

    if (!Array.isArray(assignments)) {
      return NextResponse.json(
        {
          success: false,
          error: "Assignments are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (assignments.length !== 4) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Exactly four positions are required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * NORMALIZE POSITIONS
     * -------------------------------------------------------
     */

    const positions = [1, 2, 3, 4];

    for (const position of positions) {
      const assignment = assignments.find(
        (item) =>
          Number(item.position) === position
      );

      if (!assignment) {
        return NextResponse.json(
          {
            success: false,
            error:
              `Position ${position} is missing.`,
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
     * -------------------------------------------------------
     * DETERMINE ROUND
     * -------------------------------------------------------
     *
     * If admin doesn't provide a round:
     *
     * existing rounds:
     * 1
     * 2
     * 3
     *
     * new round = 4
     */

    const maxRoundResult =
      await prisma.competitionGameResult.aggregate({
        where: {
          gameId,
        },
        _max: {
          round: true,
        },
      });

    const latestRound =
      maxRoundResult._max.round ?? 0;

    let round =
      requestedRound ??
      latestRound + 1;

    /*
     * -------------------------------------------------------
     * ROUND VALIDATION
     * -------------------------------------------------------
     */

    if (!Number.isInteger(round) || round <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Round must be a positive number.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * IMPORTANT
     * -------------------------------------------------------
     *
     * If the requested round already contains results,
     * do NOT overwrite them.
     *
     * We automatically move to the next round.
     */

    const existingRoundCount =
      await prisma.competitionGameResult.count({
        where: {
          gameId,
          round,
        },
      });

    if (existingRoundCount > 0) {
      round = latestRound + 1;
    }

    /*
     * -------------------------------------------------------
     * VALIDATE EACH ASSIGNMENT
     * -------------------------------------------------------
     */

    for (const assignment of assignments) {
      const position = Number(
        assignment.position
      );

    const teamId = assignment.teamId ?? null;

      const points =
        Number(assignment.points);

      /*
       * Position
       */

      if (
        !Number.isInteger(position) ||
        !positions.includes(position)
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid position supplied.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * -----------------------------------------------------
       * ALLOW NOT APPLICABLE
       * -----------------------------------------------------
       *
       * If team is null, points must also be null/0.
       */

      if (teamId === null) {
        continue;
      }

      /*
       * -----------------------------------------------------
       * TEAM EXISTS
       * -----------------------------------------------------
       */

      if (
        !Number.isInteger(teamId) ||
        teamId <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              `Invalid team for position ${position}.`,
          },
          {
            status: 400,
          }
        );
      }

      const team =
        await prisma.team.findUnique({
          where: {
            id: teamId,
          },
          select: {
            id: true,
          },
        });

      if (!team) {
        return NextResponse.json(
          {
            success: false,
            error:
              `Team selected for position ${position} does not exist.`,
          },
          {
            status: 400,
          }
        );
      }

      /*
       * -----------------------------------------------------
       * POINTS VALIDATION
       * -----------------------------------------------------
       */

      if (
        points === null ||
        !Number.isInteger(points) 
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              `Please select valid points for position ${position}.`,
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
     * -------------------------------------------------------
     * SAVE
     * -------------------------------------------------------
     *
     * We use a transaction so all four assignments are
     * created together.
     */

    const created =
      await prisma.$transaction(
        async (tx) => {
          const records = [];

          for (const assignment of assignments) {
            const teamId = assignment.teamId ?? null;

            const points =
              Number(assignment.points);

            /*
             * "Not Applicable" positions are not stored.
             */

            if (teamId === null) {
              continue;
            }

          const result =
  await tx.competitionGameResult.create({
    data: {
      game: {
        connect: {
          id: gameId,
        },
      },
      team: {
        connect: {
          id: teamId,
        },
      },
      round,
      position: Number(assignment.position),
      points,
    },
    select: {
      id: true,
      gameId: true,
      teamId: true,
      round: true,
      position: true,
      points: true,

      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

            records.push(result);
          }

          return records;
        }
      );

    /*
     * -------------------------------------------------------
     * RESPONSE
     * -------------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,
        message:
          `Points assigned successfully for Round ${round}.`,
        game,
        round,
        assignments: created,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POINTS ASSIGNMENT POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to assign points.",
      },
      {
        status: 500,
      }
    );
  }
}
