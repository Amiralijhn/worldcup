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

          <section className="mb-6 rounded-3xl border border-yellow-400/30 bg-yellow-400/10 p-5 shadow-xl">
  <div className="flex flex-wrap items-start justify-between gap-4">
    <div>
      <p className="text-sm font-black uppercase tracking-wide text-yellow-300">
        Update Note
      </p>

      <h2 className="mt-1 text-2xl font-black text-white">
        New Match Page Features
      </h2>

      <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
        You can now select matches by date, filter matches by stage, view your
        points for past match days, and see all player predictions after a final
        result is added.
      </p>
    </div>

    <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-black text-slate-950">
      Notice
    </span>
  </div>

  <ul className="mt-4 grid gap-2 text-sm text-white/70 sm:grid-cols-3">
    <li className="rounded-xl bg-orange-500/10 p-3">
      Date tiles added to Matches
    </li>

    <li className="rounded-xl bg-orange-500/10 p-3">
      Stage filters now show all games in that stage
    </li>

    <li className="rounded-xl bg-orange-500/10 p-3">
      Finished matches show all predictions
    </li>
  </ul>
</section>



        <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl">
          <p className="font-bold text-green-300"></p>

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