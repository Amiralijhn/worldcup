import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppNavbar from "@/components/AppNavbar";
import MatchesClient from "@/components/MatchesClient";

type MatchWithPrediction = {
  id: number;
  matchNumber: number;
  team1: string;
  team2: string;
  stage: string;
  kickoffAt: Date;
  actualTeam1Score: number | null;
  actualTeam2Score: number | null;
  status: string;
  predictions: {
    predTeam1Score: number;
    predTeam2Score: number;
    points: number | null;
  }[];
};

export default async function MatchesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const matches = await prisma.match.findMany({
    orderBy: {
      matchNumber: "asc",
    },
    include: {
      predictions: {
        where: {
          userId: user.id,
        },
      },
    },
  });

  const formattedMatches = matches.map((match: MatchWithPrediction) => ({
    id: match.id,
    matchNumber: match.matchNumber,
    team1: match.team1,
    team2: match.team2,
    stage: match.stage,
    kickoffAt: match.kickoffAt.toISOString(),
    actualTeam1Score: match.actualTeam1Score,
    actualTeam2Score: match.actualTeam2Score,
    status: match.status,
    prediction: match.predictions[0]
      ? {
          predTeam1Score: match.predictions[0].predTeam1Score,
          predTeam2Score: match.predictions[0].predTeam2Score,
          points: match.predictions[0].points,
        }
      : null,
  }));

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-6xl">
        <AppNavbar name={user.displayName} role={user.role} />
        <MatchesClient matches={formattedMatches} />
      </div>
    </main>
  );
}