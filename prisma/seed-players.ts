import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { players } from "../data/players";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("======================================");
  console.log("STARTING PLAYER SEED");
  console.log("======================================");

  // --------------------------------------------------
  // CHECK DATABASE CONNECTION
  // --------------------------------------------------

  await prisma.$connect();

  console.log("Database connection successful.");

  // --------------------------------------------------
  // LOAD TEAMS
  // --------------------------------------------------

  const teams = await prisma.team.findMany({
    orderBy: {
      id: "asc",
    },
  });

  console.log("\n========== TEAMS ==========");

  console.table(
    teams.map((team) => ({
      id: team.id,
      name: team.name,
      captain: team.captain,
      playerIds: team.playerIds,
    }))
  );

  if (teams.length === 0) {
    throw new Error(
      "No teams found in database. Create Team GC and Team Beta first."
    );
  }

  // --------------------------------------------------
  // TEAM PLAYER ASSIGNMENT
  // --------------------------------------------------
  //
  // Existing data:
  //
  // Team GC:
  // [1,2,3,4,5]
  //
  // Team Beta:
  // [13,14,15,12,11]
  //
  // We use the playerIds already stored in Team.
  // --------------------------------------------------

  const teamByPlayerId = new Map<number, number>();

  for (const team of teams) {
    for (const playerId of team.playerIds) {
      teamByPlayerId.set(playerId, team.id);
    }
  }

  // --------------------------------------------------
  // CREATE / UPDATE PLAYERS
  // --------------------------------------------------

  for (const player of players) {
    const teamId = teamByPlayerId.get(player.id);

    if (!teamId) {
      console.log(
        `Skipping ${player.name} (#${player.jerseyNo}) - no team assignment`
      );

      continue;
    }

    const team = teams.find(
      (item) => item.id === teamId
    );

    console.log(
      `Saving ${player.name} (#${player.jerseyNo}) -> ${
        team?.name ?? `Team ${teamId}`
      }`
    );

    await prisma.player.upsert({
      where: {
        id: player.id,
      },

      update: {
        name: player.name,
        jerseyNo: player.jerseyNo,
        teamId,
      },

      create: {
        id: player.id,
        name: player.name,
        jerseyNo: player.jerseyNo,
        teamId,
      },
    });
  }

  // --------------------------------------------------
  // SHOW PLAYERS
  // --------------------------------------------------

  const savedPlayers =
    await prisma.player.findMany({
      orderBy: {
        id: "asc",
      },

      include: {
        team: true,
      },
    });

  console.log("\n========== PLAYERS IN DATABASE ==========");

  console.table(
    savedPlayers.map((player) => ({
      id: player.id,
      name: player.name,
      jerseyNo: player.jerseyNo,
      teamId: player.teamId,
      team: player.team.name,
    }))
  );

  console.log("\n======================================");
  console.log("PLAYER SEED COMPLETED");
  console.log("======================================");
}

main()
  .catch((error) => {
    console.error("\nSEED ERROR:");
    console.error(error);

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });