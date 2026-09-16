"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  Plus,
  RefreshCw,
  Trophy,
  Undo2,
  Volleyball,
} from "lucide-react";

import { toast } from "sonner";

/* =========================================================
   TYPES
========================================================= */

interface Player {
  id: number;
  name: string;
  jerseyNo?: number | null;
  jerseyNumber?: number | null;
  role?: string | null;
  photo?: string | null;
  teamId?: number;
}

interface Team {
  id: number;
  name: string;
  captain?: string | null;
  playerIds?: number[];
  players?: Player[] | null;
}

interface Game {
  id: number;
  name: string;
  sportType?: string | null;
}

/* =========================================================
   THROWBALL POINT
========================================================= */

interface ThrowballPoint {
  id: number;

  matchId?: number;

  pointNumber?: number | null;

  winningTeamId?: number | null;

  teamId?: number | null;

  attackerId?: number | null;

  opponentPlayerId?: number | null;

  reason?: string | null;

  pointReason?: string | null;

  createdAt?: string;

  updatedAt?: string;

  attacker?: Player | null;

  opponent?: Player | null;

  winningTeam?: Team | null;
}

/* =========================================================
   THROWBALL SCORE
   SINGLE SCORE ONLY
========================================================= */

interface ThrowballScore {
  id: number;

  matchId: number;

  team1Id: number;

  team2Id: number;

  team1Score: number;

  team2Score: number;

  status: string;

  winnerTeamId: number | null;
}

/* =========================================================
   MATCH
========================================================= */

interface Match {
  id: number;

  tournamentId: number;

  gameId: number;

  team1Id: number;

  team2Id: number;

  matchNumber: number;

  matchDate: string;

  venue: string;

  status: string;

  result: string | null;

  winnerTeamId: number | null;

  overs: number;

  team1Score: number;

  team2Score: number;

  game: Game;

  team1: Team;

  team2: Team;

  throwballScore: ThrowballScore | null;

  throwballPoints?: ThrowballPoint[] | null;
}

/* =========================================================
   API RESPONSE
========================================================= */

interface ApiResponse {
  success: boolean;

  match?: Match;

  score?: ThrowballScore;

  points?: ThrowballPoint[];

  point?: ThrowballPoint;

  error?: string;

  completed?: boolean;
}

/* =========================================================
   POINT REASON
========================================================= */

type PointReason =
  | "SUCCESSFUL_ATTACK"
  | "OPPONENT_ERROR"
  | "OUT"
  | "FAULT"
  | "OTHER";

/* =========================================================
   PAGE
========================================================= */

export default function ThrowballMatchPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  /* =======================================================
     MATCH STATE
  ======================================================= */

  const [matchId, setMatchId] =
    useState<number | null>(null);

  const [match, setMatch] =
    useState<Match | null>(null);

  const [score, setScore] =
    useState<ThrowballScore | null>(null);

  const [points, setPoints] =
    useState<ThrowballPoint[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [updating, setUpdating] =
    useState(false);

  /* =======================================================
     POINT FORM
  ======================================================= */

  const [selectedTeam, setSelectedTeam] =
    useState<1 | 2 | null>(null);

  const [attackerId, setAttackerId] =
    useState<number | null>(null);

  const [opponentPlayerId, setOpponentPlayerId] =
    useState<number | null>(null);

  const [pointReason, setPointReason] =
    useState<PointReason>(
      "SUCCESSFUL_ATTACK"
    );

  /* =======================================================
     GET MATCH ID
  ======================================================= */

  useEffect(() => {
    params.then(({ id }) => {
      const numericId = Number(id);

      if (
        !Number.isInteger(numericId) ||
        numericId <= 0
      ) {
        toast.error("Invalid match ID.");

        setLoading(false);

        return;
      }

      setMatchId(numericId);
    });
  }, [params]);

  /* =======================================================
     LOAD MATCH
  ======================================================= */

  const loadMatch =
    useCallback(async () => {
      if (!matchId) {
        return;
      }

      try {
        setLoading(true);

        const response = await fetch(
          `/api/matches/${matchId}/throwball`,
          {
            method: "GET",

            cache: "no-store",

            headers: {
              Accept: "application/json",
            },
          }
        );

        const text =
          await response.text();

        let data: ApiResponse;

        try {
          data = text
            ? JSON.parse(text)
            : {
                success: false,
              };
        } catch {
          console.error(
            "THROWBALL API RESPONSE:",
            text
          );

          throw new Error(
            "Throwball API returned an invalid response."
          );
        }

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Failed to load Throwball match."
          );
        }

        if (
          !data.success ||
          !data.match
        ) {
          throw new Error(
            data.error ||
              "Throwball match not found."
          );
        }

        const loadedMatch =
          data.match;

        /* ===============================================
           NORMALIZE TEAM 1
        =============================================== */

        const normalizedTeam1: Team = {
          ...loadedMatch.team1,

          players:
            Array.isArray(
              loadedMatch.team1?.players
            )
              ? loadedMatch.team1.players
              : [],
        };

        /* ===============================================
           NORMALIZE TEAM 2
        =============================================== */

        const normalizedTeam2: Team = {
          ...loadedMatch.team2,

          players:
            Array.isArray(
              loadedMatch.team2?.players
            )
              ? loadedMatch.team2.players
              : [],
        };

        /* ===============================================
           NORMALIZE MATCH
        =============================================== */

        const normalizedMatch: Match = {
          ...loadedMatch,

          team1: normalizedTeam1,

          team2: normalizedTeam2,
        };

        setMatch(
          normalizedMatch
        );

        /* ===============================================
           SCORE
        =============================================== */

        setScore(
          normalizedMatch.throwballScore
        );

        /* ===============================================
           POINT HISTORY
        =============================================== */

        setPoints(
          Array.isArray(
            normalizedMatch.throwballPoints
          )
            ? normalizedMatch.throwballPoints
            : []
        );

        if (
          Array.isArray(
            data.points
          )
        ) {
          setPoints(
            data.points
          );
        }

        /* ===============================================
           RESET PLAYER SELECTION
        =============================================== */

        setSelectedTeam(null);

        setAttackerId(null);

        setOpponentPlayerId(null);
      } catch (error) {
        console.error(
          "LOAD THROWBALL MATCH ERROR:",
          error
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to load Throwball match."
        );
      } finally {
        setLoading(false);
      }
    }, [matchId]);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    if (matchId) {
      loadMatch();
    }
  }, [
    matchId,
    loadMatch,
  ]);

  /* =======================================================
     RESET POINT FORM
  ======================================================= */

  function resetPointForm() {
    setSelectedTeam(null);

    setAttackerId(null);

    setOpponentPlayerId(null);

    setPointReason(
      "SUCCESSFUL_ATTACK"
    );
  }

  /* =======================================================
     COMPLETED
  ======================================================= */

  const completed =
    score?.status ===
    "COMPLETED";

  /* =======================================================
     SELECT SCORING TEAM
  ======================================================= */

  function selectScoringTeam(
    team: 1 | 2
  ) {
    if (completed) {
      return;
    }

    setSelectedTeam(team);

    setAttackerId(null);

    setOpponentPlayerId(null);

    setPointReason(
      "SUCCESSFUL_ATTACK"
    );
  }

  /* =======================================================
     TEAM PLAYERS
  ======================================================= */

  const team1Players =
    useMemo<Player[]>(() => {
      return match &&
        Array.isArray(
          match.team1?.players
        )
        ? match.team1.players
        : [];
    }, [match]);

  const team2Players =
    useMemo<Player[]>(() => {
      return match &&
        Array.isArray(
          match.team2?.players
        )
        ? match.team2.players
        : [];
    }, [match]);

  /* =======================================================
     SELECTED TEAM PLAYERS
  ======================================================= */

  const scoringTeamPlayers =
    useMemo<Player[]>(() => {
      if (selectedTeam === 1) {
        return team1Players;
      }

      if (selectedTeam === 2) {
        return team2Players;
      }

      return [];
    }, [
      selectedTeam,
      team1Players,
      team2Players,
    ]);

  /* =======================================================
     OPPONENT PLAYERS
  ======================================================= */

  const opponentPlayers =
    useMemo<Player[]>(() => {
      if (selectedTeam === 1) {
        return team2Players;
      }

      if (selectedTeam === 2) {
        return team1Players;
      }

      return [];
    }, [
      selectedTeam,
      team1Players,
      team2Players,
    ]);

  /* =======================================================
     AVAILABLE ATTACKERS
  ======================================================= */

  const availableAttackers =
    useMemo(() => {
      return scoringTeamPlayers.filter(
        (player) =>
          player.id !==
          opponentPlayerId
      );
    }, [
      scoringTeamPlayers,
      opponentPlayerId,
    ]);

  /* =======================================================
     AVAILABLE OPPONENTS
  ======================================================= */

  const availableOpponents =
    useMemo(() => {
      return opponentPlayers.filter(
        (player) =>
          player.id !==
          attackerId
      );
    }, [
      opponentPlayers,
      attackerId,
    ]);

  /* =======================================================
     CURRENT SCORE
  ======================================================= */

  const currentTeam1Score =
    score?.team1Score ?? 0;

  const currentTeam2Score =
    score?.team2Score ?? 0;

  /* =======================================================
     PLAYER NAME
  ======================================================= */

  function getPlayerName(
    playerId:
      | number
      | null
      | undefined
  ) {
    if (
      playerId ===
        null ||
      playerId ===
        undefined
    ) {
      return "—";
    }

    const allPlayers = [
      ...team1Players,
      ...team2Players,
    ];

    const player =
      allPlayers.find(
        (item) =>
          item.id ===
          playerId
      );

    return (
      player?.name ??
      "—"
    );
  }

  /* =======================================================
     TEAM NAME
  ======================================================= */

  const getTeamName = (
    teamId:
      | number
      | null
      | undefined
  ): string => {
    if (teamId == null) {
      return "—";
    }

    if (
      teamId ===
      match?.team1Id
    ) {
      return (
        match.team1.name
      );
    }

    if (
      teamId ===
      match?.team2Id
    ) {
      return (
        match.team2.name
      );
    }

    return "—";
  };

  /* =======================================================
     POINT TEAM ID
  ======================================================= */

  function getPointTeamId(
    point: ThrowballPoint
  ) {
    return (
      point.winningTeamId ??
      point.teamId ??
      point.winningTeam?.id ??
      null
    );
  }

  /* =======================================================
     POINT REASON
  ======================================================= */

  function getPointReason(
    point: ThrowballPoint
  ): PointReason {
    const raw =
      point.pointReason ??
      point.reason ??
      "OTHER";

    const normalized =
      raw
        .toString()
        .trim()
        .toUpperCase()
        .replace(
          /\s+/g,
          "_"
        );

    if (
      normalized ===
      "SUCCESSFUL_ATTACK"
    ) {
      return "SUCCESSFUL_ATTACK";
    }

    if (
      normalized ===
      "OPPONENT_ERROR"
    ) {
      return "OPPONENT_ERROR";
    }

    if (
      normalized ===
      "OUT"
    ) {
      return "OUT";
    }

    if (
      normalized ===
      "FAULT"
    ) {
      return "FAULT";
    }

    return "OTHER";
  }

  /* =======================================================
     POINT NUMBER
  ======================================================= */

  function getPointNumber(
    point: ThrowballPoint,
    index: number
  ) {
    return (
      point.pointNumber ??
      point.id ??
      index + 1
    );
  }

  /* =======================================================
     SORT POINT HISTORY
  ======================================================= */

  const sortedPoints =
    useMemo(() => {
      return [
        ...points,
      ].sort(
        (a, b) => {
          const aNumber =
            a.pointNumber ??
            a.id;

          const bNumber =
            b.pointNumber ??
            b.id;

          return (
            bNumber -
            aNumber
          );
        }
      );
    }, [points]);

  /* =======================================================
     ADD POINT
  ======================================================= */

  async function addPoint() {
    if (!matchId) {
      return;
    }

    if (!score) {
      toast.error(
        "Throwball score is not available."
      );

      return;
    }

    if (!selectedTeam) {
      toast.error(
        "Select the team that won the point."
      );

      return;
    }

    if (completed) {
      toast.error(
        "This match is already completed."
      );

      return;
    }

    try {
      setUpdating(true);

      const response =
        await fetch(
          `/api/matches/${matchId}/throwball/score`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body: JSON.stringify({
              team:
                selectedTeam,

              attackerId,

              opponentPlayerId,

              pointReason,
            }),
          }
        );

      const text =
        await response.text();

      let data: any = {};

      try {
        data = text
          ? JSON.parse(text)
          : {};
      } catch {
        console.error(
          "THROWBALL SCORE RESPONSE:",
          text
        );

        throw new Error(
          "Throwball scoring API returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to update score."
        );
      }

      if (!data.score) {
        throw new Error(
          "Score was updated but no score data was returned."
        );
      }

      /* ===============================================
         UPDATE SCORE
      =============================================== */

      setScore(
        data.score
      );

      /* ===============================================
         UPDATE POINT
      =============================================== */

      if (
        data.point
      ) {
        setPoints(
          (previous) => [
            data.point,
            ...previous,
          ]
        );
      }

      if (
        Array.isArray(
          data.points
        )
      ) {
        setPoints(
          data.points
        );
      }

      /* ===============================================
         MATCH COMPLETED
      =============================================== */

      if (
        data.completed
      ) {
        await loadMatch();

        toast.success(
          "Throwball match completed."
        );

        window.location.href =
          `/admin/matches/${matchId}/throwball/summary`;

        return;
      }

      /* ===============================================
         RELOAD DATABASE DATA
      =============================================== */

      await loadMatch();

      toast.success(
        "Point added successfully."
      );

      resetPointForm();
    } catch (error) {
      console.error(
        "THROWBALL SCORE ERROR:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update Throwball score."
      );
    } finally {
      setUpdating(false);
    }
  }

  /* =======================================================
   UNDO LAST POINT
======================================================= */

