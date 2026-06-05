import "dotenv/config";
import path from "path";
import * as XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

type ExcelMatch = {
  match: number;
  team1: string;
  team2: string;
  stage: string;
  kickoffAt: string;
};

function normalizeStage(stage: string) {
  const value = String(stage).trim().toLowerCase();

  if (value === "group" || value === "group stage") return "Group Stage";
  if (value === "1/32") return "1/32";
  if (value === "1/16") return "1/16";
  if (value === "1/8") return "1/8";
  if (value === "1/4") return "1/4";
  if (value === "1/2" || value === "semi final" || value === "semifinal") {
    return "1/2 Final";
  }
  if (value === "final") return "Final";

  return stage;
}

async function main() {
  const filePath = path.join(
    process.cwd(),
    "..",
    "uploads",
    "matches.xlsx"
  );

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json<ExcelMatch>(sheet);

  for (const row of rows) {
    const matchNumber = Number(row.match);

    if (!matchNumber || !row.team1 || !row.team2 || !row.kickoffAt) {
      console.log("Skipping invalid row:", row);
      continue;
    }

    await prisma.match.upsert({
      where: {
        matchNumber,
      },
      update: {
        team1: String(row.team1).trim(),
        team2: String(row.team2).trim(),
        stage: normalizeStage(row.stage),
        kickoffAt: new Date(row.kickoffAt),
      },
      create: {
        matchNumber,
        team1: String(row.team1).trim(),
        team2: String(row.team2).trim(),
        stage: normalizeStage(row.stage),
        kickoffAt: new Date(row.kickoffAt),
      },
    });
  }

  console.log(`Imported ${rows.length} matches successfully.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });