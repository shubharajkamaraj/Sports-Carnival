"use client";

import { useEffect, useState } from "react";
import {
  Trophy,
  RefreshCw,
  ArrowLeft,
  TableProperties,
  Target,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

type HandballTeamStanding = {
  teamId: number;
  teamName: string;

  played: number;
  won: number;
  drawn: number;
  lost: number;

  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;

  points: number;
};

type ApiResponse = {
  success: boolean;
  standings: HandballTeamStanding[];
  message?: string;
};

export default function HandballPointsTablePage() {
  const router = useRouter();

  const [standings, setStandings] = useState<
    HandballTeamStanding[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadPointsTable(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(
        "/api/points-table/handball",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data: ApiResponse =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load handball points table."
        );
      }

      setStandings(data.standings || []);
    } catch (err) {
      console.error(
        "Handball points table error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load points table."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadPointsTable();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white md:p-6">
      <div className="mx-auto max-w-7xl">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950">

          <div className="p-5 md:p-7">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-3">

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/admin/points-table"
                    )
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white"
                >
                  <ArrowLeft size={18} />
                </button>

                <div>

                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                    Sports Carnival
                  </p>

                  <h1 className="mt-1 text-2xl font-black md:text-3xl">
                    Handball Points Table
                  </h1>

                  <p className="mt-1 text-xs text-slate-500">
                    Automatic standings based on completed matches
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  loadPointsTable(true)
                }
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-black text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >

                <RefreshCw
                  size={15}
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />

                {refreshing
                  ? "Refreshing..."
                  : "Refresh"}

              </button>

            </div>

          </div>

        </section>

        {/* =====================================================
            SUMMARY CARDS
        ===================================================== */}

        {!loading &&
          !error &&
          standings.length > 0 && (
            <section className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">

              <SummaryCard
                icon={
                  <TableProperties size={18} />
                }
                label="Teams"
                value={standings.length}
                iconClass="text-emerald-400"
                bgClass="bg-emerald-500/10"
              />

              <SummaryCard
                icon={
                  <Target size={18} />
                }
                label="Matches Played"
                value={getTotalMatches(
                  standings
                )}
                iconClass="text-blue-400"
                bgClass="bg-blue-500/10"
              />

              <SummaryCard
                icon={
                  <Trophy size={18} />
                }
                label="Total Points"
                value={getTotalPoints(
                  standings
                )}
                iconClass="text-yellow-400"
                bgClass="bg-yellow-500/10"
              />

              <SummaryCard
                icon={
                  <ShieldCheck size={18} />
                }
                label="Total Goals"
                value={getTotalGoals(
                  standings
                )}
                iconClass="text-purple-400"
                bgClass="bg-purple-500/10"
              />

            </section>
          )}

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <section className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">

            <div className="flex items-start gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                !
              </div>

              <div className="flex-1">

                <h2 className="text-sm font-black text-red-300">
                  Unable to load points table
                </h2>

                <p className="mt-1 text-xs leading-5 text-red-400/80">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    loadPointsTable(true)
                  }
                  className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-black text-red-300 transition hover:bg-red-500/20"
                >
                  Try Again
                </button>

              </div>

            </div>

          </section>
        )}

        {/* =====================================================
            LOADING
        ===================================================== */}

        {loading && (
          <section className="mt-5 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50">

            <div className="p-5">

              <div className="flex items-center gap-3">

                <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-800" />

                <div className="space-y-2">

                  <div className="h-4 w-48 animate-pulse rounded bg-slate-800" />

                  <div className="h-3 w-32 animate-pulse rounded bg-slate-800" />

                </div>

              </div>

              <div className="mt-6 space-y-3">

                {Array.from({
                  length: 4,
                }).map((_, index) => (
                  <div
                    key={index}
                    className="h-14 animate-pulse rounded-xl bg-slate-800/70"
                  />
                ))}

              </div>

            </div>

          </section>
        )}

        {/* =====================================================
            EMPTY
        ===================================================== */}

        {!loading &&
          !error &&
          standings.length === 0 && (
            <section className="mt-5 rounded-3xl border border-slate-800 bg-slate-900/50 p-10 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
                <TableProperties size={25} />
              </div>

              <h2 className="mt-4 text-lg font-black">
                No Handball Matches Yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Once completed handball matches
                are available, the team standings
                will automatically appear here.
              </p>

            </section>
          )}

        {/* =====================================================
            POINTS TABLE
        ===================================================== */}

        {!loading &&
          !error &&
          standings.length > 0 && (
            <section className="mt-5 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50">

              {/* TABLE HEADER */}

              <div className="flex flex-col gap-3 border-b border-slate-800 p-5 md:flex-row md:items-center md:justify-between">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <TableProperties size={19} />
                  </div>

                  <div>

                    <h2 className="text-base font-black">
                      Handball Standings
                    </h2>

                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Updated from completed match results
                    </p>

                  </div>

                </div>

                <div className="flex items-center gap-2">

                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-400">
                    Automatic
                  </span>

                  <span className="rounded-full bg-slate-800 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-slate-500">
                    3 Pts Win
                  </span>

                </div>

              </div>

              {/* TABLE */}

              <div className="overflow-x-auto">

                <table className="w-full min-w-[850px] border-collapse">

                  <thead>

                    <tr className="border-b border-slate-800 bg-slate-950/60">

                      <th className="w-14 px-4 py-4 text-center text-[10px] font-black uppercase tracking-wider text-slate-500">
                        #
                      </th>

                      <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Team
                      </th>

                      <th className="px-3 py-4 text-center text-[10px] font-black uppercase tracking-wider text-slate-500">
                        P
                      </th>

                      <th className="px-3 py-4 text-center text-[10px] font-black uppercase tracking-wider text-emerald-400">
                        W
                      </th>

                      <th className="px-3 py-4 text-center text-[10px] font-black uppercase tracking-wider text-yellow-400">
                        D
                      </th>

                      <th className="px-3 py-4 text-center text-[10px] font-black uppercase tracking-wider text-red-400">
                        L
                      </th>

                      <th className="px-3 py-4 text-center text-[10px] font-black uppercase tracking-wider text-slate-500">
                        GF
                      </th>

                      <th className="px-3 py-4 text-center text-[10px] font-black uppercase tracking-wider text-slate-500">
                        GA
                      </th>

                      <th className="px-3 py-4 text-center text-[10px] font-black uppercase tracking-wider text-blue-400">
                        GD
                      </th>

                      <th className="px-4 py-4 text-center text-[10px] font-black uppercase tracking-wider text-yellow-400">
                        Pts
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {standings.map(
                      (team, index) => (
                        <HandballStandingRow
                          key={team.teamId}
                          team={team}
                          position={
                            index + 1
                          }
                        />
                      )
                    )}

                  </tbody>

                </table>

              </div>

              {/* LEGEND */}

              <div className="border-t border-slate-800 bg-slate-950/40 px-5 py-4">

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] text-slate-500">

                  <span>
                    <b className="text-slate-300">
                      P
                    </b>{" "}
                    Played
                  </span>

                  <span>
                    <b className="text-emerald-400">
                      W
                    </b>{" "}
                    Won
                  </span>

                  <span>
                    <b className="text-yellow-400">
                      D
                    </b>{" "}
                    Draw
                  </span>

                  <span>
                    <b className="text-red-400">
                      L
                    </b>{" "}
                    Lost
                  </span>

                  <span>
                    <b className="text-slate-300">
                      GF
                    </b>{" "}
                    Goals For
                  </span>

                  <span>
                    <b className="text-slate-300">
                      GA
                    </b>{" "}
                    Goals Against
                  </span>

                  <span>
                    <b className="text-blue-400">
                      GD
                    </b>{" "}
                    Goal Difference
                  </span>

                  <span>
                    <b className="text-yellow-400">
                      Pts
                    </b>{" "}
                    Points
                  </span>

                </div>

              </div>

            </section>
          )}

      </div>
    </main>
  );
}

