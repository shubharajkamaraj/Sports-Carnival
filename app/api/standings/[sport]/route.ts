import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Context {
  params: Promise<{
    sport: string;
  }>;
}

export async function GET(
  req: Request,
  context: Context
) {
  try {
    const { sport: rawSport } =
      await context.params;

    const sport =
      rawSport.toUpperCase();

    const { searchParams } =
      new URL(req.url);

    const tournamentId =
      Number(
        searchParams.get(
          "tournamentId"
        )
      );

    if (
      !tournamentId ||
      Number.isNaN(
        tournamentId
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Tournament ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const validSports = [
      "CRICKET",
      "FOOTBALL",
      "HANDBALL",
      "THROWBALL",
    ];

    if (!validSports.includes(sport)) {
      return NextResponse.json(
        {
          error:
            "Invalid sport.",
        },
        {
          status: 400,
        }
      );
    }

    const standings =
      await prisma.standing.findMany({
        where: {
          tournamentId,

          sport: sport as any,
        },

        include: {
          tournament: true,
        },

        orderBy: [
          {
            points: "desc",
          },
          {
            difference: "desc",
          },
          {
            nrr: "desc",
          },
        ],
      });

    /*
     * Attach team information.
     */

    const teamIds =
      standings.map(
        (standing) =>
          standing.teamId
      );

    const teams =
      await prisma.team.findMany({
        where: {
          id: {
            in: teamIds,
          },
        },
      });

    const result =
      standings.map(
        (standing) => ({
          ...standing,

          team:
            teams.find(
              (team) =>
                team.id ===
                standing.teamId
            ) ?? null,
        })
      );

    return NextResponse.json(
      result
    );
  } catch (error) {
    console.error(
      "STANDINGS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load standings",
      },
      {
        status: 500,
      }
    );
  }
}