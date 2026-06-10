"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordForm() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/account/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      const text = await response.text();

      let data: {
        error?: string;
        message?: string;
      } = {};

      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = {
            error: "The server returned an invalid response.",
          };
        }
      }

      if (!response.ok) {
        setError(data.error || "Unable to change password.");
        return;
      }

      setMessage(
        data.message ||
          "Password changed successfully. Please log in again."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.push("/login");
        router.refresh();
      }, 1500);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 space-y-5 rounded-2xl border border-white/10 bg-black/20 p-5 sm:p-7"
    >
      <div>
        <label
          htmlFor="currentPassword"
          className="mb-2 block text-sm font-bold text-white/70"
        >
          Current password
        </label>

        <input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) =>
            setCurrentPassword(event.target.value)
          }
          required
          className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-green-400"
        />
      </div>

      <div>
        <label
          htmlFor="newPassword"
          className="mb-2 block text-sm font-bold text-white/70"
        >
          New password
        </label>

        <input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) =>
            setNewPassword(event.target.value)
          }
          minLength={8}
          required
          className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-green-400"
        />

        <p className="mt-2 text-xs text-white/40">
          Use at least 8 characters.
        </p>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-2 block text-sm font-bold text-white/70"
        >
          Confirm new password
        </label>

        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) =>
            setConfirmPassword(event.target.value)
          }
          minLength={8}
          required
          className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-green-400"
        />
      </div>

      {error && (
        <p className="rounded-xl border border-red-400/20 bg-red-500/15 p-3 text-sm text-red-100">
          {error}
        </p>
      )}

      {message && (
        <p className="rounded-xl border border-green-400/20 bg-green-400/10 p-3 text-sm text-green-100">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-green-400 px-4 py-3 font-black text-slate-950 transition hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Changing password..." : "Change Password"}
      </button>
    </form>
  );
}