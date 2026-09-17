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

    if (
      !Number.isInteger(matchId) ||
      matchId <= 0
    ) {
      return NextResponse.json(
        {
          error: "Invalid match ID.",
        },
        { status: 400 }
      );
    }

    const body = await req.json();

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
            "Striker, non-striker and bowler are required.",
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
            "Striker and non-striker must be different.",
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
          error: "Match not found.",
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
            "This is not a cricket match.",
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
      match.cricketInnings[0] ??
      null;

    const innings =
      currentInnings?.inningsNumber ??
      1;

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

    if (
      !battingTeam.players.some(
        (player) =>
          player.id === strikerId
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Striker must belong to the current batting team.",
        },
        { status: 400 }
      );
    }

    /*
     * =========================================================
     * VALIDATE NON-STRIKER
     * =========================================================
     */

    if (
      !battingTeam.players.some(
        (player) =>
          player.id ===
          nonStrikerId
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Non-striker must belong to the current batting team.",
        },
        { status: 400 }
      );
    }

    /*
     * =========================================================
     * VALIDATE BOWLER
     * =========================================================
     */

    if (
      !bowlingTeam.players.some(
        (player) =>
          player.id === bowlerId
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Bowler must belong to the current bowling team.",
        },
        { status: 400 }
      );
    }

    /*
     * =========================================================
     * FIND DISMISSED PLAYERS
     *
     * This fixes the previous problem where an OUT batsman
     * could appear again in striker/non-striker selection.
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
     * GET ALL DISMISSED PLAYERS
     * =========================================================
     */

    let dismissedPlayerIds: number[] =
      [];

    if (currentInnings) {
      const dismissed =
        await prisma.cricketBallEvent.findMany(
          {
            where: {
              inningsId:
                currentInnings.id,

              isWicket: true,

              dismissedPlayerId: {
                not: null,
              },
            },

            select: {
              dismissedPlayerId: true,
            },
          }
        );

      dismissedPlayerIds =
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
          );
    }

    /*
     * =========================================================
     * CURRENT SCHEMA DOES NOT HAVE A SEPARATE LIVE SCORE
     * MODEL.
     *
     * Return the selected players to the UI.
     * The scoring API must send these IDs when recording
     * each ball.
     * =========================================================
     */

    return NextResponse.json({
      success: true,

      matchId,

      innings,

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

      dismissedPlayerIds:
        Array.from(
          new Set(
            dismissedPlayerIds
          )
        ),
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
      { status: 500 }
    );
  }
}