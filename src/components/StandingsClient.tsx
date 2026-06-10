"use client";

import { useMemo, useState } from "react";

type MatchItem = {
  id: number;
  matchNumber: number;
  team1: string;
  team2: string;
  stage: string;
  kickoffAt: string;
  status: string;
  actualTeam1Score: number | null;
  actualTeam2Score: number | null;
  prediction: {
    predTeam1Score: number;
    predTeam2Score: number;
    points: number | null;
  } | null;
};

type StandingOverride = {
  id: number;
  group: string;
  team: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  isActive: boolean;
};

type StandingsClientProps = {
  matches: MatchItem[];
  overrides: StandingOverride[];
  isAdmin: boolean;
};

type GroupName =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L";

type TeamStanding = {
  team: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

const groups: Record<GroupName, string[]> = {
  A: ["Mexico", "South Africa", "Korea Republic", "Czechia"],
  B: ["Canada", "Switzerland", "Qatar", "Bosnia and Herzegovina"],
  C: ["Brazil", "Morocco", "Haiti", "Scotland"],
  D: ["United States", "Paraguay", "Australia", "Türkiye"],
  E: ["Germany", "Curaçao", "Côte d’Ivoire", "Ecuador"],
  F: ["Netherlands", "Japan", "Tunisia", "Sweden"],
  G: ["Belgium", "Egypt", "Iran", "New Zealand"],
  H: ["Spain", "Cabo Verde", "Saudi Arabia", "Uruguay"],
  I: ["France", "Senegal", "Norway", "Iraq"],
  J: ["Argentina", "Algeria", "Austria", "Jordan"],
  K: ["Portugal", "Uzbekistan", "Colombia", "Congo DR"],
  L: ["England", "Croatia", "Ghana", "Panama"],
};

const groupNames = Object.keys(groups) as GroupName[];

function normalizeTeamName(team: string) {
  const aliases: Record<string, string> = {
    "South Korea": "Korea Republic",
    USA: "United States",
    "Ivory Coast": "Côte d’Ivoire",
    "Côte d'Ivoire": "Côte d’Ivoire",
    "Cape Verde": "Cabo Verde",
  };

  return aliases[team] || team;
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

function createEmptyStanding(team: string): TeamStanding {
  return {
    team,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };
}

function matchBelongsToGroup(match: MatchItem, teams: string[]) {
  const team1 = normalizeTeamName(match.team1);
  const team2 = normalizeTeamName(match.team2);

  return teams.includes(team1) && teams.includes(team2);
}

function sortStandings(a: TeamStanding, b: TeamStanding) {
  return (
    b.points - a.points ||
    b.goalDifference - a.goalDifference ||
    b.goalsFor - a.goalsFor ||
    a.team.localeCompare(b.team)
  );
}

function calculateStandings(
  groupName: GroupName,
  matches: MatchItem[]
): TeamStanding[] {
  const teams = groups[groupName];

  const table: Record<string, TeamStanding> = {};

  teams.forEach((team) => {
    table[team] = createEmptyStanding(team);
  });

  const groupMatches = matches.filter(
    (match) =>
      match.stage === "Group Stage" &&
      matchBelongsToGroup(match, teams)
  );

  groupMatches.forEach((match) => {
    if (
      match.actualTeam1Score === null ||
      match.actualTeam2Score === null
    ) {
      return;
    }

    const team1 = normalizeTeamName(match.team1);
    const team2 = normalizeTeamName(match.team2);

    const team1Standing = table[team1];
    const team2Standing = table[team2];

    if (!team1Standing || !team2Standing) {
      return;
    }

    const team1Goals = match.actualTeam1Score;
    const team2Goals = match.actualTeam2Score;

    team1Standing.played += 1;
    team2Standing.played += 1;

    team1Standing.goalsFor += team1Goals;
    team1Standing.goalsAgainst += team2Goals;

    team2Standing.goalsFor += team2Goals;
    team2Standing.goalsAgainst += team1Goals;

    if (team1Goals > team2Goals) {
      team1Standing.wins += 1;
      team1Standing.points += 3;
      team2Standing.losses += 1;
    } else if (team1Goals < team2Goals) {
      team2Standing.wins += 1;
      team2Standing.points += 3;
      team1Standing.losses += 1;
    } else {
      team1Standing.draws += 1;
      team2Standing.draws += 1;
      team1Standing.points += 1;
      team2Standing.points += 1;
    }
  });

  return Object.values(table)
    .map((team) => ({
      ...team,
      goalDifference: team.goalsFor - team.goalsAgainst,
    }))
    .sort(sortStandings);
}

export default function StandingsClient({
  matches,
  overrides,
  isAdmin,
}: StandingsClientProps) {
  const [selectedGroup, setSelectedGroup] = useState<GroupName>("A");
  const [standingOverrides, setStandingOverrides] = useState(overrides);
  const [items, setItems] = useState(matches);
  const [message, setMessage] = useState("");

  const groupTeams = groups[selectedGroup];

  const calculatedStandings = useMemo(
    () => calculateStandings(selectedGroup, items),
    [selectedGroup, items]
  );

  const finalStandings = useMemo(() => {
    return calculatedStandings
      .map((team) => {
        const override = standingOverrides.find(
          (item) => item.team === team.team && item.isActive
        );

        if (!override) {
          return team;
        }

        return {
          team: team.team,
          played: override.played,
          wins: override.wins,
          draws: override.draws,
          losses: override.losses,
          goalsFor: override.goalsFor,
          goalsAgainst: override.goalsAgainst,
          goalDifference: override.goalsFor - override.goalsAgainst,
          points: override.points,
        };
      })
      .sort(sortStandings);
  }, [calculatedStandings, standingOverrides]);

  const groupMatches = useMemo(() => {
    return items.filter(
      (match) =>
        match.stage === "Group Stage" &&
        matchBelongsToGroup(match, groupTeams)
    );
  }, [items, groupTeams]);

  return (
    <section>
      <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl">
        <h1 className="text-3xl font-black">Group Standings</h1>

        <p className="mt-2 text-white/60">
          Select a group to see standings and group matches.
        </p>

        {isAdmin && (
          <p className="mt-2 text-sm text-yellow-300">
            Admin mode: you can manually adjust standings and update final match results.
          </p>
        )}

        {message && (
          <p className="mt-4 rounded-xl bg-green-500/20 p-3 text-sm text-green-100">
            {message}
          </p>
        )}

        <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
          {groupNames.map((group) => (
            <button
              key={group}
              type="button"
              onClick={() => setSelectedGroup(group)}
              className={`rounded-xl px-4 py-3 text-sm font-black transition ${
                selectedGroup === group
                  ? "bg-green-400 text-slate-950"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/10 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-bold text-green-300">
              Group {selectedGroup}
            </p>

            <h2 className="mt-1 text-2xl font-black">Standings</h2>
          </div>

          <p className="text-sm text-white/50">
            Win = 3 pts, Draw = 1 pt, Loss = 0 pts
          </p>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-white/10 text-white/50">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Team</th>
                <th className="p-3">P</th>
                <th className="p-3">W</th>
                <th className="p-3">D</th>
                <th className="p-3">L</th>
                <th className="p-3">GF</th>
                <th className="p-3">GA</th>
                <th className="p-3">GD</th>
                <th className="p-3">Pts</th>
                {isAdmin && <th className="p-3">Admin</th>}
              </tr>
            </thead>

            <tbody>
              {finalStandings.map((team, index) => (
                <StandingRow
                  key={team.team}
                  team={team}
                  index={index}
                  selectedGroup={selectedGroup}
                  isAdmin={isAdmin}
                  override={standingOverrides.find(
                    (item) => item.team === team.team
                  )}
                  onSaved={(savedOverride) => {
                    setStandingOverrides((current) => {
                      const exists = current.some(
                        (item) => item.team === savedOverride.team
                      );

                      if (exists) {
                        return current.map((item) =>
                          item.team === savedOverride.team
                            ? savedOverride
                            : item
                        );
                      }

                      return [...current, savedOverride];
                    });

                    setMessage("Standing updated successfully.");
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/10 p-5">
        <h2 className="text-2xl font-black">
          Group {selectedGroup} Matches
        </h2>

        <div className="mt-5 grid gap-4">
          {groupMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              isAdmin={isAdmin}
              onUpdated={(updatedMatch) => {
                setItems((current) =>
                  current.map((item) =>
                    item.id === updatedMatch.id
                      ? {
                          ...item,
                          actualTeam1Score: updatedMatch.actualTeam1Score,
                          actualTeam2Score: updatedMatch.actualTeam2Score,
                          status: updatedMatch.status,
                        }
                      : item
                  )
                );

                setMessage("Final result updated successfully.");
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

type StandingRowProps = {
  team: TeamStanding;
  index: number;
  selectedGroup: GroupName;
  isAdmin: boolean;
  override?: StandingOverride;
  onSaved: (override: StandingOverride) => void;
};

function StandingRow({
  team,
  index,
  selectedGroup,
  isAdmin,
  override,
  onSaved,
}: StandingRowProps) {
  const [played, setPlayed] = useState(override?.played ?? team.played);
  const [wins, setWins] = useState(override?.wins ?? team.wins);
  const [draws, setDraws] = useState(override?.draws ?? team.draws);
  const [losses, setLosses] = useState(override?.losses ?? team.losses);
  const [goalsFor, setGoalsFor] = useState(override?.goalsFor ?? team.goalsFor);
  const [goalsAgainst, setGoalsAgainst] = useState(
    override?.goalsAgainst ?? team.goalsAgainst
  );
  const [points, setPoints] = useState(override?.points ?? team.points);
  const [isActive, setIsActive] = useState(override?.isActive ?? false);
  const [saving, setSaving] = useState(false);

  async function saveStanding() {
    setSaving(true);

    try {
      const response = await fetch("/api/admin/standings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          group: selectedGroup,
          team: team.team,
          played,
          wins,
          draws,
          losses,
          goalsFor,
          goalsAgainst,
          points,
          isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Could not save standing.");
        return;
      }

      onSaved(data.override);
    } finally {
      setSaving(false);
    }
  }

  if (!isAdmin) {
    return (
      <tr className="border-b border-white/10">
        <td className="p-3 font-black">#{index + 1}</td>
        <td className="p-3 font-bold">{team.team}</td>
        <td className="p-3">{team.played}</td>
        <td className="p-3">{team.wins}</td>
        <td className="p-3">{team.draws}</td>
        <td className="p-3">{team.losses}</td>
        <td className="p-3">{team.goalsFor}</td>
        <td className="p-3">{team.goalsAgainst}</td>
        <td className="p-3">
          {team.goalDifference > 0
            ? `+${team.goalDifference}`
            : team.goalDifference}
        </td>
        <td className="p-3 font-black text-green-300">{team.points}</td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-white/10">
      <td className="p-3 font-black">#{index + 1}</td>

      <td className="p-3 font-bold">
        {team.team}
        {isActive && (
          <span className="ml-2 rounded-full bg-yellow-400 px-2 py-1 text-xs font-black text-slate-950">
            Manual
          </span>
        )}
      </td>

      <td className="p-2">
        <NumberInput value={played} onChange={setPlayed} />
      </td>

      <td className="p-2">
        <NumberInput value={wins} onChange={setWins} />
      </td>

      <td className="p-2">
        <NumberInput value={draws} onChange={setDraws} />
      </td>

      <td className="p-2">
        <NumberInput value={losses} onChange={setLosses} />
      </td>

      <td className="p-2">
        <NumberInput value={goalsFor} onChange={setGoalsFor} />
      </td>

      <td className="p-2">
        <NumberInput value={goalsAgainst} onChange={setGoalsAgainst} />
      </td>

      <td className="p-3">
        {goalsFor - goalsAgainst > 0
          ? `+${goalsFor - goalsAgainst}`
          : goalsFor - goalsAgainst}
      </td>

      <td className="p-2">
        <NumberInput value={points} onChange={setPoints} />
      </td>

      <td className="p-2">
        <label className="flex items-center gap-2 text-xs text-white/70">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
          />
          Use manual
        </label>

        <button
          type="button"
          onClick={saveStanding}
          disabled={saving}
          className="mt-2 rounded-lg bg-green-400 px-3 py-2 text-xs font-black text-slate-950 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </td>
    </tr>
  );
}

type MatchCardProps = {
  match: MatchItem;
  isAdmin: boolean;
  onUpdated: (match: {
    id: number;
    actualTeam1Score: number | null;
    actualTeam2Score: number | null;
    status: string;
  }) => void;
};

function MatchCard({ match, isAdmin, onUpdated }: MatchCardProps) {
  const hasResult =
    match.actualTeam1Score !== null &&
    match.actualTeam2Score !== null;

  const [team1Score, setTeam1Score] = useState(match.actualTeam1Score ?? 0);
  const [team2Score, setTeam2Score] = useState(match.actualTeam2Score ?? 0);
  const [saving, setSaving] = useState(false);

  async function saveResult() {
    setSaving(true);

    try {
      const response = await fetch("/api/admin/match-result", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matchId: match.id,
          actualTeam1Score: team1Score,
          actualTeam2Score: team2Score,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Could not update result.");
        return;
      }

      onUpdated(data.match);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-green-300">
            Match {match.matchNumber}
          </p>

          <h3 className="mt-1 text-xl font-black">
            {match.team1} vs {match.team2}
          </h3>

          <p className="mt-1 text-sm text-white/50">
            {formatKickoff(match.kickoffAt)}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            hasResult
              ? "bg-green-500/20 text-green-100"
              : "bg-white/10 text-white/70"
          }`}
        >
          {hasResult ? "Result Added" : "Upcoming"}
        </span>
      </div>

      <div className="mt-4 rounded-xl bg-white/10 p-4">
        <p className="text-sm text-white/50">Final Result</p>

        {!isAdmin ? (
          <p className="mt-1 text-xl font-black">
            {hasResult
              ? `${match.actualTeam1Score} - ${match.actualTeam2Score}`
              : "Not added yet"}
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              type="number"
              min="0"
              value={team1Score}
              onChange={(event) => setTeam1Score(Number(event.target.value))}
              className="w-20 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-center text-white outline-none"
            />

            <span className="font-black">-</span>

            <input
              type="number"
              min="0"
              value={team2Score}
              onChange={(event) => setTeam2Score(Number(event.target.value))}
              className="w-20 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-center text-white outline-none"
            />

            <button
              type="button"
              onClick={saveResult}
              disabled={saving}
              className="rounded-lg bg-green-400 px-4 py-2 font-black text-slate-950 transition hover:bg-green-300 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Result"}
            </button>
          </div>
        )}
      </div>

      {!isAdmin && (
        <div className="mt-4 rounded-xl bg-white/10 p-4">
          <p className="text-sm text-white/50">Your Prediction</p>

          <p className="mt-1 text-xl font-black">
            {match.prediction
              ? `${match.prediction.predTeam1Score} - ${match.prediction.predTeam2Score}`
              : "No prediction"}
          </p>

          {match.prediction && (
            <p className="mt-1 text-sm text-green-300">
              Points: {match.prediction.points ?? 0}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

type NumberInputProps = {
  value: number;
  onChange: (value: number) => void;
};

function NumberInput({ value, onChange }: NumberInputProps) {
  return (
    <input
      type="number"
      min="0"
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="w-16 rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-center text-white outline-none"
    />
  );
}