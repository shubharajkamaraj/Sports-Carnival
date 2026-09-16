"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

interface Team {
  id: number;
  name: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onPlayerAdded: () => void;
}

export default function AddPlayerForm({
  open,
  onClose,
  onPlayerAdded,
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

  async function loadTeams() {
    try {
      const res = await fetch("/api/teams");
      const data = await res.json();
      setTeams(data);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (
      !form.name ||
      !form.age ||
      !form.position ||
      !form.jerseyNumber ||
      !form.teamId
    ) {
      toast.error("Please fill all fields.");
      return;
    }

    const loading = toast.loading("Adding player...");

    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error();
      }

      toast.dismiss(loading);

      toast.success("Player added successfully!");

      setForm({
        name: "",
        age: "",
        gender: "Male",
        jerseyNumber: "",
        position: "",
        teamId: "",
      });

      onPlayerAdded();
      onClose();

    } catch (error) {
      console.error(error);

      toast.dismiss(loading);

      toast.error("Failed to add player.");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">

      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">

        <div className="mb-6 flex items-center justify-between">

          <h2 className="text-2xl font-bold">
            Add Player
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
            placeholder="Player Name"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
            className="w-full rounded-lg border p-3"
          />

          <div className="grid grid-cols-2 gap-4">

            <input
              type="number"
              placeholder="Age"
              value={form.age}
              onChange={(e) =>
                setForm({
                  ...form,
                  age: e.target.value,
                })
              }
              className="rounded-lg border p-3"
            />

            <select
              value={form.gender}
              onChange={(e) =>
                setForm({
                  ...form,
                  gender: e.target.value,
                })
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
              placeholder="Jersey Number"
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
              placeholder="Position"
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
            <option value="">
              Select Team
            </option>

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
            Add Player
          </button>

        </form>

      </div>

    </div>
  );
}