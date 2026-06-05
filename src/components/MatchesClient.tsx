"use client";

import { useMemo, useState } from "react";

type MatchItem = {
  id: number;
  matchNumber: number;
  team1: string;
  team2: string;
  stage: string;
  kickoffAt: string;
  actualTeam1Score: number | null;
  actualTeam2Score: number | null;
  status: string;
  prediction: {
    predTeam1Score: number;
    predTeam2Score: number;
    points: number | null;
  } | null;
};

type MatchesClientProps = {
  matches: MatchItem[];
};

const stages = [
  "All",
  "Group Stage",
  "1/32",
  "1/16",
  "1/8",
  "1/4",
  "1/2 Final",
  "Final",
];

function formatKickoff(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export default function MatchesClient({ matches }: MatchesClientProps) {
  const [items, setItems] = useState(matches);
  const [timeFilter, setTimeFilter] = useState("future");
  const [stageFilter, setStageFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const filteredMatches = useMemo(() => {
    const now = new Date();

    return items.filter((match) => {
      const kickoff = new Date(match.kickoffAt);

      const searchMatch = `${match.matchNumber} ${match.team1} ${match.team2}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const stageMatch =
        stageFilter === "All" || match.stage === stageFilter;

      const isPrevious =
        match.status === "FINISHED" || kickoff < now;

      const isToday =
        kickoff.toDateString() === now.toDateString();

      const isFuture =
        kickoff > now && match.status !== "FINISHED";

      const timeMatch =
        timeFilter === "all" ||
        (timeFilter === "previous" && isPrevious) ||
        (timeFilter === "today" && isToday) ||
        (timeFilter === "future" && isFuture);

      return searchMatch && stageMatch && timeMatch;
    });
  }, [items, search, stageFilter, timeFilter]);

  function updateLocalPrediction(
    matchId: number,
    field: "predTeam1Score" | "predTeam2Score",
    value: number
  ) {
    setItems((current) =>
      current.map((match) => {
        if (match.id !== matchId) return match;

        return {
          ...match,
          prediction: {
            predTeam1Score:
              field === "predTeam1Score"
                ? value
                : match.prediction?.predTeam1Score ?? 0,
            predTeam2Score:
              field === "predTeam2Score"
                ? value
                : match.prediction?.predTeam2Score ?? 0,
            points: match.prediction?.points ?? null,
          },
        };
      })
    );
  }


async function savePrediction(match: MatchItem) {
  if (!match.prediction) {
    setMessage("Please enter both scores first.");
    return;
  }

  const response = await fetch("/api/predictions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      matchId: match.id,
      predTeam1Score: match.prediction.predTeam1Score,
      predTeam2Score: match.prediction.predTeam2Score,
    }),
  });

  const text = await response.text();

  let data: { error?: string; message?: string } = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!response.ok) {
    setMessage(data.error || "Could not save prediction");
    return;
  }

  setMessage(data.message || "Prediction saved successfully.");
}


  return (
    <section>
      <div className="mb-6 rounded-3xl border border-white/10 bg-white/10 p-5">
        <h2 className="text-3xl font-black">Matches</h2>
        <p className="mt-2 text-white/60">
          Filter matches and predict future match scores.
        </p>

        {message && (
          <p className="mt-4 rounded-xl bg-green-500/20 p-3 text-sm text-green-100">
            {message}
          </p>
        )}

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <input
            className="rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none"
            placeholder="Search team or match number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option value="future">Future matches</option>
            <option value="today">Today matches</option>
            <option value="previous">Previous matches</option>
            <option value="all">All matches</option>
          </select>

          <select
            className="rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
          >
            {stages.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredMatches.map((match) => {
          const kickoff = new Date(match.kickoffAt);
          const locked =
            kickoff <= new Date() || match.status === "FINISHED";

          return (
            <div
              key={match.id}
              className="rounded-3xl border border-white/10 bg-white/10 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-green-300">
                    Match {match.matchNumber} · {match.stage}
                  </p>

                  <h3 className="mt-1 text-2xl font-black">
                    {match.team1} vs {match.team2}
                  </h3>

                  <p className="mt-1 text-white/60">
                    {formatKickoff(match.kickoffAt)}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    locked
                      ? "bg-red-500/20 text-red-100"
                      : "bg-green-500/20 text-green-100"
                  }`}
                >
                  {locked ? "Locked" : "Open"}
                </span>
              </div>

              {match.status === "FINISHED" && (
                <p className="mt-4 text-white/70">
                  Actual score:{" "}
                  <span className="font-black text-white">
                    {match.actualTeam1Score} - {match.actualTeam2Score}
                  </span>{" "}
                  · Your points:{" "}
                  <span className="font-black text-green-300">
                    {match.prediction?.points ?? 0}
                  </span>
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="w-48 font-bold">{match.team1}</span>

                <input
                  type="number"
                  min="0"
                  disabled={locked}
                  value={match.prediction?.predTeam1Score ?? ""}
                  onChange={(e) =>
                    updateLocalPrediction(
                      match.id,
                      "predTeam1Score",
                      Number(e.target.value)
                    )
                  }
                  className="w-20 rounded-xl bg-black/30 border border-white/10 px-3 py-3 text-center text-white outline-none disabled:opacity-40"
                />

                <span>-</span>

                <input
                  type="number"
                  min="0"
                  disabled={locked}
                  value={match.prediction?.predTeam2Score ?? ""}
                  onChange={(e) =>
                    updateLocalPrediction(
                      match.id,
                      "predTeam2Score",
                      Number(e.target.value)
                    )
                  }
                  className="w-20 rounded-xl bg-black/30 border border-white/10 px-3 py-3 text-center text-white outline-none disabled:opacity-40"
                />

                <span className="w-48 font-bold">{match.team2}</span>

                <button
                  disabled={locked}
                  onClick={() => savePrediction(match)}
                  className="rounded-xl bg-green-400 px-4 py-3 font-black text-slate-950 disabled:opacity-40"
                >
                  Save
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}