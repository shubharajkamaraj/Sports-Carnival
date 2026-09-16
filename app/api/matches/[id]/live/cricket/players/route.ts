import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const matchId = Number(id);

    if (!matchId || Number.isNaN(matchId)) {
      return NextResponse.json(
        {
          error: "Invalid match ID.",
        },
        {
          status: 400,
        }
      );
    }

    const body = await req.json();

    const strikerId = Number(body.strikerId);
    const nonStrikerId = Number(body.nonStrikerId);
    const bowlerId = Number(body.bowlerId);

    if (!strikerId || !nonStrikerId || !bowlerId) {
      return NextResponse.json(
        {
          error:
            "Striker, non-striker and bowler are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (strikerId === nonStrikerId) {
      return NextResponse.json(
        {
          error:
            "Striker and non-striker must be different.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ------------------------------------------------
     * GET MATCH
     * ------------------------------------------------
     */

    const match = await prisma.match.findUnique({
      where: {
        id: matchId,
      },

      include: {
        team1: {
          include: {
            playerList: true,
          },
        },

        team2: {
          include: {
            playerList: true,
          },
        },

        score: true,
      },
    });

    if (!match) {
      return NextResponse.json(
        {
          error: "Match not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * ------------------------------------------------
     * GET CURRENT INNINGS
     * ------------------------------------------------
     */

    /*
     * If MatchScore already exists,
     * use its innings.
     *
     * Otherwise this is the first innings.
     */

    const currentInnings =
      match.score?.innings ?? 1;

    /*
     * ------------------------------------------------
     * DETERMINE BATTING TEAM
     * ------------------------------------------------
     *
     * INNINGS 1
     * Team 1 bats
     * Team 2 bowls
     *
     * INNINGS 2
     * Team 2 bats
     * Team 1 bowls
     */

    const battingTeam =
      currentInnings === 1
        ? match.team1
        : match.team2;

    const bowlingTeam =
      currentInnings === 1
        ? match.team2
        : match.team1;

    /*
     * ------------------------------------------------
     * PLAYER IDs
     * ------------------------------------------------
     */

    const battingPlayerIds =
      battingTeam.playerList.map(
        (player) => player.id
      );

    const bowlingPlayerIds =
      bowlingTeam.playerList.map(
        (player) => player.id
      );

    /*
     * ------------------------------------------------
     * VALIDATE STRIKER
     * ------------------------------------------------
     */

    if (!battingPlayerIds.includes(strikerId)) {
      return NextResponse.json(
        {
          error:
            `Striker must belong to ${battingTeam.name}.`,
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ------------------------------------------------
     * VALIDATE NON-STRIKER
     * ------------------------------------------------
     */

    if (
      !battingPlayerIds.includes(
        nonStrikerId
      )
    ) {
      return NextResponse.json(
        {
          error:
            `Non-striker must belong to ${battingTeam.name}.`,
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ------------------------------------------------
     * VALIDATE BOWLER
     * ------------------------------------------------
     */

    if (!bowlingPlayerIds.includes(bowlerId)) {
      return NextResponse.json(
        {
          error:
            `Bowler must belong to ${bowlingTeam.name}.`,
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ------------------------------------------------
     * MATCH SCORE
     * ------------------------------------------------
     */

    const score = await prisma.matchScore.upsert({
      where: {
        matchId,
      },

      update: {
        strikerId,
        nonStrikerId,
        bowlerId,

        innings: currentInnings,

        status: "LIVE",
      },

      create: {
        matchId,

        team1Score: 0,
        team2Score: 0,

        period: 1,
        clock: "00:00",

        innings: currentInnings,

        overs: 0,
        balls: 0,
        wickets: 0,

        strikerId,
        nonStrikerId,
        bowlerId,

        status: "LIVE",
      },
    });

    /*
     * ------------------------------------------------
     * LOG
     * ------------------------------------------------
     */

    console.log(
      "CRICKET PLAYERS SAVED:",
      {
        matchId,

        innings: currentInnings,

        battingTeam:
          battingTeam.name,

        bowlingTeam:
          bowlingTeam.name,

        strikerId,

        nonStrikerId,

        bowlerId,
      }
    );

    /*
     * ------------------------------------------------
     * RESPONSE
     * ------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      message:
        "Cricket players updated successfully.",

      innings: currentInnings,

      battingTeam: {
        id: battingTeam.id,
        name: battingTeam.name,
      },

      bowlingTeam: {
        id: bowlingTeam.id,
        name: bowlingTeam.name,
      },

      players: {
        strikerId,
        nonStrikerId,
        bowlerId,
      },

      score,
    });
  } catch (error) {
    console.error(
      "CRICKET PLAYERS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update cricket players.",
      },
      {
        status: 500,
      }
    );
  }
}