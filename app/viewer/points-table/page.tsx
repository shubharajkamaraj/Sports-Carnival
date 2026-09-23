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

      const response = await fetch(apiUrl, {
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
    <div
      className="
        min-h-screen
        w-full
        overflow-x-hidden
        bg-transparent
        px-3
        py-5
        text-white
        sm:px-5
        sm:py-6
        md:px-8
        md:py-8
        lg:px-10
        xl:px-12
      "
    >
      <div className="mx-auto w-full max-w-7xl">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="mb-5 sm:mb-6">
          <h1
            className="
              text-2xl
              font-bold
              leading-tight
              text-white
              sm:text-3xl
              lg:text-4xl
            "
          >
            Points Table
          </h1>

          <p
            className="
              mt-1
              max-w-2xl
              text-xs
              leading-5
              text-slate-300
              sm:text-sm
              sm:leading-6
            "
          >
            View the latest tournament standings
          </p>
        </div>

        {/* =====================================================
            SPORT TABS
        ====================================================== */}

        <div
          className="
            mb-5
            grid
            grid-cols-2
            gap-2
            sm:flex
            sm:flex-wrap
            sm:gap-2
            md:mb-6
          "
        >
          {SPORTS.map((item) => {
            const active = sport === item;

            return (
              <button
                key={item}
                type="button"
                onClick={() => setSport(item)}
                className={`
                  min-w-0
                  rounded-xl
                  px-3
                  py-2.5
                  text-xs
                  font-semibold
                  transition
                  sm:px-5
                  sm:py-2.5
                  sm:text-sm
                  ${
                    active
                      ? "bg-white text-slate-900 shadow-lg"
                      : "border border-white/10 bg-white/10 text-slate-200 backdrop-blur-md hover:bg-white/15"
                  }
                `}
              >
                <span className="block truncate">
                  {item}
                </span>
              </button>
            );
          })}
        </div>

        {/* =====================================================
            SPORT RULES
        ====================================================== */}

        <div
          className="
            mb-5
            rounded-2xl
            border
            border-white/10
            bg-white/10
            p-4
            shadow-lg
            backdrop-blur-md
            sm:mb-6
            sm:p-5
            lg:p-6
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
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white sm:text-base">
                {sport} Points System
              </h2>

              {isCricket && (
                <p className="mt-1 text-xs leading-5 text-slate-300 sm:text-sm">
                  Win = 2 points · Tie/No Result = 1 point · Loss = 0
                  points
                </p>
              )}

              {(isFootball || isHandball) && (
                <p className="mt-1 text-xs leading-5 text-slate-300 sm:text-sm">
                  Win = 3 points · Draw = 1 point · Loss = 0 points
                </p>
              )}

              {isThrowball && (
                <p className="mt-1 text-xs leading-5 text-slate-300 sm:text-sm">
                  Win = 3 points · Tie = 1 point · Loss = 0 points
                </p>
              )}
            </div>

            {matchesPlayed !== null && (
              <div
                className="
                  w-full
                  rounded-xl
                  border
                  border-white/10
                  bg-white/5
                  px-4
                  py-2.5
                  text-center
                  text-xs
                  font-semibold
                  text-slate-200
                  sm:w-auto
                  sm:text-sm
                "
              >
                Matches Played: {matchesPlayed}
              </div>
            )}
          </div>
        </div>

        {/* =====================================================
            ERROR
        ====================================================== */}

        {error && (
          <div
            className="
              mb-5
              rounded-2xl
              border
              border-red-400/20
              bg-red-500/10
              p-4
              backdrop-blur-md
              sm:mb-6
              sm:p-5
            "
          >
            <p className="break-words text-sm font-semibold text-red-300">
              {error}
            </p>

            <button
              type="button"
              onClick={loadPointsTable}
              className="
                mt-3
                rounded-lg
                border
                border-red-400/20
                bg-red-500/20
                px-4
                py-2
                text-sm
                font-semibold
                text-red-200
                transition
                hover:bg-red-500/30
              "
            >
              Retry
            </button>
          </div>
        )}

        {/* =====================================================
            LOADING
        ====================================================== */}

        {loading ? (
          <div
            className="
              rounded-2xl
              border
              border-white/10
              bg-white/10
              p-10
              text-center
              shadow-lg
              backdrop-blur-md
              sm:p-14
            "
          >
            <div
              className="
                mx-auto
                mb-4
                h-9
                w-9
                animate-spin
                rounded-full
                border-4
                border-white/10
                border-t-white
              "
            />

            <p className="text-sm text-slate-300">
              Loading {sport} points table...
            </p>
          </div>
        ) : standings.length === 0 ? (
          /* =====================================================
             EMPTY
          ====================================================== */

          <div
            className="
              rounded-2xl
              border
              border-white/10
              bg-white/10
              p-10
              text-center
              shadow-lg
              backdrop-blur-md
              sm:p-14
            "
          >
            <div className="text-4xl">🏆</div>

            <p className="mt-3 font-semibold text-white">
              No standings available
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Completed {sport} matches will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* =================================================
                MOBILE VIEW
            ================================================== */}

            <div className="space-y-3 md:hidden">
              {standings.map((team, index) => (
                <MobileTeamCard
                  key={team.teamId}
                  team={team}
                  index={index}
                  sport={sport}
                />
              ))}
            </div>

            {/* =================================================
                TABLET / DESKTOP VIEW
            ================================================== */}

            <div
              className="
                hidden
                overflow-hidden
                rounded-2xl
                border
                border-white/10
                bg-white/10
                shadow-lg
                backdrop-blur-md
                md:block
              "
            >
              <div className="overflow-x-auto">
                <table
                  className="
                    w-full
                    min-w-[950px]
                    border-collapse
                  "
                >
                  {/* =========================
                      TABLE HEADER
                  ========================== */}

                  <thead>
                    <tr
                      className="
                        bg-white/5
                        text-left
                        text-xs
                        font-bold
                        uppercase
                        tracking-wide
                        text-slate-300
                      "
                    >
                      <th className="whitespace-nowrap px-4 py-4 text-center">
                        Pos
                      </th>

                      <th className="whitespace-nowrap px-4 py-4">
                        Team
                      </th>

                      <th className="whitespace-nowrap px-4 py-4 text-center">
                        P
                      </th>

                      <th className="whitespace-nowrap px-4 py-4 text-center">
                        W
                      </th>

                      {(isFootball || isHandball) && (
                        <th className="whitespace-nowrap px-4 py-4 text-center">
                          D
                        </th>
                      )}

                      {isCricket && (
                        <>
                          <th className="whitespace-nowrap px-4 py-4 text-center">
                            T
                          </th>

                          <th className="whitespace-nowrap px-4 py-4 text-center">
                            NR
                          </th>
                        </>
                      )}

                      {isThrowball && (
                        <th className="whitespace-nowrap px-4 py-4 text-center">
                          T
                        </th>
                      )}

                      <th className="whitespace-nowrap px-4 py-4 text-center">
                        L
                      </th>

                      {(isFootball || isHandball) && (
                        <>
                          <th className="whitespace-nowrap px-4 py-4 text-center">
                            GF
                          </th>

                          <th className="whitespace-nowrap px-4 py-4 text-center">
                            GA
                          </th>

                          <th className="whitespace-nowrap px-4 py-4 text-center">
                            GD
                          </th>
                        </>
                      )}

                      {isCricket && (
                        <>
                          <th className="whitespace-nowrap px-4 py-4 text-center">
                            RF
                          </th>

                          <th className="whitespace-nowrap px-4 py-4 text-center">
                            RA
                          </th>

                          <th className="whitespace-nowrap px-4 py-4 text-center">
                            RD
                          </th>
                        </>
                      )}

                      {isThrowball && (
                        <>
                          <th className="whitespace-nowrap px-4 py-4 text-center">
                            SW
                          </th>

                          <th className="whitespace-nowrap px-4 py-4 text-center">
                            SL
                          </th>

                          <th className="whitespace-nowrap px-4 py-4 text-center">
                            SD
                          </th>
                        </>
                      )}

                      <th className="whitespace-nowrap px-4 py-4 text-center">
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
                        className="
                          transition
                          hover:bg-white/5
                        "
                      >
                        {/* POSITION */}

                        <td className="px-4 py-4 text-center">
                          <PositionBadge
                            position={
                              team.position ?? index + 1
                            }
                            index={index}
                          />
                        </td>

                        {/* TEAM */}

                        <td className="max-w-[220px] px-4 py-4">
                          <div
                            className="
                              truncate
                              font-semibold
                              text-white
                            "
                            title={team.teamName}
                          >
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

                        {/* FOOTBALL / HANDBALL */}

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

                        {/* CRICKET */}

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

                        {/* THROWBALL */}

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
                          <span
                            className="
                              inline-flex
                              min-w-[42px]
                              items-center
                              justify-center
                              rounded-lg
                              border
                              border-blue-400/20
                              bg-blue-500/20
                              px-3
                              py-1.5
                              text-sm
                              font-bold
                              text-blue-300
                            "
                          >
                            {team.points ?? 0}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* =================================================
                LEGEND
            ================================================== */}

            <PointsLegend
              sport={sport}
            />
          </>
        )}
      </div>
    </div>
  );
}

