"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

interface Game {
  id: number;
  name: string;
  category: string;
  teamSize: number;
  venue: string;
  createdAt?: string;
}

interface EditGameFormProps {
  open: boolean;
  onClose: () => void;
  game: Game | null;
  onUpdated: () => void;
}

export default function EditGameForm({
  open,
  onClose,
  game,
  onUpdated,
}: EditGameFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [venue, setVenue] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (game) {
      setName(game.name);
      setCategory(game.category);
      setTeamSize(String(game.teamSize));
      setVenue(game.venue);
    }
  }, [game]);

  if (!open || !game) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name || !category || !teamSize || !venue) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (Number(teamSize) <= 0) {
      toast.error("Team size must be greater than 0.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`/api/games/${game?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          category,
          teamSize: Number(teamSize),
          venue,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Failed to update game"
        );
      }

      toast.success("Game updated successfully!");

      onUpdated();
      onClose();
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update game."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b p-6">
          <div>
            <h2 className="text-2xl font-bold">
              Edit Game
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Update game information
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <X size={22} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >
          {/* Game Name */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Game Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Category
            </label>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">
                Select category
              </option>

              <option value="Outdoor">
                Outdoor
              </option>

              <option value="Indoor">
                Indoor
              </option>
            </select>
          </div>

          {/* Team Size */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Team Size
            </label>

            <input
              type="number"
              min="1"
              value={teamSize}
              onChange={(e) => setTeamSize(e.target.value)}
              className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Venue */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Venue
            </label>

            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border px-5 py-3 font-medium hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Game"}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}