import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppNavbar from "@/components/AppNavbar";


export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      predictions: true,
      scoreAdjustments: true,
    },
  });

  if (!currentUser) {
    redirect("/login");
  }

  const predictionPoints = currentUser.predictions.reduce(
  (
    sum: number,
    prediction: { points: number | null }
  ) => sum + (prediction.points || 0),
  0
);

const adjustmentPoints = currentUser.scoreAdjustments.reduce(
  (
    sum: number,
    adjustment: { pointsChange: number }
  ) => sum + adjustment.pointsChange,
  0
);

  const totalScore = predictionPoints + adjustmentPoints;

  const nextMatch = await prisma.match.findFirst({
    where: {
      kickoffAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      kickoffAt: "asc",
    },
  });

  const predictionCount = await prisma.prediction.count({
    where: {
      userId: user.id,
    },
  });

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-6xl">
        <AppNavbar name={user.displayName} role={user.role} />

        <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl">
          <p className="font-bold text-green-300">Your portal</p>

          <h2 className="mt-2 text-4xl font-black">
            Hello {user.displayName}
          </h2>

          <p className="mt-2 text-white/60">
            Your current score is{" "}
            <span className="font-black text-green-300">
              {totalScore} points
            </span>
            .
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-black/30 p-5">
              <p className="text-sm text-white/50">Score</p>
              <p className="text-3xl font-black text-green-300">
                {totalScore}
              </p>
            </div>

            <div className="rounded-2xl bg-black/30 p-5">
              <p className="text-sm text-white/50">Predicted Matches</p>
              <p className="text-3xl font-black">
                {predictionCount}/104
              </p>
            </div>

            <div className="rounded-2xl bg-black/30 p-5">
              <p className="text-sm text-white/50">Missing Predictions</p>
              <p className="text-3xl font-black">
                {104 - predictionCount}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl">
          <h3 className="text-2xl font-black">Next Match</h3>

          {nextMatch ? (
            <div className="mt-4">
              <p className="text-sm font-bold text-green-300">
                Match {nextMatch.matchNumber} · {nextMatch.stage}
              </p>

              <h4 className="mt-2 text-3xl font-black">
                {nextMatch.team1} vs {nextMatch.team2}
              </h4>

              <p className="mt-2 text-white/60">
                {new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Toronto",
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
}).format(nextMatch.kickoffAt)}
              </p>

              <a
                href="/matches"
                className="mt-5 inline-block rounded-xl bg-green-400 px-5 py-3 font-black text-slate-950"
              >
                Go to Matches
              </a>
            </div>
          ) : (
            <p className="mt-4 text-white/60">
              No upcoming matches.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}