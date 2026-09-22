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
    <div className="min-h-screen bg-transparent px-4 py-6 text-white md:px-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            Tournament Standings
          </h1>

          <p className="mt-1 text-sm text-slate-300">
            Overall team standings across all tournament games
          </p>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-400/20 bg-red-500/10 p-4 backdrop-blur-md">
            <p className="text-sm font-semibold text-red-300">
              {error}
            </p>

            <button
              type="button"
              onClick={loadStandings}
              className="mt-3 rounded-lg border border-red-400/20 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/30"
            >
              Retry
            </button>
          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <div className="rounded-xl border border-white/10 bg-white/10 p-10 text-center shadow-lg backdrop-blur-md">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-white" />

            <p className="text-sm text-slate-300">
              Loading tournament standings...
            </p>
          </div>
        ) : standings.length === 0 ? (
          /* EMPTY */

          <div className="rounded-xl border border-white/10 bg-white/10 p-10 text-center shadow-lg backdrop-blur-md">
            <p className="font-semibold text-white">
              No standings available
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Tournament results will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* SUMMARY */}

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

              <div className="rounded-xl border border-white/10 bg-white/10 p-5 shadow-lg backdrop-blur-md transition hover:bg-white/15">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Teams
                </p>

                <p className="mt-2 text-3xl font-bold text-white">
                  {standings.length}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/10 p-5 shadow-lg backdrop-blur-md transition hover:bg-white/15">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Games
                </p>

                <p className="mt-2 text-3xl font-bold text-white">
                  {games.length}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/10 p-5 shadow-lg backdrop-blur-md transition hover:bg-white/15">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Leader
                </p>

                <p className="mt-2 truncate text-xl font-bold text-blue-300">
                  {standings[0]?.teamName ?? "-"}
                </p>
              </div>

            </div>

            {/* TABLE */}

            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/10 shadow-lg backdrop-blur-md">

              <div className="overflow-x-auto">

                <table className="w-full min-w-[800px] border-collapse">

                  <thead>
                    <tr className="bg-white/5 text-xs font-bold uppercase tracking-wide text-slate-300">

                      <th className="px-4 py-4 text-center">
                        Rank
                      </th>

                      <th className="px-4 py-4 text-left">
                        Team
                      </th>

                      <th className="px-4 py-4 text-center">
                        Played
                      </th>

                      {games.map((game) => (
                        <th
                          key={game.id}
                          className="px-4 py-4 text-center"
                        >
                          {game.name}
                        </th>
                      ))}

                      <th className="px-4 py-4 text-center">
                        Total Points
                      </th>

                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/10">

                    {standings.map((team, index) => (

                      <tr
                        key={team.teamId}
                        className="transition hover:bg-white/5"
                      >

                        {/* RANK */}

                        <td className="px-4 py-4 text-center">

                          <div
                            className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                              index === 0
                                ? "bg-yellow-500/20 text-yellow-300"
                                : index === 1
                                ? "bg-white/15 text-slate-200"
                                : index === 2
                                ? "bg-orange-500/20 text-orange-300"
                                : "bg-white/10 text-slate-300"
                            }`}
                          >
                            {team.rank}
                          </div>

                        </td>

                        {/* TEAM */}

                        <td className="px-4 py-4">

                          <div className="font-semibold text-white">
                            {team.teamName}
                          </div>

                        </td>

                        {/* PLAYED */}

                        <td className="px-4 py-4 text-center text-sm text-slate-300">
                          {team.gamesPlayed}
                        </td>

                        {/* INDIVIDUAL GAME POINTS */}

                        {games.map((game) => {

                          const points =
                            team.games?.[game.name] ?? 0;

                          return (
                            <td
                              key={game.id}
                              className="px-4 py-4 text-center"
                            >
                              <span className="inline-flex min-w-[36px] items-center justify-center rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-sm font-semibold text-slate-200">
                                {points}
                              </span>
                            </td>
                          );
                        })}

                        {/* TOTAL POINTS */}

                        <td className="px-4 py-4 text-center">

                          <span className="inline-flex min-w-[50px] items-center justify-center rounded-lg border border-blue-400/20 bg-blue-500/20 px-3 py-1.5 text-sm font-bold text-blue-300">
                            {team.totalPoints}
                          </span>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>
            </div>

            {/* LAST UPDATED / REFRESH */}

            <div className="mt-4 flex items-center justify-between gap-4">

              <p className="text-xs text-slate-400">
                Standings are calculated from tournament game results.
              </p>

              <button
                type="button"
                onClick={loadStandings}
                className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200 shadow-lg backdrop-blur-md transition hover:bg-white/15"
              >
                Refresh
              </button>

            </div>
          </>
        )}

      </div>
    </div>
  );
}