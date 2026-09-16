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

  // =====================================================
  // CURRENT MATCH STAGE
  // =====================================================

  stage:
    | "LEAGUE"
    | "THIRD_PLACE"
    | "FINAL";

  // =====================================================
  // MATCH STATUS
  // =====================================================

  status:
    | "UPCOMING"
    | "LIVE"
    | "COMPLETED"
    | "CANCELLED";

  // =====================================================
  // RESULT
  // =====================================================

  result:
    | "TEAM1_WIN"
    | "TEAM2_WIN"
    | "DRAW"
    | "TIE"
    | "NO_RESULT"
    | null;

  // =====================================================
  // WINNER
  // =====================================================

  winnerTeamId: number | null;

  // =====================================================
  // CRICKET OVERS
  // =====================================================

  overs: number;

  // =====================================================
  // SCORES
  // =====================================================

  team1Score: number;

  team2Score: number;

  // =====================================================
  // RELATIONS
  // =====================================================

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
          ? JSON.parse(
              responseText
            )
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
        return "bg-amber-100 text-amber-700";

      case "THIRD_PLACE":
        return "bg-purple-100 text-purple-700";

      case "LEAGUE":
      default:
        return "bg-blue-100 text-blue-700";
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
        return "bg-red-100 text-red-700";

      case "COMPLETED":
        return "bg-green-100 text-green-700";

      case "CANCELLED":
        return "bg-slate-200 text-slate-600";

      case "UPCOMING":
      default:
        return "bg-blue-100 text-blue-700";
    }
  }

  // =====================================================
  // EMPTY STATE
  // =====================================================

  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-12 text-center">
        <p className="text-lg font-semibold text-slate-700">
          No matches found
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Create your first match to get started.
        </p>
      </div>
    );
  }

  // =====================================================
  // TABLE
  // =====================================================

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

      <div className="overflow-x-auto">

        <table className="w-full min-w-[1000px]">

          {/* ================================================= */}
          {/* HEADER */}
          {/* ================================================= */}

          <thead className="border-b bg-slate-50">

            <tr>

              {/* MATCH */}

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Match
              </th>

              {/* GAME */}

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Game
              </th>

              {/* TEAMS */}

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Teams
              </th>

              {/* STAGE */}

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Stage
              </th>

              {/* OVERS */}

              {/* STATUS */}

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>

              {/* ACTIONS */}

              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>

            </tr>

          </thead>

          {/* ================================================= */}
          {/* BODY */}
          {/* ================================================= */}

          <tbody className="divide-y">

            {matches.map(
              (match) => (

                <tr
                  key={match.id}
                  className="transition hover:bg-slate-50"
                >

                  {/* ========================================= */}
                  {/* MATCH */}
                  {/* ========================================= */}

                  <td className="px-5 py-4">

                    <div className="font-semibold text-slate-900">
                      Match{" "}
                      {match.matchNumber ??
                        match.id}
                    </div>

                    <div className="text-xs text-slate-400">
                      ID #{match.id}
                    </div>

                  </td>

                  {/* ========================================= */}
                  {/* GAME */}
                  {/* ========================================= */}

                  <td className="px-5 py-4">

                    <div className="font-medium text-slate-800">
                      {match.game?.name ??
                        "—"}
                    </div>

                    <div className="text-xs text-slate-400">
                      {match.tournament
                        ?.name ??
                        "—"}
                    </div>

                  </td>

                  {/* ========================================= */}
                  {/* TEAMS */}
                  {/* ========================================= */}

                  <td className="px-5 py-4">

                    <div className="font-medium text-slate-800">
                      {match.team1?.name ??
                        "—"}
                    </div>

                    <div className="my-1 text-xs font-medium text-slate-400">
                      VS
                    </div>

                    <div className="font-medium text-slate-800">
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
                  {/* OVERS */}
                  {/* ========================================= */}

                

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

                      {/* ================================= */}
                      {/* START MATCH */}
                      {/* ================================= */}

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
                        className="rounded-lg p-2 text-green-600 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Start Match"
                      >
                        <Play
                          size={18}
                        />
                      </button>

                      {/* ================================= */}
                      {/* VIEW SUMMARY */}
                      {/* ================================= */}

                      {match.status ===
                        "COMPLETED" && (
                        <button
                          type="button"
                          onClick={() =>
                            onViewSummary(
                              match
                            )
                          }
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                          🏆 View Summary
                        </button>
                      )}

                      {/* ================================= */}
                      {/* EDIT */}
                      {/* ================================= */}

                      <button
                        type="button"
                        onClick={() =>
                          onEdit(match)
                        }
                        disabled={
                          match.status ===
                          "LIVE"
                        }
                        className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Edit Match"
                      >
                        <Pencil
                          size={18}
                        />
                      </button>

                      {/* ================================= */}
                      {/* DELETE */}
                      {/* ================================= */}

                      <button
                        type="button"
                        onClick={() =>
                          deleteMatch(
                            match.id
                          )
                        }
                        disabled={
                          match.status ===
                          "LIVE"
                        }
                        className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
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