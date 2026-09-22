"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Pencil,
  Trash2,
  Search,
  Plus,
  Users,
  Trophy,
  Gamepad2,
} from "lucide-react";
import { toast } from "sonner";

import StatsCard from "./StatsCard";
import AddTeamForm from "@/components/forms/AddTeamForm";
import EditTeamForm from "@/components/forms/EditTeamForm";
import DeleteModal from "@/components/ui/DeleteModal";

import type { Team } from "@/types/team";

// =====================================================
// TEAM LOGOS
// =====================================================

const TEAM_LOGOS: Record<string, string> = {
  "victory warriors": "/team-logos/victory-warriors.png",
  "faith strikers": "/team-logos/faith-strikers.png",
  "christ kingdom": "/team-logos/christ-kingdom.png",
  "hope warriors": "/team-logos/hope-warriors.png",
};

// =====================================================
// GET TEAM LOGO
// =====================================================

function getTeamLogo(teamName: string) {
  return TEAM_LOGOS[teamName.trim().toLowerCase()];
}

export default function TeamTable() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [loading, setLoading] = useState(true);

  const [selectedTeam, setSelectedTeam] =
    useState<Team | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] =
    useState<number | null>(null);

  // =====================================================
  // LOAD TEAMS
  // =====================================================

  useEffect(() => {
    loadTeams();
  }, []);

  async function loadTeams() {
    try {
      setLoading(true);

      const res = await fetch("/api/teams", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Failed to load teams"
        );
      }

      setTeams(data);
    } catch (error) {
      console.error("LOAD TEAMS ERROR:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load teams."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // TEAM ADDED
  // =====================================================

  function handleTeamAdded() {
    loadTeams();
    setOpen(false);
  }

  // =====================================================
  // EDIT TEAM
  // =====================================================

  function handleEdit(team: Team) {
    setSelectedTeam(team);
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setSelectedTeam(null);
  }

  // =====================================================
  // DELETE TEAM
  // =====================================================

  function openDelete(teamId: number) {
    setDeleteId(teamId);
    setDeleteOpen(true);
  }

  function closeDelete() {
    setDeleteOpen(false);
    setDeleteId(null);
  }

  async function deleteTeam() {
    if (deleteId === null) {
      return;
    }

    const loadingToast =
      toast.loading("Deleting team...");

    try {
      const res = await fetch(
        `/api/teams/${deleteId}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Failed to delete team"
        );
      }

      toast.dismiss(loadingToast);

      toast.success(
        "Team deleted successfully!"
      );

      closeDelete();

      await loadTeams();
    } catch (error) {
      console.error(
        "DELETE TEAM ERROR:",
        error
      );

      toast.dismiss(loadingToast);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to delete team."
      );
    }
  }

  // =====================================================
  // SEARCH
  // =====================================================

  const searchText =
    search.trim().toLowerCase();

  const filteredTeams = teams.filter(
    (team) => {
      return (
        team.name
          .toLowerCase()
          .includes(searchText) ||
        (team.captain ?? "")
          .toLowerCase()
          .includes(searchText) ||
        team.game
          .toLowerCase()
          .includes(searchText)
      );
    }
  );

  // =====================================================
  // STATS
  // =====================================================

  const totalPlayers = teams.reduce(
    (total, team) =>
      total +
      (Array.isArray(team.players)
        ? team.players.length
        : team.playerIds.length),
    0
  );

  const totalGames = new Set(
    teams.map((team) => team.game)
  ).size;

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen w-full bg-transparent p-6 text-white">
      <div className="space-y-6">

        {/* ================================================= */}
        {/* STATS */}
        {/* ================================================= */}

        <div className="grid gap-4 md:grid-cols-3">

          <StatsCard
            title="Total Teams"
            value={teams.length}
            icon={<Users size={23} />}
            color="bg-blue-600"
          />

          <StatsCard
            title="Total Players"
            value={totalPlayers}
            icon={<Trophy size={23} />}
            color="bg-orange-500"
          />

          <StatsCard
            title="Games"
            value={totalGames}
            icon={<Gamepad2 size={23} />}
            color="bg-green-600"
          />

        </div>

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Teams
            </h1>

            <p className="mt-1 text-sm text-slate-300">
              Manage tournament teams and players
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-500 active:scale-[0.98]"
          >
            <Plus size={17} />
            Add Team
          </button>

        </div>

        {/* ================================================= */}
        {/* SEARCH */}
        {/* ================================================= */}

        <div className="relative max-w-sm">

          <Search
            size={17}
            className="absolute left-3.5 top-3 text-slate-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search team, captain or game..."
            className="w-full rounded-xl border border-white/10 bg-white/10 py-2.5 pl-10 pr-3 text-sm text-white shadow-lg outline-none backdrop-blur-md transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/20"
          />

        </div>

        {/* ================================================= */}
        {/* LOADING */}
        {/* ================================================= */}

        {loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-[390px] animate-pulse rounded-2xl border border-white/10 bg-white/10 shadow-lg backdrop-blur-md"
              />
            ))}

          </div>
        )}

        {/* ================================================= */}
        {/* EMPTY */}
        {/* ================================================= */}

        {!loading &&
          filteredTeams.length === 0 && (
            <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/10 shadow-lg backdrop-blur-md">

              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/10">

                <Users
                  size={27}
                  className="text-slate-400"
                />

              </div>

              <p className="font-semibold text-slate-200">
                {search
                  ? "No teams match your search."
                  : "No teams found."}
              </p>

              {!search && (
                <p className="mt-1 text-xs text-slate-400">
                  Add your first tournament team.
                </p>
              )}

            </div>
          )}

        {/* ================================================= */}
        {/* TEAM CARDS */}
        {/* ================================================= */}

        {!loading &&
          filteredTeams.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {filteredTeams.map((team) => {
                const logo =
                  getTeamLogo(team.name);

                const playerCount =
                  Array.isArray(team.players)
                    ? team.players.length
                    : team.playerIds.length;

                return (
                  <div
                    key={team.id}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-lg backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white/[0.12] hover:shadow-xl"
                  >

                    {/* ================================================= */}
                    {/* TOP ACCENT */}
                    {/* ================================================= */}

                    <div className="h-1 bg-gradient-to-r from-blue-600 via-yellow-500 to-blue-600" />

                    {/* ================================================= */}
                    {/* LOGO */}
                    {/* ================================================= */}

                    <div className="relative flex h-[145px] items-center justify-center overflow-hidden bg-slate-950/70">

                      {/* Background glow */}

                      <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-2xl" />

                      {logo ? (
                        <div className="relative h-[115px] w-[115px] transition duration-300 group-hover:scale-105">

                          <Image
                            src={logo}
                            alt={`${team.name} logo`}
                            fill
                            sizes="115px"
                            className="object-contain"
                          />

                        </div>
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/20 bg-blue-600 text-3xl font-black text-white">

                          {team.name
                            .charAt(0)
                            .toUpperCase()}

                        </div>
                      )}

                    </div>

                    {/* ================================================= */}
                    {/* TEAM INFORMATION */}
                    {/* ================================================= */}

                    <div className="p-4">

                      {/* TEAM NAME */}

                      <div className="text-center">

                        <h2 className="truncate text-lg font-black uppercase tracking-wide text-white">
                          {team.name}
                        </h2>

                        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                          Team #
                          {String(team.id).padStart(
                            2,
                            "0"
                          )}
                        </p>

                      </div>

                      {/* DIVIDER */}

                      <div className="my-3 h-px bg-white/10" />

                      {/* DETAILS */}

                      <div className="grid grid-cols-2 gap-2">

                        {/* CAPTAIN */}

                        <div className="min-w-0 rounded-xl border border-white/10 bg-white/5 p-2.5">

                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            Captain
                          </p>

                          <p className="mt-0.5 truncate text-xs font-semibold text-slate-200">
                            {team.captain ||
                              "Not assigned"}
                          </p>

                        </div>

                        {/* PLAYERS */}

                        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">

                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            Players
                          </p>

                          <div className="mt-0.5 flex items-center gap-1.5">

                            <Users
                              size={14}
                              className="text-blue-300"
                            />

                            <span className="text-xs font-semibold text-slate-200">
                              {playerCount}
                            </span>

                          </div>

                        </div>

                      </div>

                      {/* GAME */}

                      <div className="mt-2.5 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-2.5 py-2">

                        <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                          Game
                        </span>

                        <span className="max-w-[100px] truncate rounded-full bg-blue-500/15 px-2 py-1 text-[10px] font-bold text-blue-200 ring-1 ring-blue-400/20">
                          {team.game}
                        </span>

                      </div>

                      {/* ================================================= */}
                      {/* ACTIONS */}
                      {/* ================================================= */}

                      <div className="mt-3 grid grid-cols-2 gap-2">

                        {/* EDIT */}

                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(team)
                          }
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-500/15 px-2 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/25"
                        >

                          <Pencil size={14} />

                          Edit

                        </button>

                        {/* DELETE */}

                        <button
                          type="button"
                          onClick={() =>
                            openDelete(team.id)
                          }
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-400/20 bg-red-500/15 px-2 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/25"
                        >

                          <Trash2 size={14} />

                          Delete

                        </button>

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        {/* ================================================= */}
        {/* ADD TEAM */}
        {/* ================================================= */}

        <AddTeamForm
          open={open}
          onClose={() => setOpen(false)}
          onTeamAdded={handleTeamAdded}
        />

        {/* ================================================= */}
        {/* EDIT TEAM */}
        {/* ================================================= */}

        <EditTeamForm
          open={editOpen}
          onClose={closeEdit}
          team={selectedTeam}
          onUpdated={loadTeams}
        />

        {/* ================================================= */}
        {/* DELETE MODAL */}
        {/* ================================================= */}

        <DeleteModal
          open={deleteOpen}
          title="Delete Team"
          description="Are you sure you want to delete this team? This action cannot be undone."
          onCancel={closeDelete}
          onConfirm={deleteTeam}
        />

      </div>
    </div>
  );
}