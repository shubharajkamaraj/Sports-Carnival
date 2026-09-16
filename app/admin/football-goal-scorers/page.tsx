"use client";

import { useEffect, useState } from "react";

type GoalScorer = {
  position: number;

  playerId: number;

  playerName: string;

  jerseyNo: number | null;

  teamId: number;

  teamName: string;

  leagueGoals: number;

  finalGoals: number;

  totalGoals: number;
};

export default function FootballGoalScorersPage() {
  const [players, setPlayers] =
    useState<GoalScorer[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadScorers() {
    try {
      setLoading(true);

      setError("");

      const response =
        await fetch(
          "/api/football/goal-scorers",
          {
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load goal scorers."
        );
      }

      setPlayers(
        data.players ?? []
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load goal scorers."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadScorers();
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Football Goal Scorers
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Normal goals from League and Final matches only.
          Penalty goals and own goals are excluded.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-sm">
              <th className="px-4 py-3">
                #
              </th>

              <th className="px-4 py-3">
                Player
              </th>

              <th className="px-4 py-3">
                Team
              </th>

              <th className="px-4 py-3 text-center">
                League
              </th>

              <th className="px-4 py-3 text-center">
                Final
              </th>

              <th className="px-4 py-3 text-center">
                Total Goals
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-gray-500"
                >
                  Loading...
                </td>
              </tr>
            ) : players.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-gray-500"
                >
                  No goals recorded yet.
                </td>
              </tr>
            ) : (
              players.map(
                (player) => (
                  <tr
                    key={
                      player.playerId
                    }
                    className="border-b last:border-b-0"
                  >
                    <td className="px-4 py-3 font-semibold">
                      {player.position}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {player.playerName}
                      </div>

                      {player.jerseyNo !==
                        null && (
                        <div className="text-xs text-gray-500">
                          #{player.jerseyNo}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {player.teamName}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {player.leagueGoals}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {player.finalGoals}
                    </td>

                    <td className="px-4 py-3 text-center text-lg font-bold">
                      {player.totalGoals}
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}