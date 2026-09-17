import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =====================================================
// TYPES
// =====================================================

interface Params {
  params: Promise<{
    id: string;
  }>;
}

type FootballEventType =
  | "GOAL"
  | "OWN_GOAL"
  | "PENALTY"
  | "YELLOW_CARD"
  | "RED_CARD";

interface FootballPlayer {
  id: number;
  name: string;
  jerseyNo: number | null;
  role: string | null;
  photo: string | null;
}

interface FootballTeam {
  id: number;
  name: string;
}

interface FootballEvent {
  id: number;
  matchId: number;
  playerId: number | null;
  teamId: number;
  eventType: FootballEventType;
  minute: number | null;
  description: string | null;
  createdAt: Date;
  player: FootballPlayer | null;
  team: FootballTeam;
}

// =====================================================
// GET FOOTBALL MATCH SUMMARY
// =====================================================

export async function GET(
  _request: Request,
  { params }: Params
) {
  try {
    // =====================================================
    // MATCH ID
    // =====================================================

    const { id } = await params;

    const matchId = Number(id);

    if (!Number.isInteger(matchId) || matchId <= 0) {
      return NextResponse.json(
        {
          error: "Invalid match ID.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // GET MATCH
    // =====================================================

    const match = await prisma.match.findUnique({
      where: {
        id: matchId,
      },

      include: {
        tournament: true,

        game: true,

        team1: true,

        team2: true,

        footballScore: true,

        footballEvents: {
          orderBy: [
            {
              minute: "asc",
            },
            {
              createdAt: "asc",
            },
          ],

          include: {
            player: true,
            team: true,
          },
        },
      },
    });

    // =====================================================
    // MATCH NOT FOUND
    // =====================================================

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

    // =====================================================
    // CHECK FOOTBALL
    // =====================================================

    if (
      match.game.sportType
        ?.trim()
        .toUpperCase() !== "FOOTBALL"
    ) {
      return NextResponse.json(
        {
          error: "This is not a football match.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // TYPED FOOTBALL EVENTS
    // =====================================================
    //
    // This is important.
    //
    // It makes TypeScript understand that every
    // .map() / .filter() event is a FootballEvent.
    //
    // =====================================================

    const footballEvents =
      match.footballEvents as unknown as FootballEvent[];

    // =====================================================
    // SCORE
    // =====================================================

    const team1Score =
      match.footballScore?.team1Score ??
      match.team1Score ??
      0;

    const team2Score =
      match.footballScore?.team2Score ??
      match.team2Score ??
      0;

    // =====================================================
    // WINNER
    // =====================================================

    let winner: {
      id: number;
      name: string;
    } | null = null;

    let result:
      | "TEAM1_WIN"
      | "TEAM2_WIN"
      | "DRAW" = "DRAW";

    if (team1Score > team2Score) {
      winner = {
        id: match.team1.id,
        name: match.team1.name,
      };

      result = "TEAM1_WIN";
    } else if (team2Score > team1Score) {
      winner = {
        id: match.team2.id,
        name: match.team2.name,
      };

      result = "TEAM2_WIN";
    }

    // =====================================================
    // ALL EVENTS
    // =====================================================

    const events = footballEvents.map(
      (event: FootballEvent) => ({
        id: event.id,

        matchId: event.matchId,

        playerId: event.playerId,

        teamId: event.teamId,

        eventType: event.eventType,

        minute: event.minute,

        description: event.description,

        createdAt: event.createdAt,

        player: event.player,

        team: event.team,
      })
    );

    // =====================================================
    // GOAL EVENTS
    // =====================================================

    const goalEvents =
      footballEvents.filter(
        (event: FootballEvent) =>
          event.eventType === "GOAL" ||
          event.eventType === "PENALTY" ||
          event.eventType === "OWN_GOAL"
      );

    // =====================================================
    // NORMAL GOALS
    // =====================================================

    const normalGoals =
      footballEvents.filter(
        (event: FootballEvent) =>
          event.eventType === "GOAL"
      );

    // =====================================================
    // PENALTY GOALS
    // =====================================================

    const penaltyGoals =
      footballEvents.filter(
        (event: FootballEvent) =>
          event.eventType === "PENALTY"
      );

    // =====================================================
    // OWN GOALS
    // =====================================================

    const ownGoals =
      footballEvents.filter(
        (event: FootballEvent) =>
          event.eventType === "OWN_GOAL"
      );

    // =====================================================
    // YELLOW CARDS
    // =====================================================

    const yellowCards =
      footballEvents.filter(
        (event: FootballEvent) =>
          event.eventType === "YELLOW_CARD"
      );

    // =====================================================
    // RED CARDS
    // =====================================================

    const redCards =
      footballEvents.filter(
        (event: FootballEvent) =>
          event.eventType === "RED_CARD"
      );

    // =====================================================
    // PLAYER GOAL STATISTICS
    // =====================================================

    const scorerMap = new Map<
      number,
      {
        playerId: number;
        playerName: string;
        teamId: number;
        teamName: string;
        goals: number;
        normalGoals: number;
        penaltyGoals: number;
        ownGoals: number;
      }
    >();

    // =====================================================
    // BUILD SCORER MAP
    // =====================================================

    for (const event of goalEvents) {
      // Own goals may have a player,
      // but if your database stores no player,
      // simply skip it from player scoring statistics.
      if (!event.player) {
        continue;
      }

      const playerId =
        event.player.id;

      const existing =
        scorerMap.get(playerId);

      // ===================================================
      // EXISTING PLAYER
      // ===================================================

      if (existing) {
        existing.goals += 1;

        if (
          event.eventType === "GOAL"
        ) {
          existing.normalGoals += 1;
        }

        if (
          event.eventType === "PENALTY"
        ) {
          existing.penaltyGoals += 1;
        }

        if (
          event.eventType === "OWN_GOAL"
        ) {
          existing.ownGoals += 1;
        }

        continue;
      }

      // ===================================================
      // NEW PLAYER
      // ===================================================

      scorerMap.set(
        playerId,
        {
          playerId:
            event.player.id,

          playerName:
            event.player.name,

          teamId:
            event.team.id,

          teamName:
            event.team.name,

          goals: 1,

          normalGoals:
            event.eventType === "GOAL"
              ? 1
              : 0,

          penaltyGoals:
            event.eventType ===
            "PENALTY"
              ? 1
              : 0,

          ownGoals:
            event.eventType ===
            "OWN_GOAL"
              ? 1
              : 0,
        }
      );
    }

    // =====================================================
    // GOAL SCORERS
    // =====================================================

    const goalScorers =
      Array.from(
        scorerMap.values()
      ).sort(
        (a, b) =>
          b.goals - a.goals
      );

    // =====================================================
    // TOP SCORER
    // =====================================================

    const topScorer =
      goalScorers.length > 0
        ? goalScorers[0]
        : null;

    // =====================================================
    // TEAM STATISTICS
    // =====================================================

    function teamStats(
      teamId: number
    ) {
      const teamEvents =
        footballEvents.filter(
          (event: FootballEvent) =>
            event.teamId === teamId
        );

      const goals =
        teamEvents.filter(
          (event: FootballEvent) =>
            event.eventType ===
            "GOAL"
        ).length;

      const penaltyGoals =
        teamEvents.filter(
          (event: FootballEvent) =>
            event.eventType ===
            "PENALTY"
        ).length;

      const ownGoals =
        teamEvents.filter(
          (event: FootballEvent) =>
            event.eventType ===
            "OWN_GOAL"
        ).length;

      const yellowCards =
        teamEvents.filter(
          (event: FootballEvent) =>
            event.eventType ===
            "YELLOW_CARD"
        ).length;

      const redCards =
        teamEvents.filter(
          (event: FootballEvent) =>
            event.eventType ===
            "RED_CARD"
        ).length;

      return {
        teamId,

        goals,

        penaltyGoals,

        ownGoals,

        yellowCards,

        redCards,

        totalEvents:
          teamEvents.length,
      };
    }

    // =====================================================
    // TEAM 1 STATS
    // =====================================================

    const team1Stats =
      teamStats(
        match.team1Id
      );

    // =====================================================
    // TEAM 2 STATS
    // =====================================================

    const team2Stats =
      teamStats(
        match.team2Id
      );

    // =====================================================
    // RETURN RESPONSE
    // =====================================================

    return NextResponse.json({
      success: true,

      // ===================================================
      // MATCH
      // ===================================================

      match: {
        id: match.id,

        matchNumber:
          match.matchNumber,

        status:
          match.status,

        tournament: {
          id:
            match.tournament.id,

          name:
            match.tournament.name,

          season:
            match.tournament.season,
        },

        game: {
          id:
            match.game.id,

          name:
            match.game.name,

          sportType:
            match.game.sportType,
        },

        team1: {
          id:
            match.team1.id,

          name:
            match.team1.name,

          score:
            team1Score,
        },

        team2: {
          id:
            match.team2.id,

          name:
            match.team2.name,

          score:
            team2Score,
        },

        winner,

        result,
      },

      // ===================================================
      // STATISTICS
      // ===================================================

      statistics: {
        totalGoals:
          team1Score +
          team2Score,

        normalGoals:
          normalGoals.length,

        penaltyGoals:
          penaltyGoals.length,

        ownGoals:
          ownGoals.length,

        yellowCards:
          yellowCards.length,

        redCards:
          redCards.length,

        totalEvents:
          footballEvents.length,
      },

      // ===================================================
      // TOP SCORER
      // ===================================================

      topScorer,

      // ===================================================
      // GOAL SCORERS
      // ===================================================

      goalScorers,

      // ===================================================
      // PENALTY GOALS
      // ===================================================

      penaltyGoals:
        penaltyGoals.map(
          (event: FootballEvent) => ({
            id: event.id,

            minute:
              event.minute,

            player:
              event.player
                ? {
                    id:
                      event.player.id,

                    name:
                      event.player.name,

                    jerseyNo:
                      event.player
                        .jerseyNo,
                  }
                : null,

            team: {
              id:
                event.team.id,

              name:
                event.team.name,
            },

            description:
              event.description,
          })
        ),

      // ===================================================
      // OWN GOALS
      // ===================================================

      ownGoals:
        ownGoals.map(
          (event: FootballEvent) => ({
            id: event.id,

            minute:
              event.minute,

            player:
              event.player
                ? {
                    id:
                      event.player.id,

                    name:
                      event.player.name,

                    jerseyNo:
                      event.player
                        .jerseyNo,
                  }
                : null,

            team: {
              id:
                event.team.id,

              name:
                event.team.name,
            },

            description:
              event.description,
          })
        ),

      // ===================================================
      // YELLOW CARDS
      // ===================================================

      yellowCards:
        yellowCards.map(
          (event: FootballEvent) => ({
            id: event.id,

            minute:
              event.minute,

            player:
              event.player
                ? {
                    id:
                      event.player.id,

                    name:
                      event.player.name,

                    jerseyNo:
                      event.player
                        .jerseyNo,
                  }
                : null,

            team: {
              id:
                event.team.id,

              name:
                event.team.name,
            },

            description:
              event.description,
          })
        ),

      // ===================================================
      // RED CARDS
      // ===================================================

      redCards:
        redCards.map(
          (event: FootballEvent) => ({
            id: event.id,

            minute:
              event.minute,

            player:
              event.player
                ? {
                    id:
                      event.player.id,

                    name:
                      event.player.name,

                    jerseyNo:
                      event.player
                        .jerseyNo,
                  }
                : null,

            team: {
              id:
                event.team.id,

              name:
                event.team.name,
            },

            description:
              event.description,
          })
        ),

      // ===================================================
      // TEAM STATISTICS
      // ===================================================

      teamStatistics: {
        team1:
          team1Stats,

        team2:
          team2Stats,
      },

      // ===================================================
      // ALL EVENTS
      // ===================================================

      events,
    });
  } catch (error) {
    console.error(
      "FOOTBALL SUMMARY ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load football match summary.",
      },
      {
        status: 500,
      }
    );
  }
}