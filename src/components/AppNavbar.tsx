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
    <header className="mb-6 rounded-2xl border border-white/10 bg-white/10 p-3 shadow-xl sm:rounded-3xl sm:p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-black text-white sm:text-xl">
            World Cup Prediction
          </h1>

          <p className="mt-1 truncate text-xs text-white/60 sm:text-sm">
            Logged in as {name}
          </p>
        </div>

        <nav className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          {role !== "ADMIN" && (
            <>
              <Link
                href="/dashboard"
                className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-center text-xs font-bold text-white hover:bg-white/20 sm:flex-none sm:px-4 sm:text-sm"
              >
                Portal
              </Link>

              <Link
                href="/matches"
                className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-center text-xs font-bold text-white hover:bg-white/20 sm:flex-none sm:px-4 sm:text-sm"
              >
                Matches
              </Link>

              <Link
                href="/leaderboard"
                className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-center text-xs font-bold text-white hover:bg-white/20 sm:flex-none sm:px-4 sm:text-sm"
              >
                Leaderboard
              </Link>
            </>
          )}

          <button
            onClick={logout}
            className="w-full rounded-xl bg-red-500/80 px-3 py-2 text-xs font-bold text-white hover:bg-red-500 sm:w-auto sm:px-4 sm:text-sm"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}