// =====================================================
// MOBILE TEAM CARD
// =====================================================

function MobileTeamCard({
  team,
  index,
  sport,
}: {
  team: Standing;
  index: number;
  sport: Sport;
}) {
  const isFootball =
    sport === "Football" || sport === "Handball";

  const isCricket = sport === "Cricket";

  const isThrowball = sport === "Throwball";

  return (
    <div
      className="
        overflow-hidden
        rounded-2xl
        border
        border-white/10
        bg-white/10
        shadow-lg
        backdrop-blur-md
      "
    >
      {/* TOP */}

      <div
        className="
          flex
          items-center
          justify-between
          gap-3
          border-b
          border-white/10
          bg-white/5
          px-4
          py-3
        "
      >
        <div className="flex min-w-0 items-center gap-3">
          <PositionBadge
            position={team.position ?? index + 1}
            index={index}
          />

          <div className="min-w-0">
            <h2
              className="
                truncate
                text-sm
                font-bold
                text-white
                sm:text-base
              "
              title={team.teamName}
            >
              {team.teamName}
            </h2>

            <p className="text-[11px] text-slate-400">
              Position {team.position ?? index + 1}
            </p>
          </div>
        </div>

        {/* POINTS */}

        <div className="shrink-0 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Points
          </p>

          <span
            className="
              mt-1
              inline-flex
              min-w-[42px]
              items-center
              justify-center
              rounded-lg
              border
              border-blue-400/20
              bg-blue-500/20
              px-2.5
              py-1
              text-sm
              font-bold
              text-blue-300
            "
          >
            {team.points ?? 0}
          </span>
        </div>
      </div>

      {/* BASIC STATS */}

      <div className="grid grid-cols-4 gap-2 p-3 sm:p-4">
        <MobileStat
          label="P"
          value={team.played ?? 0}
        />

        <MobileStat
          label="W"
          value={team.won ?? 0}
          valueClass="text-green-300"
        />

        {isFootball ? (
          <MobileStat
            label="D"
            value={team.drawn ?? 0}
          />
        ) : isCricket || isThrowball ? (
          <MobileStat
            label="T"
            value={team.tied ?? 0}
          />
        ) : (
          <MobileStat
            label="D"
            value={team.drawn ?? 0}
          />
        )}

        <MobileStat
          label="L"
          value={team.lost ?? 0}
          valueClass="text-red-300"
        />
      </div>

      {/* SPORT-SPECIFIC STATS */}

      <div
        className="
          border-t
          border-white/10
          px-3
          py-3
          sm:px-4
        "
      >
        {isFootball && (
          <div className="grid grid-cols-3 gap-2">
            <MobileStat
              label="GF"
              value={team.goalsFor ?? 0}
            />

            <MobileStat
              label="GA"
              value={team.goalsAgainst ?? 0}
            />

            <MobileDifferenceStat
              label="GD"
              value={team.goalDifference ?? 0}
            />
          </div>
        )}

        {isCricket && (
          <div className="grid grid-cols-3 gap-2">
            <MobileStat
              label="RF"
              value={team.runsFor ?? 0}
            />

            <MobileStat
              label="RA"
              value={team.runsAgainst ?? 0}
            />

            <MobileDifferenceStat
              label="RD"
              value={team.runDifference ?? 0}
            />
          </div>
        )}

        {isThrowball && (
          <div className="grid grid-cols-3 gap-2">
            <MobileStat
              label="SW"
              value={team.setsWon ?? 0}
            />

            <MobileStat
              label="SL"
              value={team.setsLost ?? 0}
            />

            <MobileDifferenceStat
              label="SD"
              value={team.setDifference ?? 0}
            />
          </div>
        )}
      </div>

      {/* CRICKET EXTRA */}

      {isCricket && (
        <div className="border-t border-white/10 px-3 py-3 sm:px-4">
          <div className="grid grid-cols-2 gap-2">
            <MobileStat
              label="No Result"
              value={team.noResult ?? 0}
            />

            <MobileStat
              label="Tie"
              value={team.tied ?? 0}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================
// MOBILE STAT
// =====================================================

function MobileStat({
  label,
  value,
  valueClass = "text-white",
}: {
  label: string;
  value: number;
  valueClass?: string;
}) {
  return (
    <div
      className="
        min-w-0
        rounded-xl
        border
        border-white/10
        bg-white/5
        px-2
        py-2.5
        text-center
      "
    >
      <p
        className="
          truncate
          text-[10px]
          font-semibold
          uppercase
          tracking-wide
          text-slate-400
          sm:text-[11px]
        "
      >
        {label}
      </p>

      <p
        className={`
          mt-0.5
          text-sm
          font-bold
          sm:text-base
          ${valueClass}
        `}
      >
        {value}
      </p>
    </div>
  );
}

// =====================================================
// MOBILE DIFFERENCE STAT
// =====================================================

function MobileDifferenceStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const className =
    value > 0
      ? "text-green-300"
      : value < 0
        ? "text-red-300"
        : "text-slate-400";

  return (
    <div
      className="
        min-w-0
        rounded-xl
        border
        border-white/10
        bg-white/5
        px-2
        py-2.5
        text-center
      "
    >
      <p
        className="
          truncate
          text-[10px]
          font-semibold
          uppercase
          tracking-wide
          text-slate-400
          sm:text-[11px]
        "
      >
        {label}
      </p>

      <p
        className={`
          mt-0.5
          text-sm
          font-bold
          sm:text-base
          ${className}
        `}
      >
        {formatDifference(value)}
      </p>
    </div>
  );
}

// =====================================================
// POSITION BADGE
// =====================================================

function PositionBadge({
  position,
  index,
}: {
  position: number;
  index: number;
}) {
  const className =
    index === 0
      ? "bg-yellow-500/20 text-yellow-300"
      : index === 1
        ? "bg-white/15 text-slate-200"
        : index === 2
          ? "bg-orange-500/20 text-orange-300"
          : "bg-white/10 text-slate-300";

  return (
    <div
      className={`
        flex
        h-8
        w-8
        shrink-0
        items-center
        justify-center
        rounded-full
        text-xs
        font-bold
        ${className}
      `}
    >
      {position}
    </div>
  );
}

// =====================================================
// LEGEND
// =====================================================

function PointsLegend({
  sport,
}: {
  sport: Sport;
}) {
  const isFootball =
    sport === "Football" || sport === "Handball";

  const isCricket = sport === "Cricket";

  const isThrowball = sport === "Throwball";

  return (
    <div
      className="
        mt-4
        rounded-2xl
        border
        border-white/10
        bg-white/10
        p-4
        shadow-lg
        backdrop-blur-md
        sm:p-5
      "
    >
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-300">
        Legend
      </h3>

      <div
        className="
          flex
          flex-wrap
          gap-x-4
          gap-y-2
          text-[11px]
          leading-5
          text-slate-400
          sm:gap-x-6
          sm:text-xs
        "
      >
        <LegendItem
          short="P"
          text="Played"
        />

        <LegendItem
          short="W"
          text="Won"
        />

        {isFootball && (
          <LegendItem
            short="D"
            text="Draw"
          />
        )}

        {isCricket && (
          <>
            <LegendItem
              short="T"
              text="Tie"
            />

            <LegendItem
              short="NR"
              text="No Result"
            />

            <LegendItem
              short="RF"
              text="Runs For"
            />

            <LegendItem
              short="RA"
              text="Runs Against"
            />

            <LegendItem
              short="RD"
              text="Run Difference"
            />
          </>
        )}

        {isThrowball && (
          <>
            <LegendItem
              short="T"
              text="Tie"
            />

            <LegendItem
              short="SW"
              text="Sets Won"
            />

            <LegendItem
              short="SL"
              text="Sets Lost"
            />

            <LegendItem
              short="SD"
              text="Set Difference"
            />
          </>
        )}

        {isFootball && (
          <>
            <LegendItem
              short="GF"
              text="Goals For"
            />

            <LegendItem
              short="GA"
              text="Goals Against"
            />

            <LegendItem
              short="GD"
              text="Goal Difference"
            />
          </>
        )}

        {!isCricket && (
          <LegendItem
            short="L"
            text="Lost"
          />
        )}

        {isCricket && (
          <LegendItem
            short="L"
            text="Lost"
          />
        )}

        <LegendItem
          short="Pts"
          text="Points"
        />
      </div>
    </div>
  );
}

// =====================================================
// LEGEND ITEM
// =====================================================

function LegendItem({
  short,
  text,
}: {
  short: string;
  text: string;
}) {
  return (
    <span className="whitespace-nowrap">
      <b className="text-slate-200">{short}</b>
      {" = "}
      {text}
    </span>
  );
}

// =====================================================
// FORMAT DIFFERENCE
// =====================================================

function formatDifference(value: number) {
  if (value > 0) {
    return `+${value}`;
  }

  return value;
}