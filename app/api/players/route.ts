import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const teamIdParam = searchParams.get("teamId");

    const teamId = teamIdParam
      ? Number(teamIdParam)
      : undefined;

    const players = await prisma.player.findMany({
      where: teamId
        ? {
            teamId,
          }
        : undefined,

      orderBy: [
        {
          jerseyNo: "asc",
        },
        {
          name: "asc",
        },
      ],

      include: {
        team: true,
      },
    });

    return NextResponse.json(players);
  } catch (error) {
    console.error("GET PLAYERS ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to load players",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = String(body.name ?? "").trim();

    const teamId = Number(body.teamId);

    const jerseyNo =
      body.jerseyNo === null ||
      body.jerseyNo === undefined ||
      body.jerseyNo === ""
        ? null
        : Number(body.jerseyNo);

    const role =
      body.role === null ||
      body.role === undefined ||
      body.role === ""
        ? null
        : String(body.role).trim();

    const photo =
      body.photo === null ||
      body.photo === undefined ||
      body.photo === ""
        ? null
        : String(body.photo).trim();

    if (!name || !teamId) {
      return NextResponse.json(
        {
          error: "Player name and team are required.",
        },
        {
          status: 400,
        }
      );
    }

    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
      },
    });

    if (!team) {
      return NextResponse.json(
        {
          error: "Team not found.",
        },
        {
          status: 404,
        }
      );
    }

    const player = await prisma.player.create({
      data: {
        name,
        teamId,
        jerseyNo,
        role,
        photo,
      },
      include: {
        team: true,
      },
    });

    return NextResponse.json(player, {
      status: 201,
    });
  } catch (error) {
    console.error("CREATE PLAYER ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create player",
      },
      {
        status: 500,
      }
    );
  }
}