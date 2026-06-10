"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginSignupForm() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const url = mode === "login" ? "/api/auth/login" : "/api/auth/signup";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        displayName,
        username,
        password,
      }),
    });

    const data = await response.json();

    setLoading(false);

    if (!response.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    if (data.user.role === "ADMIN") {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-950 via-slate-950 to-black flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl bg-white/10 border border-white/10 p-8 shadow-2xl backdrop-blur"
      >
        <h1 className="text-3xl font-black text-white text-center">
          World Cup Prediction
        </h1>

        <p className="text-white/60 text-center mt-2 mb-6">
          Private tournament portal
        </p>

        <div className="grid grid-cols-2 gap-2 bg-black/30 rounded-2xl p-2 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={`rounded-xl py-3 font-bold ${
              mode === "login"
                ? "bg-green-400 text-slate-950"
                : "text-white/60"
            }`}
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError("");
            }}
            className={`rounded-xl py-3 font-bold ${
              mode === "signup"
                ? "bg-green-400 text-slate-950"
                : "text-white/60"
            }`}
          >
            Sign Up
          </button>
        </div>

        {mode === "signup" && (
          <>
            <label className="block text-sm font-bold text-white/70 mb-2">
              Full Name
            </label>
            <input
              className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white outline-none mb-4"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </>
        )}

        <label className="block text-sm font-bold text-white/70 mb-2">
          Username
        </label>
        <input
          className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white outline-none mb-4"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <label className="block text-sm font-bold text-white/70 mb-2">
          Password
        </label>
        <input
          className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white outline-none mb-4"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {mode === "signup" && (
          <>
            <label className="block text-sm font-bold text-white/70 mb-2">
              Confirm Password
            </label>
            <input
              className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white outline-none mb-4"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </>
        )}

        {error && (
          <p className="mb-4 rounded-xl bg-red-500/20 p-3 text-sm text-red-100">
            {error}
          </p>
        )}

        <button
          disabled={loading}
          className="w-full rounded-xl bg-green-400 px-4 py-3 font-black text-slate-950 disabled:opacity-60"
        >
          {loading
            ? "Please wait..."
            : mode === "login"
            ? "Login"
            : "Create Account"}
        </button>
            <div className="mt-5 text-center">
  <Link
    href="/rules"
    className="text-sm font-bold text-green-300 hover:text-green-200 hover:underline"
  >
    Read Tournament Rules
  </Link>
</div>

        


      </form>
    </main>
  );
}