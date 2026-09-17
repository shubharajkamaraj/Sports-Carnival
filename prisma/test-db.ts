import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString =
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is missing."
  );
}

console.log("DATABASE_URL found.");

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log(
    "Testing database connection..."
  );

  await prisma.$queryRaw`SELECT 1`;

  console.log(
    "DATABASE CONNECTION SUCCESSFUL"
  );

  const teams =
    await prisma.team.findMany({
      select: {
        id: true,
        name: true,
      },
    });

  console.table(teams);
}

main()
  .catch((error) => {
    console.error(
      "DATABASE CONNECTION FAILED:"
    );
    console.error(error);

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });