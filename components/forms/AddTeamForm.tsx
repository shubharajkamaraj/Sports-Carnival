"use client";

import { useState } from "react";
import { X, ChevronDown, Check, Users } from "lucide-react";
import { toast } from "sonner";
import { players } from "@/data/players";

interface Props {
  open: boolean;
  onClose: () => void;
  onTeamAdded: () => void;
}

export default function AddTeamForm({
  open,
  onClose,
  onTeamAdded,
}: Props) {
  const [name, setName] = useState("");
  const [captain, setCaptain] = useState("");

  const [selectedPlayerIds, setSelectedPlayerIds] =
    useState<number[]>([]);

  const [playerDropdownOpen, setPlayerDropdownOpen] =
    useState(false);

  const [loading, setLoading] = useState(false);

  if (!open) {
    return null;
  }

  // =====================================================
  // SELECT / UNSELECT PLAYER
  // =====================================================

  function togglePlayer(playerId: number) {
    setSelectedPlayerIds((current) => {
      if (current.includes(playerId)) {
        // Remove player
        const updated = current.filter(
          (id) => id !== playerId
        );

        // If captain was this player, remove captain
        const selectedPlayer = players.find(
          (player) => player.id === playerId
        );

        if (
          selectedPlayer &&
          captain === selectedPlayer.name
        ) {
          setCaptain("");
        }

        return updated;
      }

      // Add player
      return [...current, playerId];
    });
  }

  // =====================================================
  // SELECT ALL
  // =====================================================

  function selectAllPlayers() {
    setSelectedPlayerIds(
      players.map((player) => player.id)
    );
  }

  // =====================================================
  // CLEAR ALL
  // =====================================================

  function clearAllPlayers() {
    setSelectedPlayerIds([]);
    setCaptain("");
  }

  // =====================================================
  // SUBMIT
  // =====================================================

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Team name is required.");
      return;
    }


    if (selectedPlayerIds.length === 0) {
      toast.error(
        "Please select at least one player."
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          captain: captain || null,
          playerIds: selectedPlayerIds,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Failed to create team"
        );
      }

      toast.success(
        "Team added successfully!"
      );

      // Reset form
      setName("");
      setCaptain("");
      setSelectedPlayerIds([]);
      setPlayerDropdownOpen(false);

      onTeamAdded();
      onClose();
    } catch (error) {
      console.error(
        "ADD TEAM ERROR:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add team."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // SELECTED PLAYERS
  // =====================================================

  const selectedPlayers = players.filter(
    (player) =>
      selectedPlayerIds.includes(player.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Add Team
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Create a team and select its players
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* ================================================= */}
        {/* FORM */}
        {/* ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >

          {/* TEAM NAME */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Team Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="e.g. Team Alpha"
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

         

          {/* ================================================= */}
          {/* PLAYER DROPDOWN */}
          {/* ================================================= */}

          <div className="relative">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Players
            </label>

            <button
              type="button"
              onClick={() =>
                setPlayerDropdownOpen(
                  !playerDropdownOpen
                )
              }
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left outline-none transition hover:border-blue-400 focus:border-blue-500"
            >
              <div className="flex items-center gap-3">
                <Users
                  size={18}
                  className="text-blue-600"
                />

                <span className="text-slate-700">
                  {selectedPlayerIds.length === 0
                    ? "Select players"
                    : `${selectedPlayerIds.length} player${
                        selectedPlayerIds.length >
                        1
                          ? "s"
                          : ""
                      } selected`}
                </span>
              </div>

              <ChevronDown
                size={18}
                className="text-slate-400"
              />
            </button>

            {/* DROPDOWN */}

            {playerDropdownOpen && (
              <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">

                {/* ACTIONS */}

                <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3">
                  <span className="text-xs font-medium text-slate-500">
                    {selectedPlayerIds.length} selected
                  </span>

                  <div className="flex gap-3 text-xs font-medium">
                    <button
                      type="button"
                      onClick={selectAllPlayers}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Select All
                    </button>

                    <button
                      type="button"
                      onClick={clearAllPlayers}
                      className="text-red-500 hover:text-red-600"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* PLAYER LIST */}

                <div className="max-h-64 overflow-y-auto">
                  {players.map((player) => {
                    const selected =
                      selectedPlayerIds.includes(
                        player.id
                      );

                    return (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() =>
                          togglePlayer(
                            player.id
                          )
                        }
                        className={`flex w-full items-center justify-between px-4 py-3 text-left transition ${
                          selected
                            ? "bg-blue-50"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">

                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${
                              selected
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {player.jerseyNo}
                          </div>

                          <div>
                            <p className="font-medium text-slate-800">
                              {player.name}
                            </p>

                            <p className="text-xs text-slate-400">
                              Jersey #{player.jerseyNo}
                            </p>
                          </div>

                        </div>

                        {selected && (
                          <Check
                            size={18}
                            className="text-blue-600"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ================================================= */}
          {/* SELECTED PLAYER PREVIEW */}
          {/* ================================================= */}

          {selectedPlayers.length > 0 && (
            <div className="rounded-xl bg-slate-50 p-4">

              <p className="mb-3 text-sm font-semibold text-slate-700">
                Selected Players
              </p>

              <div className="flex flex-wrap gap-2">
                {selectedPlayers.map(
                  (player) => (
                    <span
                      key={player.id}
                      className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm"
                    >
                      #{player.jerseyNo}{" "}
                      {player.name}
                    </span>
                  )
                )}
              </div>

            </div>
          )}

          {/* ================================================= */}
          {/* CAPTAIN */}
          {/* ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Captain
            </label>

            <select
              value={captain}
              onChange={(e) =>
                setCaptain(e.target.value)
              }
              disabled={
                selectedPlayers.length === 0
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            >
              <option value="">
                Select captain
              </option>

              {selectedPlayers.map(
                (player) => (
                  <option
                    key={player.id}
                    value={player.name}
                  >
                    {player.name} - #
                    {player.jerseyNo}
                  </option>
                )
              )}
            </select>
          </div>

          {/* ================================================= */}
          {/* BUTTONS */}
          {/* ================================================= */}

          <div className="flex justify-end gap-3 border-t pt-5">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : "Add Team"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}