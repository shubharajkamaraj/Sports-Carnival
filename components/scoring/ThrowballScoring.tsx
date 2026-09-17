"use client";

import { useEffect, useState } from "react";

type Team = {
  id: number;
  name: string;
  captain?: string | null;
};

type ThrowballScore = {
  matchId: number;

  team1Id: number;
  team2Id: number;

  team1Score: number;
  team2Score: number;

  currentSet: number;

  team1Set1: number;
  team2Set1: number;

  team1SetsWon: number;
  team2SetsWon: number;

  status: string;

  winnerTeamId?: number | null;

  team1: Team;
  team2: Team;

  winnerTeam?: Team | null;
};

type Props = {
  matchId: number;
};

export default function ThrowballScoring({
  matchId,
}: Props) {
  const [score, setScore] =
    useState<ThrowballScore | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [updating, setUpdating] =
    useState(false);

  const [error, setError] =
    useState("");

  async function loadScore() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `/api/matches/${matchId}/throwball`,
        {
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Failed to load Throwball score."
        );
      }

      if (!data.score) {
        await createScore();
        return;
      }

      setScore(data.score);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load score."
      );
    } finally {
      setLoading(false);
    }
  }

  async function createScore() {
    try {
      const res = await fetch(
        `/api/matches/${matchId}/throwball`,
        {
          method: "POST",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Failed to create score."
        );
      }

      setScore(data.score);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create score."
      );
    }
  }

  async function addPoint(
    team: 1 | 2
  ) {
    if (!score) return;

    if (score.status === "COMPLETED") {
      return;
    }

    try {
      setUpdating(true);

      const res = await fetch(
        `/api/matches/${matchId}/throwball/live`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            team,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Failed to update score."
        );
      }

      setScore(data.score);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update score."
      );
    } finally {
      setUpdating(false);
    }
  }

  useEffect(() => {
    loadScore();
  }, [matchId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
        Loading Throwball scoring...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-6 text-red-300">
        {error}
      </div>
    );
  }

  if (!score) {
    return null;
  }

  const completed =
    score.status === "COMPLETED";

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

        <div className="flex items-center justify-between">

          <div>
            <p className="text-sm text-slate-500">
              Throwball
            </p>

            <h1 className="text-2xl font-black">
              Live Scoring
            </h1>
          </div>

          <div
            className={`rounded-full px-4 py-2 text-xs font-bold ${
              completed
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {completed
              ? "COMPLETED"
              : "LIVE"}
          </div>

        </div>
      </div>

      {/* MAIN SCORE */}

      <div className="grid gap-4 md:grid-cols-2">

        {/* TEAM 1 */}

        <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-950/50 to-slate-950 p-6">

          <p className="text-sm text-slate-400">
            {score.team1.name}
          </p>

          <div className="mt-3 flex items-end gap-3">

            <span className="text-6xl font-black">
              {score.team1Score}
            </span>

            <span className="pb-2 text-slate-500">
              points
            </span>

          </div>

          <div className="mt-4 text-sm text-slate-400">
            Sets won:{" "}
            <span className="font-bold text-white">
              {score.team1SetsWon}
            </span>
          </div>

          <button
            type="button"
            disabled={
              updating || completed
            }
            onClick={() =>
              addPoint(1)
            }
            className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-4 text-lg font-black transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            + POINT
          </button>

        </div>

        {/* TEAM 2 */}

        <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/50 to-slate-950 p-6">

          <p className="text-sm text-slate-400">
            {score.team2.name}
          </p>

          <div className="mt-3 flex items-end gap-3">

            <span className="text-6xl font-black">
              {score.team2Score}
            </span>

            <span className="pb-2 text-slate-500">
              points
            </span>

          </div>

          <div className="mt-4 text-sm text-slate-400">
            Sets won:{" "}
            <span className="font-bold text-white">
              {score.team2SetsWon}
            </span>
          </div>

          <button
            type="button"
            disabled={
              updating || completed
            }
            onClick={() =>
              addPoint(2)
            }
            className="mt-6 w-full rounded-xl bg-emerald-600 px-5 py-4 text-lg font-black transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            + POINT
          </button>

        </div>
      </div>

      {/* SET INFORMATION */}

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

        <div className="mb-4 flex items-center justify-between">

          <div>
            <p className="text-sm text-slate-500">
              Current Set
            </p>

            <h2 className="text-xl font-black">
              Set {score.currentSet}
            </h2>
          </div>

          <div className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-bold">
            {score.team1SetsWon} -{" "}
            {score.team2SetsWon}
          </div>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead>
              <tr className="border-b border-slate-800 text-slate-500">
                <th className="px-4 py-3 text-left">
                  Team
                </th>

                <th className="px-4 py-3 text-center">
                  Set 1
                </th>

            
                <th className="px-4 py-3 text-center">
                  Sets
                </th>
              </tr>
            </thead>

            <tbody>

              <tr className="border-b border-slate-800">
                <td className="px-4 py-4 font-bold">
                  {score.team1.name}
                </td>

                <td className="px-4 py-4 text-center font-bold">
                  {score.team1Set1}
                </td>

                <td className="px-4 py-4 text-center font-black text-blue-400">
                  {score.team1SetsWon}
                </td>
              </tr>

              <tr>
                <td className="px-4 py-4 font-bold">
                  {score.team2.name}
                </td>

                <td className="px-4 py-4 text-center font-bold">
                  {score.team2Set1}
                </td>

                <td className="px-4 py-4 text-center font-black text-emerald-400">
                  {score.team2SetsWon}
                </td>
              </tr>

            </tbody>

          </table>

        </div>
      </div>

      {/* WINNER */}

      {completed &&
        score.winnerTeam && (
          <div className="rounded-3xl border border-yellow-500/30 bg-yellow-500/5 p-8 text-center">

            <div className="text-5xl">
              🏆
            </div>

            <p className="mt-3 text-sm uppercase tracking-widest text-yellow-400">
              Winner
            </p>

            <h2 className="mt-2 text-3xl font-black">
              {score.winnerTeam.name}
            </h2>

          </div>
        )}

    </div>
  );
}