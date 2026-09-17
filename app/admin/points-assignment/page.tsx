"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Award,
  Check,
  ChevronDown,
  History,
  Loader2,
  Save,
  Trophy,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type Game = {
  id: number;
  name: string;
  sportType: string | null;
  category: string | null;
  tournamentId: number;
};

type Team = {
  id: number;
  name: string;
  captain: string | null;
};

type Assignment = {
  position: number;
  teamId: number | null;
  points: number | null;
};

type SavedAssignment = {
  id: number;
  position: number;
  teamId: number;
  teamName: string;
  points: number;
};

type Round = {
  round: number;
  assignments: SavedAssignment[];
};

type ApiResponse = {
  success: boolean;
  error?: string;
  message?: string;

  games?: Game[];
  teams?: Team[];

  latestRound?: number;

  assignments?: SavedAssignment[];

  rounds?: Round[];

  round?: number;
};

/* =========================================================
   CONSTANTS
========================================================= */

const POSITIONS = [
  {
    position: 1,
    label: "Winner",
    short: "1st",
  },
  {
    position: 2,
    label: "Runner Up",
    short: "2nd",
  },
  {
    position: 3,
    label: "2nd Runner Up",
    short: "3rd",
  },
  {
    position: 4,
    label: "4th Place",
    short: "4th",
  },
];

/*
 * Point dropdown options.
 *
 * We deliberately provide a broad set because different
 * Sports Carnival games can use different scoring systems.
 *
 * Examples:
 *
 * Cricket:
 * Winner = 200
 *
 * Junior Kids:
 * Winner = 50
 *
 * The admin chooses the actual value.
 */

const POINT_OPTIONS = [
  0,
  5,
  10,
  15,
  20,
  25,
  30,
  40,
  50,
  60,
  75,
  80,
  100,
  125,
  150,
  175,
  200,
  250,
  300,
  500,
];

/* =========================================================
   DEFAULT ASSIGNMENTS
========================================================= */

function createDefaultAssignments(): Assignment[] {
  return POSITIONS.map((item) => ({
    position: item.position,
    teamId: null,
    points: null,
  }));
}

/* =========================================================
   PAGE
========================================================= */

