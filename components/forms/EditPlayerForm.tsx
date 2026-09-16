"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

interface Team {
  id: number;
  name: string;
}

interface Player {
  id: number;
  name: string;
  age: number;
  gender: string;
  jerseyNumber: number;
  position: string;
  teamId: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  player: Player | null;
  onUpdated: () => void;
}

export default function EditPlayerForm({
  open,
  onClose,
  player,
  onUpdated,
}: Props) {
  const [teams, setTeams] = useState<Team[]>([]);

  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "Male",
    jerseyNumber: "",
    position: "",
    teamId: "",
  });

  useEffect(() => {
    if (open) {
      loadTeams();
    }
  }, [open]);

  useEffect(() => {
    if (player) {
      setForm({
        name: player.name,
        age: String(player.age),
        gender: player.gender,
        jerseyNumber: String(player.jerseyNumber),
        position: player.position,
        teamId: String(player.teamId),
      });
    }
  }, [player]);

  async function loadTeams() {
    const res = await fetch("/api/teams");
    const data = await res.json();
    setTeams(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!player) return;

    const loading = toast.loading("Updating player...");

    try {
      const res = await fetch(`/api/players/${player.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error();
      }

      toast.dismiss(loading);
      toast.success("Player updated successfully!");

      onUpdated();
      onClose();
    } catch (error) {
      console.error(error);

      toast.dismiss(loading);
      toast.error("Failed to update player.");
    }
  }

  if (!open || !player) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">

      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            Edit Player
          </h2>

          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          <input
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            className="w-full rounded-lg border p-3"
          />

          <div className="grid grid-cols-2 gap-4">

            <input
              type="number"
              value={form.age}
              onChange={(e) =>
                setForm({ ...form, age: e.target.value })
              }
              className="rounded-lg border p-3"
            />

            <select
              value={form.gender}
              onChange={(e) =>
                setForm({ ...form, gender: e.target.value })
              }
              className="rounded-lg border p-3"
            >
              <option>Male</option>
              <option>Female</option>
            </select>

          </div>

          <div className="grid grid-cols-2 gap-4">

            <input
              type="number"
              value={form.jerseyNumber}
              onChange={(e) =>
                setForm({
                  ...form,
                  jerseyNumber: e.target.value,
                })
              }
              className="rounded-lg border p-3"
            />

            <input
              value={form.position}
              onChange={(e) =>
                setForm({
                  ...form,
                  position: e.target.value,
                })
              }
              className="rounded-lg border p-3"
            />

          </div>

          <select
            value={form.teamId}
            onChange={(e) =>
              setForm({
                ...form,
                teamId: e.target.value,
              })
            }
            className="w-full rounded-lg border p-3"
          >
            {teams.map((team) => (
              <option
                key={team.id}
                value={team.id}
              >
                {team.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 py-3 text-white hover:bg-blue-700"
          >
            Update Player
          </button>

        </form>

      </div>

    </div>
  );
}