"use client";

import { useState } from "react";
import { toast } from "sonner";

interface CricketPlayer {
  id: number;
  name: string;
  jerseyNumber: number;
  position: string;
}

interface CricketTeam {
  id: number;
  name: string;
  playerList: CricketPlayer[];
}

interface Match {
  id: number;

  team1: CricketTeam;
  team2: CricketTeam;

  score: {
    strikerId?: number | null;
    nonStrikerId?: number | null;
    bowlerId?: number | null;
  } | null;
}

interface CricketPlayersProps {
  match: Match;
  onUpdated?: () => void;
}

export default function CricketPlayers({
  match,
  onUpdated,
}: CricketPlayersProps) {
  const [strikerId, setStrikerId] = useState<number | "">(
    match.score?.strikerId ?? ""
  );

  const [nonStrikerId, setNonStrikerId] = useState<
    number | ""
  >(match.score?.nonStrikerId ?? "");

  const [bowlerId, setBowlerId] = useState<number | "">(
    match.score?.bowlerId ?? ""
  );

  const [saving, setSaving] = useState(false);

  /*
   * For now:
   * Team 1 is batting
   * Team 2 is bowling
   *
   * We will make innings switching dynamic
   * in the next cricket step.
   */
  const battingTeam = match.team1;
  const bowlingTeam = match.team2;

  async function savePlayers() {
    if (!strikerId) {
      toast.error("Please select the striker.");
      return;
    }

    if (!nonStrikerId) {
      toast.error("Please select the non-striker.");
      return;
    }

    if (!bowlerId) {
      toast.error("Please select the bowler.");
      return;
    }

    if (strikerId === nonStrikerId) {
      toast.error(
        "Striker and non-striker must be different."
      );
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(
        `/api/matches/${match.id}/live/cricket/players`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            strikerId: Number(strikerId),
            nonStrikerId: Number(nonStrikerId),
            bowlerId: Number(bowlerId),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Failed to update cricket players"
        );
      }

      toast.success(
        "Striker, non-striker and bowler updated."
      );

      onUpdated?.();
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update players."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">
          Cricket Players
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Select the current batsmen and bowler.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* STRIKER */}
        <PlayerSelect
          label="🏏 Striker"
          value={strikerId}
          onChange={setStrikerId}
          players={battingTeam.playerList}
          disabled={saving}
        />

        {/* NON STRIKER */}
        <PlayerSelect
          label="🏏 Non-Striker"
          value={nonStrikerId}
          onChange={setNonStrikerId}
          players={battingTeam.playerList}
          disabled={saving}
        />

        {/* BOWLER */}
        <PlayerSelect
          label="🎯 Bowler"
          value={bowlerId}
          onChange={setBowlerId}
          players={bowlingTeam.playerList}
          disabled={saving}
        />
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={savePlayers}
          disabled={saving}
          className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : "Save Players"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------ */
/* PLAYER SELECT */
/* ------------------------------------------------ */

function PlayerSelect({
  label,
  value,
  onChange,
  players,
  disabled,
}: {
  label: string;
  value: number | "";
  onChange: (value: number | "") => void;
  players: CricketPlayer[];
  disabled: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </label>

      <select
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const selectedValue = e.target.value;

          onChange(
            selectedValue
              ? Number(selectedValue)
              : ""
          );
        }}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
      >
        <option value="">
          Select player
        </option>

        {players.map((player) => (
          <option
            key={player.id}
            value={player.id}
          >
            #{player.jerseyNumber} {player.name}
          </option>
        ))}
      </select>
    </div>
  );
}