import "dotenv/config";

import { prisma } from "../lib/prisma";
import {
  SportType,
  TournamentStatus,
  GameCategory,
} from "@prisma/client";

async function main() {
  console.log("Starting database seed...");

  // =====================================================
  // CREATE TOURNAMENT
  // =====================================================

  let tournament = await prisma.tournament.findFirst({
    where: {
      name: "Sports Carnival",
    },
  });

  if (!tournament) {
    tournament = await prisma.tournament.create({
      data: {
        name: "Sports Carnival",
        season: "Season 1",
        description: "Sports Carnival Season 1",
        status: TournamentStatus.UPCOMING,
      },
    });

    console.log("Tournament created:", tournament.name);
  } else {
    console.log(
      "Tournament already exists:",
      tournament.name
    );
  }

  // =====================================================
  // STATIC GAMES
  // =====================================================

  const games: {
    name: string;
    sportType: SportType | null;
    category: GameCategory | null;
    gameOrder: number | null;
  }[] = [
    // ---------------------------------------------------
    // OUTDOOR SPORTS
    // ---------------------------------------------------

    {
      name: "Cricket",
      sportType: SportType.CRICKET,
      category: null,
      gameOrder: null,
    },

    {
      name: "Football",
      sportType: SportType.FOOTBALL,
      category: null,
      gameOrder: null,
    },

    {
      name: "Handball",
      sportType: SportType.HANDBALL,
      category: null,
      gameOrder: null,
    },

    {
      name: "Throwball",
      sportType: SportType.THROWBALL,
      category: null,
      gameOrder: null,
    },

    // ---------------------------------------------------
    // JUNIOR KIDS
    // ---------------------------------------------------

    {
      name: "BOOK BALANCE",
      sportType: null,
      category: GameCategory.JUNIOR_KIDS,
      gameOrder: 1,
    },
    {
      name: "POTATO RACE",
      sportType: null,
      category: GameCategory.JUNIOR_KIDS,
      gameOrder: 2,
    },

    // ---------------------------------------------------
    // SENIOR KIDS
    // ---------------------------------------------------

    {
      name: "SACK RACE",
      sportType: null,
      category: GameCategory.SENIOR_KIDS,
      gameOrder: 1,
    },

    {
      name: "ARRANGE THE BALL IN SAME COLOR",
      sportType: null,
      category: GameCategory.SENIOR_KIDS,
      gameOrder: 2,
    },

    // ---------------------------------------------------
    // WOMEN'S
    // ---------------------------------------------------

    {
      name: "LEMON & SPOON RELAY",
      sportType: null,
      category: GameCategory.WOMENS,
      gameOrder: 1,
    },

    {
      name: "BLINDFOLD COLLECT YOUR TEAMS COLOUR BALL",
      sportType: null,
      category: GameCategory.WOMENS,
      gameOrder: 2,
    },
     // ---------------------------------------------------
    // OTHERS
    // ---------------------------------------------------

    {
      name: "RELAY RACE",
      sportType: null,
      category: GameCategory.OTHER,
      gameOrder: 1,
    },

    {
      name: "TUG OF WAR",
      sportType: null,
      category: GameCategory.OTHER,
      gameOrder: 2,
    },
     {
      name: "TIMELY ARRIVAL",
      sportType: null,
      category: GameCategory.EXCLUDED,
      gameOrder: null,
    },
     {
      name: "PENALTY",
      sportType: null,
      category: GameCategory.EXCLUDED,
      gameOrder: null,
    }
  ];

  // =====================================================
  // CREATE GAMES
  // =====================================================

  for (const game of games) {
    const existingGame = await prisma.game.findFirst({
      where: {
        name: game.name,
        tournamentId: tournament.id,
      },
    });

    if (!existingGame) {
      await prisma.game.create({
        data: {
          name: game.name,
          sportType: game.sportType,
          tournamentId: tournament.id,
          category: game.category,
          gameOrder: game.gameOrder,
        },
      });

      console.log(`Game created: ${game.name}`);
    } else {
      console.log(`Game already exists: ${game.name}`);
    }
  }

  // =====================================================
  // DONE
  // =====================================================

  console.log("");
  console.log("================================");
  console.log("Database seed completed!");
  console.log("================================");
}

main()
  .catch((error) => {
    console.error("SEED ERROR:");
    console.error(error);

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });