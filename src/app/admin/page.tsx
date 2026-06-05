import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AppNavbar from "@/components/AppNavbar";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-6xl">
        <AppNavbar name={user.displayName} role={user.role} />

        <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl">
          <h1 className="mb-2 text-4xl font-black text-white">
            Admin Panel
          </h1>

          <p className="mb-8 text-white/60">
            Admins can update real match results and calculate player points.
          </p>

          <div className="rounded-2xl bg-black/30 p-6">
            <h2 className="mb-4 text-2xl font-black text-white">
              Update Match Result
            </h2>

            <form className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="mb-1 block font-medium text-white/70">
                  Match Number
                </label>

                <input
                  type="number"
                  className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-white/70">
                  Team 1 Score
                </label>

                <input
                  type="number"
                  className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-white/70">
                  Team 2 Score
                </label>

                <input
                  type="number"
                  className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-white outline-none"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  className="w-full rounded-lg bg-green-400 px-4 py-2 font-black text-slate-950 hover:bg-green-300"
                >
                  Save Result
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}