async function undoLastPoint() {
  if (!matchId) {
    return;
  }

  if (!score) {
    toast.error(
      "Throwball score is not available."
    );

    return;
  }

  if (completed) {
    toast.error(
      "This match is already completed."
    );

    return;
  }

  if (points.length === 0) {
    toast.error(
      "There is no point to undo."
    );

    return;
  }

  try {
    setUpdating(true);

    const response = await fetch(
      `/api/matches/${matchId}/throwball/undo`,
      {
        method: "DELETE",

        headers: {
          Accept: "application/json",
        },
      }
    );

    const text =
      await response.text();

    let data: any = {};

    try {
      data = text
        ? JSON.parse(text)
        : {};
    } catch {
      console.error(
        "THROWBALL UNDO RESPONSE:",
        text
      );

      throw new Error(
        "Throwball undo API returned an invalid response."
      );
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Failed to undo last point."
      );
    }

    // =================================================
    // UPDATE SCORE
    // =================================================

    if (data.score) {
      setScore(data.score);
    }

    // =================================================
    // UPDATE POINT HISTORY
    // =================================================

    if (Array.isArray(data.points)) {
      setPoints(data.points);
    }

    // =================================================
    // RESET FORM
    // =================================================

    resetPointForm();

    // =================================================
    // REFRESH DATABASE DATA
    // =================================================

    await loadMatch();

    toast.success(
      data.message ||
        "Last point undone successfully."
    );
  } catch (error) {
    console.error(
      "THROWBALL UNDO ERROR:",
      error
    );

    toast.error(
      error instanceof Error
        ? error.message
        : "Failed to undo last point."
    );
  } finally {
    setUpdating(false);
  }
}
  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="text-sm font-bold text-slate-700">
            Loading Throwball match...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    !match ||
    !score
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-md rounded-2xl border bg-white p-7 text-center shadow-sm">

          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
            <Volleyball
              size={28}
            />
          </div>

          <h1 className="text-xl font-black text-slate-900">
            Throwball match unavailable
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Unable to load the Throwball match.
          </p>

          <div className="mt-5 flex justify-center gap-3">

            <button
              type="button"
              onClick={
                loadMatch
              }
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
            >
              <RefreshCw
                size={16}
              />

              Retry
            </button>

            <Link
              href="/admin/matches"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Back
            </Link>

          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-100">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="border-b bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">

          <div className="flex items-center gap-3">

            <Link
              href="/admin/matches"
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100"
            >
              <ArrowLeft
                size={19}
              />
            </Link>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <Volleyball
                size={22}
              />
            </div>

            <div>

              <div className="flex items-center gap-2">

                <h1 className="text-lg font-black text-slate-900">
                  Throwball
                </h1>

                {completed ? (
                  <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-black text-green-700">
                    COMPLETED
                  </span>
                ) : (
                  <span className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-black text-red-700">
                    LIVE
                  </span>
                )}

              </div>

              <p className="text-xs text-slate-500">

                Match #
                {match.matchNumber}

                {" • "}

                {match.venue}

              </p>

            </div>

          </div>

      <div className="flex items-center gap-2">

  {/* UNDO LAST POINT */}
  <button
    type="button"
    onClick={undoLastPoint}
    disabled={
      loading ||
      updating ||
      completed ||
      points.length === 0
    }
    className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
  >
    <Undo2 size={15} />

    Undo
  </button>

  {/* REFRESH */}
  <button
    type="button"
    onClick={loadMatch}
    disabled={
      loading ||
      updating
    }
    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
  >
    <RefreshCw
      size={15}
      className={
        loading
          ? "animate-spin"
          : ""
      }
    />

    Refresh
  </button>

