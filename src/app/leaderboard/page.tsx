import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppNavbar from "@/components/AppNavbar";

type LeaderboardPlayer = {
  id: number;
  displayName: string;
  predictions: { points: number | null }[];
  scoreAdjustments: { pointsChange: number }[];
};

export default async function LeaderboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const players = await prisma.user.findMany({
    where: {
      role: "PLAYER",
    },
    include: {
      predictions: true,
      scoreAdjustments: true,
    },
  });

  const leaderboard = players
    .map((player: LeaderboardPlayer) => {
      const predictionPoints = player.predictions.reduce(
        (sum: number, prediction: { points: number | null }) =>
          sum + (prediction.points || 0),
        0
      );

      const adjustmentPoints = player.scoreAdjustments.reduce(
        (sum: number, adjustment: { pointsChange: number }) =>
          sum + adjustment.pointsChange,
        0
      );

      return {
        id: player.id,
        displayName: player.displayName,
        totalPoints: predictionPoints + adjustmentPoints,
        predictionCount: player.predictions.length,
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-6xl">
        <AppNavbar name={user.displayName} role={user.role} />

        <section className="rounded-3xl border border-white/10 bg-white/10 p-6">
          <h2 className="text-3xl font-black">Leaderboard</h2>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/30 text-white/60">
                <tr>
                  <th className="p-4">Rank</th>
                  <th className="p-4">Player</th>
                  <th className="p-4">Points</th>
                  <th className="p-4">Predictions</th>
                  <th className="p-4">Missing</th>
                </tr>
              </thead>

              <tbody>
                {leaderboard.map((player, index) => (
                  <tr key={player.id} className="border-t border-white/10">
                    <td className="p-4 font-black">#{index + 1}</td>
                    <td className="p-4 font-bold">{player.displayName}</td>
                    <td className="p-4 text-xl font-black text-green-300">
                      {player.totalPoints}
                    </td>
                    <td className="p-4">{player.predictionCount}/104</td>
                    <td className="p-4">{104 - player.predictionCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}