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

type PredictionRowProps = {
  prediction: AdminPrediction;
  onSave: (
    predictionId: number,
    predTeam1Score: number,
    predTeam2Score: number,
    points: number
  ) => Promise<void>;
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

function addDaysToTorontoDateKey(date: Date, numberOfDays: number) {
  const { year, month, day } = getTorontoDateParts(date);

  const result = new Date(
    Date.UTC(year, month - 1, day + numberOfDays)
  );

  return result.toISOString().slice(0, 10);
}

function getEndOfWeekDateKey(date: Date) {
  const { year, month, day } = getTorontoDateParts(date);

  const temporaryDate = new Date(
    Date.UTC(year, month - 1, day)
  );

  const dayOfWeek = temporaryDate.getUTCDay();
  const daysUntilSunday =
    dayOfWeek === 0 ? 0 : 7 - dayOfWeek;

  temporaryDate.setUTCDate(
    temporaryDate.getUTCDate() + daysUntilSunday
  );

  return temporaryDate.toISOString().slice(0, 10);
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
  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("success");

  const filteredMatches = useMemo(() => {
    const now = new Date();

    const next24Hours = new Date(
      now.getTime() + 24 * 60 * 60 * 1000
    );

    const todayKey = getTorontoDateKey(now);
    const tomorrowKey = addDaysToTorontoDateKey(now, 1);
    const endOfWeekKey = getEndOfWeekDateKey(now);

    return items.filter((match) => {
      const kickoff = new Date(match.kickoffAt);
      const kickoffDateKey = getTorontoDateKey(kickoff);

      const searchMatches =
        `${match.matchNumber} ${match.team1} ${match.team2}`
          .toLowerCase()
          .includes(search.trim().toLowerCase());

      const stageMatches =
        stageFilter === "All" ||
        match.stage === stageFilter;

      const isPrevious =
        kickoff < now || match.status === "FINISHED";

      let timeMatches = false;

      switch (timeFilter) {
        case "next24":
          timeMatches =
            kickoff >= now &&
            kickoff <= next24Hours &&
            match.status !== "FINISHED";
          break;

        case "today":
          timeMatches = kickoffDateKey === todayKey;
          break;

        case "tomorrow":
          timeMatches = kickoffDateKey === tomorrowKey;
          break;

        case "thisWeek":
          timeMatches =
            kickoff >= now &&
            kickoffDateKey <= endOfWeekKey &&
            match.status !== "FINISHED";
          break;

        case "future":
          timeMatches =
            kickoff > now &&
            match.status !== "FINISHED";
          break;

        case "previous":
          timeMatches = isPrevious;
          break;

        case "all":
          timeMatches = true;
          break;
      }

      return (
        searchMatches &&
        stageMatches &&
        timeMatches
      );
    });
  }, [items, search, stageFilter, timeFilter]);

  async function updatePrediction(
    predictionId: number,
    predTeam1Score: number,
    predTeam2Score: number,
    points: number
  ) {
    setMessage("");

    try {
      const response = await fetch(
        "/api/admin/prediction-points",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            predictionId,
            predTeam1Score,
            predTeam2Score,
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
          data = {
            error: "The server returned an invalid response.",
          };
        }
      }

      if (!response.ok) {
        setMessageType("error");
        setMessage(
          data.error || "Could not update prediction."
        );
        return;
      }

      setItems((currentItems) =>
        currentItems.map((match) => ({
          ...match,
          predictions: match.predictions.map(
            (prediction) =>
              prediction.id === predictionId
                ? {
                    ...prediction,
                    predTeam1Score,
                    predTeam2Score,
                    points,
                  }
                : prediction
          ),
        }))
      );

      setMessageType("success");
      setMessage(
        data.message ||
          "Prediction updated successfully."
      );
    } catch {
      setMessageType("error");
      setMessage("Unable to connect to the server.");
    }
  }

  return (
    <section>
      <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
        <h1 className="text-3xl font-black">
          Admin Match Management
        </h1>

        <p className="mt-2 text-white/60">
          Filter matches, review user predictions, and adjust
          predicted scores and points.
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

      {filteredMatches.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-white/10 bg-white/10 p-8 text-center">
          <h2 className="text-xl font-black">
            No matches found
          </h2>

          <p className="mt-2 text-sm text-white/60">
            Try changing the filters or search text.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {filteredMatches.map((match) => {
            const isSelected =
              selectedMatchId === match.id;

            return (
              <div
                key={match.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-white/10"
              >
                <button
                  type="button"
                  onClick={() =>
                    setSelectedMatchId(
                      isSelected ? null : match.id
                    )
                  }
                  className="w-full p-5 text-left transition hover:bg-white/5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-green-300">
                        Match {match.matchNumber} ·{" "}
                        {match.stage}
                      </p>

                      <h2 className="mt-1 text-2xl font-black">
                        {match.team1} vs {match.team2}
                      </h2>

                      <p className="mt-1 text-sm text-white/60">
                        {formatKickoff(match.kickoffAt)}
                      </p>

                      <p className="mt-2 text-sm text-white/50">
                        {match.predictions.length} submitted{" "}
                        prediction
                        {match.predictions.length === 1
                          ? ""
                          : "s"}
                      </p>
                    </div>

                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
                      {isSelected
                        ? "Hide predictions"
                        : "View predictions"}
                    </span>
                  </div>
                </button>

                {isSelected && (
                  <div className="border-t border-white/10 p-5">
                    {match.predictions.length === 0 ? (
                      <p className="text-sm text-white/60">
                        No users have submitted predictions
                        for this match.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                          <thead className="border-b border-white/10 text-white/50">
                            <tr>
                              <th className="p-3">Player</th>
                              <th className="p-3">Username</th>
                              <th className="p-3">
                                Predicted Score
                              </th>
                              <th className="p-3">
                                Current Points
                              </th>
                              <th className="p-3">
                                New Points
                              </th>
                              <th className="p-3">Save</th>
                            </tr>
                          </thead>

                          <tbody>
                            {match.predictions.map(
                              (prediction) => (
                                <PredictionRow
                                  key={prediction.id}
                                  prediction={prediction}
                                  onSave={updatePrediction}
                                />
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function PredictionRow({
  prediction,
  onSave,
}: PredictionRowProps) {
  const [predTeam1Score, setPredTeam1Score] = useState(
    prediction.predTeam1Score
  );

  const [predTeam2Score, setPredTeam2Score] = useState(
    prediction.predTeam2Score
  );

  const [points, setPoints] = useState(
    prediction.points ?? 0
  );

  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);

    try {
      await onSave(
        prediction.id,
        predTeam1Score,
        predTeam2Score,
        points
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="border-b border-white/10">
      <td className="p-3 font-bold">
        {prediction.user.displayName}
      </td>

      <td className="p-3 text-white/60">
        {prediction.user.username}
      </td>

      <td className="p-3">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            value={predTeam1Score}
            onChange={(event) =>
              setPredTeam1Score(
                Number(event.target.value)
              )
            }
            className="w-16 rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-center text-white outline-none"
          />

          <span>-</span>

          <input
            type="number"
            min="0"
            value={predTeam2Score}
            onChange={(event) =>
              setPredTeam2Score(
                Number(event.target.value)
              )
            }
            className="w-16 rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-center text-white outline-none"
          />
        </div>
      </td>

      <td className="p-3 font-bold text-green-300">
        {prediction.points ?? 0}
      </td>

      <td className="p-3">
        <input
          type="number"
          value={points}
          onChange={(event) =>
            setPoints(Number(event.target.value))
          }
          className="w-20 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-center text-white outline-none"
        />
      </td>

      <td className="p-3">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="rounded-lg bg-green-400 px-3 py-2 font-black text-slate-950 transition hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </td>
    </tr>
  );
}