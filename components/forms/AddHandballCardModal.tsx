"use client";

import { useEffect, useState } from "react";
import { X, Square } from "lucide-react";
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

  cardType: "YELLOW_CARD" | "RED_CARD";

  onClose: () => void;

  onAdded: () => void;
}

// =====================================================
// COMPONENT
// =====================================================

export default function AddHandballCardModal({
  open,
  matchId,
  team,
  allPlayers,
  cardType,
  onClose,
  onAdded,
}: Props) {
  const [playerId, setPlayerId] = useState("");

  const [minute, setMinute] = useState("");

  const [loading, setLoading] = useState(false);

  // =====================================================
  // RESET
  // =====================================================

  useEffect(() => {
    if (!open) return;

    setPlayerId("");
    setMinute("");
  }, [open, cardType]);

  // =====================================================
  // SUBMIT CARD
  // =====================================================

  async function handleSubmit() {
    if (!playerId) {
      toast.error("Please select a player.");
      return;
    }

    if (!minute) {
      toast.error("Please enter the card minute.");
      return;
    }

    const minuteNumber = Number(minute);

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

      // =================================================
      // HANDBALL EVENT API
      // =================================================

      const response = await fetch(
        `/api/matches/${matchId}/handball/event`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            eventType: cardType,

            teamId: team.id,

            playerId: Number(playerId),

            minute: minuteNumber,
          }),
        }
      );

      // =================================================
      // RESPONSE
      // =================================================

      const responseText = await response.text();

      let data: any = {};

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        throw new Error(
          "Server returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to record handball card."
        );
      }

      // =================================================
      // SUCCESS
      // =================================================

      toast.success(
        cardType === "YELLOW_CARD"
          ? "Yellow card recorded."
          : "Red card recorded."
      );

      // Refresh parent match page
      onAdded();

      // Close modal
      onClose();
    } catch (error) {
      console.error(
        "ADD HANDBALL CARD ERROR:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to record handball card."
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

  const selectedPlayer = allPlayers.find(
    (player) =>
      String(player.id) === playerId
  );

  const isYellow =
    cardType === "YELLOW_CARD";

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">

      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="flex items-center justify-between border-b px-6 py-5">

          <div className="flex items-center gap-3">

            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                isYellow
                  ? "bg-yellow-100"
                  : "bg-red-100"
              }`}
            >
              <Square
                size={20}
                className={
                  isYellow
                    ? "fill-yellow-400 text-yellow-500"
                    : "fill-red-500 text-red-600"
                }
              />
            </div>

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                {isYellow
                  ? "Yellow Card"
                  : "Red Card"}
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

          {/* TEAM */}

          <div
            className={`rounded-xl p-4 ${
              isYellow
                ? "bg-yellow-50"
                : "bg-red-50"
            }`}
          >
            <p
              className={`text-xs font-semibold uppercase tracking-wide ${
                isYellow
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              Card for
            </p>

            <p
              className={`mt-1 text-lg font-bold ${
                isYellow
                  ? "text-yellow-900"
                  : "text-red-900"
              }`}
            >
              {team.name}
            </p>
          </div>

          {/* PLAYER */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Player
            </label>

            <select
              value={playerId}
              onChange={(e) =>
                setPlayerId(e.target.value)
              }
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
            >

              <option value="">
                Select player
              </option>

              {allPlayers.map((player) => (
                <option
                  key={player.id}
                  value={player.id}
                >
                  {player.jerseyNo != null
                    ? `#${player.jerseyNo} `
                    : ""}
                  {player.name}
                  {player.role
                    ? ` — ${player.role}`
                    : ""}
                </option>
              ))}

            </select>

          </div>

          {/* MINUTE */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Card Minute
            </label>

            <div className="relative">

              <input
                type="number"
                min="0"
                max="120"
                value={minute}
                onChange={(e) =>
                  setMinute(e.target.value)
                }
                disabled={loading}
                placeholder="Example: 15"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-10 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
              />

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                '
              </span>

            </div>

          </div>

          {/* PREVIEW */}

          {selectedPlayer && minute && (

            <div
              className={`rounded-xl border p-4 ${
                isYellow
                  ? "border-yellow-100 bg-yellow-50"
                  : "border-red-100 bg-red-50"
              }`}
            >

              <p
                className={`text-xs font-semibold uppercase tracking-wide ${
                  isYellow
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                Card Preview
              </p>

              <div className="mt-3 flex items-center justify-between">

                {/* PLAYER */}

                <div className="flex items-center gap-3">

                  <div
                    className={`flex h-10 w-8 items-center justify-center rounded-md font-bold text-white ${
                      isYellow
                        ? "bg-yellow-400"
                        : "bg-red-500"
                    }`}
                  >
                    {selectedPlayer.jerseyNo ?? "—"}
                  </div>

                  <div>

                    <p className="font-bold text-slate-900">
                      {selectedPlayer.name}
                    </p>

                    {selectedPlayer.role && (
                      <p className="text-xs text-slate-500">
                        {selectedPlayer.role}
                      </p>
                    )}

                  </div>

                </div>

                {/* CARD */}

                <div className="text-right">

                  <div
                    className={`mx-auto h-8 w-6 rounded-sm ${
                      isYellow
                        ? "bg-yellow-400"
                        : "bg-red-500"
                    }`}
                  />

                  <p
                    className={`mt-1 text-sm font-bold ${
                      isYellow
                        ? "text-yellow-700"
                        : "text-red-700"
                    }`}
                  >
                    {minute}'
                  </p>

                </div>

              </div>

            </div>
          )}

          {/* BUTTONS */}

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
                !playerId ||
                !minute
              }
              className={`rounded-xl px-5 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                isYellow
                  ? "bg-yellow-500 hover:bg-yellow-600"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {loading
                ? "Saving..."
                : isYellow
                  ? "Add Yellow Card"
                  : "Add Red Card"}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}