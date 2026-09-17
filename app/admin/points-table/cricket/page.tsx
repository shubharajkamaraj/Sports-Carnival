"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  RefreshCw,
  Trophy,
  TrendingUp,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type PointsTableTeam = {
  position: number;

  teamId: number;
  teamName: string;

  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;

  points: number;

  nrr: number;
};

type PointsTableResponse = {
  success: boolean;

  tournamentId:
    | number
    | null;

  matchesPlayed: number;

  teams: PointsTableTeam[];

  error?: string;
};

/* =========================================================
   PAGE
========================================================= */

export default function CricketPointsTablePage() {
  /* =======================================================
     STATE
  ======================================================= */

  const [teams, setTeams] =
    useState<PointsTableTeam[]>(
      []
    );

  const [matchesPlayed, setMatchesPlayed] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * Change this if you want to
   * permanently show one tournament.
   *
   * Example:
   *
   * const tournamentId = 1;
   *
   * For now we don't filter.
   */

  const tournamentId:
    | number
    | null = null;

  /* =======================================================
     LOAD TABLE
  ======================================================= */

  async function loadPointsTable(
    showRefresh = false
  ) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const url =
        tournamentId
          ? `/api/cricket/points-table?tournamentId=${tournamentId}`
          : "/api/cricket/points-table";

      const response =
        await fetch(url, {
          cache: "no-store",
        });

      const data =
        (await response.json()) as
          PointsTableResponse;

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load points table."
        );
      }

      if (!data.success) {
        throw new Error(
          data.error ||
            "Failed to load points table."
        );
      }

      setTeams(
        data.teams ?? []
      );

      setMatchesPlayed(
        data.matchesPlayed ?? 0
      );
    } catch (error) {
      console.error(
        "POINTS TABLE ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load points table."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadPointsTable();
  }, []);

  /* =======================================================
     NRR FORMAT
  ======================================================= */

  function formatNRR(
    nrr: number
  ) {
    if (nrr > 0) {
      return `+${nrr.toFixed(3)}`;
    }

    return nrr.toFixed(3);
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-4 text-white md:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
              <Trophy
                size={22}
                className="text-emerald-400"
              />
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-400">
              Loading cricket points table...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 p-4 text-white md:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-red-500/20 bg-red-950/20 p-8">
            <h1 className="text-xl font-black text-red-400">
              Unable to load points table
            </h1>

            <p className="mt-2 text-sm text-red-300">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                loadPointsTable(true)
              }
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700"
            >
              <RefreshCw
                size={15}
              />

              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-emerald-950/50 via-slate-900 to-slate-950">

          <div className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                <Trophy
                  size={27}
                  className="text-emerald-400"
                />
              </div>

              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400">
                  Cricket
                </p>

                <h1 className="mt-1 text-2xl font-black md:text-3xl">
                  Points Table
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Tournament standings
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                loadPointsTable(true)
              }
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-bold text-slate-200 transition hover:bg-slate-800 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
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

          {/* =================================================
              STATS
          ================================================= */}

          <div className="grid grid-cols-2 border-t border-slate-800 md:grid-cols-3">

            <div className="p-5 text-center md:p-6">
              <p className="text-2xl font-black">
                {teams.length}
              </p>

              <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                Teams
              </p>
            </div>

            <div className="border-l border-slate-800 p-5 text-center md:p-6">
              <p className="text-2xl font-black">
                {matchesPlayed}
              </p>

              <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                Completed Matches
              </p>
            </div>

            <div className="hidden border-l border-slate-800 p-5 text-center md:block md:p-6">
              <p className="text-2xl font-black text-emerald-400">
                2
              </p>

              <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                Points / Win
              </p>
            </div>

          </div>

        </section>

        {/* =================================================
            POINTS TABLE
        ================================================= */}

        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">

          {/* TABLE HEADER */}

          <div className="border-b border-slate-800 p-5 md:p-6">

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

              <div>
                <h2 className="text-lg font-black">
                  Team Standings
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Ranked by points and net run rate
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <TrendingUp
                  size={14}
                />

                Points → NRR
              </div>

            </div>

          </div>

          {/* =================================================
              EMPTY
          ================================================= */}

          {teams.length === 0 ? (
            <div className="p-12 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-800">
                <Trophy
                  size={22}
                  className="text-slate-500"
                />
              </div>

              <h3 className="mt-4 text-sm font-bold text-slate-300">
                No completed cricket matches
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                The points table will appear once
                cricket matches are completed.
              </p>

            </div>
          ) : (
            <>

              {/* =================================================
                  DESKTOP TABLE
              ================================================= */}

              <div className="hidden overflow-x-auto md:block">

                <table className="w-full border-collapse">

                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/70">

                      <th className="w-16 px-4 py-4 text-center text-[10px] font-black uppercase tracking-wider text-slate-500">
                        #
                      </th>

                      <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Team
                      </th>

                      <th className="px-3 py-4 text-center text-[10px] font-black uppercase tracking-wider text-slate-500">
                        P
                      </th>

                      <th className="px-3 py-4 text-center text-[10px] font-black uppercase tracking-wider text-slate-500">
                        W
                      </th>

                      <th className="px-3 py-4 text-center text-[10px] font-black uppercase tracking-wider text-slate-500">
                        L
                      </th>

                      <th className="px-3 py-4 text-center text-[10px] font-black uppercase tracking-wider text-slate-500">
                        T
                      </th>

                      <th className="px-3 py-4 text-center text-[10px] font-black uppercase tracking-wider text-slate-500">
                        NR
                      </th>

                      <th className="px-4 py-4 text-center text-[10px] font-black uppercase tracking-wider text-slate-500">
                        PTS
                      </th>

                      <th className="px-4 py-4 text-center text-[10px] font-black uppercase tracking-wider text-slate-500">
                        NRR
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {teams.map(
                      (team) => {

                        const isFirst =
                          team.position ===
                          1;

                        const isSecond =
                          team.position ===
                          2;

                        const isThird =
                          team.position ===
                          3;

                        return (
                          <tr
                            key={
                              team.teamId
                            }
                            className={`border-b border-slate-800 transition hover:bg-slate-800/40 ${
                              isFirst
                                ? "bg-emerald-500/[0.04]"
                                : ""
                            }`}
                          >

                            {/* POSITION */}

                            <td className="px-4 py-5 text-center">

                              {isFirst ? (
                                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/10 text-sm">
                                  🥇
                                </div>
                              ) : isSecond ? (
                                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-slate-400/10 text-sm">
                                  🥈
                                </div>
                              ) : isThird ? (
                                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10 text-sm">
                                  🥉
                                </div>
                              ) : (
                                <span className="text-sm font-black text-slate-500">
                                  {
                                    team.position
                                  }
                                </span>
                              )}

                            </td>

                            {/* TEAM */}

                            <td className="px-4 py-5">

                              <div className="flex items-center gap-3">

                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-xs font-black text-slate-400">
                                  {
                                    team.teamName
                                      .slice(
                                        0,
                                        2
                                      )
                                      .toUpperCase()
                                  }
                                </div>

                                <div>
                                  <p className="text-sm font-black text-white">
                                    {
                                      team.teamName
                                    }
                                  </p>

                                  {isFirst && (
                                    <p className="mt-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-400">
                                      Top position
                                    </p>
                                  )}
                                </div>

                              </div>

                            </td>

                            {/* P */}

                            <td className="px-3 py-5 text-center text-sm font-bold text-slate-300">
                              {
                                team.played
                              }
                            </td>

                            {/* W */}

                            <td className="px-3 py-5 text-center text-sm font-black text-emerald-400">
                              {
                                team.won
                              }
                            </td>

                            {/* L */}

                            <td className="px-3 py-5 text-center text-sm font-bold text-red-400">
                              {
                                team.lost
                              }
                            </td>

                            {/* T */}

                            <td className="px-3 py-5 text-center text-sm font-bold text-yellow-400">
                              {
                                team.tied
                              }
                            </td>

                            {/* NR */}

                            <td className="px-3 py-5 text-center text-sm font-bold text-slate-400">
                              {
                                team.noResult
                              }
                            </td>

                            {/* POINTS */}

                            <td className="px-4 py-5 text-center">

                              <span className="inline-flex min-w-10 items-center justify-center rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-sm font-black text-emerald-400">
                                {
                                  team.points
                                }
                              </span>

                            </td>

                            {/* NRR */}

                            <td className="px-4 py-5 text-center">

                              <span
                                className={`inline-flex items-center gap-1 text-sm font-black ${
                                  team.nrr >
                                  0
                                    ? "text-emerald-400"
                                    : team.nrr <
                                        0
                                      ? "text-red-400"
                                      : "text-slate-400"
                                }`}
                              >

                                {team.nrr >
                                0 ? (
                                  <ChevronUp
                                    size={
                                      13
                                    }
                                  />
                                ) : team.nrr <
                                  0 ? (
                                  <ChevronDown
                                    size={
                                      13
                                    }
                                  />
                                ) : null}

                                {formatNRR(
                                  team.nrr
                                )}

                              </span>

                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

              {/* =================================================
                  MOBILE CARDS
              ================================================= */}

              <div className="space-y-3 p-4 md:hidden">

                {teams.map(
                  (team) => {

                    const isTop =
                      team.position ===
                      1;

                    return (
                      <div
                        key={
                          team.teamId
                        }
                        className={`rounded-2xl border p-4 ${
                          isTop
                            ? "border-emerald-500/30 bg-emerald-500/[0.04]"
                            : "border-slate-800 bg-slate-950"
                        }`}
                      >

                        {/* TOP */}

                        <div className="flex items-center justify-between">

                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-xs font-black text-slate-400">
                              {team.position}
                            </div>

                            <div>
                              <p className="text-sm font-black">
                                {
                                  team.teamName
                                }
                              </p>

                              <p className="mt-0.5 text-[10px] font-bold text-slate-500">
                                {
                                  team.played
                                }{" "}
                                matches
                              </p>
                            </div>

                          </div>

                          <div className="text-right">

                            <p className="text-lg font-black text-emerald-400">
                              {
                                team.points
                              }
                            </p>

                            <p className="text-[9px] font-black uppercase text-slate-500">
                              Points
                            </p>

                          </div>

                        </div>

                        {/* STATS */}

                        <div className="mt-4 grid grid-cols-4 gap-2">

                          <div className="rounded-xl bg-slate-900 p-2 text-center">
                            <p className="text-sm font-black">
                              {
                                team.won
                              }
                            </p>

                            <p className="text-[9px] font-bold text-slate-500">
                              W
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-900 p-2 text-center">
                            <p className="text-sm font-black text-red-400">
                              {
                                team.lost
                              }
                            </p>

                            <p className="text-[9px] font-bold text-slate-500">
                              L
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-900 p-2 text-center">
                            <p className="text-sm font-black">
                              {
                                team.tied
                              }
                            </p>

                            <p className="text-[9px] font-bold text-slate-500">
                              T
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-900 p-2 text-center">
                            <p
                              className={`text-sm font-black ${
                                team.nrr >
                                0
                                  ? "text-emerald-400"
                                  : team.nrr <
                                      0
                                    ? "text-red-400"
                                    : "text-slate-300"
                              }`}
                            >
                              {formatNRR(
                                team.nrr
                              )}
                            </p>

                            <p className="text-[9px] font-bold text-slate-500">
                              NRR
                            </p>
                          </div>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            </>
          )}

        </section>

        {/* =================================================
            LEGEND
        ================================================= */}

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Points System
          </h3>

          <div className="mt-4 grid gap-3 text-xs text-slate-500 sm:grid-cols-2 md:grid-cols-4">

            <div className="rounded-xl bg-slate-950 p-3">
              <span className="font-black text-emerald-400">
                Win
              </span>

              <span className="ml-2">
                2 points
              </span>
            </div>

            <div className="rounded-xl bg-slate-950 p-3">
              <span className="font-black text-yellow-400">
                Tie
              </span>

              <span className="ml-2">
                1 point
              </span>
            </div>

            <div className="rounded-xl bg-slate-950 p-3">
              <span className="font-black text-blue-400">
                No Result
              </span>

              <span className="ml-2">
                1 point
              </span>
            </div>

            <div className="rounded-xl bg-slate-950 p-3">
              <span className="font-black text-slate-300">
                Loss
              </span>

              <span className="ml-2">
                0 points
              </span>
            </div>

          </div>

        </section>

      </div>
    </main>
  );
}