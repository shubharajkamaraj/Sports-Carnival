"use client";

import { useEffect, useMemo, useState } from "react";

type Player = {
  id: number;
  name: string;
  jerseyNo: number | null;
};

type Team = {
  id: number;
  name: string;
  captain: string | null;
  playerIds: number[];
  createdAt: string;
  updatedAt: string;
  players: Player[];
};

export default function ViewerTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("ALL");
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null);

  useEffect(() => {
    loadTeams();
  }, []);

  async function loadTeams() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/teams", {
        method: "GET",
        cache: "no-store",
      });

      const text = await response.text();

      let data: Team[];

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `Invalid API response: ${text.slice(0, 300)}`
        );
      }

      if (!response.ok) {
        throw new Error("Failed to load teams");
      }

      if (!Array.isArray(data)) {
        throw new Error("Invalid teams data received");
      }

      setTeams(data);

      // Open first team automatically
      if (data.length > 0) {
        setExpandedTeam(data[0].id);
      }
    } catch (err) {
      console.error("TEAMS ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load teams"
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredTeams = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return teams
      .filter((team) => {
        if (selectedTeam === "ALL") {
          return true;
        }

        return String(team.id) === selectedTeam;
      })
      .map((team) => {
        if (!searchText) {
          return team;
        }

        const teamMatches =
          team.name.toLowerCase().includes(searchText) ||
          (team.captain ?? "")
            .toLowerCase()
            .includes(searchText);

        const matchingPlayers = team.players.filter((player) =>
          player.name.toLowerCase().includes(searchText)
        );

        if (teamMatches) {
          return team;
        }

        return {
          ...team,
          players: matchingPlayers,
        };
      })
      .filter((team) => {
        if (!searchText) {
          return true;
        }

        return (
          team.name.toLowerCase().includes(searchText) ||
          (team.captain ?? "")
            .toLowerCase()
            .includes(searchText) ||
          team.players.length > 0
        );
      });
  }, [teams, search, selectedTeam]);

  const totalPlayers = teams.reduce(
    (total, team) => total + team.players.length,
    0
  );

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl">

        {/* =========================================
            HEADER
        ========================================== */}

        <div className="mb-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

            <div>
              <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
                Teams & Players
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Meet the teams and players participating in the
                Sports Carnival
              </p>
            </div>

            <button
              type="button"
              onClick={loadTeams}
              disabled={loading}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>

          </div>
        </div>

        {/* =========================================
            SUMMARY
        ========================================== */}

        {!loading && !error && (
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">

            <SummaryCard
              label="Teams"
              value={teams.length}
            />

            <SummaryCard
              label="Players"
              value={totalPlayers}
            />

            <SummaryCard
              label="Captains"
              value={teams.filter((team) => team.captain).length}
            />

            <SummaryCard
              label="Largest Team"
              value={
                teams.length
                  ? Math.max(
                      ...teams.map(
                        (team) => team.players.length
                      )
                    )
                  : 0
              }
              suffix=" players"
            />

          </div>
        )}

        {/* =========================================
            ERROR
        ========================================== */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5">

            <p className="font-semibold text-red-700">
              Failed to load teams
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={loadTeams}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Retry
            </button>

          </div>
        )}

        {/* =========================================
            LOADING
        ========================================== */}

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">

            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="text-sm text-slate-500">
              Loading teams and players...
            </p>

          </div>
        ) : (
          <>
            {/* =====================================
                SEARCH + FILTER
            ====================================== */}

            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

              <div className="flex flex-col gap-3 md:flex-row">

                {/* SEARCH */}

                <div className="relative flex-1">

                  <svg
                    className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle
                      cx="11"
                      cy="11"
                      r="7"
                    />

                    <path d="m20 20-3.5-3.5" />
                  </svg>

                  <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search team, captain or player..."
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                {/* TEAM FILTER */}

                <select
                  value={selectedTeam}
                  onChange={(e) =>
                    setSelectedTeam(e.target.value)
                  }
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="ALL">
                    All Teams
                  </option>

                  {teams.map((team) => (
                    <option
                      key={team.id}
                      value={String(team.id)}
                    >
                      {team.name}
                    </option>
                  ))}
                </select>

              </div>

            </div>

            {/* =====================================
                TEAM CARDS
            ====================================== */}

            {filteredTeams.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">

                <div className="mb-3 text-4xl">
                  🔍
                </div>

                <p className="font-semibold text-slate-700">
                  No teams or players found
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Try a different search.
                </p>

              </div>
            ) : (
              <div className="space-y-5">

                {filteredTeams.map((team) => {

                  const isExpanded =
                    expandedTeam === team.id;

                  return (
                    <TeamCard
                      key={team.id}
                      team={team}
                      expanded={isExpanded}
                      onToggle={() =>
                        setExpandedTeam(
                          isExpanded ? null : team.id
                        )
                      }
                    />
                  );
                })}

              </div>
            )}

          </>
        )}

      </div>
    </div>
  );
}

/* =================================================
   SUMMARY CARD
================================================= */

function SummaryCard({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
        <span className="text-sm font-medium text-slate-400">
          {suffix}
        </span>
      </p>

    </div>
  );
}

/* =================================================
   TEAM CARD
================================================= */

function TeamCard({
  team,
  expanded,
  onToggle,
}: {
  team: Team;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* TEAM HEADER */}

      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left"
      >
        <div className="p-5">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-4">

              {/* TEAM ICON */}

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-2xl font-bold text-blue-700">
                {getTeamInitials(team.name)}
              </div>

              <div className="min-w-0">

                <h2 className="truncate text-lg font-bold text-slate-900 md:text-xl">
                  {team.name}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Captain:{" "}
                  <span className="font-semibold text-slate-700">
                    {team.captain || "Not assigned"}
                  </span>
                </p>

              </div>

            </div>

            {/* TEAM INFO */}

            <div className="flex items-center gap-3">

              <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                {team.players.length} Players
              </span>

              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 transition ${
                  expanded ? "rotate-180" : ""
                }`}
              >
                <svg
                  className="h-5 w-5 text-slate-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>

            </div>

          </div>

        </div>
      </button>

      {/* PLAYER LIST */}

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/70 p-4">

          <div className="mb-3 flex items-center justify-between">

            <div>
              <h3 className="font-semibold text-slate-800">
                Players
              </h3>

              <p className="text-xs text-slate-500">
                {team.players.length} registered players
              </p>
            </div>

            {team.captain && (
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                Captain: {team.captain}
              </span>
            )}

          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

            {team.players.map((player) => {

              const isCaptain =
                player.name.trim().toLowerCase() ===
                (team.captain ?? "")
                  .trim()
                  .toLowerCase();

              return (
                <div
                  key={player.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-blue-200 hover:shadow-sm"
                >

                  {/* JERSEY NUMBER */}

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
                    {player.jerseyNo ?? "-"}
                  </div>

                  {/* PLAYER */}

                  <div className="min-w-0 flex-1">

                    <div className="flex items-center gap-2">

                      <p className="truncate text-sm font-semibold text-slate-900">
                        {player.name}
                      </p>

                      {isCaptain && (
                        <span
                          title="Captain"
                          className="shrink-0 text-sm"
                        >
                          ©
                        </span>
                      )}

                    </div>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Jersey #{player.jerseyNo ?? "-"}
                    </p>

                  </div>

                </div>
              );
            })}

          </div>

        </div>
      )}

    </div>
  );
}

/* =================================================
   TEAM INITIALS
================================================= */

function getTeamInitials(name: string) {
  if (!name) return "TM";

  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return (
    words[0][0] +
    words[words.length - 1][0]
  ).toUpperCase();
}