/* =============================================================
   STANDING ROW
============================================================= */

function HandballStandingRow({
  team,
  position,
}: {
  team: HandballTeamStanding;
  position: number;
}) {
  const isFirst = position === 1;

  const isPositiveGD =
    team.goalDifference > 0;

  const isNegativeGD =
    team.goalDifference < 0;

  return (
    <tr
      className={`border-b border-slate-800/70 transition hover:bg-slate-800/30 ${
        isFirst
          ? "bg-yellow-500/[0.025]"
          : ""
      }`}
    >

      {/* POSITION */}

      <td className="px-4 py-4 text-center">

        {position <= 3 ? (
          <div
            className={`mx-auto flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-black ${
              position === 1
                ? "bg-yellow-500/10 text-yellow-400"
                : position === 2
                  ? "bg-slate-700 text-slate-300"
                  : "bg-orange-500/10 text-orange-400"
            }`}
          >
            {position}
          </div>
        ) : (
          <span className="text-xs font-bold text-slate-600">
            {position}
          </span>
        )}

      </td>

      {/* TEAM */}

      <td className="px-4 py-4">

        <div className="flex items-center gap-3">

          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
              isFirst
                ? "bg-yellow-500/10 text-yellow-400"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {team.teamName
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="min-w-0">

            <p
              className={`truncate text-sm font-black ${
                isFirst
                  ? "text-yellow-300"
                  : "text-white"
              }`}
            >
              {team.teamName}
            </p>

            {isFirst && (
              <p className="mt-0.5 text-[9px] font-black uppercase tracking-wider text-yellow-500/60">
                Current Leader
              </p>
            )}

          </div>

        </div>

      </td>

      {/* PLAYED */}

      <td className="px-3 py-4 text-center text-sm font-bold text-slate-300">
        {team.played}
      </td>

      {/* WON */}

      <td className="px-3 py-4 text-center text-sm font-black text-emerald-400">
        {team.won}
      </td>

      {/* DRAW */}

      <td className="px-3 py-4 text-center text-sm font-bold text-yellow-400">
        {team.drawn}
      </td>

      {/* LOST */}

      <td className="px-3 py-4 text-center text-sm font-bold text-red-400">
        {team.lost}
      </td>

      {/* GOALS FOR */}

      <td className="px-3 py-4 text-center text-sm font-bold text-slate-300">
        {team.goalsFor}
      </td>

      {/* GOALS AGAINST */}

      <td className="px-3 py-4 text-center text-sm font-bold text-slate-400">
        {team.goalsAgainst}
      </td>

      {/* GOAL DIFFERENCE */}

      <td className="px-3 py-4 text-center">

        <span
          className={`text-sm font-black ${
            isPositiveGD
              ? "text-emerald-400"
              : isNegativeGD
                ? "text-red-400"
                : "text-slate-500"
          }`}
        >
          {team.goalDifference > 0
            ? `+${team.goalDifference}`
            : team.goalDifference}
        </span>

      </td>

      {/* POINTS */}

      <td className="px-4 py-4 text-center">

        <div className="inline-flex min-w-[42px] items-center justify-center rounded-lg bg-yellow-500/10 px-2.5 py-1.5">

          <span className="text-sm font-black text-yellow-400">
            {team.points}
          </span>

        </div>

      </td>

    </tr>
  );
}

/* =============================================================
   SUMMARY CARD
============================================================= */

function SummaryCard({
  icon,
  label,
  value,
  iconClass,
  bgClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  iconClass: string;
  bgClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">

      <div className="flex items-center gap-3">

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${bgClass} ${iconClass}`}
        >
          {icon}
        </div>

        <div className="min-w-0">

          <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
            {label}
          </p>

          <p className="mt-1 text-xl font-black text-white">
            {value}
          </p>

        </div>

      </div>

    </div>
  );
}

/* =============================================================
   HELPERS
============================================================= */

function getTotalMatches(
  standings: HandballTeamStanding[]
) {
  return Math.floor(
    standings.reduce(
      (total, team) =>
        total + team.played,
      0
    ) / 2
  );
}

function getTotalPoints(
  standings: HandballTeamStanding[]
) {
  return standings.reduce(
    (total, team) =>
      total + team.points,
    0
  );
}

function getTotalGoals(
  standings: HandballTeamStanding[]
) {
  return standings.reduce(
    (total, team) =>
      total + team.goalsFor,
    0
  );
}