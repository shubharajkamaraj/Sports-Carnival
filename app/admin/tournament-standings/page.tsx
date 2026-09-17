"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Trophy,
  RefreshCw,
  Medal,
  TrendingUp,
} from "lucide-react";

type Game = {
  id: number;
  name: string;
  gameOrder: number | null;
};

type Standing = {
  rank: number;
  teamId: number;
  teamName: string;
  totalPoints: number;
  gamesPlayed: number;
  games: Record<string, number>;
};

export default function TournamentStandingsPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStandings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/tournament-standings", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Failed to load tournament standings."
        );
      }

      setGames(data.games ?? []);
      setStandings(data.standings ?? []);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load tournament standings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStandings();
  }, []);

  const totalTeams = standings.length;

  const highestScore = useMemo(() => {
    if (standings.length === 0) return 0;

    return standings[0].totalPoints;
  }, [standings]);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* HEADER */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-500/10">
                <Trophy className="h-6 w-6 text-yellow-400" />
              </div>

              <div>
                <h1 className="text-2xl font-bold">
                  Tournament Standings
                </h1>

                <p className="text-sm text-zinc-400">
                  Overall points accumulated across competition games
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={loadStandings}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium transition hover:bg-zinc-800 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />

            Refresh
          </button>
        </div>

        {/* SUMMARY */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            icon={<Trophy className="h-5 w-5" />}
            title="Competition Games"
            value={games.length}
          />

          <SummaryCard
            icon={<Medal className="h-5 w-5" />}
            title="Teams"
            value={totalTeams}
          />

          <SummaryCard
            icon={<TrendingUp className="h-5 w-5" />}
            title="Highest Points"
            value={highestScore}
          />
        </div>

        {/* ERROR */}
        {error && (
          <div className="rounded-xl border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
          <div className="border-b border-zinc-800 px-5 py-4">
            <h2 className="font-semibold">
              Overall Team Ranking
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Points are automatically calculated from Points Assignment.
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center text-zinc-500">
              Loading standings...
            </div>
          ) : standings.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 text-center">
              <Trophy className="h-10 w-10 text-zinc-700" />

              <p className="font-medium text-zinc-400">
                No tournament points assigned yet
              </p>

              <p className="text-sm text-zinc-600">
                Add results from Points Assignment.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/70 text-left text-xs uppercase tracking-wide text-zinc-500">
                    <th className="px-5 py-4 text-center">
                      Rank
                    </th>

                    <th className="px-5 py-4">
                      Team
                    </th>

                    <th className="px-5 py-4 text-center">
                      Games
                    </th>

                    {games.map((game) => (
                      <th
                        key={game.id}
                        className="px-5 py-4 text-center"
                      >
                        {game.name}
                      </th>
                    ))}

                    <th className="px-5 py-4 text-center">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {standings.map((team) => (
                    <tr
                      key={team.teamId}
                      className="border-b border-zinc-900 transition hover:bg-zinc-900/50"
                    >
                      <td className="px-5 py-5 text-center">
                        <RankBadge rank={team.rank} />
                      </td>

                      <td className="px-5 py-5">
                        <div className="font-semibold text-white">
                          {team.teamName}
                        </div>
                      </td>

                      <td className="px-5 py-5 text-center text-zinc-400">
                        {team.gamesPlayed}
                      </td>

                      {games.map((game) => (
                        <td
                          key={game.id}
                          className="px-5 py-5 text-center"
                        >
                          {team.games[game.name] ?? (
                            <span className="text-zinc-700">
                              —
                            </span>
                          )}
                        </td>
                      ))}

                      <td className="px-5 py-5 text-center">
                        <span className="inline-flex min-w-[70px] items-center justify-center rounded-lg bg-yellow-500/10 px-3 py-1.5 font-bold text-yellow-400">
                          {team.totalPoints}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-yellow-400">
          {icon}
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {title}
          </p>

          <p className="mt-1 text-2xl font-bold">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    return (
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-yellow-500/10 font-bold text-yellow-400">
        {rank}
      </div>
    );
  }

  return (
    <span className="font-semibold text-zinc-500">
      {rank}
    </span>
  );
}