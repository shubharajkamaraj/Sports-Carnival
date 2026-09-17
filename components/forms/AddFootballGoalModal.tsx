"use client";

import {
  useEffect,
  useState,
} from "react";

import { X, Goal } from "lucide-react";
import { toast } from "sonner";

// =====================================================
// TYPES
// =====================================================

interface Player {
  id: number;
  name: string;
  jerseyNo?: number | null;
  role?: string | null;
}

interface Team {
  id: number;
  name: string;
  players?: Player[];
}

interface Props {
  open: boolean;

  matchId: number;

  team: Team;

  allPlayers: Player[];

  onClose: () => void;

  onAdded: () => void;
}

// =====================================================
// COMPONENT
// =====================================================

export default function AddFootballGoalModal({
  open,
  matchId,
  team,
  allPlayers,
  onClose,
  onAdded,
}: Props) {
  const [scorerId, setScorerId] =
    useState("");

  const [minute, setMinute] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  // =====================================================
  // RESET
  // =====================================================

  useEffect(() => {
    if (!open) {
      return;
    }

    setScorerId("");
    setMinute("");
  }, [open]);

  // =====================================================
  // SAVE GOAL
  // =====================================================

  async function handleSubmit() {
    if (!scorerId) {
      toast.error(
        "Please select the goal scorer."
      );

      return;
    }

    if (!minute) {
      toast.error(
        "Please enter the goal minute."
      );

      return;
    }

    const minuteNumber =
      Number(minute);

    if (
      !Number.isInteger(minuteNumber) ||
      minuteNumber < 0 ||
      minuteNumber > 120
    ) {
      toast.error(
        "Please enter a valid minute between 0 and 120."
      );

      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `/api/matches/${matchId}/football/events`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            eventType: "GOAL",

            teamId: team.id,

            playerId:
              Number(scorerId),

            minute:
              minuteNumber,
          }),
        }
      );

      // =================================================
      // SAFELY READ RESPONSE
      // =================================================

      const responseText =
        await res.text();

      let data: any = {};

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        console.error(
          "GOAL API returned non-JSON:",
          responseText
        );

        throw new Error(
          "Server returned an invalid response."
        );
      }

      if (!res.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to record goal."
        );
      }

      // =================================================
      // SUCCESS
      // =================================================

      toast.success(
        "Goal recorded successfully."
      );

      onAdded();

      onClose();
    } catch (error) {
      console.error(
        "ADD FOOTBALL GOAL ERROR:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to record goal."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // DON'T SHOW
  // =====================================================

  if (!open) {
    return null;
  }

  // =====================================================
  // SELECTED PLAYER
  // =====================================================

  const selectedPlayer =
    allPlayers.find(
      (player) =>
        String(player.id) ===
        scorerId
    );

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">

      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="flex items-center justify-between border-b px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">

              <Goal
                size={20}
                className="text-green-600"
              />

            </div>

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Add Goal
              </h2>

              <p className="text-sm text-slate-500">
                {team.name}
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>

        </div>

        {/* ================================================= */}
        {/* BODY */}
        {/* ================================================= */}

        <div className="space-y-5 p-6">

          {/* ================================================= */}
          {/* TEAM */}
          {/* ================================================= */}

          <div className="rounded-xl bg-green-50 p-4">

            <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
              Goal for
            </p>

            <p className="mt-1 text-lg font-bold text-green-900">
              {team.name}
            </p>

          </div>

          {/* ================================================= */}
          {/* GOAL SCORER */}
          {/* ================================================= */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Goal Scorer
            </label>

            <select
              value={scorerId}
              onChange={(e) =>
                setScorerId(
                  e.target.value
                )
              }
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
            >

              <option value="">
                Select goal scorer
              </option>

              {allPlayers.map(
                (player) => (
                  <option
                    key={player.id}
                    value={player.id}
                  >

                    {player.jerseyNo !=
                    null
                      ? `#${player.jerseyNo} `
                      : ""}

                    {player.name}

                    {player.role
                      ? ` — ${player.role}`
                      : ""}

                  </option>
                )
              )}

            </select>

            <p className="mt-1 text-xs text-slate-400">
              Select the player who scored the goal.
            </p>

          </div>

          {/* ================================================= */}
          {/* MINUTE */}
          {/* ================================================= */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Goal Minute
            </label>

            <div className="relative">

              <input
                type="number"
                min="0"
                max="120"
                value={minute}
                onChange={(e) =>
                  setMinute(
                    e.target.value
                  )
                }
                disabled={loading}
                placeholder="Example: 24"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-10 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
              />

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                '
              </span>

            </div>

            <p className="mt-1 text-xs text-slate-400">
              Enter the minute when the goal was scored.
            </p>

          </div>

          {/* ================================================= */}
          {/* PREVIEW */}
          {/* ================================================= */}

          {selectedPlayer && minute && (

            <div className="rounded-xl border border-green-100 bg-green-50 p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                Goal Preview
              </p>

              <div className="mt-3 flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white font-bold text-green-700 ring-1 ring-green-200">

                    {selectedPlayer.jerseyNo ??
                      "—"}

                  </div>

                  <div>

                    <p className="font-bold text-green-900">
                      {selectedPlayer.name}
                    </p>

                    {selectedPlayer.role && (
                      <p className="text-xs text-green-700">
                        {selectedPlayer.role}
                      </p>
                    )}

                  </div>

                </div>

                <div className="text-right">

                  <p className="text-2xl">
                    ⚽
                  </p>

                  <p className="text-sm font-bold text-green-700">
                    {minute}'
                  </p>

                </div>

              </div>

            </div>

          )}

          {/* ================================================= */}
          {/* BUTTONS */}
          {/* ================================================= */}

          <div className="flex justify-end gap-3 pt-2">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                loading ||
                !scorerId ||
                !minute
              }
              className="rounded-xl bg-green-600 px-5 py-2.5 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {loading
                ? "Saving..."
                : "Add Goal"}

            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

