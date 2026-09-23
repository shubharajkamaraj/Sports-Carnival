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

      if (data.length > 0) {
        setExpandedTeam(data[0].id);
      }
    } catch (err) {
      console.error("TEAMS ERROR:", err);

      setTeams([]);

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

  const totalCaptains = teams.filter(
    (team) => team.captain
  ).length;

  const largestTeam = teams.length
    ? Math.max(
        ...teams.map(
          (team) => team.players.length
        )
      )
    : 0;

  return (
    <main
      className="
        min-h-screen
        w-full
        overflow-x-hidden
        bg-transparent
        px-3
        py-4
        text-white
        sm:px-5
        sm:py-6
        md:px-8
        md:py-8
        lg:px-10
        lg:py-10
        xl:px-12
        xl:py-12
      "
    >
      <div className="mx-auto w-full max-w-7xl">

        {/* =========================================
            HEADER
        ========================================== */}

        <header className="mb-5 sm:mb-6 md:mb-8">

          <div
            className="
              flex
              flex-col
              gap-4
              md:flex-row
              md:items-center
              md:justify-between
            "
          >

            {/* TITLE */}

            <div className="min-w-0">

              <h1
                className="
                  break-words
                  text-2xl
                  font-bold
                  leading-tight
                  text-white
                  sm:text-3xl
                  md:text-4xl
                "
              >
                Teams & Players
              </h1>

              <p
                className="
                  mt-2
                  max-w-2xl
                  text-xs
                  leading-5
                  text-slate-300
                  sm:text-sm
                  sm:leading-6
                "
              >
                Meet the teams and players participating in
                the Sports Carnival
              </p>

            </div>

            {/* REFRESH */}

            <button
              type="button"
              onClick={loadTeams}
              disabled={loading}
              className="
                w-full
                shrink-0
                rounded-xl
                border
                border-white/10
                bg-white/10
                px-4
                py-3
                text-sm
                font-semibold
                text-slate-200
                shadow-lg
                backdrop-blur-md
                transition
                hover:bg-white/15
                active:scale-[0.98]
                disabled:cursor-not-allowed
                disabled:opacity-50
                sm:w-auto
                sm:px-5
              "
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>

          </div>

        </header>

        {/* =========================================
            SUMMARY
        ========================================== */}

        {!loading && !error && (
          <section
            className="
              mb-5
              grid
              grid-cols-2
              gap-3
              sm:mb-6
              sm:grid-cols-2
              sm:gap-4
              lg:grid-cols-4
            "
          >

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
              value={totalCaptains}
            />

            <SummaryCard
              label="Largest Team"
              value={largestTeam}
              suffix=" players"
            />

          </section>
        )}

        {/* =========================================
            ERROR
        ========================================== */}

        {error && (
          <div
            className="
              mb-5
              rounded-2xl
              border
              border-red-400/20
              bg-red-500/10
              p-4
              backdrop-blur-md
              sm:mb-6
              sm:p-5
            "
          >

            <p className="text-sm font-semibold text-red-300 sm:text-base">
              Failed to load teams
            </p>

            <p className="mt-1 break-words text-xs leading-5 text-red-200/80 sm:text-sm">
              {error}
            </p>

            <button
              type="button"
              onClick={loadTeams}
              className="
                mt-4
                w-full
                rounded-xl
                border
                border-red-400/20
                bg-red-500/20
                px-4
                py-2.5
                text-sm
                font-semibold
                text-red-200
                transition
                hover:bg-red-500/30
                active:scale-[0.98]
                sm:w-auto
              "
            >
              Retry
            </button>

          </div>
        )}

        {/* =========================================
            LOADING
        ========================================== */}

        {loading ? (
          <div
            className="
              rounded-2xl
              border
              border-white/10
              bg-white/10
              p-8
              text-center
              shadow-lg
              backdrop-blur-md
              sm:p-12
            "
          >

            <div
              className="
                mx-auto
                mb-4
                h-9
                w-9
                animate-spin
                rounded-full
                border-4
                border-white/10
                border-t-white
                sm:h-10
                sm:w-10
              "
            />

            <p className="text-xs text-slate-300 sm:text-sm">
              Loading teams and players...
            </p>

          </div>
        ) : (
          <>

            {/* =====================================
                SEARCH + FILTER
            ====================================== */}

            <section
              className="
                mb-5
                rounded-2xl
                border
                border-white/10
                bg-white/10
                p-3
                shadow-lg
                backdrop-blur-md
                sm:mb-6
                sm:p-4
                md:p-5
              "
            >

              <div
                className="
                  flex
                  flex-col
                  gap-3
                  md:flex-row
                "
              >

                {/* SEARCH */}

                <div className="relative min-w-0 flex-1">

                  <svg
                    className="
                      pointer-events-none
                      absolute
                      left-3
                      top-1/2
                      h-5
                      w-5
                      -translate-y-1/2
                      text-slate-400
                    "
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
                    className="
                      w-full
                      rounded-xl
                      border
                      border-white/10
                      bg-white/5
                      py-3
                      pl-10
                      pr-4
                      text-sm
                      text-white
                      outline-none
                      transition
                      placeholder:text-slate-500
                      focus:border-blue-400/40
                      focus:bg-white/10
                      focus:ring-2
                      focus:ring-blue-400/20
                    "
                  />

                </div>

                {/* TEAM FILTER */}

                <select
                  value={selectedTeam}
                  onChange={(e) =>
                    setSelectedTeam(e.target.value)
                  }
                  className="
                    w-full
                    rounded-xl
                    border
                    border-white/10
                    bg-[#0b1022]
                    px-4
                    py-3
                    text-sm
                    font-medium
                    text-white
                    outline-none
                    transition
                    focus:border-blue-400/40
                    focus:ring-2
                    focus:ring-blue-400/20
                    md:w-[240px]
                    lg:w-[280px]
                  "
                >

                  <option
                    value="ALL"
                    className="bg-[#0b1022] text-white"
                  >
                    All Teams
                  </option>

                  {teams.map((team) => (
                    <option
                      key={team.id}
                      value={String(team.id)}
                      className="bg-[#0b1022] text-white"
                    >
                      {team.name}
                    </option>
                  ))}

                </select>

              </div>

              {/* SEARCH RESULT INFO */}

              {(search || selectedTeam !== "ALL") && (
                <div className="mt-3 flex flex-wrap items-center gap-2">

                  <span className="text-xs text-slate-400">
                    Showing {filteredTeams.length}{" "}
                    {filteredTeams.length === 1
                      ? "team"
                      : "teams"}
                  </span>

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="
                        rounded-full
                        border
                        border-white/10
                        bg-white/5
                        px-3
                        py-1
                        text-xs
                        font-medium
                        text-slate-300
                        transition
                        hover:bg-white/10
                      "
                    >
                      Clear search
                    </button>
                  )}

                  {selectedTeam !== "ALL" && (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedTeam("ALL")
                      }
                      className="
                        rounded-full
                        border
                        border-white/10
                        bg-white/5
                        px-3
                        py-1
                        text-xs
                        font-medium
                        text-slate-300
                        transition
                        hover:bg-white/10
                      "
                    >
                      All teams
                    </button>
                  )}

                </div>
              )}

            </section>

            {/* =====================================
                TEAM CARDS
            ====================================== */}

            {filteredTeams.length === 0 ? (
              <div
                className="
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/10
                  p-8
                  text-center
                  shadow-lg
                  backdrop-blur-md
                  sm:p-12
                "
              >

                <div className="mb-3 text-4xl sm:text-5xl">
                  🔍
                </div>

                <p className="font-semibold text-white sm:text-lg">
                  No teams or players found
                </p>

                <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                  Try a different search.
                </p>

              </div>
            ) : (
              <div className="space-y-4 sm:space-y-5">

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
                          isExpanded
                            ? null
                            : team.id
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
    </main>
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
    <div
      className="
        min-w-0
        rounded-2xl
        border
        border-white/10
        bg-white/10
        p-3
        shadow-lg
        backdrop-blur-md
        transition
        hover:bg-white/15
        sm:p-4
        md:p-5
      "
    >

      <p
        className="
          truncate
          text-[10px]
          font-semibold
          uppercase
          tracking-wide
          text-slate-400
          sm:text-xs
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1
          truncate
          text-xl
          font-bold
          text-white
          sm:mt-2
          sm:text-2xl
          md:text-3xl
        "
      >
        {value}

        <span
          className="
            ml-1
            text-[10px]
            font-medium
            text-slate-400
            sm:text-xs
            md:text-sm
          "
        >
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
    <div
      className="
        w-full
        overflow-hidden
        rounded-2xl
        border
        border-white/10
        bg-white/10
        shadow-lg
        backdrop-blur-md
        transition
        hover:bg-white/[0.12]
      "
    >

      {/* =========================================
          TEAM HEADER
      ========================================== */}

      <button
        type="button"
        onClick={onToggle}
        className="
          block
          w-full
          text-left
          focus:outline-none
          focus:ring-2
          focus:ring-blue-400/30
        "
      >

        <div
          className="
            p-4
            sm:p-5
            md:p-6
          "
        >

          <div
            className="
              flex
              flex-col
              gap-4
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >

            {/* TEAM DETAILS */}

            <div className="flex min-w-0 items-center gap-3 sm:gap-4">

              {/* TEAM ICON */}

              <div
                className="
                  flex
                  h-12
                  w-12
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-blue-400/20
                  bg-blue-500/20
                  text-base
                  font-bold
                  text-blue-300
                  sm:h-14
                  sm:w-14
                  sm:text-xl
                "
              >
                {getTeamInitials(team.name)}
              </div>

              {/* NAME */}

              <div className="min-w-0 flex-1">

                <h2
                  className="
                    break-words
                    text-base
                    font-bold
                    leading-6
                    text-white
                    sm:text-lg
                    md:text-xl
                  "
                >
                  {team.name}
                </h2>

                <p
                  className="
                    mt-1
                    break-words
                    text-xs
                    leading-5
                    text-slate-400
                    sm:text-sm
                  "
                >
                  Captain:{" "}

                  <span className="font-semibold text-slate-200">
                    {team.captain || "Not assigned"}
                  </span>
                </p>

              </div>

            </div>

            {/* TEAM INFO */}

            <div
              className="
                flex
                w-full
                items-center
                justify-between
                gap-2
                sm:w-auto
                sm:justify-end
                sm:gap-3
              "
            >

              <span
                className="
                  rounded-lg
                  border
                  border-white/10
                  bg-white/5
                  px-3
                  py-2
                  text-xs
                  font-semibold
                  text-slate-200
                  sm:text-sm
                "
              >
                {team.players.length}{" "}
                {team.players.length === 1
                  ? "Player"
                  : "Players"}
              </span>

              <span
                className={`
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  border
                  border-white/10
                  bg-white/5
                  transition-transform
                  duration-300
                  ${expanded ? "rotate-180" : ""}
                `}
              >
                <svg
                  className="h-5 w-5 text-slate-400"
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

      {/* =========================================
          PLAYER LIST
      ========================================== */}

      {expanded && (
        <div
          className="
            border-t
            border-white/10
            bg-white/5
            p-3
            sm:p-4
            md:p-5
          "
        >

          {/* PLAYER HEADER */}

          <div
            className="
              mb-4
              flex
              flex-col
              gap-3
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >

            <div>

              <h3 className="font-semibold text-white sm:text-base">
                Players
              </h3>

              <p className="mt-0.5 text-xs text-slate-400">
                {team.players.length} registered{" "}
                {team.players.length === 1
                  ? "player"
                  : "players"}
              </p>

            </div>

            {team.captain && (
              <span
                className="
                  w-fit
                  max-w-full
                  break-words
                  rounded-full
                  border
                  border-blue-400/20
                  bg-blue-500/20
                  px-3
                  py-1
                  text-xs
                  font-bold
                  text-blue-300
                "
              >
                Captain: {team.captain}
              </span>
            )}

          </div>

          {/* PLAYER GRID */}

          {team.players.length === 0 ? (
            <div
              className="
                rounded-xl
                border
                border-white/10
                bg-white/5
                p-6
                text-center
              "
            >
              <p className="text-sm font-semibold text-slate-300">
                No players found
              </p>
            </div>
          ) : (
            <div
              className="
                grid
                grid-cols-1
                gap-3
                sm:grid-cols-2
                lg:grid-cols-3
                xl:grid-cols-4
              "
            >

              {team.players.map((player) => {

                const isCaptain =
                  player.name
                    .trim()
                    .toLowerCase() ===
                  (team.captain ?? "")
                    .trim()
                    .toLowerCase();

                return (
                  <div
                    key={player.id}
                    className="
                      flex
                      min-w-0
                      items-center
                      gap-3
                      rounded-xl
                      border
                      border-white/10
                      bg-white/5
                      p-3
                      transition
                      hover:border-blue-400/20
                      hover:bg-white/10
                    "
                  >

                    {/* JERSEY NUMBER */}

                    <div
                      className="
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        border
                        border-white/10
                        bg-white/10
                        text-sm
                        font-bold
                        text-slate-200
                        sm:h-11
                        sm:w-11
                      "
                    >
                      {player.jerseyNo ?? "-"}
                    </div>

                    {/* PLAYER */}

                    <div className="min-w-0 flex-1">

                      <div className="flex min-w-0 items-center gap-2">

                        <p
                          className="
                            min-w-0
                            flex-1
                            truncate
                            text-sm
                            font-semibold
                            text-white
                          "
                          title={player.name}
                        >
                          {player.name}
                        </p>

                        {isCaptain && (
                          <span
                            title="Captain"
                            className="
                              shrink-0
                              text-sm
                              font-bold
                              text-blue-300
                            "
                          >
                            ©
                          </span>
                        )}

                      </div>

                      <p className="mt-0.5 truncate text-[11px] text-slate-500 sm:text-xs">
                        Jersey #{player.jerseyNo ?? "-"}
                      </p>

                    </div>

                  </div>
                );
              })}

            </div>
          )}

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
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    words[0][0] +
    words[words.length - 1][0]
  ).toUpperCase();
}