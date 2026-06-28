"use client";

import { useState } from "react";

export default function UpdateNotice() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="mb-6 grid gap-4">
      <section className="rounded-3xl border border-red-400/40 bg-red-500/15 p-5 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-red-300">
              !!! Update Note !!!
            </p>

            <h2 className="mt-1 text-2xl font-black text-white">
              Knockout Match Prediction Update - MUST Choose the Winner
            </h2>

            <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-white/80">
              For knockout matches, you MUST now predict both the legal time
              score and the team you think will advance after legal time or
              penalties. Your game score prediction is for the 90 minutes or 120
              minutes if the game had extra time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-black text-white">
              Attention
            </span>

            <button
              type="button"
              onClick={() => setIsVisible(false)}
              className="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs font-black text-white transition hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </div>

        <ul className="mt-4 grid gap-2 text-sm text-white/80 sm:grid-cols-3">
          <li className="rounded-xl border border-red-300/20 bg-red-400/10 p-3 font-bold">
            Your prediction is for the score after 90 minutes or 120 minutes.
          </li>

          <li className="rounded-xl border border-red-300/20 bg-red-400/10 p-3 font-bold">
            Correct prediction of the advancing team gives +1 point.
          </li>

          <li className="rounded-xl border border-red-300/20 bg-red-400/10 p-3 font-bold">
            Select advancing team using radio buttons after selecting the score!
          </li>
        </ul>
      </section>

      <section className="rounded-3xl border border-orange-400/40 bg-orange-500/15 p-5 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-orange-300">
              Update Note
            </p>

            <h2 className="mt-1 text-2xl font-black text-white">
              New Match Page Features
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/80">
              You can now select matches by date, filter matches by stage, view
              your points for past match days, and see all player predictions
              after a final result is added.
            </p>
          </div>
        </div>

        <ul className="mt-4 grid gap-2 text-sm text-white/80 sm:grid-cols-3">
          <li className="rounded-xl border border-orange-300/20 bg-orange-400/10 p-3">
            Date tiles added to Matches
          </li>

          <li className="rounded-xl border border-orange-300/20 bg-orange-400/10 p-3">
            Stage filters now show all games in that stage
          </li>

          <li className="rounded-xl border border-orange-300/20 bg-orange-400/10 p-3">
            Finished matches show all predictions
          </li>
        </ul>
      </section>
    </div>
  );
}