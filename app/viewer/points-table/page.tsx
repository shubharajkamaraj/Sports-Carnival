"use client";

import { useEffect, useState } from "react";

type Sport = "Football" | "Cricket" | "Handball" | "Throwball";

type Standing = {
  position?: number;
  teamId: number;
  teamName: string;

  played: number;
  won: number;
  drawn?: number;
  tied?: number;
  lost: number;
  noResult?: number;
  points: number;

  goalsFor?: number;
  goalsAgainst?: number;
  goalDifference?: number;

  runsFor?: number;
  runsAgainst?: number;
  runDifference?: number;

  setsWon?: number;
  setsLost?: number;
  setDifference?: number;
};

type ApiResponse = {
  success?: boolean;
  tournamentId?: number | null;
  matchesPlayed?: number;

  standings?: Standing[];
  data?: Standing[];
  pointsTable?: Standing[];

  teams?: Standing[];

  error?: string;
  message?: string;
};

const SPORTS: Sport[] = [
  "Football",
  "Cricket",
  "Handball",
  "Throwball",
];

function getPointsTableApi(sport: Sport) {
  switch (sport.toLowerCase()) {
    case "cricket":
      return "/api/cricket/points-table";

    case "throwball":
      return "/api/throwball/points-table";

    case "football":
      return "/api/points-table/football";

    case "handball":
      return "/api/points-table/handball";

    default:
      return "";
  }
}

