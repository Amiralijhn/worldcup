import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppNavbar from "@/components/AppNavbar";
import AdminMatchesClient from "@/components/AdminMatchesClient";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const matches = await prisma.match.findMany({
    orderBy: {
      matchNumber: "asc",
    },
    include: {
      predictions: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
        },
      },
    },
  });

  const formattedMatches = matches.map((match) => ({
    id: match.id,
    matchNumber: match.matchNumber,
    team1: match.team1,
    team2: match.team2,
    stage: match.stage,
    kickoffAt: match.kickoffAt.toISOString(),
    status: match.status,
    actualTeam1Score: match.actualTeam1Score,
    actualTeam2Score: match.actualTeam2Score,
    actualWinner: match.actualWinner,
    predictions: match.predictions.map((prediction) => ({
      id: prediction.id,
      predTeam1Score: prediction.predTeam1Score,
      predTeam2Score: prediction.predTeam2Score,
      predWinner: prediction.predWinner,
      points: prediction.points,
      user: {
        id: prediction.user.id,
        username: prediction.user.username,
        displayName: prediction.user.displayName,
      },
    })),
  }));

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-6xl">
        <AppNavbar name={user.displayName} role={user.role} />

        <AdminMatchesClient matches={formattedMatches} />
      </div>
    </main>
  );
}