</div>
        </div>

      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="mx-auto max-w-7xl space-y-4 p-4 sm:p-5">

        {/* =================================================
            SCORE HEADER
        ================================================= */}

        <section className="rounded-2xl border bg-white px-4 py-5 shadow-sm">

          <div className="grid grid-cols-3 items-center">

            {/* TEAM 1 */}

            <div>

              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Team 1
              </p>

              <h2 className="mt-1 truncate text-xl font-black text-slate-900 sm:text-2xl">
                {match.team1.name}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {team1Players.length} players
              </p>

            </div>

            {/* MAIN SCORE */}

            <div className="text-center">

              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Current Score
              </p>

              <div className="mt-1 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">

                {currentTeam1Score}

                <span className="mx-2 text-slate-300">
                  -
                </span>

                {currentTeam2Score}

              </div>

              <p className="mt-1 text-[10px] text-slate-400">
                First to 11 • Win by 2
              </p>

            </div>

            {/* TEAM 2 */}

            <div className="text-right">

              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Team 2
              </p>

              <h2 className="mt-1 truncate text-xl font-black text-slate-900 sm:text-2xl">
                {match.team2.name}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {team2Players.length} players
              </p>

            </div>

          </div>

        </section>

        {/* =================================================
            SCORING SECTION
        ================================================= */}

        <section className="grid items-stretch gap-3 lg:grid-cols-3">

          {/* =================================================
              TEAM 1
          ================================================= */}

          <TeamScoreCard
            teamName={
              match.team1.name
            }
            score={
              currentTeam1Score
            }
            selected={
              selectedTeam === 1
            }
            disabled={
              updating ||
              completed
            }
            onAdd={() =>
              selectScoringTeam(
                1
              )
            }
          />

          {/* =================================================
              POINT DETAILS
          ================================================= */}

          <section className="rounded-2xl border bg-white p-4 shadow-sm">

            <div className="mb-3 flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <Trophy
                  size={18}
                />
              </div>

              <div>

                <h3 className="text-base font-black text-slate-900">
                  Point Details
                </h3>

                <p className="text-[10px] text-slate-400">
                  Select winner and point details
                </p>

              </div>

            </div>

            {/* =================================================
                TEAM SELECT
            ================================================= */}

            <div className="grid grid-cols-2 gap-2">

              <button
                type="button"
                disabled={
                  updating ||
                  completed
                }
                onClick={() =>
                  selectScoringTeam(
                    1
                  )
                }
                className={`rounded-xl px-3 py-3 text-sm font-black transition ${
                  selectedTeam ===
                  1
                    ? "bg-green-600 text-white"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                } disabled:opacity-40`}
              >
                {match.team1.name}
              </button>

              <button
                type="button"
                disabled={
                  updating ||
                  completed
                }
                onClick={() =>
                  selectScoringTeam(
                    2
                  )
                }
                className={`rounded-xl px-3 py-3 text-sm font-black transition ${
                  selectedTeam ===
                  2
                    ? "bg-green-600 text-white"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                } disabled:opacity-40`}
              >
                {match.team2.name}
              </button>

            </div>

            {/* =================================================
                POINT FORM
            ================================================= */}

            {selectedTeam && (
              <div className="mt-3 space-y-2.5">

                {/* PLAYERS */}

                <div className="grid grid-cols-2 gap-2">

                  {/* PLAYER */}

                  <div>

                    <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                      Player
                    </label>

                    <select
                      value={
                        attackerId ??
                        ""
                      }
                      onChange={(
                        event
                      ) => {

                        const value =
                          event.target
                            .value;

                        setAttackerId(
                          value
                            ? Number(
                                value
                              )
                            : null
                        );

                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                    >

                      <option value="">
                        Select player
                      </option>

                      {availableAttackers.map(
                        (
                          player
                        ) => (
                          <option
                            key={
                              player.id
                            }
                            value={
                              player.id
                            }
                          >

                            {player.name}

                            {(
                              player.jerseyNo ??
                              player.jerseyNumber
                            ) != null
                              ? ` #${
                                  player.jerseyNo ??
                                  player.jerseyNumber
                                }`
                              : ""}

                          </option>
                        )
                      )}

                    </select>

                  </div>

                  {/* OPPONENT */}

                  <div>

                    <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                      Opponent
                    </label>

                    <select
                      value={
                        opponentPlayerId ??
                        ""
                      }
                      onChange={(
                        event
                      ) => {

                        setOpponentPlayerId(
                          event.target
                            .value
                            ? Number(
                                event.target
                                  .value
                              )
                            : null
                        );

                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                    >

                      <option value="">
                        Select opponent
                      </option>

                      {availableOpponents.map(
                        (
                          player
                        ) => (
                          <option
                            key={
                              player.id
                            }
                            value={
                              player.id
                            }
                          >

                            {player.name}

                            {(
                              player.jerseyNo ??
                              player.jerseyNumber
                            ) != null
                              ? ` #${
                                  player.jerseyNo ??
                                  player.jerseyNumber
                                }`
                              : ""}

                          </option>
                        )
                      )}

                    </select>

                  </div>

                </div>

                {/* =================================================
                    RESULT
                ================================================= */}

                <div>

                  <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                    Result
                  </label>

                  <select
                    value={
                      pointReason
                    }
                    onChange={(
                      event
                    ) =>
                      setPointReason(
                        event.target
                          .value as PointReason
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                  >

                    <option value="SUCCESSFUL_ATTACK">
                      Successful Attack
                    </option>

                    <option value="OPPONENT_ERROR">
                      Opponent Error
                    </option>

                    <option value="OUT">
                      Out
                    </option>

                    <option value="FAULT">
                      Fault
                    </option>

                    <option value="OTHER">
                      Other
                    </option>

                  </select>

                </div>

                {/* =================================================
                    CURRENT SELECTION
                ================================================= */}

                {(
                  attackerId !==
                    null ||
                  opponentPlayerId !==
                    null
                ) && (

                  <div className="rounded-xl bg-slate-50 px-3 py-2">

                    <div className="flex items-center justify-between text-[10px]">

                      <span className="font-bold uppercase text-slate-400">
                        Point
                      </span>

                      <span className="font-black text-slate-800">

                        {pointReason ===
                        "SUCCESSFUL_ATTACK"
                          ? "Successful Attack"
                          : pointReason ===
                              "OPPONENT_ERROR"
                            ? "Opponent Error"
                            : pointReason ===
                                "OUT"
                              ? "Out"
                              : pointReason ===
                                  "FAULT"
                                ? "Fault"
                                : "Other"}

                      </span>

                    </div>

                    {attackerId !==
                      null && (

                      <div className="mt-1 flex items-center justify-between text-[10px]">

                        <span className="text-slate-400">
                          Player
                        </span>

                        <span className="font-black text-slate-800">
                          {getPlayerName(
                            attackerId
                          )}
                        </span>

                      </div>

                    )}

                    {opponentPlayerId !==
                      null && (

                      <div className="flex items-center justify-between text-[10px]">

                        <span className="text-slate-400">
                          Opponent
                        </span>

                        <span className="font-black text-slate-800">
                          {getPlayerName(
                            opponentPlayerId
                          )}
                        </span>

                      </div>

                    )}

                  </div>

                )}

                {/* =================================================
                    ACTIONS
                ================================================= */}

                <div className="grid grid-cols-2 gap-2">

                  <button
                    type="button"
                    onClick={
                      resetPointForm
                    }
                    disabled={
                      updating
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-50"
                  >
                    CANCEL
                  </button>

                  <button
                    type="button"
                    onClick={
                      addPoint
                    }
                    disabled={
                      updating ||
                      completed
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-40"
                  >

                    {updating ? (
                      <RefreshCw
                        size={14}
                        className="animate-spin"
                      />
                    ) : (
                      <Plus
                        size={15}
                      />
                    )}

                    POINT

                  </button>

                </div>

              </div>
            )}

          </section>

          {/* =================================================
              TEAM 2
          ================================================= */}

          <TeamScoreCard
            teamName={
              match.team2.name
            }
            score={
              currentTeam2Score
            }
            selected={
              selectedTeam === 2
            }
            disabled={
              updating ||
              completed
            }
            onAdd={() =>
              selectScoringTeam(
                2
              )
            }
          />

        </section>

        {/* =================================================
            POINT HISTORY
        ================================================= */}

        <PointHistory
          points={
            sortedPoints
          }
          getPointNumber={
            getPointNumber
          }
          getPointTeamId={
            getPointTeamId
          }
          getTeamName={
            getTeamName
          }
          getPlayerName={
            getPlayerName
          }
          getPointReason={
            getPointReason
          }
          team1Id={
            match.team1Id
          }
          team2Id={
            match.team2Id
          }
        />

        {/* =================================================
            COMPLETED
        ================================================= */}

        {completed && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-center">

            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
              <Trophy
                size={20}
              />
            </div>

            <h2 className="mt-2 text-lg font-black text-green-900">
              Match Completed
            </h2>

            <p className="mt-1 text-sm text-green-700">

              {score.winnerTeamId ===
              match.team1Id
                ? match.team1.name
                : score.winnerTeamId ===
                    match.team2Id
                  ? match.team2.name
                  : "Match winner"}

              {" "}won the match.

            </p>

            <p className="mt-2 text-xs font-bold text-green-700">

              Final Score:{" "}

              {score.team1Score}

              {" - "}

              {score.team2Score}

            </p>

          </div>
        )}

      </main>

    </div>
  );
}

/* =========================================================
   TEAM SCORE CARD
========================================================= */

function TeamScoreCard({
  teamName,
  score,
  selected,
  disabled,
  onAdd,
}: {
  teamName: string;

  score: number;

  selected: boolean;

  disabled: boolean;

  onAdd: () => void;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-4 shadow-sm transition ${
        selected
          ? "border-blue-400 ring-2 ring-blue-100"
          : "border-slate-200"
      }`}
    >

      <div className="text-center">

        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          Team
        </p>

        <h2 className="mt-1 truncate text-xl font-black text-slate-900">
          {teamName}
        </h2>

        <div className="mt-2">

          <p className="text-6xl font-black tracking-tight text-blue-600">
            {score}
          </p>

          <p className="text-[10px] text-slate-400">
            Current Score
          </p>

        </div>

        <button
          type="button"
          onClick={
            onAdd
          }
          disabled={
            disabled
          }
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-base font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-40 ${
            selected
              ? "bg-green-600 hover:bg-green-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >

          <Plus
            size={19}
          />

          {selected
            ? "SELECTED"
            : "POINT"}

        </button>

      </div>

    </div>
  );
}

/* =========================================================
   POINT HISTORY
========================================================= */

function PointHistory({
  points,
  getPointNumber,
  getPointTeamId,
  getTeamName,
  getPlayerName,
  getPointReason,
  team1Id,
  team2Id,
}: {
  points: ThrowballPoint[];

  getPointNumber: (
    point: ThrowballPoint,
    index: number
  ) => number;

  getPointTeamId: (
    point: ThrowballPoint
  ) => number | null;

  getTeamName: (
    teamId:
      | number
      | null
      | undefined
  ) => string;

  getPlayerName: (
    playerId:
      | number
      | null
      | undefined
  ) => string;

  getPointReason: (
    point: ThrowballPoint
  ) => PointReason;

  team1Id: number;

  team2Id: number;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex items-center justify-between border-b px-4 py-3">

        <div>

          <h2 className="text-base font-black text-slate-900">
            Point History
          </h2>

          <p className="text-[10px] text-slate-400">
            {points.length} points
          </p>

        </div>

        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-black text-blue-600">
          LIVE
        </span>

      </div>

      {/* =================================================
          EMPTY
      ================================================= */}

      {points.length ===
      0 ? (

        <div className="px-4 py-8 text-center">

          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Plus
              size={18}
            />
          </div>

          <p className="mt-2 text-sm font-bold text-slate-500">
            No points recorded yet
          </p>

          <p className="mt-1 text-[10px] text-slate-400">
            Add the first point using the scoring panel above.
          </p>

        </div>

      ) : (

        <div className="w-full overflow-x-auto">

          <table className="w-full min-w-[700px] border-collapse">

            <thead>

              <tr className="border-b bg-slate-50">

                <th className="w-14 px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-wide text-slate-400">
                  #
                </th>

                <th className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-wide text-slate-400">
                  Team
                </th>

                <th className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-wide text-slate-400">
                  Player
                </th>

                <th className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-wide text-slate-400">
                  Result
                </th>

                <th className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-wide text-slate-400">
                  Opponent
                </th>

              </tr>

            </thead>

            <tbody>

              {points.map(
                (
                  point,
                  index
                ) => {

                  const teamId =
                    getPointTeamId(
                      point
                    );

                  const reason =
                    getPointReason(
                      point
                    );

                  const playerName =
                    point.attacker
                      ?.name ??
                    getPlayerName(
                      point.attackerId
                    );

                  const opponentName =
                    point.opponent
                      ?.name ??
                    getPlayerName(
                      point.opponentPlayerId
                    );

                  return (
                    <tr
                      key={
                        point.id ??
                        `${index}-${getPointNumber(
                          point,
                          index
                        )}`
                      }
                      className="border-b last:border-b-0 hover:bg-slate-50"
                    >

                      {/* NUMBER */}

                      <td className="px-4 py-3">

                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-slate-700">
                          {getPointNumber(
                            point,
                            index
                          )}
                        </div>

                      </td>

                      {/* TEAM */}

                      <td className="px-4 py-3">

                        <div className="flex items-center gap-2">

                          <div
                            className={`h-2 w-2 rounded-full ${
                              teamId ===
                              team1Id
                                ? "bg-blue-600"
                                : teamId ===
                                    team2Id
                                  ? "bg-orange-500"
                                  : "bg-slate-300"
                            }`}
                          />

                          <span className="text-xs font-black text-slate-800">
                            {getTeamName(
                              teamId
                            )}
                          </span>

                        </div>

                      </td>

                      {/* PLAYER */}

                      <td className="px-4 py-3">

                        <span className="text-xs font-black text-slate-900">
                          {playerName}
                        </span>

                      </td>

                      {/* RESULT */}

                      <td className="px-4 py-3">

                        <ResultBadge
                          reason={
                            reason
                          }
                        />

                      </td>

                      {/* OPPONENT */}

                      <td className="px-4 py-3">

                        <span className="text-xs font-bold text-slate-600">
                          {opponentName}
                        </span>

                      </td>

                    </tr>
                  );
                }
              )}

            </tbody>

          </table>

        </div>

      )}

    </section>
  );
}

/* =========================================================
   RESULT BADGE
========================================================= */

function ResultBadge({
  reason,
}: {
  reason: PointReason;
}) {
  const config =
    {
      SUCCESSFUL_ATTACK: {
        label:
          "Successful Attack",

        className:
          "bg-green-50 text-green-700 border-green-200",
      },

      OPPONENT_ERROR: {
        label:
          "Opponent Error",

        className:
          "bg-orange-50 text-orange-700 border-orange-200",
      },

      OUT: {
        label:
          "Out",

        className:
          "bg-red-50 text-red-700 border-red-200",
      },

      FAULT: {
        label:
          "Fault",

        className:
          "bg-yellow-50 text-yellow-700 border-yellow-200",
      },

      OTHER: {
        label:
          "Other",

        className:
          "bg-slate-50 text-slate-600 border-slate-200",
      },
    }[reason];

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black ${config.className}`}
    >
      {config.label}
    </span>
  );
}