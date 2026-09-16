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
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Tournament Standings
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Overall team standings across all tournament games
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={loadStandings}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="text-sm text-slate-500">
              Loading tournament standings...
            </p>
          </div>
        ) : standings.length === 0 ? (
          /* EMPTY */
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <p className="font-semibold text-slate-700">
              No standings available
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Tournament results will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* SUMMARY */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Teams
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {standings.length}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Games
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {games.length}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Leader
                </p>

                <p className="mt-2 truncate text-xl font-bold text-blue-600">
                  {standings[0]?.teamName ?? "-"}
                </p>
              </div>

            </div>

            {/* TABLE */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

              <div className="overflow-x-auto">

                <table className="w-full min-w-[800px] border-collapse">

                  <thead>
                    <tr className="bg-slate-100 text-xs font-bold uppercase tracking-wide text-slate-600">

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

                  <tbody className="divide-y divide-slate-100">

                    {standings.map((team, index) => (

                      <tr
                        key={team.teamId}
                        className="transition hover:bg-slate-50"
                      >

                        {/* RANK */}

                        <td className="px-4 py-4 text-center">

                          <div
                            className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                              index === 0
                                ? "bg-yellow-100 text-yellow-700"
                                : index === 1
                                ? "bg-slate-200 text-slate-700"
                                : index === 2
                                ? "bg-orange-100 text-orange-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {team.rank}
                          </div>

                        </td>

                        {/* TEAM */}

                        <td className="px-4 py-4">

                          <div className="font-semibold text-slate-900">
                            {team.teamName}
                          </div>

                        </td>

                        {/* PLAYED */}

                        <td className="px-4 py-4 text-center text-sm text-slate-700">
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
                              <span className="inline-flex min-w-[36px] items-center justify-center rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-700">
                                {points}
                              </span>
                            </td>
                          );
                        })}

                        {/* TOTAL POINTS */}

                        <td className="px-4 py-4 text-center">

                          <span className="inline-flex min-w-[50px] items-center justify-center rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-bold text-blue-700">
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

            <div className="mt-4 flex items-center justify-between">

              <p className="text-xs text-slate-500">
                Standings are calculated from tournament game results.
              </p>

              <button
                type="button"
                onClick={loadStandings}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
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