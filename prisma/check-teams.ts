import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const teams = await prisma.team.findMany({
    select: {
      id: true,
      name: true,
      captain: true,
      playerIds: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  console.log(
    "\n========== TEAMS IN DATABASE ==========\n"
  );

  console.table(teams);

  console.log(
    "\n========== PLAYERS IN DATABASE ==========\n"
  );

  const dbPlayers = await prisma.player.findMany({
    select: {
      id: true,
      name: true,
      jerseyNo: true,
      teamId: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  console.table(dbPlayers);
}

main()
  .catch((error) => {
    console.error("CHECK ERROR:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });