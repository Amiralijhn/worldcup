import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "World Cup Prediction",
  description: "World Cup 2026 prediction website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <nav className="border-b bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-xl font-bold text-slate-900">
              WorldCupPredictions
            </Link>

            <div className="flex gap-5 text-sm font-medium text-slate-700">
              <Link href="/" className="hover:text-blue-600">
                Home
              </Link>
              <Link href="/login" className="hover:text-blue-600">
                Login
              </Link>
              <Link href="/dashboard" className="hover:text-blue-600">
                Dashboard
              </Link>
              <Link href="/leaderboard" className="hover:text-blue-600">
                Leaderboard
              </Link>
              <Link href="/admin" className="hover:text-blue-600">
                Admin
              </Link>
            </div>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}