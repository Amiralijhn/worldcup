"use client";

import { useState } from "react";

export default function UpdateNotice() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  return (
    <section className="mb-6 rounded-3xl border border-red-400/40 bg-red-500/15 p-5 shadow-xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-red-300">
            !!! Update Note !!!
          </p>

          <h2 className="mt-1 text-2xl font-black text-white">
            Knockout Match Prediction Update - MUST Choose the Winner
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-white/80">
            For knockout matches, you MUST now predict both the match score and
            the team you think will advance after regular time, extra time, or
            penalties. If you do not choose a winner, your knockout prediction
            will not save.
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

      <div className="mt-5 rounded-2xl border border-red-300/20 bg-red-400/10 p-4">
        <h3 className="text-lg font-black text-white">
          New Match Page Features
        </h3>

        <ul className="mt-4 grid gap-2 text-sm text-white/80 sm:grid-cols-3">
          <li className="rounded-xl border border-red-300/20 bg-black/20 p-3 font-bold">
            Your prediction is for the final match score entered by admin.
          </li>

          <li className="rounded-xl border border-red-300/20 bg-black/20 p-3 font-bold">
            Correct prediction of the advancing team gives +1 point.
          </li>

          <li className="rounded-xl border border-red-300/20 bg-black/20 p-3 font-bold">
            Select the advancing team using radio buttons after selecting the
            score.
          </li>
        </ul>
      </div>
    </section>
  );
}