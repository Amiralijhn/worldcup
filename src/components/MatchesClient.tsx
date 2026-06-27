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
  "Playoff",
  "Final",
];

function getTorontoDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
}

function getTorontoDateKey(date: Date) {
  const { year, month, day } = getTorontoDateParts(date);

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
}

function addDaysToTorontoDateKey(date: Date, days: number) {
  const { year, month, day } = getTorontoDateParts(date);

  const result = new Date(Date.UTC(year, month - 1, day + days));

  return result.toISOString().slice(0, 10);
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

function formatDateTile(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00Z`);

  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "2-digit",
  }).format(date);
}

function formatDateTitle(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00Z`);

  return new Intl.DateTimeFormat("en-CA", {
    weekday: "long",
    month: "long",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function isMatchToday(kickoffAt: string) {
  return (
    getTorontoDateKey(new Date(kickoffAt)) ===
    getTorontoDateKey(new Date())
  );
}

function isMatchTomorrow(kickoffAt: string) {
  return (
    getTorontoDateKey(new Date(kickoffAt)) ===
    addDaysToTorontoDateKey(new Date(), 1)
  );
}

export default function MatchesClient({ matches }: MatchesClientProps) {
  const [items, setItems] = useState(matches);
  const [stageFilter, setStageFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  const todayKey = getTorontoDateKey(new Date());

  const dateKeys = useMemo(() => {
    const uniqueDates = new Set<string>();

    items.forEach((match) => {
      uniqueDates.add(getTorontoDateKey(new Date(match.kickoffAt)));
    });

    return Array.from(uniqueDates).sort();
  }, [items]);

  const defaultDateKey =
    dateKeys.find((dateKey) => dateKey >= todayKey) || dateKeys[0] || "";

  const [selectedDateKey, setSelectedDateKey] = useState(defaultDateKey);

  const selectedDateMatches = useMemo(() => {
    return items.filter((match) => {
      const matchDateKey = getTorontoDateKey(new Date(match.kickoffAt));

      const dateMatch = matchDateKey === selectedDateKey;

      const searchMatch =
        `${match.matchNumber} ${match.team1} ${match.team2}`
          .toLowerCase()
          .includes(search.trim().toLowerCase());

      const stageMatch = stageFilter === "All" || match.stage === stageFilter;

      return dateMatch && searchMatch && stageMatch;
    });
  }, [items, selectedDateKey, search, stageFilter]);

  const selectedDateIsPast = selectedDateKey < todayKey;

  const selectedDateTotalPoints = selectedDateMatches.reduce(
    (sum, match) => sum + (match.prediction?.points ?? 0),
    0
  );

  function getDatePoints(dateKey: string) {
    const matchesOnDate = items.filter(
      (match) => getTorontoDateKey(new Date(match.kickoffAt)) === dateKey
    );

    return matchesOnDate.reduce(
      (sum, match) => sum + (match.prediction?.points ?? 0),
      0
    );
  }

  function updateLocalPrediction(
    matchId: number,
    field: "predTeam1Score" | "predTeam2Score",
    value: number
  ) {
    setItems((current) =>
      current.map((match) => {
        if (match.id !== matchId) {
          return match;
        }

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
      setMessageType("error");
      setMessage("Please enter both scores first.");
      return;
    }

    try {
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
        setMessageType("error");
        setMessage(data.error || "Could not save prediction.");
        return;
      }

      setMessageType("success");
      setMessage(data.message || "Prediction saved successfully.");
    } catch {
      setMessageType("error");
      setMessage("Unable to connect to the server.");
    }
  }

  return (
    <section>
      <div className="mb-6 rounded-3xl border border-white/10 bg-white/10 p-5">
        <h2 className="text-3xl font-black">Matches</h2>

        <p className="mt-2 text-white/60">
          Select a date to see the matches on that day.
        </p>

        {message && (
          <p
            className={`mt-4 rounded-xl p-3 text-sm ${
              messageType === "success"
                ? "bg-green-500/20 text-green-100"
                : "bg-red-500/20 text-red-100"
            }`}
          >
            {message}
          </p>
        )}

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <input
            className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
            placeholder="Search team or match number"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
            value={stageFilter}
            onChange={(event) => setStageFilter(event.target.value)}
          >
            {stages.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6 rounded-3xl border border-white/10 bg-white/10 p-5">
        <h3 className="text-xl font-black">Choose Date</h3>

        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {dateKeys.map((dateKey) => {
            const isSelected = selectedDateKey === dateKey;
            const isPast = dateKey < todayKey;
            const isToday = dateKey === todayKey;
            const isTomorrow = dateKey === addDaysToTorontoDateKey(new Date(), 1);
            const totalPoints = getDatePoints(dateKey);

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => setSelectedDateKey(dateKey)}
                className={`min-w-[130px] rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? "border-green-400 bg-green-400 text-slate-950"
                    : "border-white/10 bg-black/20 text-white hover:bg-white/10"
                }`}
              >
                <p className="text-lg font-black">{formatDateTile(dateKey)}</p>

                <p
                  className={`mt-1 text-xs font-bold ${
                    isSelected ? "text-slate-800" : "text-white/50"
                  }`}
                >
                  {isToday
                    ? "Today"
                    : isTomorrow
                    ? "Tomorrow"
                    : isPast
                    ? "Past"
                    : "Upcoming"}
                </p>

                {isPast && (
                  <p
                    className={`mt-2 text-xs font-black ${
                      isSelected ? "text-slate-950" : "text-green-300"
                    }`}
                  >
                    Points: {totalPoints}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-green-400/20 bg-green-400/10 p-4">
        <h3 className="font-black text-green-300">
          {selectedDateKey ? formatDateTitle(selectedDateKey) : "Selected Date"}
        </h3>

        <p className="mt-1 text-sm text-white/60">
          Showing matches for the selected date.
        </p>
      </div>

      {selectedDateMatches.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/10 p-8 text-center">
          <h3 className="text-xl font-black">No matches found</h3>

          <p className="mt-2 text-sm text-white/60">
            Try selecting another date, stage, or search text.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {selectedDateMatches.map((match) => {
            const kickoff = new Date(match.kickoffAt);

            const locked = kickoff <= new Date() || match.status === "FINISHED";

            const today = isMatchToday(match.kickoffAt);
            const tomorrow = isMatchTomorrow(match.kickoffAt);

            const hasResult =
              match.actualTeam1Score !== null &&
              match.actualTeam2Score !== null;

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

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <p className="text-sm text-white/60">
                        {formatKickoff(match.kickoffAt)}
                      </p>

                      {today && (
                        <span className="rounded-full bg-green-400 px-2 py-1 text-xs font-black text-slate-950">
                          Today
                        </span>
                      )}

                      {tomorrow && (
                        <span className="rounded-full bg-blue-400 px-2 py-1 text-xs font-black text-slate-950">
                          Tomorrow
                        </span>
                      )}
                    </div>
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

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-black/20 p-4">
                    <p className="text-sm text-white/50">Final Result</p>

                    <p className="mt-1 text-xl font-black">
                      {hasResult
                        ? `${match.actualTeam1Score} - ${match.actualTeam2Score}`
                        : "Not added yet"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-black/20 p-4">
                    <p className="text-sm text-white/50">Your Prediction</p>

                    <p className="mt-1 text-xl font-black">
                      {match.prediction
                        ? `${match.prediction.predTeam1Score} - ${match.prediction.predTeam2Score}`
                        : "No prediction"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-black/20 p-4">
                    <p className="text-sm text-white/50">Points Earned</p>

                    <p className="mt-1 text-xl font-black text-green-300">
                      {hasResult ? match.prediction?.points ?? 0 : "Pending"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto_1fr_auto] sm:items-center">
                  <span className="font-bold">{match.team1}</span>

                  <input
                    type="number"
                    min="0"
                    disabled={locked}
                    value={match.prediction?.predTeam1Score ?? ""}
                    onChange={(event) =>
                      updateLocalPrediction(
                        match.id,
                        "predTeam1Score",
                        Number(event.target.value)
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-center text-white outline-none disabled:opacity-40 sm:w-20"
                  />

                  <span className="hidden sm:block">-</span>

                  <input
                    type="number"
                    min="0"
                    disabled={locked}
                    value={match.prediction?.predTeam2Score ?? ""}
                    onChange={(event) =>
                      updateLocalPrediction(
                        match.id,
                        "predTeam2Score",
                        Number(event.target.value)
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-center text-white outline-none disabled:opacity-40 sm:w-20"
                  />

                  <span className="font-bold">{match.team2}</span>

                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => savePrediction(match)}
                    className="rounded-xl bg-green-400 px-4 py-3 font-black text-slate-950 transition hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Save
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedDateIsPast && (
        <div className="mt-6 rounded-3xl border border-green-400/20 bg-green-400/10 p-5 text-center">
          <p className="text-sm font-bold text-green-300">
            Total points earned on {formatDateTile(selectedDateKey)}
          </p>

          <p className="mt-2 text-4xl font-black text-white">
            {selectedDateTotalPoints}
          </p>
        </div>
      )}
    </section>
  );
}