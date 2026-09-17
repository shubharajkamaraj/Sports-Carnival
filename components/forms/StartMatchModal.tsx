"use client";

import {
  useEffect,
  useState,
} from "react";

import { X } from "lucide-react";
import { toast } from "sonner";

// =====================================================
// TYPES
// =====================================================

interface Team {
  id: number;
  name: string;
}

interface Game {
  id: number;
  name: string;

  sportType?:
    | "CRICKET"
    | "FOOTBALL"
    | "THROWBALL"
    | "HANDBALL"
    | string
    | null;
}

type MatchStage =
  | "LEAGUE"
  | "THIRD_PLACE"
  | "FINAL";

interface Match {
  id: number;

  tournamentId?: number;
  gameId: number;

  team1Id: number;
  team2Id: number;

  matchNumber?: number | null;

  stage?: MatchStage;

  status: string;

  // =====================================================
  // CRICKET
  // =====================================================

  overs: number;

  // =====================================================
  // SCORE
  // =====================================================

  team1Score?: number;
  team2Score?: number;

  // =====================================================
  // RELATIONS
  // =====================================================

  game: Game;

  team1: Team;
  team2: Team;
}

// =====================================================
// PROPS
// =====================================================

interface Props {
  open: boolean;

  match: Match | null;

  onClose: () => void;

  onStarted: (
    inningsId: number
  ) => void;
}

// =====================================================
// COMPONENT
// =====================================================

export default function StartMatchModal({
  open,
  match,
  onClose,
  onStarted,
}: Props) {
  const [
    battingTeamId,
    setBattingTeamId,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  // =====================================================
  // DETERMINE SPORT
  // =====================================================

  const sportType =
    match?.game?.sportType
      ?.toUpperCase() ?? "";

  const gameName =
    match?.game?.name
      ?.toLowerCase() ?? "";

  const isFootball =
    sportType === "FOOTBALL" ||
    gameName.includes("football");

  const isHandball =
    sportType === "HANDBALL" ||
    gameName.includes("handball");

  const isCricket =
    sportType === "CRICKET" ||
    gameName.includes("cricket");

  const isThrowball =
    sportType === "THROWBALL" ||
    gameName.includes("throwball");

  // =====================================================
  // RESET
  // =====================================================

  useEffect(() => {
    if (!open || !match) {
      return;
    }

    /*
     * Football, Handball and Throwball
     * do not need batting team selection.
     */

    if (
      isFootball ||
      isHandball ||
      isThrowball
    ) {
      setBattingTeamId("");
      return;
    }

    /*
     * Cricket starts with Team 1 batting.
     */

    if (isCricket) {
      setBattingTeamId(
        String(match.team1Id)
      );
    }
  }, [
    open,
    match,
    isFootball,
    isHandball,
    isThrowball,
    isCricket,
  ]);

  // =====================================================
  // START CRICKET
  // =====================================================

  async function startCricket() {
    if (!match) {
      return;
    }

    if (!battingTeamId) {
      toast.error(
        "Please select the batting team."
      );

      return;
    }

    const battingTeamIdNumber =
      Number(battingTeamId);

    const bowlingTeamId =
      battingTeamIdNumber ===
      match.team1Id
        ? match.team2Id
        : match.team1Id;

    if (
      !Number.isInteger(
        battingTeamIdNumber
      ) ||
      !Number.isInteger(
        bowlingTeamId
      )
    ) {
      toast.error(
        "Invalid batting or bowling team."
      );

      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `/api/matches/${match.id}/cricket/start`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            inningsNumber: 1,

            battingTeamId:
              battingTeamIdNumber,

            bowlingTeamId:
              bowlingTeamId,
          }),
        }
      );

      const responseText =
        await res.text();

      let data: {
        error?: string;
        message?: string;
        inningsId?: number;
      } = {};

      try {
        data = responseText
          ? JSON.parse(
              responseText
            )
          : {};
      } catch {
        data = {};
      }

      // =================================================
      // API ERROR
      // =================================================

      if (!res.ok) {
        /*
         * If innings 1 already exists,
         * open that existing innings.
         */

        if (
          data.error ===
            "Innings 1 already exists." &&
          data.inningsId
        ) {
          onStarted(
            Number(
              data.inningsId
            )
          );

          return;
        }

        throw new Error(
          data.error ||
            data.message ||
            responseText ||
            "Failed to start cricket match."
        );
      }

      // =================================================
      // CHECK INNINGS ID
      // =================================================

      if (!data.inningsId) {
        throw new Error(
          "Cricket innings was created but no innings ID was returned."
        );
      }

      onStarted(
        Number(
          data.inningsId
        )
      );
    } catch (error) {
      console.error(
        "START CRICKET ERROR:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to start cricket match."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // START FOOTBALL
  // =====================================================

  async function startFootball() {
    if (!match) {
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `/api/matches/${match.id}/football/start`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );

      const responseText =
        await res.text();

      let data: {
        error?: string;
        message?: string;
      } = {};

      try {
        data = responseText
          ? JSON.parse(
              responseText
            )
          : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(
          data.error ||
            data.message ||
            responseText ||
            "Failed to start football match."
        );
      }

      toast.success(
        "Football match started."
      );

      window.location.href =
        `/admin/matches/${match.id}/football`;
    } catch (error) {
      console.error(
        "START FOOTBALL ERROR:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to start football match."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // START HANDBALL
  // =====================================================

  async function startHandball() {
    if (!match) {
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `/api/matches/${match.id}/handball/start`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );

      const responseText =
        await res.text();

      let data: {
        error?: string;
        message?: string;
      } = {};

      try {
        data = responseText
          ? JSON.parse(
              responseText
            )
          : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(
          data.error ||
            data.message ||
            responseText ||
            "Failed to start handball match."
        );
      }

      toast.success(
        "Handball match started."
      );

      window.location.href =
        `/admin/matches/${match.id}/handball`;
    } catch (error) {
      console.error(
        "START HANDBALL ERROR:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to start handball match."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // START THROWBALL
  // =====================================================

  async function startThrowball() {
    if (!match) {
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `/api/matches/${match.id}/throwball/start`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );

      const responseText =
        await res.text();

      let data: {
        error?: string;
        message?: string;
      } = {};

      try {
        data = responseText
          ? JSON.parse(
              responseText
            )
          : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(
          data.error ||
            data.message ||
            responseText ||
            "Failed to start Throwball match."
        );
      }

      toast.success(
        "Throwball match started."
      );

      window.location.href =
        `/admin/matches/${match.id}/throwball`;
    } catch (error) {
      console.error(
        "START THROWBALL ERROR:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to start Throwball match."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // START MATCH
  // =====================================================

  async function handleStart() {
    if (!match) {
      return;
    }

    if (isFootball) {
      await startFootball();
      return;
    }

    if (isHandball) {
      await startHandball();
      return;
    }

    if (isThrowball) {
      await startThrowball();
      return;
    }

    if (isCricket) {
      await startCricket();
      return;
    }

    toast.error(
      "This sport is not configured yet."
    );
  }

  // =====================================================
  // DON'T SHOW
  // =====================================================

  if (!open || !match) {
    return null;
  }

  // =====================================================
  // CRICKET TEAMS
  // =====================================================

  const battingTeam =
    battingTeamId ===
    String(match.team1Id)
      ? match.team1
      : match.team2;

  const bowlingTeam =
    battingTeamId ===
    String(match.team1Id)
      ? match.team2
      : match.team1;

  // =====================================================
  // FOOTBALL UI
  // =====================================================

  if (isFootball) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

        <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

          {/* HEADER */}

          <div className="flex items-center justify-between border-b px-6 py-5">

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Start Football Match
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Start the football match
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
            >
              <X size={20} />
            </button>

          </div>

          {/* CONTENT */}

          <div className="space-y-5 p-6">

            {/* MATCH */}

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Match
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900">

                {match.team1.name}

                <span className="mx-2 text-slate-400">
                  vs
                </span>

                {match.team2.name}

              </p>

              <p className="mt-1 text-sm text-slate-500">
                Football
              </p>

            </div>

            {/* STAGE */}

            {match.stage && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

                <p className="text-xs font-medium text-blue-600">
                  Stage
                </p>

                <p className="mt-1 font-bold text-blue-900">
                  {match.stage ===
                  "THIRD_PLACE"
                    ? "3rd Place"
                    : match.stage ===
                      "FINAL"
                    ? "Final"
                    : "League"}
                </p>

              </div>
            )}

            {/* TEAM PREVIEW */}

            <div className="rounded-xl border border-green-100 bg-green-50 p-4">

              <div className="grid grid-cols-2 gap-4">

                <div>
                  <p className="text-xs font-medium text-green-600">
                    Team 1
                  </p>

                  <p className="mt-1 font-bold text-green-900">
                    {match.team1.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Team 2
                  </p>

                  <p className="mt-1 font-bold text-slate-800">
                    {match.team2.name}
                  </p>
                </div>

              </div>

            </div>

            {/* INFO */}

            <div className="rounded-xl border border-slate-200 bg-white p-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-lg">
                  ⚽
                </div>

                <div>

                  <p className="font-semibold text-slate-800">
                    Ready to start
                  </p>

                  <p className="text-sm text-slate-500">
                    Goals, cards and match events
                    can be recorded after starting.
                  </p>

                </div>

              </div>

            </div>

            {/* BUTTONS */}

            <div className="flex justify-end gap-3 pt-2">

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-slate-200 px-5 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleStart}
                disabled={loading}
                className="rounded-xl bg-green-600 px-5 py-2.5 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Starting..."
                  : "Start Match"}
              </button>

            </div>

          </div>

        </div>

      </div>
    );
  }

  // =====================================================
  // HANDBALL UI
  // =====================================================

  if (isHandball) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

        <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

          {/* HEADER */}

          <div className="flex items-center justify-between border-b px-6 py-5">

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Start Handball Match
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Start the handball match
              </p>

            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
            >
              <X size={20} />
            </button>

          </div>

          {/* CONTENT */}

          <div className="space-y-5 p-6">

            {/* MATCH */}

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Match
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900">

                {match.team1.name}

                <span className="mx-2 text-slate-400">
                  vs
                </span>

                {match.team2.name}

              </p>

              <p className="mt-1 text-sm text-slate-500">
                Handball
              </p>

            </div>

            {/* STAGE */}

            {match.stage && (
              <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">

                <p className="text-xs font-medium text-purple-600">
                  Stage
                </p>

                <p className="mt-1 font-bold text-purple-900">
                  {match.stage ===
                  "THIRD_PLACE"
                    ? "3rd Place"
                    : match.stage ===
                      "FINAL"
                    ? "Final"
                    : "League"}
                </p>

              </div>
            )}

            {/* TEAM PREVIEW */}

            <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">

              <div className="grid grid-cols-2 gap-4">

                <div>

                  <p className="text-xs font-medium text-purple-600">
                    Team 1
                  </p>

                  <p className="mt-1 font-bold text-purple-900">
                    {match.team1.name}
                  </p>

                </div>

                <div>

                  <p className="text-xs font-medium text-slate-500">
                    Team 2
                  </p>

                  <p className="mt-1 font-bold text-slate-800">
                    {match.team2.name}
                  </p>

                </div>

              </div>

            </div>

            {/* INFORMATION */}

            <div className="rounded-xl border border-slate-200 bg-white p-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-lg">
                  🤾
                </div>

                <div>

                  <p className="font-semibold text-slate-800">
                    Ready to start
                  </p>

                  <p className="text-sm text-slate-500">
                    Goals, player scoring and match
                    events can be recorded after
                    starting.
                  </p>

                </div>

              </div>

            </div>

            {/* FORMAT */}

            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-xs font-medium text-indigo-600">
                    Match Format
                  </p>

                  <p className="mt-1 font-bold text-indigo-900">
                    Two Halves
                  </p>

                </div>

                <div className="text-right">

                  <p className="text-xs text-indigo-500">
                    Scoring
                  </p>

                  <p className="mt-1 font-bold text-indigo-900">
                    Goals
                  </p>

                </div>

              </div>

            </div>

            {/* BUTTONS */}

            <div className="flex justify-end gap-3 pt-2">

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-slate-200 px-5 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleStart}
                disabled={loading}
                className="rounded-xl bg-purple-600 px-5 py-2.5 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Starting..."
                  : "Start Match"}
              </button>

            </div>

          </div>

        </div>

      </div>
    );
  }

  // =====================================================
  // THROWBALL UI
  // =====================================================

  if (isThrowball) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

        <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

          {/* HEADER */}

          <div className="flex items-center justify-between border-b px-6 py-5">

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Start Throwball Match
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Start the Throwball match
              </p>

            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
            >
              <X size={20} />
            </button>

          </div>

          {/* CONTENT */}

          <div className="space-y-5 p-6">

            {/* MATCH */}

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Match
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900">

                {match.team1.name}

                <span className="mx-2 text-slate-400">
                  vs
                </span>

                {match.team2.name}

              </p>

              <p className="mt-1 text-sm text-slate-500">
                Throwball
              </p>

            </div>

            {/* STAGE */}

            {match.stage && (
              <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">

                <p className="text-xs font-medium text-orange-600">
                  Stage
                </p>

                <p className="mt-1 font-bold text-orange-900">
                  {match.stage ===
                  "THIRD_PLACE"
                    ? "3rd Place"
                    : match.stage ===
                      "FINAL"
                    ? "Final"
                    : "League"}
                </p>

              </div>
            )}

            {/* TEAM PREVIEW */}

            <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">

              <div className="grid grid-cols-2 gap-4">

                <div>

                  <p className="text-xs font-medium text-orange-600">
                    Team 1
                  </p>

                  <p className="mt-1 font-bold text-orange-900">
                    {match.team1.name}
                  </p>

                </div>

                <div>

                  <p className="text-xs font-medium text-slate-500">
                    Team 2
                  </p>

                  <p className="mt-1 font-bold text-slate-800">
                    {match.team2.name}
                  </p>

                </div>

              </div>

            </div>

            {/* INFORMATION */}

            <div className="rounded-xl border border-slate-200 bg-white p-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-lg">
                  🏐
                </div>

                <div>

                  <p className="font-semibold text-slate-800">
                    Ready to start
                  </p>

                  <p className="text-sm text-slate-500">
                    Throwball scoring will be
                    available after the match starts.
                  </p>

                </div>

              </div>

            </div>

            {/* FORMAT */}

            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-xs font-medium text-orange-600">
                    Match Format
                  </p>

                  <p className="mt-1 font-bold text-orange-900">
                    Single Set
                  </p>

                </div>

                <div className="text-right">

                  <p className="text-xs text-orange-600">
                    Target
                  </p>

                  <p className="mt-1 font-bold text-orange-900">
                    11 Points
                  </p>

                </div>

              </div>

              <div className="mt-3 border-t border-orange-200 pt-3">

                <p className="text-sm font-medium text-orange-800">
                  Win by 2 points
                </p>

                <p className="mt-1 text-xs text-orange-700">
                  The set continues beyond 11 if
                  necessary until one team leads by
                  at least 2 points.
                </p>

              </div>

            </div>

            {/* BUTTONS */}

            <div className="flex justify-end gap-3 pt-2">

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-slate-200 px-5 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleStart}
                disabled={loading}
                className="rounded-xl bg-orange-600 px-5 py-2.5 font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Starting..."
                  : "Start Match"}
              </button>

            </div>

          </div>

        </div>

      </div>
    );
  }

  // =====================================================
  // CRICKET UI
  // =====================================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* HEADER */}

        <div className="flex items-center justify-between border-b px-6 py-5">

          <div>

            <h2 className="text-xl font-bold text-slate-900">
              Start Cricket Match
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure the first cricket innings
            </p>

          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>

        </div>

        {/* CONTENT */}

        <div className="space-y-5 p-6">

          {/* MATCH */}

          <div className="rounded-xl bg-slate-50 p-4">

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Match
            </p>

            <p className="mt-1 text-lg font-bold text-slate-900">

              {match.team1.name}

              <span className="mx-2 text-slate-400">
                vs
              </span>

              {match.team2.name}

            </p>

            <p className="mt-1 text-sm text-slate-500">
              Cricket
            </p>

          </div>

          {/* STAGE */}

          {match.stage && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-xs font-medium text-blue-600">
                    Stage
                  </p>

                  <p className="mt-1 font-bold text-blue-900">
                    {match.stage ===
                    "THIRD_PLACE"
                      ? "3rd Place"
                      : match.stage ===
                        "FINAL"
                      ? "Final"
                      : "League"}
                  </p>

                </div>

                <div className="text-right">

                  <p className="text-xs font-medium text-slate-500">
                    Match Overs
                  </p>

                  <p className="mt-1 font-bold text-slate-800">
                    {match.overs} Overs
                  </p>

                </div>

              </div>

            </div>
          )}

          {/* BATTING TEAM */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Batting First
            </label>

            <select
              value={battingTeamId}
              onChange={(e) =>
                setBattingTeamId(
                  e.target.value
                )
              }
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
            >

              <option value="">
                Select Batting Team
              </option>

              <option
                value={
                  match.team1Id
                }
              >
                {match.team1.name}
              </option>

              <option
                value={
                  match.team2Id
                }
              >
                {match.team2.name}
              </option>

            </select>

          </div>

          {/* TEAM PREVIEW */}

          {battingTeamId && (

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

              <div className="grid grid-cols-2 gap-4">

                <div>

                  <p className="text-xs font-medium text-blue-500">
                    Batting
                  </p>

                  <p className="mt-1 font-bold text-blue-900">
                    {battingTeam.name}
                  </p>

                </div>

                <div>

                  <p className="text-xs font-medium text-slate-500">
                    Bowling
                  </p>

                  <p className="mt-1 font-bold text-slate-800">
                    {bowlingTeam.name}
                  </p>

                </div>

              </div>

            </div>
          )}

          {/* CRICKET FORMAT */}

          <div className="rounded-xl border border-green-100 bg-green-50 p-4">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-medium text-green-600">
                  Match Format
                </p>

                <p className="mt-1 font-bold text-green-900">
                  {match.overs} Overs
                </p>

              </div>

              <div className="text-right">

                <p className="text-xs font-medium text-green-600">
                  Innings
                </p>

                <p className="mt-1 font-bold text-green-900">
                  2 Innings
                </p>

              </div>

            </div>

          </div>

          {/* BUTTONS */}

          <div className="flex justify-end gap-3 pt-2">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-5 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleStart}
              disabled={
                loading ||
                !battingTeamId
              }
              className="rounded-xl bg-green-600 px-5 py-2.5 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Starting..."
                : "Start Match"}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

