import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type PlayerStats = {
  playerId: number;

  playerName: string;

  jerseyNo: number | null;

  teamId: number;

  teamName: string;

  leagueGoals: number;

  finalGoals: number;

  totalGoals: number;
};

export async function GET(
  request: Request
) {
  try {
    const {
      searchParams,
    } = new URL(request.url);

    const tournamentIdParam =
      searchParams.get(
        "tournamentId"
      );

    let tournamentId:
      | number
      | null = null;

    if (
      tournamentIdParam !==
      null
    ) {
      const parsed =
        Number(
          tournamentIdParam
        );

      if (
        !Number.isInteger(
          parsed
        ) ||
        parsed <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid tournament ID.",
          },
          {
            status: 400,
          }
        );
      }

      tournamentId = parsed;
    }

    /* =====================================================
       LOAD ONLY:
       
       LEAGUE
       FINAL
       
       AND ONLY NORMAL GOALS
    ===================================================== */

    const matches =
      await prisma.match.findMany({
        where: {
          status: "COMPLETED",

          stage: {
            in: [
              "LEAGUE",
              "FINAL",
            ],
          },

          game: {
            sportType: "FOOTBALL",
          },

          ...(tournamentId !==
          null
            ? {
                tournamentId,
              }
            : {}),

          footballEvents: {
            some: {
              eventType: "GOAL",

              playerId: {
                not: null,
              },
            },
          },
        },

        select: {
          id: true,

          stage: true,

          footballEvents: {
            where: {
              eventType:
                "GOAL",

              playerId: {
                not: null,
              },
            },

            select: {
              playerId: true,

              player: {
                select: {
                  id: true,

                  name: true,

                  jerseyNo: true,

                  teamId: true,
                },
              },

              team: {
                select: {
                  id: true,

                  name: true,
                },
              },
            },
          },
        },
      });

    const playerMap =
      new Map<
        number,
        PlayerStats
      >();

    /* =====================================================
       PROCESS MATCHES
    ===================================================== */

    for (
      const match of matches
    ) {
      for (
        const event of
          match.footballEvents
      ) {
        if (
          !event.player ||
          event.playerId === null
        ) {
          continue;
        }

        let stats =
          playerMap.get(
            event.playerId
          );

        if (!stats) {
          stats = {
            playerId:
              event.playerId,

            playerName:
              event.player.name,

            jerseyNo:
              event.player.jerseyNo,

            teamId:
              event.team.id,

            teamName:
              event.team.name,

            leagueGoals: 0,

            finalGoals: 0,

            totalGoals: 0,
          };

          playerMap.set(
            event.playerId,
            stats
          );
        }

        /* =================================================
           LEAGUE
        ================================================= */

        if (
          match.stage ===
          "LEAGUE"
        ) {
          stats.leagueGoals += 1;
        }

        /* =================================================
           FINAL
        ================================================= */

        if (
          match.stage ===
          "FINAL"
        ) {
          stats.finalGoals += 1;
        }

        stats.totalGoals += 1;
      }
    }

    /* =====================================================
       SORT
    ===================================================== */

    const players =
      Array.from(
        playerMap.values()
      ).sort(
        (a, b) => {
          if (
            b.totalGoals !==
            a.totalGoals
          ) {
            return (
              b.totalGoals -
              a.totalGoals
            );
          }

          return a.playerName.localeCompare(
            b.playerName
          );
        }
      );

    /* =====================================================
       RANK
    ===================================================== */

    const ranked =
      players.map(
        (player, index) => ({
          position:
            index + 1,

          ...player,
        })
      );

    return NextResponse.json({
      success: true,

      tournamentId,

      players: ranked,
    });
  } catch (error) {
    console.error(
      "FOOTBALL GOAL SCORERS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to load goal scorers.",
      },
      {
        status: 500,
      }
    );
  }
}