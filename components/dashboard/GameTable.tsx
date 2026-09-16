"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";

import AddGameForm from "@/components/forms/AddGameForm";
import EditGameForm from "@/components/forms/EditGameForm";
import DeleteModal from "@/components/ui/DeleteModal";

interface Game {
  id: number;
  name: string;
  category: string;
  teamSize: number;
  venue: string;
  createdAt: string;
}

export default function GameTable() {
  const [games, setGames] = useState<Game[]>([]);
  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);

  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [selectedGame, setSelectedGame] =
    useState<Game | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] =
    useState<number | null>(null);

  useEffect(() => {
    loadGames();
  }, []);

  async function loadGames() {
    try {
      setLoading(true);

      const res = await fetch("/api/games");

      if (!res.ok) {
        throw new Error("Failed to fetch games");
      }

      const data = await res.json();

      setGames(data);
    } catch (error) {
      console.error(error);
      toast.error("Unable to load games.");
    } finally {
      setLoading(false);
    }
  }

  function handleGameAdded() {
    loadGames();
  }

  function editGame(game: Game) {
    setSelectedGame(game);
    setEditOpen(true);
  }

  function openDeleteModal(id: number) {
    setDeleteId(id);
    setDeleteOpen(true);
  }

  async function deleteGame() {
    if (deleteId === null) return;

    try {
      const res = await fetch(
        `/api/games/${deleteId}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        throw new Error("Delete failed");
      }

      toast.success("Game deleted successfully!");

      setDeleteOpen(false);
      setDeleteId(null);

      loadGames();
    } catch (error) {
      console.error(error);

      toast.error(
        "Unable to delete game."
      );
    }
  }

  const filteredGames = games.filter(
    (game) =>
      game.name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      game.category
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      game.venue
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-bold">
            Games
          </h1>

          <p className="mt-1 text-gray-500">
            Manage sports games for the carnival
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Game
        </button>

      </div>

      {/* Statistics */}
      <div className="grid gap-6 md:grid-cols-3">

        <div className="rounded-2xl bg-white p-6 shadow">
          <div className="flex items-center gap-4">

            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <Trophy size={26} />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Total Games
              </p>

              <p className="text-3xl font-bold">
                {games.length}
              </p>
            </div>

          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="text-sm text-gray-500">
            Outdoor Games
          </p>

          <p className="mt-2 text-3xl font-bold">
            {
              games.filter(
                (game) =>
                  game.category === "Outdoor"
              ).length
            }
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="text-sm text-gray-500">
            Indoor Games
          </p>

          <p className="mt-2 text-3xl font-bold">
            {
              games.filter(
                (game) =>
                  game.category === "Indoor"
              ).length
            }
          </p>
        </div>

      </div>

      {/* Search */}
      <div className="relative max-w-md">

        <Search
          size={18}
          className="absolute left-4 top-3.5 text-gray-400"
        />

        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search games..."
          className="w-full rounded-xl border py-3 pl-10 outline-none focus:ring-2 focus:ring-blue-500"
        />

      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow">

        <table className="w-full">

          <thead className="bg-slate-100">

            <tr>
              <th className="p-4 text-left">
                Game
              </th>

              <th className="p-4 text-left">
                Category
              </th>

              <th className="p-4 text-center">
                Team Size
              </th>

              <th className="p-4 text-left">
                Venue
              </th>

              <th className="p-4 text-center">
                Actions
              </th>
            </tr>

          </thead>

          <tbody>

            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-gray-500"
                >
                  Loading games...
                </td>
              </tr>
            ) : filteredGames.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-gray-500"
                >
                  No games found.
                </td>
              </tr>
            ) : (
              filteredGames.map((game) => (
                <tr
                  key={game.id}
                  className="border-b hover:bg-slate-50"
                >

                  <td className="p-4 font-medium">
                    {game.name}
                  </td>

                  <td className="p-4">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                      {game.category}
                    </span>
                  </td>

                  <td className="p-4 text-center">
                    {game.teamSize}
                  </td>

                  <td className="p-4">
                    {game.venue}
                  </td>

                  <td className="p-4">

                    <div className="flex justify-center gap-2">

                      {/* Edit */}
                      <button
                        onClick={() =>
                          editGame(game)
                        }
                        className="rounded-lg bg-green-100 p-2 text-green-700 hover:bg-green-200"
                      >
                        <Pencil size={18} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() =>
                          openDeleteModal(game.id)
                        }
                        className="rounded-lg bg-red-100 p-2 text-red-700 hover:bg-red-200"
                      >
                        <Trash2 size={18} />
                      </button>

                    </div>

                  </td>

                </tr>
              ))
            )}

          </tbody>

        </table>

      </div>

      {/* Add Game */}
      <AddGameForm
        open={open}
        onClose={() => setOpen(false)}
        onGameAdded={handleGameAdded}
      />

      {/* Edit Game */}
      <EditGameForm
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setSelectedGame(null);
        }}
        game={selectedGame}
        onUpdated={loadGames}
      />

      {/* Delete Confirmation */}
      <DeleteModal
        open={deleteOpen}
        title="Delete Game"
        description="Are you sure you want to delete this game? This action cannot be undone."
        onCancel={() => {
          setDeleteOpen(false);
          setDeleteId(null);
        }}
        onConfirm={deleteGame}
      />

    </div>
  );
}