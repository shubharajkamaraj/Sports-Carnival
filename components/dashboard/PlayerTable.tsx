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
    player.name.toLowerCase().includes(search.toLowerCase())
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
    <div className="space-y-6">

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-bold">
            Players
          </h1>

          <p className="text-gray-500">
            Manage players
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Player
        </button>

      </div>

      <div className="relative max-w-md">

        <Search
          size={18}
          className="absolute left-4 top-3.5 text-gray-400"
        />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Player..."
          className="w-full rounded-xl border py-3 pl-10"
        />

      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow">

        <table className="w-full">

          <thead className="bg-slate-100">

            <tr>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-center">Age</th>
              <th className="p-4 text-center">Gender</th>
              <th className="p-4 text-center">Jersey</th>
              <th className="p-4 text-center">Position</th>
              <th className="p-4 text-center">Team</th>
              <th className="p-4 text-center">Action</th>
            </tr>

          </thead>

          <tbody>

            {loading ? (

              <tr>
                <td colSpan={7} className="p-6 text-center">
                  Loading players...
                </td>
              </tr>

            ) : filteredPlayers.length === 0 ? (

              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  No players found.
                </td>
              </tr>

            ) : (

              filteredPlayers.map((player) => (

                <tr
                  key={player.id}
                  className="border-b hover:bg-slate-50"
                >
                  <td className="p-4">{player.name}</td>

                  <td className="p-4 text-center">
                    {player.age}
                  </td>

                  <td className="p-4 text-center">
                    {player.gender}
                  </td>

                  <td className="p-4 text-center">
                    #{player.jerseyNumber}
                  </td>

                  <td className="p-4 text-center">
                    {player.position}
                  </td>

                  <td className="p-4 text-center">
                    {player.team.name}
                  </td>

                  <td className="p-4">

                    <div className="flex justify-center gap-2">

                      <button  onClick={() => editPlayer(player)} className="rounded bg-green-100 p-2 hover:bg-green-200">
                        <Pencil size={18} />
                      </button>

                      <button  onClick={() => {
                        setDeleteId(player.id);
                        setDeleteOpen(true);
                      }} className="rounded bg-red-100 p-2 hover:bg-red-200">
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

      <AddPlayerForm
        open={open}
        onClose={() => setOpen(false)}
        onPlayerAdded={loadPlayers}
      />
<EditPlayerForm
  open={editOpen}
  onClose={() => setEditOpen(false)}
  player={selectedPlayer}
  onUpdated={loadPlayers}
/>
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
  );
}