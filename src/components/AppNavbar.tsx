"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type AppNavbarProps = {
  name: string;
  role: "ADMIN" | "PLAYER";
};

export default function AppNavbar({ name, role }: AppNavbarProps) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/login");
    router.refresh();
  }

  return (
    <header className="mb-6 rounded-3xl border border-white/10 bg-white/10 p-4 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white">
            World Cup Prediction
          </h1>

          <p className="text-sm text-white/60">
            Logged in as {name}
          </p>
        </div>

        <nav className="flex flex-wrap gap-2">
          {role !== "ADMIN" && (
            <>
              <Link
                href="/dashboard"
                className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20"
              >
                Portal
              </Link>

              <Link
                href="/matches"
                className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20"
              >
                Matches
              </Link>

              <Link
                href="/leaderboard"
                className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20"
              >
                Leaderboard
              </Link>
            </>
          )}

          <button
            onClick={logout}
            className="rounded-xl bg-red-500/80 px-4 py-2 text-sm font-bold text-white hover:bg-red-500"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}