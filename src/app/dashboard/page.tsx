import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppNavbar from "@/components/AppNavbar";
import UpdateNotice from "@/components/UpdateNotice";

function formatKickoff(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  const currentUser = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    include: {
      predictions: true,
      scoreAdjustments: true,
    },
  });

  if (!currentUser) {
    redirect("/login");
  }

  const predictionPoints = currentUser.predictions.reduce(
    (sum, prediction) => sum + (prediction.points || 0),
    0
  );

  const adjustmentPoints = currentUser.scoreAdjustments.reduce(
    (sum, adjustment) => sum + adjustment.pointsChange,
    0
  );

  const totalPoints = predictionPoints + adjustmentPoints;

  const nextMatch = await prisma.match.findFirst({
    where: {
      kickoffAt: {
        gt: new Date(),
      },
      status: {
        not: "FINISHED",
      },
    },
    orderBy: {
      kickoffAt: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-6xl">
        <AppNavbar name={user.displayName} role={user.role} />

        <UpdateNotice />

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl lg:col-span-2">
            <p className="font-bold text-green-300">Welcome back</p>

            <h1 className="mt-2 text-4xl font-black">
              {currentUser.displayName}
            </h1>

            <p className="mt-3 max-w-2xl text-white/60">
              Make your predictions before kickoff, follow your points, and
              compete on the leaderboard.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-black/20 p-5">
                <p className="text-sm text-white/50">Total Points</p>

                <p className="mt-2 text-4xl font-black text-green-300">
                  {totalPoints}
                </p>
              </div>

              <div className="rounded-2xl bg-black/20 p-5">
                <p className="text-sm text-white/50">Predictions</p>

                <p className="mt-2 text-4xl font-black">
                  {currentUser.predictions.length}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/matches"
                className="rounded-xl bg-green-400 px-5 py-3 font-black text-slate-950 transition hover:bg-green-300"
              >
                Go to Matches
              </Link>

              <Link
                href="/leaderboard"
                className="rounded-xl bg-white/10 px-5 py-3 font-black text-white transition hover:bg-white/20"
              >
                View Leaderboard
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl">
            <p className="font-bold text-green-300">Next Match</p>

            {nextMatch ? (
              <>
                <h2 className="mt-2 text-2xl font-black">
                  {nextMatch.team1} vs {nextMatch.team2}
                </h2>

                <p className="mt-2 text-sm text-white/50">
                  Match {nextMatch.matchNumber} · {nextMatch.stage}
                </p>

                <p className="mt-4 rounded-2xl bg-black/20 p-4 text-sm text-white/70">
                  {formatKickoff(nextMatch.kickoffAt)}
                </p>

                <Link
                  href="/matches"
                  className="mt-5 block rounded-xl bg-green-400 px-5 py-3 text-center font-black text-slate-950 transition hover:bg-green-300"
                >
                  Predict Now
                </Link>
              </>
            ) : (
              <p className="mt-3 text-white/60">No upcoming matches found.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}