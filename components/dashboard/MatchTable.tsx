"use client";

import {
  Pencil,
  Trash2,
  Play,
} from "lucide-react";
import { toast } from "sonner";

// =====================================================
// TYPES
// =====================================================

interface Team {
  id: number;
  name: string;
}

interface Game {
  id: number;
  name: string;

  sportType:
    | "CRICKET"
    | "FOOTBALL"
    | "THROWBALL"
    | "HANDBALL"
    | null;
}

interface Tournament {
  id: number;
  name: string;
}

export interface Match {
  id: number;

  tournamentId: number;
  gameId: number;

  team1Id: number;
  team2Id: number;

  matchNumber: number | null;

  stage:
    | "LEAGUE"
    | "THIRD_PLACE"
    | "FINAL";

  status:
    | "UPCOMING"
    | "LIVE"
    | "COMPLETED"
    | "CANCELLED";

  result:
    | "TEAM1_WIN"
    | "TEAM2_WIN"
    | "DRAW"
    | "TIE"
    | "NO_RESULT"
    | null;

  winnerTeamId: number | null;

  overs: number;

  team1Score: number;

  team2Score: number;

  tournament: Tournament;

  game: Game;

  team1: Team;

  team2: Team;
}

// =====================================================
// PROPS
// =====================================================

type Props = {
  matches: Match[];

  onEdit: (match: Match) => void;

  onRefresh: () => void;

  onStartMatch: (match: Match) => void;

  onViewSummary: (match: Match) => void;
};

// =====================================================
// COMPONENT
// =====================================================

