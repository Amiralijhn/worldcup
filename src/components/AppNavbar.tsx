"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";

type AppNavbarProps = {
  name: string;
  role: "ADMIN" | "PLAYER";
};

type NavbarLinkProps = {
  href: string;
  children: ReactNode;
  onClick?: () => void;
};

export default function AppNavbar({
  name,
  role,
}: AppNavbarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="mb-6 w-full rounded-2xl border border-white/10 bg-white/10 p-3 shadow-xl sm:rounded-3xl sm:p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-black text-white sm:text-xl">
            World Cup Prediction
          </h1>

          <p className="mt-1 truncate text-xs text-white/60 sm:text-sm">
            Logged in as {name}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className="rounded-xl bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-green-300 lg:hidden"
        >
          {menuOpen ? "Close" : "Menu"}
        </button>

        <nav className="hidden flex-wrap justify-end gap-2 lg:flex">
          <NavbarItems
            role={role}
            logout={logout}
          />
        </nav>
      </div>

      {menuOpen && (
        <nav className="mt-4 grid gap-2 border-t border-white/10 pt-4 lg:hidden">
          <NavbarItems
            role={role}
            logout={logout}
            onLinkClick={closeMenu}
          />
        </nav>
      )}
    </header>
  );
}

function NavbarItems({
  role,
  logout,
  onLinkClick,
}: {
  role: "ADMIN" | "PLAYER";
  logout: () => void;
  onLinkClick?: () => void;
}) {
  return (
    <>
      {role === "PLAYER" && (
        <>
          <NavbarLink href="/dashboard" onClick={onLinkClick}>
            Portal
          </NavbarLink>

          <NavbarLink href="/matches" onClick={onLinkClick}>
            Matches
          </NavbarLink>

          <NavbarLink href="/standings" onClick={onLinkClick}>
            Standings
          </NavbarLink>

          <NavbarLink href="/leaderboard" onClick={onLinkClick}>
            Leaderboard
          </NavbarLink>
        </>
      )}

      {role === "ADMIN" && (
        <>
          <NavbarLink href="/admin" onClick={onLinkClick}>
            Manage Matches
          </NavbarLink>

          <NavbarLink href="/standings" onClick={onLinkClick}>
            Standings
          </NavbarLink>
        </>
      )}

      <NavbarLink href="/rules" onClick={onLinkClick}>
        Rules
      </NavbarLink>

      <NavbarLink href="/change-password" onClick={onLinkClick}>
        Change Password
      </NavbarLink>

      <button
        type="button"
        onClick={() => {
          onLinkClick?.();
          logout();
        }}
        className="rounded-xl bg-red-500/80 px-3 py-2 text-center text-xs font-bold text-white transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-300 sm:px-4 sm:text-sm"
      >
        Logout
      </button>
    </>
  );
}

function NavbarLink({
  href,
  children,
  onClick,
}: NavbarLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="rounded-xl bg-white/10 px-3 py-2 text-center text-xs font-bold text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-green-300 sm:px-4 sm:text-sm"
    >
      {children}
    </Link>
  );
}