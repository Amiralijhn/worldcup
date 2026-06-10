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

type StandingsClientProps = {
  matches: MatchItem[];
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
  A: ["Mexico", "South Africa", "South Korea", "Czechia"],
  B: ["Canada", "Switzerland", "Qatar", "Bosnia and Herzegovina"],
  C: ["Brazil", "Morocco", "Haiti", "Scotland"],
  D: ["USA", "Paraguay", "Australia", "Türkiye"],
  E: ["Germany", "Curaçao", "Ivory Coast", "Ecuador"],
  F: ["Netherlands", "Japan", "Tunisia", "Sweden"],
  G: ["Belgium", "Egypt", "Iran", "New Zealand"],
  H: ["Spain", "Cape Verde", "Saudi Arabia", "Uruguay"],
  I: ["France", "Senegal", "Norway", "Iraq"],
  J: ["Argentina", "Algeria", "Austria", "Jordan"],
  K: ["Portugal", "Uzbekistan", "Colombia", "Congo DR"],
  L: ["England", "Croatia", "Ghana", "Panama"],
};

const groupNames = Object.keys(groups) as GroupName[];

function normalizeTeamName(team: string) {
  const aliases: Record<string, string> = {
    "Korea Republic": "South Korea",
    "United States": "USA",
    "Côte d’Ivoire": "Ivory Coast",
    "Côte d'Ivoire": "Ivory Coast",
    "Cabo Verde": "Cape Verde",
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
    .sort((a, b) => {
      return (
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        a.team.localeCompare(b.team)
      );
    });
}

export default function StandingsClient({
  matches,
}: StandingsClientProps) {
  const [selectedGroup, setSelectedGroup] = useState<GroupName>("A");

  const groupTeams = groups[selectedGroup];

  const standings = useMemo(
    () => calculateStandings(selectedGroup, matches),
    [selectedGroup, matches]
  );

  const groupMatches = useMemo(() => {
    return matches.filter(
      (match) =>
        match.stage === "Group Stage" &&
        matchBelongsToGroup(match, groupTeams)
    );
  }, [matches, groupTeams]);

  return (
    <section>
      <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl">
        <h1 className="text-3xl font-black">Group Standings</h1>

        <p className="mt-2 text-white/60">
          Select a group to see the table, team points, group matches,
          final results, and your predictions.
        </p>

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

            <h2 className="mt-1 text-2xl font-black">
              Standings
            </h2>
          </div>

          <p className="text-sm text-white/50">
            Win = 3 pts, Draw = 1 pt, Loss = 0 pts
          </p>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
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
              </tr>
            </thead>

            <tbody>
              {standings.map((team, index) => (
                <tr key={team.team} className="border-b border-white/10">
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
                  <td className="p-3 font-black text-green-300">
                    {team.points}
                  </td>
                </tr>
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
          {groupMatches.map((match) => {
            const hasResult =
              match.actualTeam1Score !== null &&
              match.actualTeam2Score !== null;

            return (
              <article
                key={match.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-5"
              >
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

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-white/10 p-4">
                    <p className="text-sm text-white/50">
                      Final Result
                    </p>

                    <p className="mt-1 text-xl font-black">
                      {hasResult
                        ? `${match.actualTeam1Score} - ${match.actualTeam2Score}`
                        : "Not added yet"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/10 p-4">
                    <p className="text-sm text-white/50">
                      Your Prediction
                    </p>

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
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}