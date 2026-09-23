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

const filters = [
  ["ALL", "All"],
  ["LIVE", "Live"],
  ["UPCOMING", "Upcoming"],
  ["COMPLETED", "Completed"],
] as const;

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
    return match.game?.sportType || "SPORT";
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

  function getStatusClasses(status: MatchStatus) {
    switch (status) {
      case "LIVE":
        return "bg-red-500/20 text-red-300";

      case "UPCOMING":
        return "bg-blue-500/20 text-blue-300";

      case "COMPLETED":
        return "bg-green-500/20 text-green-300";

      case "CANCELLED":
        return "bg-orange-500/20 text-orange-300";

      default:
        return "bg-white/10 text-slate-300";
    }
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-transparent text-white">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div
          className="
            mx-auto
            w-full
            max-w-7xl
            px-4
            py-5

            sm:px-6
            sm:py-6

            lg:px-8
            lg:py-7

            xl:px-10
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
            {/* Title */}
            <div className="min-w-0">
              <Link
                href="/viewer"
                className="
                  inline-flex
                  items-center
                  text-sm
                  font-medium
                  text-slate-300
                  transition
                  hover:text-white
                "
              >
                ← Viewer Home
              </Link>

              <h1
                className="
                  mt-2
                  break-words
                  text-2xl
                  font-bold
                  leading-tight
                  text-white

                  sm:text-3xl

                  lg:text-4xl
                "
              >
                Matches
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

                  lg:text-base
                "
              >
                Follow live matches, upcoming games and completed results.
              </p>
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={loadMatches}
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
                font-medium
                text-white
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

          {/* =================================================
              SUMMARY
          ================================================== */}
          <div
            className="
              mt-5
              grid
              grid-cols-1
              gap-3

              sm:mt-6
              sm:grid-cols-3
              sm:gap-4
            "
          >
            {/* Live */}
            <button
              type="button"
              onClick={() => setFilter("LIVE")}
              className="
                w-full
                rounded-xl
                border
                border-white/10
                bg-white/10
                p-4
                text-left
                backdrop-blur-md
                transition
                hover:bg-white/15

                sm:p-5
              "
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Live
              </p>

              <p
                className="
                  mt-1
                  text-2xl
                  font-bold
                  text-white

                  sm:text-3xl
                "
              >
                {liveCount}
              </p>
            </button>

            {/* Upcoming */}
            <button
              type="button"
              onClick={() => setFilter("UPCOMING")}
              className="
                w-full
                rounded-xl
                border
                border-white/10
                bg-white/10
                p-4
                text-left
                backdrop-blur-md
                transition
                hover:bg-white/15

                sm:p-5
              "
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Upcoming
              </p>

              <p
                className="
                  mt-1
                  text-2xl
                  font-bold
                  text-white

                  sm:text-3xl
                "
              >
                {upcomingCount}
              </p>
            </button>

            {/* Completed */}
            <button
              type="button"
              onClick={() => setFilter("COMPLETED")}
              className="
                w-full
                rounded-xl
                border
                border-white/10
                bg-white/10
                p-4
                text-left
                backdrop-blur-md
                transition
                hover:bg-white/15

                sm:p-5
              "
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Completed
              </p>

              <p
                className="
                  mt-1
                  text-2xl
                  font-bold
                  text-white

                  sm:text-3xl
                "
              >
                {completedCount}
              </p>
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          CONTENT
      ====================================================== */}
      <main
        className="
          mx-auto
          w-full
          max-w-7xl
          px-4
          py-5

          sm:px-6
          sm:py-6

          lg:px-8
          lg:py-8

          xl:px-10
        "
      >
        {/* ===================================================
            FILTERS
        ==================================================== */}
        <div className="mb-5 w-full overflow-x-auto pb-1">
          <div className="flex min-w-max gap-2">
            {filters.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`
                  shrink-0
                  rounded-lg
                  px-4
                  py-2
                  text-sm
                  font-medium
                  transition

                  ${
                    filter === value
                      ? "bg-white text-slate-900 shadow-lg"
                      : "border border-white/10 bg-white/10 text-slate-200 backdrop-blur-md hover:bg-white/15"
                  }
                `}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ===================================================
            LOADING
        ==================================================== */}
        {loading && (
          <div
            className="
              rounded-2xl
              border
              border-white/10
              bg-white/10
              p-8
              text-center
              backdrop-blur-md

              sm:p-10
            "
          >
            <p className="text-sm text-slate-300">
              Loading matches...
            </p>
          </div>
        )}

        {/* ===================================================
            ERROR
        ==================================================== */}
        {!loading && error && (
          <div
            className="
              rounded-2xl
              border
              border-red-400/20
              bg-red-500/10
              p-6
              text-center
              backdrop-blur-md

              sm:p-8
            "
          >
            <p className="text-sm text-red-300">
              {error}
            </p>

            <button
              type="button"
              onClick={loadMatches}
              className="
                mt-4
                rounded-lg
                bg-white
                px-4
                py-2
                text-sm
                font-medium
                text-slate-900
                transition
                hover:bg-slate-200
              "
            >
              Try Again
            </button>
          </div>
        )}

        {/* ===================================================
            EMPTY
        ==================================================== */}
        {!loading &&
          !error &&
          filteredMatches.length === 0 && (
            <div
              className="
                rounded-2xl
                border
                border-white/10
                bg-white/10
                p-8
                text-center
                backdrop-blur-md

                sm:p-10
              "
            >
              <div className="text-4xl sm:text-5xl">
                🏆
              </div>

              <h2
                className="
                  mt-3
                  text-lg
                  font-semibold
                  text-white

                  sm:text-xl
                "
              >
                No matches found
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  leading-6
                  text-slate-300
                "
              >
                There are no matches in this category yet.
              </p>
            </div>
          )}

        {/* ===================================================
            MATCHES
        ==================================================== */}
        {!loading &&
          !error &&
          filteredMatches.length > 0 && (
            <div
              className="
                overflow-hidden
                rounded-2xl
                border
                border-white/10
                bg-white/10
                backdrop-blur-md
              "
            >
              {/* =================================================
                  DESKTOP TABLE HEADER
              ================================================== */}
              <div
                className="
                  hidden
                  border-b
                  border-white/10
                  bg-white/5
                  px-5
                  py-3
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wide
                  text-slate-400

                  lg:grid
                  lg:grid-cols-[90px_120px_minmax(220px,1fr)_130px_minmax(120px,160px)]
                  lg:gap-4

                  xl:grid-cols-[100px_130px_minmax(280px,1fr)_140px_minmax(140px,180px)]
                "
              >
                <div>Match</div>
                <div>Sport</div>
                <div>Teams</div>
                <div>Status</div>
                <div>Result</div>
              </div>

              {/* =================================================
                  MATCH LIST
              ================================================== */}
              <div className="divide-y divide-white/10">
                {filteredMatches.map((match) => {
                  const team1Score = match.team1Score ?? 0;
                  const team2Score = match.team2Score ?? 0;

                  const team1Won =
                    match.winnerTeamId === match.team1.id;

                  const team2Won =
                    match.winnerTeamId === match.team2.id;

                  return (
                    <Link
                      key={match.id}
                      href={`/viewer/matches/${match.id}`}
                      className="
                        block
                        min-w-0
                        p-4
                        transition
                        hover:bg-white/5

                        sm:p-5

                        lg:px-5
                        lg:py-4
                      "
                    >
                      {/* =================================================
                          MOBILE / TABLET CARD
                      ================================================== */}
                      <div className="lg:hidden">

                        {/* Top row */}
                        <div
                          className="
                            flex
                            min-w-0
                            items-start
                            justify-between
                            gap-3
                          "
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-slate-400">
                              {match.matchNumber
                                ? `Match ${match.matchNumber}`
                                : `Match #${match.id}`}
                            </p>

                            {match.stage && (
                              <p className="mt-0.5 text-xs text-slate-500">
                                {match.stage}
                              </p>
                            )}
                          </div>

                          {/* Status */}
                          <span
                            className={`
                              inline-flex
                              shrink-0
                              items-center
                              rounded-full
                              px-2.5
                              py-1
                              text-[10px]
                              font-semibold

                              sm:text-xs

                              ${getStatusClasses(match.status)}
                            `}
                          >
                            {match.status === "LIVE" && (
                              <span className="mr-1.5">
                                ●
                              </span>
                            )}

                            {getStatusText(match.status)}
                          </span>
                        </div>

                        {/* Sport */}
                        <div className="mt-3">
                          <span
                            className="
                              inline-flex
                              max-w-full
                              rounded-full
                              bg-white/10
                              px-2.5
                              py-1
                              text-xs
                              font-semibold
                              text-slate-200
                            "
                          >
                            {getSportName(match)}
                          </span>

                          <p className="mt-1 break-words text-xs text-slate-400">
                            {match.game?.name}
                          </p>
                        </div>

                        {/* Teams + Scores */}
                        <div className="mt-4 rounded-xl border border-white/10 bg-black/10 p-3">
                          <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0 flex-1 space-y-2">
                              <p
                                className={`
                                  break-words
                                  text-sm
                                  font-semibold
                                  leading-5

                                  ${
                                    team1Won
                                      ? "text-white"
                                      : "text-slate-300"
                                  }
                                `}
                              >
                                {match.team1.name}
                              </p>

                              <p
                                className={`
                                  break-words
                                  text-sm
                                  font-semibold
                                  leading-5

                                  ${
                                    team2Won
                                      ? "text-white"
                                      : "text-slate-300"
                                  }
                                `}
                              >
                                {match.team2.name}
                              </p>
                            </div>

                            <div
                              className="
                                shrink-0
                                text-right
                              "
                            >
                              <p className="text-lg font-bold text-white">
                                {team1Score}
                              </p>

                              <p className="text-lg font-bold text-white">
                                {team2Score}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Result */}
                        <div className="mt-3">
                          <p className="text-xs text-slate-400">
                            Result
                          </p>

                          <p className="mt-1 break-words text-sm font-medium text-slate-200">
                            {getResultText(match) ?? "—"}
                          </p>
                        </div>
                      </div>

                      {/* =================================================
                          DESKTOP TABLE ROW
                      ================================================== */}
                      <div
                        className="
                          hidden

                          lg:grid
                          lg:grid-cols-[90px_120px_minmax(220px,1fr)_130px_minmax(120px,160px)]
                          lg:items-center
                          lg:gap-4

                          xl:grid-cols-[100px_130px_minmax(280px,1fr)_140px_minmax(140px,180px)]
                        "
                      >
                        {/* Match */}
                        <div className="min-w-0">
                          <p className="break-words font-semibold text-white">
                            {match.matchNumber
                              ? `Match ${match.matchNumber}`
                              : `Match #${match.id}`}
                          </p>

                          {match.stage && (
                            <p className="mt-0.5 break-words text-xs text-slate-400">
                              {match.stage}
                            </p>
                          )}
                        </div>

                        {/* Sport */}
                        <div className="min-w-0">
                          <span
                            className="
                              inline-flex
                              max-w-full
                              rounded-full
                              bg-white/10
                              px-2.5
                              py-1
                              text-xs
                              font-semibold
                              text-slate-200
                            "
                          >
                            {getSportName(match)}
                          </span>

                          <p className="mt-1 break-words text-xs text-slate-400">
                            {match.game?.name}
                          </p>
                        </div>

                        {/* Teams */}
                        <div className="min-w-0">
                          <div className="flex items-center justify-between gap-5">
                            <div className="min-w-0 flex-1 space-y-1">
                              <p
                                className={`
                                  break-words
                                  font-semibold
                                  leading-5

                                  ${
                                    team1Won
                                      ? "text-white"
                                      : "text-slate-300"
                                  }
                                `}
                              >
                                {match.team1.name}
                              </p>

                              <p
                                className={`
                                  break-words
                                  font-semibold
                                  leading-5

                                  ${
                                    team2Won
                                      ? "text-white"
                                      : "text-slate-300"
                                  }
                                `}
                              >
                                {match.team2.name}
                              </p>
                            </div>

                            <div className="shrink-0 text-right">
                              <p className="font-bold text-white">
                                {team1Score}
                              </p>

                              <p className="font-bold text-white">
                                {team2Score}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="min-w-0">
                          <span
                            className={`
                              inline-flex
                              max-w-full
                              items-center
                              rounded-full
                              px-2.5
                              py-1
                              text-xs
                              font-semibold

                              ${getStatusClasses(match.status)}
                            `}
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
                        <div className="min-w-0">
                          <p className="break-words text-sm font-medium text-slate-200">
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