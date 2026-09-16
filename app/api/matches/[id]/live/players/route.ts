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

    if (!matchId) {
      return NextResponse.json(
        {
          error: "Invalid match ID.",
        },
        { status: 400 }
      );
    }

    const body = await req.json();

    const strikerId = Number(body.strikerId);
    const nonStrikerId = Number(body.nonStrikerId);
    const bowlerId = Number(body.bowlerId);

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

    if (strikerId === nonStrikerId) {
      return NextResponse.json(
        {
          error:
            "Striker and non-striker must be different.",
        },
        { status: 400 }
      );
    }

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
        { status: 404 }
      );
    }

    if (!match.score) {
      return NextResponse.json(
        {
          error:
            "Live score has not been started.",
        },
        { status: 400 }
      );
    }

    /*
     * IMPORTANT
     *
     * Determine batting and bowling team
     * from the current innings.
     */

    const battingTeam =
      match.score.innings === 1
        ? match.team1
        : match.team2;

    const bowlingTeam =
      match.score.innings === 1
        ? match.team2
        : match.team1;

    const battingPlayerIds =
      battingTeam.playerList.map(
        (player) => player.id
      );

    const bowlingPlayerIds =
      bowlingTeam.playerList.map(
        (player) => player.id
      );

    /*
     * Check batsmen
     */

    if (
      !battingPlayerIds.includes(strikerId)
    ) {
      return NextResponse.json(
        {
          error:
            "Striker must belong to the current batting team.",
        },
        { status: 400 }
      );
    }

    if (
      !battingPlayerIds.includes(
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
     * Check bowler
     */

    if (
      !bowlingPlayerIds.includes(bowlerId)
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
     * Prevent an OUT batsman from being selected
     * again.
     */

    const outPlayer =
      await prisma.cricketBattingStat.findFirst({
        where: {
          matchId,
          playerId: {
            in: [
              strikerId,
              nonStrikerId,
            ],
          },
          innings:
            match.score.innings,
          isOut: true,
        },
      });

    if (outPlayer) {
      return NextResponse.json(
        {
          error:
            "An OUT batsman cannot be selected again.",
        },
        { status: 400 }
      );
    }

    /*
     * Save current players
     */

    const score =
      await prisma.matchScore.update({
        where: {
          matchId,
        },

        data: {
          strikerId,
          nonStrikerId,
          bowlerId,
          status: "LIVE",
        },
      });

    /*
     * Make sure batting stat rows exist
     */

    await prisma.cricketBattingStat.upsert({
      where: {
        matchId_playerId_innings: {
          matchId,
          playerId: strikerId,
          innings: match.score.innings,
        },
      },

      update: {},

      create: {
        matchId,
        playerId: strikerId,
        innings: match.score.innings,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
      },
    });

    await prisma.cricketBattingStat.upsert({
      where: {
        matchId_playerId_innings: {
          matchId,
          playerId: nonStrikerId,
          innings: match.score.innings,
        },
      },

      update: {},

      create: {
        matchId,
        playerId: nonStrikerId,
        innings: match.score.innings,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
      },
    });

    /*
     * Make sure bowling stat exists
     */

    await prisma.cricketBowlingStat.upsert({
      where: {
        matchId_playerId_innings: {
          matchId,
          playerId: bowlerId,
          innings: match.score.innings,
        },
      },

      update: {},

      create: {
        matchId,
        playerId: bowlerId,
        innings: match.score.innings,
        overs: 0,
        balls: 0,
        runs: 0,
        wickets: 0,
        wides: 0,
        noBalls: 0,
      },
    });

    return NextResponse.json({
      success: true,
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
          "Failed to update cricket players.",
      },
      { status: 500 }
    );
  }
}