import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import AppNavbar from "@/components/AppNavbar";

type RuleCardProps = {
  number: string;
  title: string;
  children: React.ReactNode;
};

function RuleCard({ number, title, children }: RuleCardProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-400 font-black text-slate-950">
          {number}
        </div>

        <div>
          <h3 className="text-lg font-black">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-white/60">{children}</p>
        </div>
      </div>
    </article>
  );
}

export default async function RulesPage() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-5xl">
        {user ? (
          <AppNavbar name={user.displayName} role={user.role} />
        ) : (
          <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-black">World Cup Prediction</h1>
              <p className="text-sm text-white/60">Tournament Rules</p>
            </div>

            <Link
              href="/login"
              className="rounded-xl bg-green-400 px-4 py-2 text-center text-sm font-black text-slate-950 hover:bg-green-300"
            >
              Back to Login
            </Link>
          </header>
        )}

        <section className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl sm:p-8">
          <p className="font-bold text-green-300">Tournament Guide</p>

          <h2 className="mt-2 text-3xl font-black sm:text-4xl">
            Game Rules
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60 sm:text-base">
            Predict match scores, earn points, and compete with other players.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <RuleCard number="1" title="Submit predictions">
              Enter both team scores and press Save.
            </RuleCard>

            <RuleCard number="2" title="Prediction deadline">
              Predictions must be saved before kickoff. After kickoff, the
              match becomes locked.
            </RuleCard>

            <RuleCard number="3" title="Change predictions">
              You can update a prediction before kickoff. The latest saved
              prediction will be used.
            </RuleCard>

            <RuleCard number="4" title="Official result">
              The administrator enters the official result after the match.
            </RuleCard>

            <RuleCard number="5" title="How points are calculated">
              Exact score earns 5 points. Correct goal difference earns 3
              points. Correct winner or draw earns 2 points. Incorrect or
              missing predictions earn 0 points.
            </RuleCard>

            <RuleCard number="6" title="Leaderboard">
              Players are ranked from highest total points to lowest.
            </RuleCard>

            <RuleCard number="7" title="Missing predictions">
              A match without a saved prediction earns 0 points.
            </RuleCard>
          </div>

          {!user && (
            <div className="mt-8 text-center">
              <Link
                href="/login"
                className="inline-block rounded-xl bg-green-400 px-6 py-3 font-black text-slate-950 hover:bg-green-300"
              >
                Return to Login or Sign Up
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}