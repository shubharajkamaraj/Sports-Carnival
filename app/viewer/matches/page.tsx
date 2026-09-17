
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type MatchStatus =
  | "UPCOMING"
  | "LIVE"
  | "COMPLETED"
  | "CANCELLED"
  | string;

interface Team {
  id: number;
  name: string;
}

interface Game {
  id: number;
  name: string;
  sportType?: string | null;
}

interface Match {
  id: number;
  matchNumber?: number | null;
  stage?: string | null;
  status: MatchStatus;
  result?: string | null;
  winnerTeamId?: number | null;
  team1Score?: number | null;
  team2Score?: number | null;
  team1: Team;
  team2: Team;
  game: Game;
}

export default function ViewerMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState<
    "ALL" | "LIVE" | "UPCOMING" | "COMPLETED"
  >("ALL");

  useEffect(() => {
    loadMatches();
  }, []);

  async function loadMatches() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/matches", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load matches");
      }

      const data = await response.json();

      const matchList = Array.isArray(data)
        ? data
        : Array.isArray(data.matches)
          ? data.matches
          : Array.isArray(data.data)
            ? data.data
            : [];

      setMatches(matchList);
    } catch (err) {
      console.error("Viewer matches error:", err);
      setError("Unable to load matches.");
    } finally {
      setLoading(false);
    }
  }

  const filteredMatches = useMemo(() => {
    if (filter === "ALL") {
      return matches;
    }

    return matches.filter((match) => match.status === filter);
  }, [matches, filter]);

  const liveCount = matches.filter(
    (match) => match.status === "LIVE"
  ).length;

  const upcomingCount = matches.filter(
    (match) => match.status === "UPCOMING"
  ).length;

  const completedCount = matches.filter(
    (match) => match.status === "COMPLETED"
  ).length;

  function getSportName(match: Match) {
    if (match.game?.sportType) {
      return match.game.sportType;
    }

    return "SPORT";
  }

  function getStatusText(status: MatchStatus) {
    switch (status) {
      case "LIVE":
        return "LIVE";

      case "UPCOMING":
        return "UPCOMING";

      case "COMPLETED":
        return "COMPLETED";

      case "CANCELLED":
        return "CANCELLED";

      default:
        return status;
    }
  }

  function getResultText(match: Match) {
    if (match.status !== "COMPLETED") {
      return null;
    }

    if (match.result === "TEAM1_WIN") {
      return `${match.team1.name} won`;
    }

    if (match.result === "TEAM2_WIN") {
      return `${match.team2.name} won`;
    }

    if (match.result === "DRAW") {
      return "Draw";
    }

    if (match.result === "TIE") {
      return "Tie";
    }

    if (match.result === "NO_RESULT") {
      return "No Result";
    }

    if (match.winnerTeamId === match.team1.id) {
      return `${match.team1.name} won`;
    }

    if (match.winnerTeamId === match.team2.id) {
      return `${match.team2.name} won`;
    }

    return "Result available";
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <Link
                href="/viewer"
                className="text-sm font-medium text-slate-500 hover:text-slate-900"
              >
                ← Viewer Home
              </Link>

              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                Matches
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Follow live matches, upcoming games and completed results.
              </p>
            </div>

            <button
              onClick={loadMatches}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>

          </div>

          {/* Summary */}
          <div className="mt-6 grid grid-cols-3 gap-3">

            <button
              onClick={() => setFilter("LIVE")}
              className="rounded-xl border bg-white p-4 text-left hover:bg-slate-50"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Live
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {liveCount}
              </p>
            </button>

            <button
              onClick={() => setFilter("UPCOMING")}
              className="rounded-xl border bg-white p-4 text-left hover:bg-slate-50"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Upcoming
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {upcomingCount}
              </p>
            </button>

            <button
              onClick={() => setFilter("COMPLETED")}
              className="rounded-xl border bg-white p-4 text-left hover:bg-slate-50"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Completed
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {completedCount}
              </p>
            </button>

          </div>

        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-6 py-6">

        {/* Filters */}
        <div className="mb-5 flex flex-wrap gap-2">

          {(
            [
              ["ALL", "All"],
              ["LIVE", "Live"],
              ["UPCOMING", "Upcoming"],
              ["COMPLETED", "Completed"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === value
                  ? "bg-slate-900 text-white"
                  : "border bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {label}
            </button>
          ))}

        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-xl border bg-white p-10 text-center">
            <p className="text-sm text-slate-500">
              Loading matches...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-600">
              {error}
            </p>

            <button
              onClick={loadMatches}
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          filteredMatches.length === 0 && (
            <div className="rounded-xl border bg-white p-10 text-center">
              <div className="text-4xl">🏆</div>

              <h2 className="mt-3 text-lg font-semibold text-slate-900">
                No matches found
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                There are no matches in this category yet.
              </p>
            </div>
          )}

        {/* Match List */}
        {!loading &&
          !error &&
          filteredMatches.length > 0 && (
            <div className="overflow-hidden rounded-xl border bg-white">

              {/* Table Header */}
              <div className="hidden border-b bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 md:grid md:grid-cols-[90px_110px_1fr_120px_100px] md:gap-4">
                <div>Match</div>
                <div>Sport</div>
                <div>Teams</div>
                <div>Status</div>
                <div>Result</div>
              </div>

              {/* Rows */}
              <div className="divide-y">

                {filteredMatches.map((match) => {
                  const team1Score = match.team1Score ?? 0;
                  const team2Score = match.team2Score ?? 0;

                  return (
                    <Link
                      key={match.id}
                      href={`/viewer/matches/${match.id}`}
                      className="block px-5 py-4 transition hover:bg-slate-50"
                    >

                      <div className="grid gap-3 md:grid-cols-[90px_110px_1fr_120px_100px] md:items-center md:gap-4">

                        {/* Match Number */}
                        <div>
                          <p className="text-xs text-slate-400 md:hidden">
                            Match
                          </p>

                          <p className="font-semibold text-slate-900">
                            {match.matchNumber
                              ? `Match ${match.matchNumber}`
                              : `Match #${match.id}`}
                          </p>

                          {match.stage && (
                            <p className="mt-0.5 text-xs text-slate-400">
                              {match.stage}
                            </p>
                          )}
                        </div>

                        {/* Sport */}
                        <div>
                          <p className="text-xs text-slate-400 md:hidden">
                            Sport
                          </p>

                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {getSportName(match)}
                          </span>

                          <p className="mt-1 text-xs text-slate-400">
                            {match.game?.name}
                          </p>
                        </div>

                        {/* Teams */}
                        <div>

                          <div className="flex items-center justify-between gap-4">

                            <div className="min-w-0">
                              <p
                                className={`truncate font-semibold ${
                                  match.winnerTeamId === match.team1.id
                                    ? "text-slate-900"
                                    : "text-slate-700"
                                }`}
                              >
                                {match.team1.name}
                              </p>

                              <p
                                className={`truncate font-semibold ${
                                  match.winnerTeamId === match.team2.id
                                    ? "text-slate-900"
                                    : "text-slate-700"
                                }`}
                              >
                                {match.team2.name}
                              </p>
                            </div>

                            <div className="shrink-0 text-right">

                              <p className="font-bold text-slate-900">
                                {team1Score}
                              </p>

                              <p className="font-bold text-slate-900">
                                {team2Score}
                              </p>

                            </div>

                          </div>

                        </div>

                        {/* Status */}
                        <div>
                          <p className="text-xs text-slate-400 md:hidden">
                            Status
                          </p>

                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              match.status === "LIVE"
                                ? "bg-red-100 text-red-600"
                                : match.status === "UPCOMING"
                                  ? "bg-blue-100 text-blue-600"
                                  : match.status === "COMPLETED"
                                    ? "bg-green-100 text-green-600"
                                    : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {match.status === "LIVE" && (
                              <span className="mr-1.5">
                                ●
                              </span>
                            )}

                            {getStatusText(match.status)}
                          </span>
                        </div>

                        {/* Result */}
                        <div>
                          <p className="text-xs text-slate-400 md:hidden">
                            Result
                          </p>

                          <p className="text-sm font-medium text-slate-700">
                            {getResultText(match) ?? "—"}
                          </p>
                        </div>

                      </div>

                    </Link>
                  );
                })}

              </div>
            </div>
          )}

      </main>
    </div>
  );
}