export default function ViewerPointsTablePage() {
  const [sport, setSport] = useState<Sport>("Football");

  const [standings, setStandings] = useState<Standing[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [matchesPlayed, setMatchesPlayed] = useState<number | null>(
    null
  );

  useEffect(() => {
    loadPointsTable();
  }, [sport]);

  async function loadPointsTable() {
    try {
      setLoading(true);
      setError("");

      const apiUrl = getPointsTableApi(sport);

      if (!apiUrl) {
        throw new Error(`Unsupported sport: ${sport}`);
      }

      console.log("=================================");
      console.log("Loading Points Table");
      console.log("Sport:", sport);
      console.log("API:", apiUrl);
      console.log("=================================");

      const response = await fetch(apiUrl, {
        method: "GET",
        cache: "no-store",
      });

      const text = await response.text();

      console.log("API status:", response.status);
      console.log("API response:", text);

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
          data?.error ||
            data?.message ||
            `Failed to load ${sport} points table`
        );
      }

      if (data?.success === false) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Failed to load ${sport} points table`
        );
      }

      const rows =
        data?.teams ??
        data?.standings ??
        data?.data ??
        data?.pointsTable ??
        [];

      if (!Array.isArray(rows)) {
        throw new Error(
          "Invalid points table data received from API"
        );
      }

      setStandings(rows);

      if (typeof data.matchesPlayed === "number") {
        setMatchesPlayed(data.matchesPlayed);
      } else {
        setMatchesPlayed(null);
      }
    } catch (err) {
      console.error("Points table error:", err);

      setStandings([]);

      setMatchesPlayed(null);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load points table"
      );
    } finally {
      setLoading(false);
    }
  }

  const isFootball = sport === "Football";
  const isCricket = sport === "Cricket";
  const isHandball = sport === "Handball";
  const isThrowball = sport === "Throwball";

  return (
    <div className="min-h-screen bg-transparent px-4 py-6 text-white md:px-8">
      <div className="mx-auto max-w-7xl">

        {/* =========================
            HEADER
        ========================== */}

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            Points Table
          </h1>

          <p className="mt-1 text-sm text-slate-300">
            View the latest tournament standings
          </p>
        </div>

        {/* =========================
            SPORT TABS
        ========================== */}

        <div className="mb-6 flex flex-wrap gap-2">
          {SPORTS.map((item) => {
            const active = sport === item;

            return (
              <button
                key={item}
                type="button"
                onClick={() => setSport(item)}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-white text-slate-900 shadow-lg"
                    : "border border-white/10 bg-white/10 text-slate-200 backdrop-blur-md hover:bg-white/15"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>

        {/* =========================
            SPORT RULES
        ========================== */}

        <div className="mb-6 rounded-xl border border-white/10 bg-white/10 p-4 shadow-lg backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">

            <div>
              <h2 className="text-sm font-bold text-white">
                {sport} Points System
              </h2>

              {isCricket && (
                <p className="mt-1 text-sm text-slate-300">
                  Win = 2 points · Tie/No Result = 1 point · Loss = 0
                  points
                </p>
              )}

              {(isFootball || isHandball) && (
                <p className="mt-1 text-sm text-slate-300">
                  Win = 3 points · Draw = 1 point · Loss = 0 points
                </p>
              )}

              {isThrowball && (
                <p className="mt-1 text-sm text-slate-300">
                  Win = 3 points · Tie = 1 point · Loss = 0 points
                </p>
              )}
            </div>

            {matchesPlayed !== null && (
              <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200">
                Matches Played: {matchesPlayed}
              </div>
            )}
          </div>
        </div>

        {/* =========================
            ERROR
        ========================== */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-400/20 bg-red-500/10 p-4 backdrop-blur-md">
            <p className="text-sm font-semibold text-red-300">
              {error}
            </p>

            <button
              type="button"
              onClick={loadPointsTable}
              className="mt-3 rounded-lg border border-red-400/20 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/30"
            >
              Retry
            </button>
          </div>
        )}

        {/* =========================
            LOADING
        ========================== */}

        {loading ? (
          <div className="rounded-xl border border-white/10 bg-white/10 p-10 text-center shadow-lg backdrop-blur-md">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-white" />

            <p className="text-sm text-slate-300">
              Loading {sport} points table...
            </p>
          </div>
        ) : standings.length === 0 ? (
          /* =========================
             EMPTY
          ========================== */

          <div className="rounded-xl border border-white/10 bg-white/10 p-10 text-center shadow-lg backdrop-blur-md">
            <p className="font-semibold text-white">
              No standings available
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Completed {sport} matches will appear here.
            </p>
          </div>
        ) : (
          /* =========================
             TABLE
          ========================== */

          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/10 shadow-lg backdrop-blur-md">

            <div className="overflow-x-auto">

              <table className="w-full min-w-[950px] border-collapse">

                {/* =========================
                    TABLE HEADER
                ========================== */}

                <thead>
                  <tr className="bg-white/5 text-left text-xs font-bold uppercase tracking-wide text-slate-300">

                    <th className="px-4 py-4 text-center">
                      Pos
                    </th>

                    <th className="px-4 py-4">
                      Team
                    </th>

                    <th className="px-4 py-4 text-center">
                      P
                    </th>

                    <th className="px-4 py-4 text-center">
                      W
                    </th>

                    {/* FOOTBALL / HANDBALL DRAW */}
                    {(isFootball || isHandball) && (
                      <th className="px-4 py-4 text-center">
                        D
                      </th>
                    )}

                    {/* CRICKET */}
                    {isCricket && (
                      <>
                        <th className="px-4 py-4 text-center">
                          T
                        </th>

                        <th className="px-4 py-4 text-center">
                          NR
                        </th>
                      </>
                    )}

                    {/* THROWBALL */}
                    {isThrowball && (
                      <th className="px-4 py-4 text-center">
                        T
                      </th>
                    )}

                    <th className="px-4 py-4 text-center">
                      L
                    </th>

                    {/* FOOTBALL / HANDBALL */}
                    {(isFootball || isHandball) && (
                      <>
                        <th className="px-4 py-4 text-center">
                          GF
                        </th>

                        <th className="px-4 py-4 text-center">
                          GA
                        </th>

                        <th className="px-4 py-4 text-center">
                          GD
                        </th>
                      </>
                    )}

                    {/* CRICKET */}
                    {isCricket && (
                      <>
                        <th className="px-4 py-4 text-center">
                          RF
                        </th>

                        <th className="px-4 py-4 text-center">
                          RA
                        </th>

                        <th className="px-4 py-4 text-center">
                          RD
                        </th>
                      </>
                    )}

                    {/* THROWBALL */}
                    {isThrowball && (
                      <>
                        <th className="px-4 py-4 text-center">
                          SW
                        </th>

                        <th className="px-4 py-4 text-center">
                          SL
                        </th>

                        <th className="px-4 py-4 text-center">
                          SD
                        </th>
                      </>
                    )}

                    <th className="px-4 py-4 text-center">
                      Pts
                    </th>
                  </tr>
                </thead>

                {/* =========================
                    TABLE BODY
                ========================== */}

                <tbody className="divide-y divide-white/10">

                  {standings.map((team, index) => (

                    <tr
                      key={team.teamId}
                      className="transition hover:bg-white/5"
                    >

                      {/* POSITION */}

                      <td className="px-4 py-4 text-center">

                        <div
                          className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                            index === 0
                              ? "bg-yellow-500/20 text-yellow-300"
                              : index === 1
                              ? "bg-white/15 text-slate-200"
                              : index === 2
                              ? "bg-orange-500/20 text-orange-300"
                              : "bg-white/10 text-slate-300"
                          }`}
                        >
                          {team.position ?? index + 1}
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
                        {team.played ?? 0}
                      </td>

                      {/* WON */}

                      <td className="px-4 py-4 text-center text-sm font-semibold text-green-300">
                        {team.won ?? 0}
                      </td>

                      {/* DRAW */}

                      {(isFootball || isHandball) && (
                        <td className="px-4 py-4 text-center text-sm text-slate-300">
                          {team.drawn ?? 0}
                        </td>
                      )}

                      {/* CRICKET TIE */}

                      {isCricket && (
                        <>
                          <td className="px-4 py-4 text-center text-sm text-slate-300">
                            {team.tied ?? 0}
                          </td>

                          <td className="px-4 py-4 text-center text-sm text-slate-300">
                            {team.noResult ?? 0}
                          </td>
                        </>
                      )}

                      {/* THROWBALL TIE */}

                      {isThrowball && (
                        <td className="px-4 py-4 text-center text-sm text-slate-300">
                          {team.tied ?? 0}
                        </td>
                      )}

                      {/* LOST */}

                      <td className="px-4 py-4 text-center text-sm font-semibold text-red-300">
                        {team.lost ?? 0}
                      </td>

                      {/* FOOTBALL / HANDBALL GOALS */}

                      {(isFootball || isHandball) && (
                        <>
                          <td className="px-4 py-4 text-center text-sm text-slate-300">
                            {team.goalsFor ?? 0}
                          </td>

                          <td className="px-4 py-4 text-center text-sm text-slate-300">
                            {team.goalsAgainst ?? 0}
                          </td>

                          <td
                            className={`px-4 py-4 text-center text-sm font-semibold ${
                              (team.goalDifference ?? 0) > 0
                                ? "text-green-300"
                                : (team.goalDifference ?? 0) < 0
                                ? "text-red-300"
                                : "text-slate-400"
                            }`}
                          >
                            {formatDifference(
                              team.goalDifference ?? 0
                            )}
                          </td>
                        </>
                      )}

                      {/* CRICKET RUNS */}

                      {isCricket && (
                        <>
                          <td className="px-4 py-4 text-center text-sm text-slate-300">
                            {team.runsFor ?? 0}
                          </td>

                          <td className="px-4 py-4 text-center text-sm text-slate-300">
                            {team.runsAgainst ?? 0}
                          </td>

                          <td
                            className={`px-4 py-4 text-center text-sm font-semibold ${
                              (team.runDifference ?? 0) > 0
                                ? "text-green-300"
                                : (team.runDifference ?? 0) < 0
                                ? "text-red-300"
                                : "text-slate-400"
                            }`}
                          >
                            {formatDifference(
                              team.runDifference ?? 0
                            )}
                          </td>
                        </>
                      )}

                      {/* THROWBALL SETS */}

                      {isThrowball && (
                        <>
                          <td className="px-4 py-4 text-center text-sm text-slate-300">
                            {team.setsWon ?? 0}
                          </td>

                          <td className="px-4 py-4 text-center text-sm text-slate-300">
                            {team.setsLost ?? 0}
                          </td>

                          <td
                            className={`px-4 py-4 text-center text-sm font-semibold ${
                              (team.setDifference ?? 0) > 0
                                ? "text-green-300"
                                : (team.setDifference ?? 0) < 0
                                ? "text-red-300"
                                : "text-slate-400"
                            }`}
                          >
                            {formatDifference(
                              team.setDifference ?? 0
                            )}
                          </td>
                        </>
                      )}

                      {/* POINTS */}

                      <td className="px-4 py-4 text-center">

                        <span className="inline-flex min-w-[42px] items-center justify-center rounded-lg border border-blue-400/20 bg-blue-500/20 px-3 py-1.5 text-sm font-bold text-blue-300">
                          {team.points ?? 0}
                        </span>

                      </td>

                    </tr>

                  ))}

                </tbody>
              </table>

            </div>
          </div>
        )}

        {/* =========================
            LEGEND
        ========================== */}

        {!loading && standings.length > 0 && (

          <div className="mt-4 rounded-xl border border-white/10 bg-white/10 p-4 shadow-lg backdrop-blur-md">

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400">

              <span>
                <b className="text-slate-200">P</b> = Played
              </span>

              <span>
                <b className="text-slate-200">W</b> = Won
              </span>

              {(isFootball || isHandball) && (
                <span>
                  <b className="text-slate-200">D</b> = Draw
                </span>
              )}

              {isCricket && (
                <>
                  <span>
                    <b className="text-slate-200">T</b> = Tie
                  </span>

                  <span>
                    <b className="text-slate-200">NR</b> = No Result
                  </span>

                  <span>
                    <b className="text-slate-200">RF</b> = Runs For
                  </span>

                  <span>
                    <b className="text-slate-200">RA</b> = Runs Against
                  </span>

                  <span>
                    <b className="text-slate-200">RD</b> = Run Difference
                  </span>
                </>
              )}

              {isThrowball && (
                <>
                  <span>
                    <b className="text-slate-200">T</b> = Tie
                  </span>

                  <span>
                    <b className="text-slate-200">SW</b> = Sets Won
                  </span>

                  <span>
                    <b className="text-slate-200">SL</b> = Sets Lost
                  </span>

                  <span>
                    <b className="text-slate-200">SD</b> = Set Difference
                  </span>
                </>
              )}

              {(isFootball || isHandball) && (
                <>
                  <span>
                    <b className="text-slate-200">GF</b> = Goals For
                  </span>

                  <span>
                    <b className="text-slate-200">GA</b> = Goals Against
                  </span>

                  <span>
                    <b className="text-slate-200">GD</b> = Goal Difference
                  </span>
                </>
              )}

              <span>
                <b className="text-slate-200">L</b> = Lost
              </span>

              <span>
                <b className="text-slate-200">Pts</b> = Points
              </span>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function formatDifference(value: number) {
  if (value > 0) {
    return `+${value}`;
  }

  return value;
}