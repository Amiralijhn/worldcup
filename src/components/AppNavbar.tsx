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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-black text-white sm:text-xl">
            World Cup Prediction
          </h1>

          <p className="mt-1 truncate text-xs text-white/60 sm:text-sm">
            Logged in as {name}
          </p>
        </div>

        <nav className="grid w-full grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:w-auto lg:justify-end">
          {role !== "ADMIN" && (
            <>
              <NavbarLink href="/dashboard">Portal</NavbarLink>
              <NavbarLink href="/matches">Matches</NavbarLink>
              <NavbarLink href="/leaderboard">Leaderboard</NavbarLink>
            </>
          )}

          <NavbarLink href="/rules">Rules</NavbarLink>

          <button
            type="button"
            onClick={logout}
            className="rounded-xl bg-red-500/80 px-3 py-2 text-center text-xs font-bold text-white transition hover:bg-red-500 sm:px-4 sm:text-sm"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}

type NavbarLinkProps = {
  href: string;
  children: React.ReactNode;
};

function NavbarLink({ href, children }: NavbarLinkProps) {
  return (
    <Link
      href={href}
      className="rounded-xl bg-white/10 px-3 py-2 text-center text-xs font-bold text-white transition hover:bg-white/20 sm:px-4 sm:text-sm"
    >
      {children}
    </Link>
  );
}