export default function MatchTable({
  matches,
  onEdit,
  onRefresh,
  onStartMatch,
  onViewSummary,
}: Props) {
  // =====================================================
  // DELETE MATCH
  // =====================================================

  async function deleteMatch(
    matchId: number
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this match?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const res =
        await fetch(
          `/api/matches/${matchId}`,
          {
            method: "DELETE",
          }
        );

      const responseText =
        await res.text();

      let data: any = {};

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Failed to delete match."
        );
      }

      toast.success(
        "Match deleted successfully."
      );

      onRefresh();
    } catch (error) {
      console.error(
        "DELETE MATCH ERROR:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete match."
      );
    }
  }

  // =====================================================
  // STAGE LABEL
  // =====================================================

  function formatStage(
    stage: Match["stage"]
  ) {
    switch (stage) {
      case "LEAGUE":
        return "League";

      case "THIRD_PLACE":
        return "3rd Place";

      case "FINAL":
        return "Final";

      default:
        return stage;
    }
  }

  // =====================================================
  // STAGE CLASS
  // =====================================================

  function stageClass(
    stage: Match["stage"]
  ) {
    switch (stage) {
      case "FINAL":
        return "bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/20";

      case "THIRD_PLACE":
        return "bg-purple-500/15 text-purple-200 ring-1 ring-purple-400/20";

      case "LEAGUE":
      default:
        return "bg-blue-500/15 text-blue-200 ring-1 ring-blue-400/20";
    }
  }

  // =====================================================
  // STATUS CLASS
  // =====================================================

  function statusClass(
    status: Match["status"]
  ) {
    switch (status) {
      case "LIVE":
        return "bg-red-500/15 text-red-200 ring-1 ring-red-400/20";

      case "COMPLETED":
        return "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/20";

      case "CANCELLED":
        return "bg-white/10 text-slate-300 ring-1 ring-white/10";

      case "UPCOMING":
      default:
        return "bg-blue-500/15 text-blue-200 ring-1 ring-blue-400/20";
    }
  }

  // =====================================================
  // EMPTY STATE
  // =====================================================

  if (matches.length === 0) {
    return (
      <div className="min-h-screen w-full rounded-2xl border border-white/10 bg-transparent p-12 text-center shadow-lg">
        <p className="text-lg font-semibold text-white">
          No matches found
        </p>

        <p className="mt-1 text-sm text-slate-400">
          Create your first match to get started.
        </p>
      </div>
    );
  }

  // =====================================================
  // TABLE
  // =====================================================

  return (
    <div className="min-h-screen overflow-hidden rounded-2xl border border-white/10 bg-transparent shadow-lg backdrop-blur-md">

      <div className="overflow-x-auto">

        <table className="w-full min-w-[1000px]">

          {/* ================================================= */}
          {/* HEADER */}
          {/* ================================================= */}

          <thead className="border-b border-white/10 bg-slate-950/40">

            <tr>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                Match
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                Game
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                Teams
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                Stage
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                Status
              </th>

              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-300">
                Actions
              </th>

            </tr>

          </thead>

          {/* ================================================= */}
          {/* BODY */}
          {/* ================================================= */}

          <tbody className="divide-y divide-white/10">

            {matches.map(
              (match) => (

                <tr
                  key={match.id}
                  className="transition hover:bg-white/5"
                >

                  {/* ========================================= */}
                  {/* MATCH */}
                  {/* ========================================= */}

                  <td className="px-5 py-4">

                    <div className="font-semibold text-white">
                      Match{" "}
                      {match.matchNumber ??
                        match.id}
                    </div>

                    <div className="text-xs text-slate-500">
                      ID #{match.id}
                    </div>

                  </td>

                  {/* ========================================= */}
                  {/* GAME */}
                  {/* ========================================= */}

                  <td className="px-5 py-4">

                    <div className="font-medium text-slate-200">
                      {match.game?.name ??
                        "—"}
                    </div>

                    <div className="text-xs text-slate-500">
                      {match.tournament
                        ?.name ??
                        "—"}
                    </div>

                  </td>

                  {/* ========================================= */}
                  {/* TEAMS */}
                  {/* ========================================= */}

                  <td className="px-5 py-4">

                    <div className="font-medium text-slate-200">
                      {match.team1?.name ??
                        "—"}
                    </div>

                    <div className="my-1 text-xs font-medium text-slate-500">
                      VS
                    </div>

                    <div className="font-medium text-slate-200">
                      {match.team2?.name ??
                        "—"}
                    </div>

                  </td>

                  {/* ========================================= */}
                  {/* STAGE */}
                  {/* ========================================= */}

                  <td className="px-5 py-4">

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${stageClass(
                        match.stage
                      )}`}
                    >
                      {formatStage(
                        match.stage
                      )}
                    </span>

                  </td>

                  {/* ========================================= */}
                  {/* STATUS */}
                  {/* ========================================= */}

                  <td className="px-5 py-4">

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                        match.status
                      )}`}
                    >
                      {match.status}
                    </span>

                  </td>

                  {/* ========================================= */}
                  {/* ACTIONS */}
                  {/* ========================================= */}

                  <td className="px-5 py-4">

                    <div className="flex items-center justify-end gap-2">

                      {/* START MATCH */}

                      <button
                        type="button"
                        onClick={() =>
                          onStartMatch(
                            match
                          )
                        }
                        disabled={
                          match.status ===
                            "COMPLETED" ||
                          match.status ===
                            "CANCELLED"
                        }
                        className="rounded-lg p-2 text-emerald-300 transition hover:bg-emerald-500/10 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Start Match"
                      >
                        <Play
                          size={18}
                        />
                      </button>

                      {/* VIEW SUMMARY */}

                      {match.status ===
                        "COMPLETED" && (
                        <button
                          type="button"
                          onClick={() =>
                            onViewSummary(
                              match
                            )
                          }
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                        >
                          🏆 View Summary
                        </button>
                      )}

                      {/* EDIT */}

                      <button
                        type="button"
                        onClick={() =>
                          onEdit(match)
                        }
                        // disabled={
                        //   match.status ===
                        //   "LIVE"
                        // }
                        className="rounded-lg p-2 text-blue-300 transition hover:bg-blue-500/10 hover:text-blue-200 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Edit Match"
                      >
                        <Pencil
                          size={18}
                        />
                      </button>

                      {/* DELETE */}

                      <button
                        type="button"
                        onClick={() =>
                          deleteMatch(
                            match.id
                          )
                        }
                        // disabled={
                        //   match.status ===
                        //   "LIVE"
                        // }
                        className="rounded-lg p-2 text-red-300 transition hover:bg-red-500/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Delete Match"
                      >
                        <Trash2
                          size={18}
                        />
                      </button>

                    </div>

                  </td>

                </tr>
              )
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}