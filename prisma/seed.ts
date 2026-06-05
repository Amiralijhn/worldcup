import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

const users = [
  { username: "laurent", displayName: "Laurent", role: UserRole.PLAYER },
  { username: "amirali", displayName: "Amirali", role: UserRole.PLAYER },
  { username: "yusuf", displayName: "Yusuf", role: UserRole.PLAYER },
  { username: "mehrad", displayName: "Mehrad", role: UserRole.PLAYER },
  { username: "diego", displayName: "Diego", role: UserRole.PLAYER },
  { username: "patrick", displayName: "Patrick", role: UserRole.PLAYER },
  { username: "bardia", displayName: "Bardia", role: UserRole.PLAYER },
  { username: "manish", displayName: "Manish", role: UserRole.PLAYER },
  { username: "admin", displayName: "Admin", role: UserRole.ADMIN },
];

const matches = [
  {
    matchNumber: 1,
    team1: "Mexico",
    team2: "South Africa",
    kickoffAt: new Date("2026-06-11T15:00:00-04:00"),
  },
  {
    matchNumber: 2,
    team1: "South Korea",
    team2: "Czechia",
    kickoffAt: new Date("2026-06-11T22:00:00-04:00"),
  },
  {
    matchNumber: 3,
    team1: "Canada",
    team2: "Bosnia and Herzegovina",
    kickoffAt: new Date("2026-06-12T15:00:00-04:00"),
  },
];

async function main() {
  const passwordHash = await bcrypt.hash("1234", 10);
  const adminPasswordHash = await bcrypt.hash("admin", 10);

  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: {
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        passwordHash:
          user.role === UserRole.ADMIN ? adminPasswordHash : passwordHash,
      },
    });
  }

  for (const match of matches) {
    await prisma.match.upsert({
      where: { matchNumber: match.matchNumber },
      update: {},
      create: match,
    });
  }
}

main()
  .then(async () => {
    console.log("Database seeded successfully");
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });