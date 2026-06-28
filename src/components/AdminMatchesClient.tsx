"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type AdminPrediction = {
  id: number;
  predTeam1Score: number;
  predTeam2Score: number;
  predWinner: string | null;
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
  actualWinner: string | null;
  predictions: AdminPrediction[];
};

type AdminMatchesClientProps = {
  matches: AdminMatch[];
};

type PredictionRowProps = {
  prediction: AdminPrediction;
  team1: string;
  team2: string;
  isKnockout: boolean;
  onSave: (
    predictionId: number,
    predTeam1Score: number,
    predTeam2Score: number,
    points: number
  ) => Promise<void>;
};

const stageFilters = [
  { label: "All Games", value: "All" },
  { label: "Group Stage", value: "Group Stage" },
  { label: "1/32", value: "1/32" },
  { label: "1/16", value: "1/16" },
  { label: "1/8", value: "1/8" },
  { label: "1/4", value: "1/4" },
  { label: "1/2", value: "1/2 Final" },
  { label: "Playoff", value: "Playoff" },
  { label: "Final", value: "Final" },
];

const knockoutStages = [
  "1/32",
  "1/16",
  "1/8",
  "1/4",
  "1/2 Final",
  "Playoff",
  "Final",
];

function isKnockoutStage(stage: string) {
  return knockoutStages.includes(stage);
}

function getWinnerLabel(
  winner: string | null | undefined,
  team1: string,
  team2: string
) {
  if (winner === "TEAM1") return team1;
  if (winner === "TEAM2") return team2;
  return "Not selected";
}

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

function addDaysToDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);

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

function formatDateTimeLocal(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
}

function selectedDateDefaultTime(dateKey: string) {
  return `${dateKey}T15:00`;
}

function isMatchToday(kickoffAt: string) {
  return (
    getTorontoDateKey(new Date(kickoffAt)) === getTorontoDateKey(new Date())
  );
}

function isMatchTomorrow(kickoffAt: string) {
  return (
    getTorontoDateKey(new Date(kickoffAt)) ===
    addDaysToTorontoDateKey(new Date(), 1)
  );
}

export default function AdminMatchesClient({
  matches,
}: AdminMatchesClientProps) {
  const [items, setItems] = useState(matches);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);

  const [selectedStageFilter, setSelectedStageFilter] = useState<string | null>(
    null
  );

  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  const todayKey = getTorontoDateKey(new Date());
  const finalDateKey = "2026-07-19";
  const todayTileRef = useRef<HTMLButtonElement | null>(null);

  const dateKeys = useMemo(() => {
    const matchDateKeys = items.map((match) =>
      getTorontoDateKey(new Date(match.kickoffAt))
    );

    const sortedMatchDateKeys = [...matchDateKeys].sort();

    const firstMatchDateKey =
      sortedMatchDateKeys.length > 0 ? sortedMatchDateKeys[0] : todayKey;

    const startDateKey =
      firstMatchDateKey < todayKey ? firstMatchDateKey : todayKey;

    const dates: string[] = [];
    let currentDateKey = startDateKey;

    while (currentDateKey <= finalDateKey) {
      dates.push(currentDateKey);
      currentDateKey = addDaysToDateKey(currentDateKey, 1);
    }

    return dates;
  }, [items, todayKey]);

  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);

  const dateModeIsActive = selectedStageFilter === null;

  useEffect(() => {
    todayTileRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, []);

  function scrollToToday() {
    setSelectedStageFilter(null);
    setSelectedDateKey(todayKey);

    setTimeout(() => {
      todayTileRef.current?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }, 50);
  }

  function selectDate(dateKey: string) {
    setSelectedStageFilter(null);
    setSelectedDateKey(dateKey);
    setSelectedMatchId(null);
  }

  function selectStageFilter(stageValue: string) {
    setSelectedStageFilter(stageValue);
    setSelectedMatchId(null);
  }

  const selectedMatches = useMemo(() => {
    return items
      .filter((match) => {
        const matchDateKey = getTorontoDateKey(new Date(match.kickoffAt));

        const searchMatches =
          `${match.matchNumber} ${match.team1} ${match.team2}`
            .toLowerCase()
            .includes(search.trim().toLowerCase());

        if (!searchMatches) {
          return false;
        }

        if (selectedStageFilter !== null) {
          if (selectedStageFilter === "All") {
            return true;
          }

          return match.stage === selectedStageFilter;
        }

        return matchDateKey === selectedDateKey;
      })
      .sort(
        (a, b) =>
          new Date(a.kickoffAt).getTime() -
          new Date(b.kickoffAt).getTime()
      );
  }, [items, search, selectedDateKey, selectedStageFilter]);

  function getDateMatchCount(dateKey: string) {
    return items.filter(
      (match) => getTorontoDateKey(new Date(match.kickoffAt)) === dateKey
    ).length;
  }

  function getCurrentHeading() {
    if (selectedStageFilter !== null) {
      const filter = stageFilters.find(
        (stage) => stage.value === selectedStageFilter
      );

      return filter?.label || "Matches";
    }

    return selectedDateKey ? formatDateTitle(selectedDateKey) : "Selected Date";
  }

  function getCurrentDescription() {
    if (selectedStageFilter !== null) {
      if (selectedStageFilter === "All") {
        return "Showing all games, no matter the date.";
      }

      return "Showing all games in this stage, no matter the date.";
    }

    return "Showing matches for the selected date.";
  }

  async function updatePrediction(
    predictionId: number,
    predTeam1Score: number,
    predTeam2Score: number,
    points: number
  ) {
    setMessage("");

    try {
      const response = await fetch("/api/admin/prediction-points", {
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
      });

      const data = await response.json();

      if (!response.ok) {
        setMessageType("error");
        setMessage(data.error || "Could not update prediction.");
        return;
      }

      setItems((currentItems) =>
        currentItems.map((match) => ({
          ...match,
          predictions: match.predictions.map((prediction) =>
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
      setMessage(data.message || "Prediction updated successfully.");
    } catch {
      setMessageType("error");
      setMessage("Unable to connect to the server.");
    }
  }

  async function updateFinalResult(
    matchId: number,
    actualTeam1Score: number,
    actualTeam2Score: number,
    actualWinner: string | null
  ) {
    setMessage("");

    try {
      const response = await fetch("/api/admin/match-result", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matchId,
          actualTeam1Score,
          actualTeam2Score,
          actualWinner,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessageType("error");
        setMessage(data.error || "Could not update final result.");
        return;
      }

      setItems((currentItems) =>
        currentItems.map((match) =>
          match.id === matchId
            ? {
                ...match,
                actualTeam1Score: data.match.actualTeam1Score,
                actualTeam2Score: data.match.actualTeam2Score,
                actualWinner: data.match.actualWinner,
                status: data.match.status,
              }
            : match
        )
      );

      setMessageType("success");
      setMessage(
        "Final result updated. Prediction points were recalculated."
      );
    } catch {
      setMessageType("error");
      setMessage("Unable to connect to the server.");
    }
  }

  async function createMatch(newMatch: {
    matchNumber: number;
    team1: string;
    team2: string;
    stage: string;
    kickoffAt: string;
  }) {
    setMessage("");

    try {
      const response = await fetch("/api/admin/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMatch),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessageType("error");
        setMessage(data.error || "Could not add match.");
        return;
      }

      setItems((currentItems) =>
        [
          ...currentItems,
          {
            ...data.match,
            kickoffAt: data.match.kickoffAt,
            actualWinner: data.match.actualWinner ?? null,
            predictions: [],
          },
        ].sort((a, b) => a.matchNumber - b.matchNumber)
      );

      setMessageType("success");
      setMessage(data.message || "Match added successfully.");
    } catch {
      setMessageType("error");
      setMessage("Unable to connect to the server.");
    }
  }

  async function updateMatch(
    matchId: number,
    updatedMatchData: {
      matchNumber: number;
      team1: string;
      team2: string;
      stage: string;
      kickoffAt: string;
    }
  ) {
    setMessage("");

    try {
      const response = await fetch(`/api/admin/matches/${matchId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedMatchData),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessageType("error");
        setMessage(data.error || "Could not update match.");
        return;
      }

      setItems((currentItems) =>
        currentItems
          .map((match) =>
            match.id === matchId
              ? {
                  ...match,
                  matchNumber: data.match.matchNumber,
                  team1: data.match.team1,
                  team2: data.match.team2,
                  stage: data.match.stage,
                  kickoffAt: data.match.kickoffAt,
                }
              : match
          )
          .sort((a, b) => a.matchNumber - b.matchNumber)
      );

      setMessageType("success");
      setMessage(data.message || "Match updated successfully.");
    } catch {
      setMessageType("error");
      setMessage("Unable to connect to the server.");
    }
  }

  async function deleteMatch(matchId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this match? This also deletes predictions for this match."
    );

    if (!confirmed) {
      return;
    }

    setMessage("");

    try {
      const response = await fetch(`/api/admin/matches/${matchId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setMessageType("error");
        setMessage(data.error || "Could not delete match.");
        return;
      }

      setItems((currentItems) =>
        currentItems.filter((match) => match.id !== matchId)
      );

      setSelectedMatchId(null);
      setMessageType("success");
      setMessage(data.message || "Match deleted successfully.");
    } catch {
      setMessageType("error");
      setMessage("Unable to connect to the server.");
    }
  }

  return (
    <section>
      <div className="mb-6 rounded-3xl border border-white/10 bg-white/10 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black sm:text-3xl">
              Admin Match Management
            </h1>

            <p className="mt-2 text-sm text-white/60 sm:text-base">
              Add, edit, delete matches, update final results, and review user
              predictions.
            </p>
          </div>

          <button
            type="button"
            onClick={scrollToToday}
            className="rounded-xl bg-green-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-green-300"
          >
            Today
          </button>
        </div>

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

        <div className="mt-5">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search team or match number"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
          />
        </div>

        <div className="mt-5">
          <h2 className="text-xl font-black">Filter by Stage</h2>

          <div className="mt-3 flex flex-wrap gap-2">
            {stageFilters.map((stage) => {
              const isActive = selectedStageFilter === stage.value;

              return (
                <button
                  key={stage.value}
                  type="button"
                  onClick={() => selectStageFilter(stage.value)}
                  className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                    isActive
                      ? "bg-yellow-400 text-slate-950"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {stage.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-black">Choose Date</h2>

          <p className="mt-1 text-sm text-white/60">
            Click a date to manage the games on that date.
          </p>

          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {dateKeys.map((dateKey) => {
              const isSelected = dateModeIsActive && selectedDateKey === dateKey;
              const isPast = dateKey < todayKey;
              const isToday = dateKey === todayKey;
              const isTomorrow =
                dateKey === addDaysToTorontoDateKey(new Date(), 1);
              const matchCount = getDateMatchCount(dateKey);

              return (
                <button
                  key={dateKey}
                  ref={dateKey === todayKey ? todayTileRef : null}
                  type="button"
                  onClick={() => selectDate(dateKey)}
                  className={`min-w-[135px] rounded-2xl border p-4 text-left transition ${
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

                  <p
                    className={`mt-2 text-xs ${
                      isSelected ? "text-slate-800" : "text-white/50"
                    }`}
                  >
                    {matchCount} match{matchCount === 1 ? "" : "es"}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-green-400/20 bg-green-400/10 p-4">
        <h2 className="font-black text-green-300">{getCurrentHeading()}</h2>

        <p className="mt-1 text-sm text-white/60">
          {getCurrentDescription()}
        </p>
      </div>

      {dateModeIsActive && (
        <AddMatchForm
          key={selectedDateKey}
          selectedDateKey={selectedDateKey}
          onCreate={createMatch}
        />
      )}

      {selectedMatches.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-white/10 bg-white/10 p-8 text-center">
          <h2 className="text-xl font-black">No matches found</h2>

          <p className="mt-2 text-sm text-white/60">
            Try changing the date, stage filter, or search text.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {selectedMatches.map((match) => {
            const isSelected = selectedMatchId === match.id;
            const today = isMatchToday(match.kickoffAt);
            const tomorrow = isMatchTomorrow(match.kickoffAt);
            const hasResult =
              match.actualTeam1Score !== null &&
              match.actualTeam2Score !== null;
            const knockoutMatch = isKnockoutStage(match.stage);

            return (
              <div
                key={match.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-white/10"
              >
                <button
                  type="button"
                  onClick={() =>
                    setSelectedMatchId(isSelected ? null : match.id)
                  }
                  className="w-full p-4 text-left transition hover:bg-white/5 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-green-300">
                        Match {match.matchNumber} · {match.stage}
                      </p>

                      <h2 className="mt-1 break-words text-xl font-black sm:text-2xl">
                        {match.team1} vs {match.team2}
                      </h2>

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

                      <p className="mt-2 text-sm text-white/50">
                        {match.predictions.length} submitted prediction
                        {match.predictions.length === 1 ? "" : "s"}
                      </p>

                      {hasResult && (
                        <p className="mt-2 text-sm text-white/50">
                          Final: {match.actualTeam1Score} -{" "}
                          {match.actualTeam2Score}
                          {knockoutMatch
                            ? ` · Winner: ${getWinnerLabel(
                                match.actualWinner,
                                match.team1,
                                match.team2
                              )}`
                            : ""}
                        </p>
                      )}
                    </div>

                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
                      {isSelected ? "Hide details" : "Manage match"}
                    </span>
                  </div>
                </button>

                {isSelected && (
                  <div className="grid gap-5 border-t border-white/10 p-4 sm:p-5">
                    <FinalResultForm
                      match={match}
                      onSave={updateFinalResult}
                    />

                    <EditMatchForm
                      match={match}
                      onSave={updateMatch}
                      onDelete={deleteMatch}
                    />

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <h3 className="text-xl font-black">User Predictions</h3>

                      {match.predictions.length === 0 ? (
                        <p className="mt-3 text-sm text-white/60">
                          No users have submitted predictions for this match.
                        </p>
                      ) : (
                        <div className="mt-4 overflow-x-auto rounded-2xl">
                          <table className="w-full min-w-[720px] text-left text-sm">
                            <thead className="border-b border-white/10 text-white/50">
                              <tr>
                                <th className="whitespace-nowrap p-3">
                                  Player
                                </th>
                                <th className="whitespace-nowrap p-3">
                                  Username
                                </th>
                                <th className="whitespace-nowrap p-3">
                                  Predicted Score
                                </th>
                                <th className="whitespace-nowrap p-3">
                                  Winner
                                </th>
                                <th className="whitespace-nowrap p-3">
                                  Current
                                </th>
                                <th className="whitespace-nowrap p-3">New</th>
                                <th className="whitespace-nowrap p-3">Save</th>
                              </tr>
                            </thead>

                            <tbody>
                              {match.predictions.map((prediction) => (
                                <PredictionRow
                                  key={prediction.id}
                                  prediction={prediction}
                                  team1={match.team1}
                                  team2={match.team2}
                                  isKnockout={knockoutMatch}
                                  onSave={updatePrediction}
                                />
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
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

function AddMatchForm({
  selectedDateKey,
  onCreate,
}: {
  selectedDateKey: string;
  onCreate: (newMatch: {
    matchNumber: number;
    team1: string;
    team2: string;
    stage: string;
    kickoffAt: string;
  }) => Promise<void>;
}) {
  const [matchNumber, setMatchNumber] = useState(0);
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [stage, setStage] = useState("Group Stage");
  const [kickoffAt, setKickoffAt] = useState(
    selectedDateDefaultTime(selectedDateKey)
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setSaving(true);

    try {
      await onCreate({
        matchNumber,
        team1,
        team2,
        stage,
        kickoffAt: new Date(kickoffAt).toISOString(),
      });

      setMatchNumber(0);
      setTeam1("");
      setTeam2("");
      setStage("Group Stage");
      setKickoffAt(selectedDateDefaultTime(selectedDateKey));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-orange-400/30 bg-orange-500/10 p-4 sm:p-5"
    >
      <h2 className="text-xl font-black text-orange-300">
        Add Match on {formatDateTile(selectedDateKey)}
      </h2>

      <div className="mt-4 grid gap-3 md:grid-cols-5">
        <input
          type="number"
          min="1"
          value={matchNumber}
          onChange={(event) => setMatchNumber(Number(event.target.value))}
          placeholder="Match #"
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-white outline-none"
        />

        <input
          value={team1}
          onChange={(event) => setTeam1(event.target.value)}
          placeholder="Team 1"
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-white outline-none"
        />

        <input
          value={team2}
          onChange={(event) => setTeam2(event.target.value)}
          placeholder="Team 2"
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-white outline-none"
        />

        <select
          value={stage}
          onChange={(event) => setStage(event.target.value)}
          className="rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white outline-none"
        >
          {stageFilters
            .filter((item) => item.value !== "All")
            .map((stageItem) => (
              <option key={stageItem.value} value={stageItem.value}>
                {stageItem.label}
              </option>
            ))}
        </select>

        <input
          type="datetime-local"
          value={kickoffAt}
          onChange={(event) => setKickoffAt(event.target.value)}
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-white outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="mt-4 rounded-xl bg-orange-500 px-5 py-3 font-black text-white transition hover:bg-orange-400 disabled:opacity-50"
      >
        {saving ? "Adding..." : "Add Match"}
      </button>
    </form>
  );
}

function FinalResultForm({
  match,
  onSave,
}: {
  match: AdminMatch;
  onSave: (
    matchId: number,
    actualTeam1Score: number,
    actualTeam2Score: number,
    actualWinner: string | null
  ) => Promise<void>;
}) {
  const [team1Score, setTeam1Score] = useState(match.actualTeam1Score ?? 0);
  const [team2Score, setTeam2Score] = useState(match.actualTeam2Score ?? 0);
  const [actualWinner, setActualWinner] = useState(match.actualWinner ?? "");
  const [saving, setSaving] = useState(false);

  const knockoutMatch = isKnockoutStage(match.stage);

  async function handleSave() {
    setSaving(true);

    try {
      await onSave(
        match.id,
        team1Score,
        team2Score,
        knockoutMatch ? actualWinner : null
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-green-400/20 bg-green-400/10 p-4">
      <h3 className="text-xl font-black text-green-300">Final Result</h3>

      <div className="mt-4 grid gap-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto_1fr] sm:items-center">
          <div className="min-w-0">
            <p className="break-words font-bold">{match.team1}</p>
          </div>

          <input
            type="number"
            min="0"
            value={team1Score}
            onChange={(event) => setTeam1Score(Number(event.target.value))}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-center text-white outline-none sm:w-20"
          />

          <span className="hidden text-center font-black sm:block">-</span>

          <input
            type="number"
            min="0"
            value={team2Score}
            onChange={(event) => setTeam2Score(Number(event.target.value))}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-center text-white outline-none sm:w-20"
          />

          <div className="min-w-0">
            <p className="break-words font-bold">{match.team2}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:hidden">
          <div className="rounded-xl bg-black/20 p-3 text-center">
            <p className="text-xs font-bold text-white/50">{match.team1}</p>
            <p className="mt-1 text-lg font-black">{team1Score}</p>
          </div>

          <div className="rounded-xl bg-black/20 p-3 text-center">
            <p className="text-xs font-bold text-white/50">{match.team2}</p>
            <p className="mt-1 text-lg font-black">{team2Score}</p>
          </div>
        </div>
      </div>

      {knockoutMatch && (
        <div className="mt-4">
          <p className="mb-2 break-words text-sm font-bold text-white/60">
            Team that advanced/won after 120 minutes or penalties
          </p>

          <select
            value={actualWinner}
            onChange={(event) => setActualWinner(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
          >
            <option value="">Select winner</option>
            <option value="TEAM1">{match.team1}</option>
            <option value="TEAM2">{match.team2}</option>
          </select>
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-4 w-full rounded-lg bg-green-400 px-4 py-3 font-black text-slate-950 transition hover:bg-green-300 disabled:opacity-50 sm:w-auto"
      >
        {saving ? "Saving..." : "Save Result"}
      </button>
    </div>
  );
}

function EditMatchForm({
  match,
  onSave,
  onDelete,
}: {
  match: AdminMatch;
  onSave: (
    matchId: number,
    updatedMatchData: {
      matchNumber: number;
      team1: string;
      team2: string;
      stage: string;
      kickoffAt: string;
    }
  ) => Promise<void>;
  onDelete: (matchId: number) => Promise<void>;
}) {
  const [matchNumber, setMatchNumber] = useState(match.matchNumber);
  const [team1, setTeam1] = useState(match.team1);
  const [team2, setTeam2] = useState(match.team2);
  const [stage, setStage] = useState(match.stage);
  const [kickoffAt, setKickoffAt] = useState(
    formatDateTimeLocal(match.kickoffAt)
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    setSaving(true);

    try {
      await onSave(match.id, {
        matchNumber,
        team1,
        team2,
        stage,
        kickoffAt: new Date(kickoffAt).toISOString(),
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);

    try {
      await onDelete(match.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <h3 className="text-xl font-black">Edit Match</h3>

      <div className="mt-4 grid gap-3 md:grid-cols-5">
        <input
          type="number"
          min="1"
          value={matchNumber}
          onChange={(event) => setMatchNumber(Number(event.target.value))}
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-white outline-none"
        />

        <input
          value={team1}
          onChange={(event) => setTeam1(event.target.value)}
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-white outline-none"
        />

        <input
          value={team2}
          onChange={(event) => setTeam2(event.target.value)}
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-white outline-none"
        />

        <select
          value={stage}
          onChange={(event) => setStage(event.target.value)}
          className="rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white outline-none"
        >
          {stageFilters
            .filter((item) => item.value !== "All")
            .map((stageItem) => (
              <option key={stageItem.value} value={stageItem.value}>
                {stageItem.label}
              </option>
            ))}
        </select>

        <input
          type="datetime-local"
          value={kickoffAt}
          onChange={(event) => setKickoffAt(event.target.value)}
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-white outline-none"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-green-400 px-4 py-2 font-black text-slate-950 transition hover:bg-green-300 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Match"}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg bg-red-500 px-4 py-2 font-black text-white transition hover:bg-red-400 disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete Match"}
        </button>
      </div>
    </div>
  );
}

function PredictionRow({
  prediction,
  team1,
  team2,
  isKnockout,
  onSave,
}: PredictionRowProps) {
  const [predTeam1Score, setPredTeam1Score] = useState(
    prediction.predTeam1Score
  );

  const [predTeam2Score, setPredTeam2Score] = useState(
    prediction.predTeam2Score
  );

  const [points, setPoints] = useState(prediction.points ?? 0);
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
      <td className="whitespace-nowrap p-3 font-bold">
        {prediction.user.displayName}
      </td>

      <td className="whitespace-nowrap p-3 text-white/60">
        {prediction.user.username}
      </td>

      <td className="whitespace-nowrap p-3">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            value={predTeam1Score}
            onChange={(event) =>
              setPredTeam1Score(Number(event.target.value))
            }
            className="w-16 rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-center text-white outline-none"
          />

          <span>-</span>

          <input
            type="number"
            min="0"
            value={predTeam2Score}
            onChange={(event) =>
              setPredTeam2Score(Number(event.target.value))
            }
            className="w-16 rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-center text-white outline-none"
          />
        </div>
      </td>

      <td className="whitespace-nowrap p-3 text-white/70">
        {isKnockout
          ? getWinnerLabel(prediction.predWinner, team1, team2)
          : "-"}
      </td>

      <td className="whitespace-nowrap p-3 font-bold text-green-300">
        {prediction.points ?? 0}
      </td>

      <td className="whitespace-nowrap p-3">
        <input
          type="number"
          value={points}
          onChange={(event) => setPoints(Number(event.target.value))}
          className="w-20 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-center text-white outline-none"
        />
      </td>

      <td className="whitespace-nowrap p-3">
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