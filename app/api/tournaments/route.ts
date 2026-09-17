import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(tournaments);
  } catch (error) {
    console.error("GET tournaments error:", error);

    return NextResponse.json(
      { error: "Failed to fetch tournaments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const tournament = await prisma.tournament.create({
      data: {
        name: body.name,
        season: body.season || null,
        description: body.description || null,
        startDate: body.startDate
          ? new Date(body.startDate)
          : null,
        endDate: body.endDate
          ? new Date(body.endDate)
          : null,
        status: body.status || "UPCOMING",
      },
    });

    return NextResponse.json(tournament, { status: 201 });
  } catch (error) {
    console.error("POST tournaments error:", error);

    return NextResponse.json(
      { error: "Failed to create tournament" },
      { status: 500 }
    );
  }
}