"use client";

import { useMemo, useState } from "react";

type AdminPrediction = {
  id: number;
  predTeam1Score: number;
  predTeam2Score: number;
  points: number | null;
  user: {
    id: number;
    username: string;
    displayName: string;
  };
};

type AdminMatch = {
  id: number;
  matchNumber: number;
  team1: string;
  team2: string;
  stage: string;
  kickoffAt: string;
  status: string;
  actualTeam1Score: number | null;
  actualTeam2Score: number | null;
  predictions: AdminPrediction[];
};

type AdminMatchesClientProps = {
  matches: AdminMatch[];
};

type TimeFilter =
  | "next24"
  | "today"
  | "tomorrow"
  | "thisWeek"
  | "future"
  | "previous"
  | "all";

const stages = [
  "All",
  "Group Stage",
  "1/32",
  "1/16",
  "1/8",
  "1/4",
  "1/2 Final",
  "Playoff",
  "Final",
];

function getTorontoDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addDays(date: Date, numberOfDays: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + numberOfDays);
  return result;
}

function formatKickoff(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

export default function AdminMatchesClient({
  matches,
}: AdminMatchesClientProps) {
  const [items, setItems] = useState(matches);
  const [selectedMatchId, setSelectedMatchId] =
    useState<number | null>(null);

  const [timeFilter, setTimeFilter] =
    useState<TimeFilter>("all");

  const [stageFilter, setStageFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const filteredMatches = useMemo(() => {
    const now = new Date();
    const next24Hours = new Date(
      now.getTime() + 24 * 60 * 60 * 1000
    );

    const todayKey = getTorontoDateKey(now);
    const tomorrowKey = getTorontoDateKey(addDays(now, 1));
    const weekEnd = addDays(now, 7);

    return items.filter((match) => {
      const kickoff = new Date(match.kickoffAt);
      const kickoffDateKey = getTorontoDateKey(kickoff);

      const searchMatches =
        `${match.matchNumber} ${match.team1} ${match.team2}`
          .toLowerCase()
          .includes(search.trim().toLowerCase());

      const stageMatches =
        stageFilter === "All" || match.stage === stageFilter;

      const isPrevious =
        kickoff < now || match.status === "FINISHED";

      let timeMatches = false;

      switch (timeFilter) {
        case "next24":
          timeMatches =
            kickoff >= now && kickoff <= next24Hours;
          break;

        case "today":
          timeMatches = kickoffDateKey === todayKey;
          break;

        case "tomorrow":
          timeMatches = kickoffDateKey === tomorrowKey;
          break;

        case "thisWeek":
          timeMatches =
            kickoff >= now && kickoff <= weekEnd;
          break;

        case "future":
          timeMatches =
            kickoff >= now &&
            match.status !== "FINISHED";
          break;

        case "previous":
          timeMatches = isPrevious;
          break;

        case "all":
          timeMatches = true;
          break;
      }

      return searchMatches && stageMatches && timeMatches;
    });
  }, [items, search, stageFilter, timeFilter]);

  const selectedMatch = items.find(
    (match) => match.id === selectedMatchId
  );

  async function updatePredictionPoints(
    predictionId: number,
    points: number
  ) {
    setMessage("");

    const response = await fetch(
      "/api/admin/prediction-points",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          predictionId,
          points,
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
        data.error = "Invalid server response.";
      }
    }

    if (!response.ok) {
      setMessage(
        data.error || "Could not update prediction points."
      );
      return;
    }

    setItems((currentItems) =>
      currentItems.map((match) => ({
        ...match,
        predictions: match.predictions.map((prediction) =>
          prediction.id === predictionId
            ? {
                ...prediction,
                points,
              }
            : prediction
        ),
      }))
    );

    setMessage(
      data.message || "Prediction points updated."
    );
  }

  return (
    <section>
      <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
        <h1 className="text-3xl font-black">
          Admin Match Management
        </h1>

        <p className="mt-2 text-white/60">
          Filter matches, review user predictions, and adjust
          prediction points.
        </p>

        {message && (
          <p className="mt-4 rounded-xl bg-green-500/20 p-3 text-sm text-green-100">
            {message}
          </p>
        )}

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search team or match number"
            className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
          />

          <select
            value={timeFilter}
            onChange={(event) =>
              setTimeFilter(
                event.target.value as TimeFilter
              )
            }
            className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
          >
            <option value="next24">Next 24 Hours</option>
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="thisWeek">This Week</option>
            <option value="future">Future</option>
            <option value="previous">Previous</option>
            <option value="all">All Matches</option>
          </select>

          <select
            value={stageFilter}
            onChange={(event) =>
              setStageFilter(event.target.value)
            }
            className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
          >
            {stages.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {filteredMatches.map((match) => (
          <button
            key={match.id}
            type="button"
            onClick={() =>
              setSelectedMatchId(
                selectedMatchId === match.id
                  ? null
                  : match.id
              )
            }
            className="w-full rounded-3xl border border-white/10 bg-white/10 p-5 text-left transition hover:bg-white/15"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-green-300">
                  Match {match.matchNumber} · {match.stage}
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  {match.team1} vs {match.team2}
                </h2>

                <p className="mt-1 text-sm text-white/60">
                  {formatKickoff(match.kickoffAt)}
                </p>

                <p className="mt-2 text-sm text-white/50">
                  {match.predictions.length} submitted prediction
                  {match.predictions.length === 1 ? "" : "s"}
                </p>
              </div>

              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
                {selectedMatchId === match.id
                  ? "Hide predictions"
                  : "View predictions"}
              </span>
            </div>
          </button>
        ))}
      </div>

      {selectedMatch && (
        <section className="mt-6 rounded-3xl border border-green-400/20 bg-green-400/10 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-bold text-green-300">
                Match {selectedMatch.matchNumber}
              </p>

              <h2 className="mt-1 text-2xl font-black">
                {selectedMatch.team1} vs{" "}
                {selectedMatch.team2}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setSelectedMatchId(null)}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold"
            >
              Close
            </button>
          </div>

          {selectedMatch.predictions.length === 0 ? (
            <p className="mt-5 text-white/60">
              No users have submitted predictions for this match.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="border-b border-white/10 text-white/50">
                  <tr>
                    <th className="p-3">Player</th>
                    <th className="p-3">Username</th>
                    <th className="p-3">Prediction</th>
                    <th className="p-3">Current points</th>
                    <th className="p-3">Adjust points</th>
                  </tr>
                </thead>

                <tbody>
                  {selectedMatch.predictions.map(
                    (prediction) => (
                      <PredictionRow
                        key={prediction.id}
                        prediction={prediction}
                        onSave={updatePredictionPoints}
                      />
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </section>
  );
}

type PredictionRowProps = {
  prediction: AdminPrediction;
  onSave: (
    predictionId: number,
    points: number
  ) => Promise<void>;
};

function PredictionRow({
  prediction,
  onSave,
}: PredictionRowProps) {
  const [points, setPoints] = useState(
    prediction.points ?? 0
  );

  return (
    <tr className="border-b border-white/10">
      <td className="p-3 font-bold">
        {prediction.user.displayName}
      </td>

      <td className="p-3 text-white/60">
        {prediction.user.username}
      </td>

      <td className="p-3 font-black">
        {prediction.predTeam1Score} -{" "}
        {prediction.predTeam2Score}
      </td>

      <td className="p-3 text-green-300">
        {prediction.points ?? 0}
      </td>

      <td className="p-3">
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={points}
            onChange={(event) =>
              setPoints(Number(event.target.value))
            }
            className="w-20 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-center text-white"
          />

          <button
            type="button"
            onClick={() =>
              onSave(prediction.id, points)
            }
            className="rounded-lg bg-green-400 px-3 py-2 font-black text-slate-950"
          >
            Save
          </button>
        </div>
      </td>
    </tr>
  );
}