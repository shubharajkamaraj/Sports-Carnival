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

const POINT_OPTIONS = [
  -20,
  -10,
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

    if (!gameId) {
      setError(
        "Please select a game first."
      );
      return;
    }

    if (!round) {
      setError(
        "Please enter a round number."
      );
      return;
    }

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
   * LOADING
   * -------------------------------------------------------
   */

  if (loading) {
    return (
      <main className="min-h-screen w-full bg-transparent p-6">
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="flex items-center gap-3 text-white">
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
    <main className="min-h-screen w-full bg-transparent p-4 md:p-6">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white shadow-sm ring-1 ring-white/10">
                <Trophy className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-tight text-white">
                  Points Assignment
                </h1>

                <p className="text-sm font-medium text-slate-300">
                  Assign tournament points to game positions
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (
          <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200">
            <Check className="h-4 w-4" />
            {success}
          </div>
        )}

        {/* =================================================
            GAME SELECTOR
        ================================================= */}

        <section className="mb-5 rounded-2xl border border-white/10 bg-white/10 p-5 shadow-lg backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-white" />

            <h2 className="font-black text-white">
              Select Game
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_180px]">

            {/* GAME */}

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-300">
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
                  className="w-full appearance-none rounded-xl border border-white/20 bg-white/10 px-4 py-3 pr-10 text-sm font-bold text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30"
                >
                  <option
                    value=""
                    className="bg-slate-900 text-white"
                  >
                    Select Game
                  </option>

                  {games.map((game) => (
                    <option
                      key={game.id}
                      value={game.id}
                      className="bg-slate-900 text-white"
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

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
              </div>
            </div>

            {/* ROUND */}

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-300">
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
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 disabled:bg-white/5 disabled:text-white/40"
              />
            </div>
          </div>

          {selectedGame && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200 ring-1 ring-white/10">
                {selectedGame.name}
              </span>

              {selectedGame.sportType && (
                <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-bold text-blue-200 ring-1 ring-blue-400/20">
                  {selectedGame.sportType}
                </span>
              )}

              {selectedGame.category && (
                <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-bold text-purple-200 ring-1 ring-purple-400/20">
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

        <section className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-lg backdrop-blur-md">

          <div className="border-b border-white/10 bg-slate-950/40 px-5 py-4 text-white">
            <h2 className="font-black">
              Assign Points
            </h2>

            <p className="mt-1 text-xs font-medium text-slate-300">
              The same team can be selected in multiple positions.
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
                    className="grid gap-4 rounded-xl border border-white/10 bg-white/5 p-4 md:grid-cols-[190px_1fr_220px]"
                  >

                    {/* POSITION */}

                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sm font-black text-white shadow-sm ring-1 ring-white/10">
                        {position.short}
                      </div>

                      <div>
                        <p className="text-sm font-black text-white">
                          {position.label}
                        </p>

                        <p className="text-xs font-medium text-slate-400">
                          Position {position.position}
                        </p>
                      </div>
                    </div>

                    {/* TEAM */}

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-300">
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
                          className="w-full appearance-none rounded-xl border border-white/20 bg-white/10 px-4 py-3 pr-10 text-sm font-bold text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 disabled:bg-white/5 disabled:text-white/40"
                        >
                          <option
                            value=""
                            className="bg-slate-900 text-white"
                          >
                            Not Applicable
                          </option>

                          {teams.map(
                            (team) => (
                              <option
                                key={team.id}
                                value={team.id}
                                className="bg-slate-900 text-white"
                              >
                                {team.name}
                              </option>
                            )
                          )}
                        </select>

                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                      </div>
                    </div>

                    {/* POINTS */}

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-300">
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
                          className="w-full appearance-none rounded-xl border border-white/20 bg-white/10 px-4 py-3 pr-10 text-sm font-black text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 disabled:bg-white/5 disabled:text-white/40"
                        >
                          <option
                            value=""
                            className="bg-slate-900 text-white"
                          >
                            Select Points
                          </option>

                          {POINT_OPTIONS.map(
                            (points) => (
                              <option
                                key={points}
                                value={points}
                                className="bg-slate-900 text-white"
                              >
                                {points} points
                              </option>
                            )
                          )}
                        </select>

                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* =================================================
                SAVE
            ================================================= */}

            <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">

              <p className="text-xs font-medium text-slate-400">
                Existing rounds are preserved.
                Saving creates a new round.
              </p>

              <button
                type="button"
                onClick={handleSave}
                disabled={
                  saving || !gameId
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
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
          <section className="rounded-2xl border border-white/10 bg-white/10 shadow-lg backdrop-blur-md">

            <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
              <History className="h-5 w-5 text-white" />

              <div>
                <h2 className="font-black text-white">
                  Assignment History
                </h2>

                <p className="text-xs font-medium text-slate-400">
                  Previous rounds for this game
                </p>
              </div>
            </div>

            {rounds.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-semibold text-slate-400">
                  No points have been assigned for this game yet.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">

                {rounds.map(
                  (savedRound) => (
                    <div
                      key={savedRound.round}
                      className="p-5"
                    >

                      <div className="mb-4 flex items-center justify-between">

                        <div>
                          <span className="text-sm font-black text-white">
                            Round{" "}
                            {savedRound.round}
                          </span>
                        </div>

                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300 ring-1 ring-white/10">
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
                                className="rounded-xl border border-white/10 bg-white/5 p-4"
                              >

                                <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                                  {
                                    position.label
                                  }
                                </p>

                                <p className="mt-2 text-sm font-black text-white">
                                  {result
                                    ? result.teamName
                                    : "Not Applicable"}
                                </p>

                                <p className="mt-1 text-lg font-black text-blue-300">
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