import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AppNavbar from "@/components/AppNavbar";

export default async function RulesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-5xl">
        <AppNavbar name={user.displayName} role={user.role} />

        <section className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl sm:p-8">
          <div className="mb-8">
            <p className="font-bold text-green-300">Tournament Guide</p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              Game Rules
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60 sm:text-base">
              Predict the final score of each World Cup match, earn points for
              accurate predictions, and compete with the other players on the
              leaderboard.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <RuleCard number="1" title="Submit your predictions">
              Enter the score you believe each team will have at the end of the
              match, then press Save Prediction.
            </RuleCard>

            <RuleCard number="2" title="Prediction deadline">
              Predictions must be submitted before the scheduled kickoff time.
              After kickoff, the match becomes locked and predictions cannot be
              added or changed.
            </RuleCard>

            <RuleCard number="3" title="Changing a prediction">
              You may update a saved prediction as many times as you want before
              the match starts. The most recently saved prediction will be used.
            </RuleCard>

            <RuleCard number="4" title="Final match score">
              Predictions are calculated using the official final score recorded
              by the administrator. Extra-time or penalty-shootout rules should
              follow the tournament organizer&apos;s announced scoring policy.
            </RuleCard>

            <RuleCard number="5" title="Earning points">
              Points are awarded after the administrator enters the official
              match result. More accurate predictions receive more points.
            </RuleCard>

            <RuleCard number="6" title="Leaderboard">
              Your total score is shown on the leaderboard. Players are ranked
              from the highest total points to the lowest.
            </RuleCard>

            <RuleCard number="7" title="Missing predictions">
              A match with no submitted prediction earns zero points. The
              leaderboard also shows how many predictions each player has
              completed or missed.
            </RuleCard>

            <RuleCard number="8" title="Administrator decisions">
              The administrator may correct match results or apply score
              adjustments when necessary. Administrative decisions are final.
            </RuleCard>
          </div>

          <div className="mt-8 rounded-2xl border border-green-400/20 bg-green-400/10 p-5">
            <h2 className="text-xl font-black text-green-300">
              Important
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/70">
              Always confirm that your prediction shows as saved before leaving
              the page. Internet or browser problems do not automatically submit
              a prediction.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

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
          <h2 className="text-lg font-black">{title}</h2>

          <p className="mt-2 text-sm leading-6 text-white/60">
            {children}
          </p>
        </div>
      </div>
    </article>
  );
}