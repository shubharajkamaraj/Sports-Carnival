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

  // Cricket/Football/Handball may use standings/data
  standings?: Standing[];
  data?: Standing[];
  pointsTable?: Standing[];

  // Throwball uses "teams"
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

      /*
       * IMPORTANT:
       *
       * Throwball API returns:
       *
       * {
       *   success: true,
       *   matchesPlayed: 1,
       *   teams: [...]
       * }
       *
       * Therefore we MUST read data.teams.
       */

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

      if (
        typeof data.matchesPlayed === "number"
      ) {
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
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl">

        {/* =========================
            HEADER
        ========================== */}

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Points Table
          </h1>

          <p className="mt-1 text-sm text-slate-500">
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
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
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

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">

            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {sport} Points System
              </h2>

              {isCricket && (
                <p className="mt-1 text-sm text-slate-600">
                  Win = 2 points · Tie/No Result = 1 point ·
                  Loss = 0 points
                </p>
              )}

              {(isFootball || isHandball) && (
                <p className="mt-1 text-sm text-slate-600">
                  Win = 3 points · Draw = 1 point · Loss = 0
                  points
                </p>
              )}

              {isThrowball && (
                <p className="mt-1 text-sm text-slate-600">
                  Win = 3 points · Tie = 1 point · Loss = 0
                  points
                </p>
              )}
            </div>

            {matchesPlayed !== null && (
              <div className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                Matches Played: {matchesPlayed}
              </div>
            )}
          </div>
        </div>

        {/* =========================
            ERROR
        ========================== */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={loadPointsTable}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* =========================
            LOADING
        ========================== */}

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="text-sm text-slate-500">
              Loading {sport} points table...
            </p>
          </div>
        ) : standings.length === 0 ? (
          /* =========================
             EMPTY
          ========================== */

          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <p className="font-semibold text-slate-700">
              No standings available
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Completed {sport} matches will appear here.
            </p>
          </div>
        ) : (
          /* =========================
             TABLE
          ========================== */

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

            <div className="overflow-x-auto">

              <table className="w-full min-w-[950px] border-collapse">

                {/* =========================
                    TABLE HEADER
                ========================== */}

                <thead>
                  <tr className="bg-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-600">

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

                <tbody className="divide-y divide-slate-100">

                  {standings.map((team, index) => (

                    <tr
                      key={team.teamId}
                      className="transition hover:bg-slate-50"
                    >

                      {/* POSITION */}

                      <td className="px-4 py-4 text-center">

                        <div
                          className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                            index === 0
                              ? "bg-yellow-100 text-yellow-700"
                              : index === 1
                              ? "bg-slate-200 text-slate-700"
                              : index === 2
                              ? "bg-orange-100 text-orange-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {team.position ?? index + 1}
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
                        {team.played ?? 0}
                      </td>

                      {/* WON */}

                      <td className="px-4 py-4 text-center text-sm font-semibold text-green-600">
                        {team.won ?? 0}
                      </td>

                      {/* DRAW */}

                      {(isFootball || isHandball) && (
                        <td className="px-4 py-4 text-center text-sm text-slate-700">
                          {team.drawn ?? 0}
                        </td>
                      )}

                      {/* CRICKET TIE */}

                      {isCricket && (
                        <>
                          <td className="px-4 py-4 text-center text-sm text-slate-700">
                            {team.tied ?? 0}
                          </td>

                          <td className="px-4 py-4 text-center text-sm text-slate-700">
                            {team.noResult ?? 0}
                          </td>
                        </>
                      )}

                      {/* THROWBALL TIE */}

                      {isThrowball && (
                        <td className="px-4 py-4 text-center text-sm text-slate-700">
                          {team.tied ?? 0}
                        </td>
                      )}

                      {/* LOST */}

                      <td className="px-4 py-4 text-center text-sm font-semibold text-red-600">
                        {team.lost ?? 0}
                      </td>

                      {/* FOOTBALL / HANDBALL GOALS */}

                      {(isFootball || isHandball) && (
                        <>
                          <td className="px-4 py-4 text-center text-sm text-slate-700">
                            {team.goalsFor ?? 0}
                          </td>

                          <td className="px-4 py-4 text-center text-sm text-slate-700">
                            {team.goalsAgainst ?? 0}
                          </td>

                          <td
                            className={`px-4 py-4 text-center text-sm font-semibold ${
                              (team.goalDifference ?? 0) > 0
                                ? "text-green-600"
                                : (team.goalDifference ?? 0) < 0
                                ? "text-red-600"
                                : "text-slate-600"
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
                          <td className="px-4 py-4 text-center text-sm text-slate-700">
                            {team.runsFor ?? 0}
                          </td>

                          <td className="px-4 py-4 text-center text-sm text-slate-700">
                            {team.runsAgainst ?? 0}
                          </td>

                          <td
                            className={`px-4 py-4 text-center text-sm font-semibold ${
                              (team.runDifference ?? 0) > 0
                                ? "text-green-600"
                                : (team.runDifference ?? 0) < 0
                                ? "text-red-600"
                                : "text-slate-600"
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
                          <td className="px-4 py-4 text-center text-sm text-slate-700">
                            {team.setsWon ?? 0}
                          </td>

                          <td className="px-4 py-4 text-center text-sm text-slate-700">
                            {team.setsLost ?? 0}
                          </td>

                          <td
                            className={`px-4 py-4 text-center text-sm font-semibold ${
                              (team.setDifference ?? 0) > 0
                                ? "text-green-600"
                                : (team.setDifference ?? 0) < 0
                                ? "text-red-600"
                                : "text-slate-600"
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

                        <span className="inline-flex min-w-[42px] items-center justify-center rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-bold text-blue-700">
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

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">

              <span>
                <b>P</b> = Played
              </span>

              <span>
                <b>W</b> = Won
              </span>

              {(isFootball || isHandball) && (
                <span>
                  <b>D</b> = Draw
                </span>
              )}

              {isCricket && (
                <>
                  <span>
                    <b>T</b> = Tie
                  </span>

                  <span>
                    <b>NR</b> = No Result
                  </span>

                  <span>
                    <b>RF</b> = Runs For
                  </span>

                  <span>
                    <b>RA</b> = Runs Against
                  </span>

                  <span>
                    <b>RD</b> = Run Difference
                  </span>
                </>
              )}

              {isThrowball && (
                <>
                  <span>
                    <b>T</b> = Tie
                  </span>

                  <span>
                    <b>SW</b> = Sets Won
                  </span>

                  <span>
                    <b>SL</b> = Sets Lost
                  </span>

                  <span>
                    <b>SD</b> = Set Difference
                  </span>
                </>
              )}

              {(isFootball || isHandball) && (
                <>
                  <span>
                    <b>GF</b> = Goals For
                  </span>

                  <span>
                    <b>GA</b> = Goals Against
                  </span>

                  <span>
                    <b>GD</b> = Goal Difference
                  </span>
                </>
              )}

              <span>
                <b>L</b> = Lost
              </span>

              <span>
                <b>Pts</b> = Points
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