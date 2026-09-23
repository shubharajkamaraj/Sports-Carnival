"use client";

import { useEffect, useState } from "react";

type Game = {
  id: number;
  name: string;
  gameOrder: number | null;
};

type TeamStanding = {
  rank: number;
  teamId: number;
  teamName: string;
  totalPoints: number;
  gamesPlayed: number;
  games: Record<string, number>;
};

type ApiResponse = {
  success: boolean;
  games: Game[];
  standings: TeamStanding[];
  error?: string;
};

export default function ViewerStandingsPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [standings, setStandings] = useState<TeamStanding[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStandings();
  }, []);

  async function loadStandings() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/tournament-standings", {
        method: "GET",
        cache: "no-store",
      });

      const text = await response.text();

      let data: ApiResponse;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `Invalid API response: ${text.slice(0, 300)}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to load tournament standings"
        );
      }

      if (!data.success) {
        throw new Error(
          data?.error || "Failed to load tournament standings"
        );
      }

      setGames(Array.isArray(data.games) ? data.games : []);

      setStandings(
        Array.isArray(data.standings)
          ? data.standings
          : []
      );
    } catch (err) {
      console.error("STANDINGS ERROR:", err);

      setGames([]);
      setStandings([]);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load standings"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
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
        md:px-6
        md:py-8
        lg:px-8
        xl:px-10
      "
    >
      <div className="mx-auto w-full max-w-7xl">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="mb-5 sm:mb-6 md:mb-8">
          <div
            className="
              flex
              flex-col
              gap-4
              sm:flex-row
              sm:items-end
              sm:justify-between
            "
          >
            <div className="min-w-0">
              <h1
                className="
                  text-2xl
                  font-bold
                  leading-tight
                  text-white
                  sm:text-3xl
                  lg:text-4xl
                "
              >
                Tournament Standings
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
                Overall team standings across all tournament
                games
              </p>
            </div>

            {/* Header Refresh */}

            <button
              type="button"
              onClick={loadStandings}
              disabled={loading}
              className="
                w-full
                shrink-0
                rounded-xl
                border
                border-white/10
                bg-white/10
                px-4
                py-2.5
                text-sm
                font-semibold
                text-slate-200
                shadow-lg
                backdrop-blur-md
                transition
                hover:bg-white/15
                disabled:cursor-not-allowed
                disabled:opacity-50
                sm:w-auto
              "
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* =====================================================
            ERROR
        ====================================================== */}

        {error && (
          <div
            className="
              mb-5
              rounded-xl
              border
              border-red-400/20
              bg-red-500/10
              p-4
              backdrop-blur-md
              sm:mb-6
            "
          >
            <p
              className="
                break-words
                text-sm
                font-semibold
                leading-5
                text-red-300
              "
            >
              {error}
            </p>

            <button
              type="button"
              onClick={loadStandings}
              className="
                mt-3
                w-full
                rounded-lg
                border
                border-red-400/20
                bg-red-500/20
                px-4
                py-2
                text-sm
                font-semibold
                text-red-200
                transition
                hover:bg-red-500/30
                sm:w-auto
              "
            >
              Retry
            </button>
          </div>
        )}

        {/* =====================================================
            LOADING
        ====================================================== */}

        {loading ? (
          <div
            className="
              rounded-xl
              border
              border-white/10
              bg-white/10
              p-8
              text-center
              shadow-lg
              backdrop-blur-md
              sm:p-10
            "
          >
            <div
              className="
                mx-auto
                mb-3
                h-8
                w-8
                animate-spin
                rounded-full
                border-4
                border-white/10
                border-t-white
              "
            />

            <p className="text-sm text-slate-300">
              Loading tournament standings...
            </p>
          </div>
        ) : standings.length === 0 ? (
          /* =====================================================
             EMPTY
          ====================================================== */

          <div
            className="
              rounded-xl
              border
              border-white/10
              bg-white/10
              p-8
              text-center
              shadow-lg
              backdrop-blur-md
              sm:p-10
            "
          >
            <div className="text-4xl">🏆</div>

            <p className="mt-3 font-semibold text-white">
              No standings available
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Tournament results will appear here.
            </p>

            <button
              type="button"
              onClick={loadStandings}
              className="
                mt-5
                rounded-lg
                bg-white
                px-4
                py-2
                text-sm
                font-semibold
                text-slate-900
                transition
                hover:bg-slate-200
              "
            >
              Refresh
            </button>
          </div>
        ) : (
          <>
            {/* =================================================
                SUMMARY
            ================================================== */}

            <div
              className="
                mb-5
                grid
                grid-cols-2
                gap-3
                sm:mb-6
                sm:grid-cols-3
                sm:gap-4
              "
            >
              {/* Teams */}

              <SummaryCard
                label="Teams"
                value={standings.length}
              />

              {/* Games */}

              <SummaryCard
                label="Games"
                value={games.length}
              />

              {/* Leader */}

              <div
                className="
                  col-span-2
                  min-w-0
                  rounded-xl
                  border
                  border-white/10
                  bg-white/10
                  p-4
                  shadow-lg
                  backdrop-blur-md
                  transition
                  hover:bg-white/15
                  sm:col-span-1
                  sm:p-5
                "
              >
                <p
                  className="
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-wide
                    text-slate-400
                    sm:text-xs
                  "
                >
                  Leader
                </p>

                <p
                  className="
                    mt-2
                    truncate
                    text-lg
                    font-bold
                    text-blue-300
                    sm:text-xl
                  "
                  title={standings[0]?.teamName}
                >
                  {standings[0]?.teamName ?? "-"}
                </p>
              </div>
            </div>

            {/* =================================================
                MOBILE STANDINGS
                Visible below md
            ================================================== */}

            <div className="space-y-4 md:hidden">
              {standings.map((team, index) => (
                <MobileTeamCard
                  key={team.teamId}
                  team={team}
                  games={games}
                  index={index}
                />
              ))}
            </div>

            {/* =================================================
                DESKTOP / TABLET TABLE
                Visible md and above
            ================================================== */}

            <div
              className="
                hidden
                overflow-hidden
                rounded-xl
                border
                border-white/10
                bg-white/10
                shadow-lg
                backdrop-blur-md
                md:block
              "
            >
              <div className="w-full overflow-x-auto">
                <table
                  className="
                    w-full
                    min-w-[800px]
                    border-collapse
                  "
                >
                  {/* TABLE HEADER */}

                  <thead>
                    <tr
                      className="
                        bg-white/5
                        text-xs
                        font-bold
                        uppercase
                        tracking-wide
                        text-slate-300
                      "
                    >
                      <th className="whitespace-nowrap px-3 py-4 text-center lg:px-4">
                        Rank
                      </th>

                      <th className="whitespace-nowrap px-3 py-4 text-left lg:px-4">
                        Team
                      </th>

                      <th className="whitespace-nowrap px-3 py-4 text-center lg:px-4">
                        Played
                      </th>

                      {games.map((game) => (
                        <th
                          key={game.id}
                          className="
                            max-w-[160px]
                            whitespace-normal
                            px-3
                            py-4
                            text-center
                            lg:px-4
                          "
                          title={game.name}
                        >
                          {game.name}
                        </th>
                      ))}

                      <th className="whitespace-nowrap px-3 py-4 text-center lg:px-4">
                        Total Points
                      </th>
                    </tr>
                  </thead>

                  {/* TABLE BODY */}

                  <tbody className="divide-y divide-white/10">
                    {standings.map((team, index) => (
                      <tr
                        key={team.teamId}
                        className="
                          transition
                          hover:bg-white/5
                        "
                      >
                        {/* RANK */}

                        <td className="px-3 py-4 text-center lg:px-4">
                          <RankBadge
                            rank={team.rank}
                            index={index}
                          />
                        </td>

                        {/* TEAM */}

                        <td
                          className="
                            min-w-[150px]
                            max-w-[240px]
                            px-3
                            py-4
                            lg:px-4
                          "
                        >
                          <div
                            className="
                              break-words
                              font-semibold
                              leading-5
                              text-white
                            "
                          >
                            {team.teamName}
                          </div>
                        </td>

                        {/* PLAYED */}

                        <td
                          className="
                            px-3
                            py-4
                            text-center
                            text-sm
                            text-slate-300
                            lg:px-4
                          "
                        >
                          {team.gamesPlayed}
                        </td>

                        {/* GAME POINTS */}

                        {games.map((game) => {
                          const points =
                            team.games?.[game.name] ?? 0;

                          return (
                            <td
                              key={game.id}
                              className="
                                px-3
                                py-4
                                text-center
                                lg:px-4
                              "
                            >
                              <span
                                className="
                                  inline-flex
                                  min-w-[36px]
                                  items-center
                                  justify-center
                                  rounded-lg
                                  border
                                  border-white/10
                                  bg-white/5
                                  px-2.5
                                  py-1
                                  text-sm
                                  font-semibold
                                  text-slate-200
                                "
                              >
                                {points}
                              </span>
                            </td>
                          );
                        })}

                        {/* TOTAL POINTS */}

                        <td
                          className="
                            px-3
                            py-4
                            text-center
                            lg:px-4
                          "
                        >
                          <span
                            className="
                              inline-flex
                              min-w-[50px]
                              items-center
                              justify-center
                              rounded-lg
                              border
                              border-blue-400/20
                              bg-blue-500/20
                              px-3
                              py-1.5
                              text-sm
                              font-bold
                              text-blue-300
                            "
                          >
                            {team.totalPoints}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* =================================================
                MOBILE INFORMATION
            ================================================== */}

            <div
              className="
                mt-5
                rounded-xl
                border
                border-white/10
                bg-white/10
                p-4
                shadow-lg
                backdrop-blur-md
                md:hidden
              "
            >
              <p className="text-xs leading-5 text-slate-400">
                Scroll through the team cards above to view
                individual game points and total tournament
                points.
              </p>
            </div>

            {/* =================================================
                DESKTOP LEGEND / REFRESH
            ================================================== */}

            <div
              className="
                mt-4
                flex
                flex-col
                gap-3
                sm:flex-row
                sm:items-center
                sm:justify-between
                sm:gap-4
              "
            >
              <p
                className="
                  text-xs
                  leading-5
                  text-slate-400
                "
              >
                Standings are calculated from tournament game
                results.
              </p>

              <button
                type="button"
                onClick={loadStandings}
                disabled={loading}
                className="
                  w-full
                  rounded-lg
                  border
                  border-white/10
                  bg-white/10
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-slate-200
                  shadow-lg
                  backdrop-blur-md
                  transition
                  hover:bg-white/15
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  sm:w-auto
                "
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      className="
        min-w-0
        rounded-xl
        border
        border-white/10
        bg-white/10
        p-4
        shadow-lg
        backdrop-blur-md
        transition
        hover:bg-white/15
        sm:p-5
      "
    >
      <p
        className="
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
          mt-2
          text-2xl
          font-bold
          text-white
          sm:text-3xl
        "
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   MOBILE TEAM CARD
========================================================= */

function MobileTeamCard({
  team,
  games,
  index,
}: {
  team: TeamStanding;
  games: Game[];
  index: number;
}) {
  return (
    <div
      className="
        overflow-hidden
        rounded-2xl
        border
        border-white/10
        bg-white/10
        shadow-lg
        backdrop-blur-md
      "
    >
      {/* TEAM HEADER */}

      <div
        className="
          border-b
          border-white/10
          bg-white/5
          p-4
          sm:p-5
        "
      >
        <div className="flex items-center gap-3">
          {/* Rank */}

          <RankBadge
            rank={team.rank}
            index={index}
          />

          {/* Team Name */}

          <div className="min-w-0 flex-1">
            <p
              className="
                break-words
                text-base
                font-bold
                leading-5
                text-white
                sm:text-lg
              "
            >
              {team.teamName}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {team.gamesPlayed}{" "}
              {team.gamesPlayed === 1
                ? "game"
                : "games"}{" "}
              played
            </p>
          </div>

          {/* Total */}

          <div className="shrink-0 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Total
            </p>

            <span
              className="
                mt-1
                inline-flex
                min-w-[48px]
                items-center
                justify-center
                rounded-lg
                border
                border-blue-400/20
                bg-blue-500/20
                px-2.5
                py-1.5
                text-sm
                font-bold
                text-blue-300
              "
            >
              {team.totalPoints}
            </span>
          </div>
        </div>
      </div>

      {/* GAME POINTS */}

      <div className="p-4 sm:p-5">
        <p
          className="
            mb-3
            text-[10px]
            font-semibold
            uppercase
            tracking-wider
            text-slate-400
          "
        >
          Game Points
        </p>

        {games.length === 0 ? (
          <p className="text-sm text-slate-400">
            No games available.
          </p>
        ) : (
          <div
            className="
              grid
              grid-cols-1
              gap-2
              min-[380px]:grid-cols-2
            "
          >
            {games.map((game) => {
              const points =
                team.games?.[game.name] ?? 0;

              return (
                <div
                  key={game.id}
                  className="
                    flex
                    min-w-0
                    items-center
                    justify-between
                    gap-3
                    rounded-xl
                    border
                    border-white/10
                    bg-white/5
                    px-3
                    py-3
                  "
                >
                  <span
                    className="
                      min-w-0
                      break-words
                      pr-2
                      text-xs
                      font-medium
                      leading-4
                      text-slate-300
                    "
                  >
                    {game.name}
                  </span>

                  <span
                    className="
                      flex
                      h-8
                      min-w-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      bg-white/10
                      px-2
                      text-sm
                      font-bold
                      text-white
                    "
                  >
                    {points}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   RANK BADGE
========================================================= */

function RankBadge({
  rank,
  index,
}: {
  rank: number;
  index: number;
}) {
  const className =
    index === 0
      ? "bg-yellow-500/20 text-yellow-300"
      : index === 1
        ? "bg-white/15 text-slate-200"
        : index === 2
          ? "bg-orange-500/20 text-orange-300"
          : "bg-white/10 text-slate-300";

  return (
    <div
      className={`
        flex
        h-9
        w-9
        shrink-0
        items-center
        justify-center
        rounded-full
        text-sm
        font-bold
        ${className}
      `}
    >
      {rank}
    </div>
  );
}