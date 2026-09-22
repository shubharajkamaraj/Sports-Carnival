"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import AddPlayerForm from "@/components/forms/AddPlayerForm";
import EditPlayerForm from "@/components/forms/EditPlayerForm";
import DeleteModal from "@/components/ui/DeleteModal";
import { toast } from "sonner";

interface Player {
  id: number;
  name: string;
  age: number;
  gender: string;
  jerseyNumber: number;
  position: string;
  teamId: number;

  team: {
    id: number;
    name: string;
  };
}

export default function PlayerTable() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);

  const [selectedPlayer, setSelectedPlayer] =
    useState<Player | null>(null);

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [deleteId, setDeleteId] =
    useState<number | null>(null);

  useEffect(() => {
    loadPlayers();
  }, []);

  async function loadPlayers() {
    try {
      setLoading(true);

      const res = await fetch("/api/players");

      if (!res.ok) {
        throw new Error("Failed to load players");
      }

      const data = await res.json();
      setPlayers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const filteredPlayers = players.filter((player) =>
    player.name
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function editPlayer(player: Player) {
    setSelectedPlayer(player);
    setEditOpen(true);
  }

  async function deletePlayer() {
    if (!deleteId) return;

    const loading = toast.loading(
      "Deleting player..."
    );

    try {
      const res = await fetch(
        `/api/players/${deleteId}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        throw new Error();
      }

      toast.dismiss(loading);

      toast.success(
        "Player deleted successfully!"
      );

      loadPlayers();

      setDeleteOpen(false);
      setDeleteId(null);

    } catch (error) {

      console.error(error);

      toast.dismiss(loading);

      toast.error(
        "Unable to delete player."
      );
    }
  }

  return (
    <div className="min-h-screen w-full bg-transparent p-6 text-white">
      <div className="space-y-6">

        {/* Header */}

        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-3xl font-bold text-white">
              Players
            </h1>

            <p className="mt-1 text-sm text-slate-300">
              Manage players
            </p>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-500"
          >
            <Plus size={18} />
            Add Player
          </button>

        </div>

        {/* Search */}

        <div className="relative max-w-md">

          <Search
            size={18}
            className="absolute left-4 top-3.5 text-slate-400"
          />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search Player..."
            className="w-full rounded-xl border border-white/10 bg-white/10 py-3 pl-10 pr-4 text-white placeholder:text-slate-400 outline-none backdrop-blur-md transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30"
          />

        </div>

        {/* Table */}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-lg backdrop-blur-md">

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="border-b border-white/10 bg-slate-950/40">

                <tr>

                  <th className="p-4 text-left text-sm font-semibold text-slate-300">
                    Name
                  </th>

                  <th className="p-4 text-center text-sm font-semibold text-slate-300">
                    Team
                  </th>

                  <th className="p-4 text-center text-sm font-semibold text-slate-300">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-white/10">

                {loading ? (

                  <tr>
                    <td
                      colSpan={7}
                      className="p-6 text-center text-slate-400"
                    >
                      Loading players...
                    </td>
                  </tr>

                ) : filteredPlayers.length === 0 ? (

                  <tr>
                    <td
                      colSpan={7}
                      className="p-6 text-center text-slate-400"
                    >
                      No players found.
                    </td>
                  </tr>

                ) : (

                  filteredPlayers.map((player) => (

                    <tr
                      key={player.id}
                      className="border-b border-white/10 transition hover:bg-white/5"
                    >

                      <td className="p-4 font-medium text-white">
                        {player.name}
                      </td>

                      <td className="p-4 text-center text-slate-200">
                        {player.team.name}
                      </td>

                      <td className="p-4">

                        <div className="flex justify-center gap-2">

                          {/* Edit */}

                          <button
                            onClick={() =>
                              editPlayer(player)
                            }
                            className="rounded-lg bg-emerald-500/15 p-2 text-emerald-300 ring-1 ring-emerald-400/20 transition hover:bg-emerald-500/25"
                          >
                            <Pencil size={18} />
                          </button>

                          {/* Delete */}

                          <button
                            onClick={() => {
                              setDeleteId(
                                player.id
                              );
                              setDeleteOpen(true);
                            }}
                            className="rounded-lg bg-red-500/15 p-2 text-red-300 ring-1 ring-red-400/20 transition hover:bg-red-500/25"
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

        </div>

        {/* Add Player */}

        <AddPlayerForm
          open={open}
          onClose={() => setOpen(false)}
          onPlayerAdded={loadPlayers}
        />

        {/* Edit Player */}

        <EditPlayerForm
          open={editOpen}
          onClose={() =>
            setEditOpen(false)
          }
          player={selectedPlayer}
          onUpdated={loadPlayers}
        />

        {/* Delete Modal */}

        <DeleteModal
          open={deleteOpen}
          title="Delete Player"
          description="Are you sure you want to delete this player? This action cannot be undone."
          onCancel={() => {
            setDeleteOpen(false);
            setDeleteId(null);
          }}
          onConfirm={deletePlayer}
        />

      </div>
    </div>
  );
}