export default function PointsAssignmentPage() {
  /*
   * -------------------------------------------------------
   * DATA
   * -------------------------------------------------------
   */

  const [games, setGames] =
    useState<Game[]>([]);

  const [teams, setTeams] =
    useState<Team[]>([]);

  const [rounds, setRounds] =
    useState<Round[]>([]);

  /*
   * -------------------------------------------------------
   * FORM
   * -------------------------------------------------------
   */

  const [gameId, setGameId] =
    useState("");

  const [round, setRound] =
    useState("");

  const [assignments, setAssignments] =
    useState<Assignment[]>(
      createDefaultAssignments()
    );

  /*
   * -------------------------------------------------------
   * UI STATE
   * -------------------------------------------------------
   */

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /*
   * -------------------------------------------------------
   * SELECTED GAME
   * -------------------------------------------------------
   */

  const selectedGame = useMemo(() => {
    return games.find(
      (game) =>
        game.id === Number(gameId)
    );
  }, [games, gameId]);

  /*
   * -------------------------------------------------------
   * LOAD INITIAL DATA
   * -------------------------------------------------------
   */

  useEffect(() => {
    loadInitialData();
  }, []);

  /*
   * -------------------------------------------------------
   * LOAD INITIAL DATA
   * -------------------------------------------------------
   */

  async function loadInitialData() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/points-assignment",
        {
          cache: "no-store",
        }
      );

      const data =
        (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Failed to load points assignment data."
        );
      }

      setGames(data.games ?? []);
      setTeams(data.teams ?? []);
    } catch (error) {
      console.error(
        "LOAD POINT ASSIGNMENT DATA ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load data."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * -------------------------------------------------------
   * GAME CHANGE
   * -------------------------------------------------------
   */

  async function handleGameChange(
    value: string
  ) {
    setGameId(value);

    setAssignments(
      createDefaultAssignments()
    );

    setRounds([]);
    setSuccess("");
    setError("");

    if (!value) {
      setRound("");
      return;
    }

    try {
      const response = await fetch(
        `/api/points-assignment?gameId=${value}`,
        {
          cache: "no-store",
        }
      );

      const data =
        (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Failed to load game results."
        );
      }

      const loadedRounds =
        data.rounds ?? [];

      setRounds(loadedRounds);

      /*
       * New round is automatically one greater
       * than the latest existing round.
       */

      const nextRound =
        (data.latestRound ?? 0) + 1;

      setRound(String(nextRound));
    } catch (error) {
      console.error(
        "LOAD GAME RESULTS ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load game results."
      );
    }
  }

  /*
   * -------------------------------------------------------
   * UPDATE TEAM
   * -------------------------------------------------------
   */

  function updateTeam(
    position: number,
    value: string
  ) {
    setAssignments((previous) =>
      previous.map((item) => {
        if (item.position !== position) {
          return item;
        }

        if (value === "") {
          return {
            ...item,
            teamId: null,
            points: null,
          };
        }

        return {
          ...item,
          teamId: Number(value),
        };
      })
    );
  }

  /*
   * -------------------------------------------------------
   * UPDATE POINTS
   * -------------------------------------------------------
   */

  function updatePoints(
    position: number,
    value: string
  ) {
    setAssignments((previous) =>
      previous.map((item) => {
        if (item.position !== position) {
          return item;
        }

        if (value === "") {
          return {
            ...item,
            points: null,
          };
        }

        return {
          ...item,
          points: Number(value),
        };
      })
    );
  }

  /*
   * -------------------------------------------------------
   * SAVE
   * -------------------------------------------------------
   */

  async function handleSave() {
    setError("");
    setSuccess("");

    /*
     * Game required
     */

    if (!gameId) {
      setError(
        "Please select a game first."
      );
      return;
    }

    /*
     * Round required
     */

    if (!round) {
      setError(
        "Please enter a round number."
      );
      return;
    }

    /*
     * At least one team
     */

    const activeAssignments =
      assignments.filter(
        (item) =>
          item.teamId !== null
      );

    if (activeAssignments.length === 0) {
      setError(
        "Please select at least one team."
      );
      return;
    }

    /*
     * Every selected team needs points.
     */

    for (const item of activeAssignments) {
      if (
        item.points === null ||
        item.points === undefined
      ) {
        const position =
          POSITIONS.find(
            (p) =>
              p.position ===
              item.position
          );

        setError(
          `Please select points for ${position?.label ?? "this position"}.`
        );

        return;
      }
    }

    try {
      setSaving(true);

      const response = await fetch(
        "/api/points-assignment",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            gameId: Number(gameId),
            round: Number(round),
            assignments,
          }),
        }
      );

      const data =
        (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Failed to assign points."
        );
      }

      setSuccess(
        data.message ||
          "Points assigned successfully."
      );

      /*
       * Reload rounds so the new round appears
       * immediately.
       */

      const refreshResponse =
        await fetch(
          `/api/points-assignment?gameId=${gameId}`,
          {
            cache: "no-store",
          }
        );

      const refreshData =
        (await refreshResponse.json()) as ApiResponse;

      if (
        refreshResponse.ok &&
        refreshData.success
      ) {
        setRounds(
          refreshData.rounds ?? []
        );

        const nextRound =
          (refreshData.latestRound ?? 0) +
          1;

        /*
         * Reset form for the next round.
         */

        setRound(
          String(nextRound)
        );
      }

      setAssignments(
        createDefaultAssignments()
      );
    } catch (error) {
      console.error(
        "SAVE POINT ASSIGNMENT ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to assign points."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * -------------------------------------------------------
   * FORMAT GAME CATEGORY
   * -------------------------------------------------------
   */

  function formatCategory(
    category: string | null
  ) {
    if (!category) {
      return "";
    }

    return category
      .replaceAll("_", " ")
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  }

  /*
   * -------------------------------------------------------
   * TEAM DISPLAY
   * -------------------------------------------------------
   */

  function getTeamName(
    teamId: number | null
  ) {
    if (teamId === null) {
      return "Not Applicable";
    }

    return (
      teams.find(
        (team) =>
          team.id === teamId
      )?.name ??
      "Unknown Team"
    );
  }

  /*
   * -------------------------------------------------------
   * LOADING
   * -------------------------------------------------------
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-semibold">
              Loading points assignment...
            </span>
          </div>
        </div>
      </main>
    );
  }

  /*
   * -------------------------------------------------------
   * PAGE
   * -------------------------------------------------------
   */

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                <Trophy className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  Points Assignment
                </h1>

                <p className="text-sm font-medium text-slate-500">
                  Assign tournament points to
                  game positions
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <Check className="h-4 w-4" />
            {success}
          </div>
        )}

        {/* =================================================
            GAME SELECTOR
        ================================================= */}

        <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-slate-700" />

            <h2 className="font-black text-slate-900">
              Select Game
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_180px]">
            {/* GAME */}

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Game / Competition
              </label>

              <div className="relative">
                <select
                  value={gameId}
                  onChange={(event) =>
                    handleGameChange(
                      event.target.value
                    )
                  }
                  className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 pr-10 text-sm font-bold text-slate-800 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">
                    Select Game
                  </option>

                  {games.map((game) => (
                    <option
                      key={game.id}
                      value={game.id}
                    >
                      {game.name}
                      {game.category
                        ? ` — ${formatCategory(
                            game.category
                          )}`
                        : ""}
                    </option>
                  ))}
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              </div>
            </div>

            {/* ROUND */}

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Round
              </label>

              <input
                type="number"
                min={1}
                value={round}
                onChange={(event) =>
                  setRound(
                    event.target.value
                  )
                }
                disabled={!gameId}
                placeholder="Round"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>
          </div>

          {selectedGame && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {selectedGame.name}
              </span>

              {selectedGame.sportType && (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                  {selectedGame.sportType}
                </span>
              )}

              {selectedGame.category && (
                <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
                  {formatCategory(
                    selectedGame.category
                  )}
                </span>
              )}
            </div>
          )}
        </section>

        {/* =================================================
            ASSIGNMENT FORM
        ================================================= */}

        <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-900 px-5 py-4 text-white">
            <h2 className="font-black">
              Assign Points
            </h2>

            <p className="mt-1 text-xs font-medium text-slate-300">
              The same team can be selected in
              multiple positions.
            </p>
          </div>

          <div className="p-5">
            <div className="grid gap-4">
              {POSITIONS.map((position) => {
                const assignment =
                  assignments.find(
                    (item) =>
                      item.position ===
                      position.position
                  )!;

                return (
                  <div
                    key={position.position}
                    className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[190px_1fr_220px]"
                  >
                    {/* POSITION */}

                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200">
                        {position.short}
                      </div>

                      <div>
                        <p className="text-sm font-black text-slate-900">
                          {position.label}
                        </p>

                        <p className="text-xs font-medium text-slate-500">
                          Position {position.position}
                        </p>
                      </div>
                    </div>

                    {/* TEAM */}

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Team
                      </label>

                      <div className="relative">
                        <select
                          value={
                            assignment.teamId ??
                            ""
                          }
                          onChange={(event) =>
                            updateTeam(
                              position.position,
                              event.target.value
                            )
                          }
                          disabled={!gameId}
                          className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 pr-10 text-sm font-bold text-slate-800 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                        >
                          <option value="">
                            Not Applicable
                          </option>

                          {teams.map(
                            (team) => (
                              <option
                                key={team.id}
                                value={team.id}
                              >
                                {team.name}
                              </option>
                            )
                          )}
                        </select>

                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      </div>
                    </div>

                    {/* POINTS */}

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Points
                      </label>

                      <div className="relative">
                        <select
                          value={
                            assignment.points ??
                            ""
                          }
                          onChange={(event) =>
                            updatePoints(
                              position.position,
                              event.target.value
                            )
                          }
                          disabled={
                            !gameId ||
                            assignment.teamId ===
                              null
                          }
                          className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 pr-10 text-sm font-black text-slate-800 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          <option value="">
                            Select Points
                          </option>

                          {POINT_OPTIONS.map(
                            (points) => (
                              <option
                                key={points}
                                value={points}
                              >
                                {points} points
                              </option>
                            )
                          )}
                        </select>

                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* =================================================
                SAVE
            ================================================= */}

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-medium text-slate-500">
                Existing rounds are preserved.
                Saving creates a new round.
              </p>

              <button
                type="button"
                onClick={handleSave}
                disabled={
                  saving || !gameId
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Points
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* =================================================
            ROUND HISTORY
        ================================================= */}

        {gameId && (
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
              <History className="h-5 w-5 text-slate-700" />

              <div>
                <h2 className="font-black text-slate-900">
                  Assignment History
                </h2>

                <p className="text-xs font-medium text-slate-500">
                  Previous rounds for this game
                </p>
              </div>
            </div>

            {rounds.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-semibold text-slate-500">
                  No points have been assigned
                  for this game yet.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {rounds.map(
                  (savedRound) => (
                    <div
                      key={savedRound.round}
                      className="p-5"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <span className="text-sm font-black text-slate-900">
                            Round{" "}
                            {savedRound.round}
                          </span>
                        </div>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          {
                            savedRound
                              .assignments
                              .length
                          }{" "}
                          assignments
                        </span>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                        {POSITIONS.map(
                          (position) => {
                            const result =
                              savedRound.assignments.find(
                                (item) =>
                                  item.position ===
                                  position.position
                              );

                            return (
                              <div
                                key={
                                  position.position
                                }
                                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                              >
                                <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                                  {
                                    position.label
                                  }
                                </p>

                                <p className="mt-2 text-sm font-black text-slate-900">
                                  {result
                                    ? result.teamName
                                    : "Not Applicable"}
                                </p>

                                <p className="mt-1 text-lg font-black text-slate-700">
                                  {result
                                    ? `${result.points} pts`
                                    : "—"}
                                </p>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

