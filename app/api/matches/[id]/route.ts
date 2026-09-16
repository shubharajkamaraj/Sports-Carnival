
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =====================================================
// GET SINGLE MATCH
// =====================================================


// =====================================================
// GET SINGLE MATCH
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const matchId = Number(id);

    if (!Number.isInteger(matchId)) {
      return NextResponse.json(
        {
          error: "Invalid match ID.",
        },
        {
          status: 400,
        }
      );
    }

    const match = await prisma.match.findUnique({
      where: {
        id: matchId,
      },

      include: {
        tournament: true,
        game: true,
        team1: true,
        team2: true,
        winnerTeam: true,

        // =================================================
        // CRICKET INNINGS
        // =================================================

        cricketInnings: {
          orderBy: {
            inningsNumber: "asc",
          },

          include: {
         battingTeam: {
  include: {
    players: true,
  },
},

bowlingTeam: {
  include: {
    players: true,
  },
},

            ballEvents: {
              orderBy: [
                {
                  overNumber: "asc",
                },
                {
                  ballNumber: "asc",
                },
              ],
            },
          },
        },
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

    return NextResponse.json(match);
  } catch (error) {
    console.error(
      "GET MATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch match.",
      },
      {
        status: 500,
      }
    );
  }
}



// =====================================================
// UPDATE MATCH
// =====================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // =================================================
    // MATCH ID
    // =================================================

    const { id } = await params;

    const matchId = Number(id);

    if (!Number.isInteger(matchId)) {
      return NextResponse.json(
        {
          error: "Invalid match ID.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // CHECK EXISTING MATCH
    // =================================================

    const existingMatch =
      await prisma.match.findUnique({
        where: {
          id: matchId,
        },

        include: {
          game: true,
        },
      });

    if (!existingMatch) {
      return NextResponse.json(
        {
          error: "Match not found.",
        },
        {
          status: 404,
        }
      );
    }

    // =================================================
    // REQUEST BODY
    // =================================================

    const body = await request.json();

    const {
      tournamentId,
      gameId,
      team1Id,
      team2Id,
      matchNumber,
      stage,
      overs,
    } = body;

    // =================================================
    // REQUIRED FIELD VALIDATION
    // =================================================

    if (
      tournamentId === undefined ||
      tournamentId === null ||
      tournamentId === "" ||
      gameId === undefined ||
      gameId === null ||
      gameId === "" ||
      team1Id === undefined ||
      team1Id === null ||
      team1Id === "" ||
      team2Id === undefined ||
      team2Id === null ||
      team2Id === "" ||
      !stage
    ) {
      return NextResponse.json(
        {
          error:
            "Tournament, game, Team 1, Team 2 and stage are required.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // CONVERT IDS
    // =================================================

    const tournamentIdNumber =
      Number(tournamentId);

    const gameIdNumber =
      Number(gameId);

    const team1IdNumber =
      Number(team1Id);

    const team2IdNumber =
      Number(team2Id);

    // =================================================
    // VALIDATE IDS
    // =================================================

    if (
      !Number.isInteger(
        tournamentIdNumber
      ) ||
      !Number.isInteger(
        gameIdNumber
      ) ||
      !Number.isInteger(
        team1IdNumber
      ) ||
      !Number.isInteger(
        team2IdNumber
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid tournament, game or team ID.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // SAME TEAM CHECK
    // =================================================

    if (
      team1IdNumber === team2IdNumber
    ) {
      return NextResponse.json(
        {
          error:
            "Team 1 and Team 2 cannot be the same.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // VALIDATE STAGE
    // =================================================

    const validStages = [
      "LEAGUE",
      "THIRD_PLACE",
      "FINAL",
    ];

    if (
      !validStages.includes(stage)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid match stage. Use League, Third Place or Final.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // CHECK TOURNAMENT
    // =================================================

    const tournament =
      await prisma.tournament.findUnique({
        where: {
          id: tournamentIdNumber,
        },
      });

    if (!tournament) {
      return NextResponse.json(
        {
          error:
            "Tournament not found.",
        },
        {
          status: 404,
        }
      );
    }

    // =================================================
    // CHECK GAME
    // =================================================

    const game =
      await prisma.game.findUnique({
        where: {
          id: gameIdNumber,
        },
      });

    if (!game) {
      return NextResponse.json(
        {
          error: "Game not found.",
        },
        {
          status: 404,
        }
      );
    }

    // =================================================
    // CHECK TEAM 1
    // =================================================

    const team1 =
      await prisma.team.findUnique({
        where: {
          id: team1IdNumber,
        },
      });

    if (!team1) {
      return NextResponse.json(
        {
          error:
            "Team 1 not found.",
        },
        {
          status: 404,
        }
      );
    }

    // =================================================
    // CHECK TEAM 2
    // =================================================

    const team2 =
      await prisma.team.findUnique({
        where: {
          id: team2IdNumber,
        },
      });

    if (!team2) {
      return NextResponse.json(
        {
          error:
            "Team 2 not found.",
        },
        {
          status: 404,
        }
      );
    }

    // =================================================
    // OVERS
    // =================================================

    let oversNumber =
      existingMatch.overs;

    // -------------------------------------------------
    // Cricket
    // -------------------------------------------------

    if (
      game.sportType === "CRICKET"
    ) {
      if (
        overs === undefined ||
        overs === null ||
        overs === ""
      ) {
        return NextResponse.json(
          {
            error:
              "Overs are required for cricket matches.",
          },
          {
            status: 400,
          }
        );
      }

      oversNumber = Number(overs);

      if (
        !Number.isInteger(
          oversNumber
        ) ||
        ![1, 2, 3, 4, 5].includes(
          oversNumber
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Cricket overs must be between 1 and 5.",
          },
          {
            status: 400,
          }
        );
      }
    }

    // -------------------------------------------------
    // Non-cricket
    // -------------------------------------------------

    else {
      oversNumber =
        existingMatch.overs ?? 2;
    }

    // =================================================
    // MATCH NUMBER
    // =================================================

    let matchNumberValue:
      | number
      | null = null;

    if (
      matchNumber !== undefined &&
      matchNumber !== null &&
      matchNumber !== ""
    ) {
      const parsedMatchNumber =
        Number(matchNumber);

      if (
        !Number.isInteger(
          parsedMatchNumber
        ) ||
        parsedMatchNumber < 1
      ) {
        return NextResponse.json(
          {
            error:
              "Match number must be a positive whole number.",
          },
          {
            status: 400,
          }
        );
      }

      matchNumberValue =
        parsedMatchNumber;
    }

    // =================================================
    // UPDATE MATCH
    // =================================================

    const updatedMatch =
      await prisma.match.update({
        where: {
          id: matchId,
        },

        data: {
          tournamentId:
            tournamentIdNumber,

          gameId:
            gameIdNumber,

          team1Id:
            team1IdNumber,

          team2Id:
            team2IdNumber,

          matchNumber:
            matchNumberValue,

          stage,

          overs:
            oversNumber,
        },

        include: {
          tournament: true,
          game: true,
          team1: true,
          team2: true,
          winnerTeam: true,
        },
      });

    // =================================================
    // RESPONSE
    // =================================================

    return NextResponse.json(
      updatedMatch
    );
  } catch (error) {
    console.error(
      "UPDATE MATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update match.",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// DELETE MATCH
// =====================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const matchId = Number(id);

    if (!Number.isInteger(matchId)) {
      return NextResponse.json(
        {
          error: "Invalid match ID.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // CHECK MATCH
    // =================================================

    const match =
      await prisma.match.findUnique({
        where: {
          id: matchId,
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

    // =================================================
    // DELETE
    // =================================================

    await prisma.match.delete({
      where: {
        id: matchId,
      },
    });

    return NextResponse.json({
      message:
        "Match deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE MATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete match.",
      },
      {
        status: 500,
      }
    );
  }
}

