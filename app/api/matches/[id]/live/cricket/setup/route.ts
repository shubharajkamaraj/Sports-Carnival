import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;

    const matchId = Number(id);

    if (
      !Number.isInteger(matchId) ||
      matchId <= 0
    ) {
      return NextResponse.json(
        {
          error: "Invalid match ID",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const strikerId = Number(
      body.strikerId
    );

    const nonStrikerId = Number(
      body.nonStrikerId
    );

    const bowlerId = Number(
      body.bowlerId
    );

    if (
      !strikerId ||
      !nonStrikerId ||
      !bowlerId
    ) {
      return NextResponse.json(
        {
          error:
            "Striker, non-striker and bowler are required",
        },
        { status: 400 }
      );
    }

    if (
      strikerId === nonStrikerId
    ) {
      return NextResponse.json(
        {
          error:
            "Striker and non-striker must be different",
        },
        { status: 400 }
      );
    }

    /*
     * =========================================================
     * GET MATCH
     * =========================================================
     */

    const match =
      await prisma.match.findUnique({
        where: {
          id: matchId,
        },

        include: {
          game: true,

          team1: {
            include: {
              players: true,
            },
          },

          team2: {
            include: {
              players: true,
            },
          },

          cricketInnings: {
            orderBy: {
              inningsNumber: "desc",
            },

            take: 1,
          },
        },
      });

    if (!match) {
      return NextResponse.json(
        {
          error: "Match not found",
        },
        { status: 404 }
      );
    }

    if (
      match.game.sportType !==
      "CRICKET"
    ) {
      return NextResponse.json(
        {
          error:
            "This is not a cricket match",
        },
        { status: 400 }
      );
    }

    /*
     * =========================================================
     * CURRENT INNINGS
     * =========================================================
     */

    const currentInnings =
      match.cricketInnings[0] ?? null;

    const inningsNumber =
      currentInnings?.inningsNumber ?? 1;

    const battingTeamId =
      currentInnings?.battingTeamId ??
      match.team1Id;

    const bowlingTeamId =
      currentInnings?.bowlingTeamId ??
      match.team2Id;

    const battingTeam =
      battingTeamId === match.team1Id
        ? match.team1
        : match.team2;

    const bowlingTeam =
      bowlingTeamId === match.team1Id
        ? match.team1
        : match.team2;

    /*
     * =========================================================
     * VALIDATE STRIKER
     * =========================================================
     */

    const strikerBelongs =
      battingTeam.players.some(
        (player) =>
          player.id === strikerId
      );

    if (!strikerBelongs) {
      return NextResponse.json(
        {
          error:
            "Striker must belong to the current batting team",
        },
        { status: 400 }
      );
    }

    /*
     * =========================================================
     * VALIDATE NON-STRIKER
     * =========================================================
     */

    const nonStrikerBelongs =
      battingTeam.players.some(
        (player) =>
          player.id ===
          nonStrikerId
      );

    if (!nonStrikerBelongs) {
      return NextResponse.json(
        {
          error:
            "Non-striker must belong to the current batting team",
        },
        { status: 400 }
      );
    }

    /*
     * =========================================================
     * VALIDATE BOWLER
     * =========================================================
     */

    const bowlerBelongs =
      bowlingTeam.players.some(
        (player) =>
          player.id === bowlerId
      );

    if (!bowlerBelongs) {
      return NextResponse.json(
        {
          error:
            "Bowler must belong to the current bowling team",
        },
        { status: 400 }
      );
    }

    /*
     * =========================================================
     * CHECK DISMISSED PLAYERS
     * =========================================================
     */

    if (currentInnings) {
      const dismissed =
        await prisma.cricketBallEvent.findMany(
          {
            where: {
              inningsId:
                currentInnings.id,

              isWicket: true,

              dismissedPlayerId: {
                in: [
                  strikerId,
                  nonStrikerId,
                ],
              },
            },

            select: {
              dismissedPlayerId: true,
            },
          }
        );

      const dismissedIds =
        new Set(
          dismissed
            .map(
              (item) =>
                item.dismissedPlayerId
            )
            .filter(
              (
                value
              ): value is number =>
                value !== null
            )
        );

      if (
        dismissedIds.has(
          strikerId
        ) ||
        dismissedIds.has(
          nonStrikerId
        )
      ) {
        return NextResponse.json(
          {
            error:
              "An OUT batsman cannot be selected again.",
          },
          { status: 400 }
        );
      }
    }

    /*
     * =========================================================
     * RESPONSE
     *
     * Current schema does not have a place to permanently
     * store striker/non-striker/bowler state.
     *
     * So this endpoint validates and returns the setup.
     * Actual ball events will contain the player IDs.
     * =========================================================
     */

    return NextResponse.json({
      success: true,

      matchId,

      innings: inningsNumber,

      battingTeamId,

      bowlingTeamId,

      strikerId,

      nonStrikerId,

      bowlerId,

      striker:
        battingTeam.players.find(
          (player) =>
            player.id === strikerId
        ) ?? null,

      nonStriker:
        battingTeam.players.find(
          (player) =>
            player.id ===
            nonStrikerId
        ) ?? null,

      bowler:
        bowlingTeam.players.find(
          (player) =>
            player.id === bowlerId
        ) ?? null,
    });
  } catch (error) {
    console.error(
      "CRICKET SETUP ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to setup cricket players",
      },
      {
        status: 500,
      }
    );
  }
}