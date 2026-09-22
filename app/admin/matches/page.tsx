"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import AddMatchForm from "@/components/forms/AddMatchForm";
import EditMatchForm from "@/components/forms/EditMatchForm";
import StartMatchModal from "@/components/forms/StartMatchModal";
import { useRouter } from "next/navigation";
import MatchTable, {
  type Match,
} from "@/components/dashboard/MatchTable";

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [startMatchOpen, setStartMatchOpen] =
    useState(false);

  const [selectedMatch, setSelectedMatch] =
    useState<Match | null>(null);

  const router = useRouter();

  // =====================================================
  // LOAD MATCHES
  // =====================================================

  async function loadMatches() {
    try {
      setLoading(true);

      const res = await fetch("/api/matches", {
        cache: "no-store",
      });

      const responseText = await res.text();

      let data: any = {};

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        throw new Error(
          "Invalid response from matches API."
        );
      }

      if (!res.ok) {
        throw new Error(
          data.error || "Failed to load matches"
        );
      }

      setMatches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(
        "LOAD MATCHES ERROR:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load matches."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMatches();
  }, []);

  // =====================================================
  // EDIT MATCH
  // =====================================================

  function handleEdit(match: Match) {
    setSelectedMatch(match);
    setEditOpen(true);
  }

  // =====================================================
  // START MATCH
  // =====================================================

  function handleStartMatch(match: Match) {
    setSelectedMatch(match);
    setStartMatchOpen(true);
  }

  // =====================================================
  // CLOSE EDIT
  // =====================================================

  function closeEdit() {
    setEditOpen(false);
    setSelectedMatch(null);
  }

  // =====================================================
  // CLOSE START MATCH
  // =====================================================

  function closeStartMatch() {
    setStartMatchOpen(false);
    setSelectedMatch(null);
  }

  return (
    <div className="min-h-screen w-full bg-transparent p-6 text-white">
      <div className="mx-auto max-w-7xl">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>
            <h1 className="text-3xl font-bold text-white">
              Matches
            </h1>

            <p className="mt-1 text-sm text-slate-300">
              Create and manage tournament matches
            </p>
          </div>

          <div className="flex gap-3">

            <button
              type="button"
              onClick={loadMatches}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 font-medium text-slate-200 shadow-lg backdrop-blur-md transition hover:bg-white/15"
            >
              <RefreshCw size={18} />

              Refresh
            </button>

            <button
              type="button"
              onClick={() =>
                setAddOpen(true)
              }
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-500"
            >
              <Plus size={18} />

              Add Match
            </button>

          </div>
        </div>

        {/* ================================================= */}
        {/* STATS */}
        {/* ================================================= */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* TOTAL */}

          <div className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-lg backdrop-blur-md">
            <p className="text-sm text-slate-400">
              Total Matches
            </p>

            <p className="mt-1 text-3xl font-bold text-white">
              {matches.length}
            </p>
          </div>

          {/* UPCOMING */}

          <div className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-lg backdrop-blur-md">
            <p className="text-sm text-slate-400">
              Upcoming
            </p>

            <p className="mt-1 text-3xl font-bold text-blue-300">
              {
                matches.filter(
                  (match) =>
                    match.status === "UPCOMING"
                ).length
              }
            </p>
          </div>

          {/* LIVE */}

          <div className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-lg backdrop-blur-md">
            <p className="text-sm text-slate-400">
              Live
            </p>

            <p className="mt-1 text-3xl font-bold text-red-300">
              {
                matches.filter(
                  (match) =>
                    match.status === "LIVE"
                ).length
              }
            </p>
          </div>

          {/* COMPLETED */}

          <div className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-lg backdrop-blur-md">
            <p className="text-sm text-slate-400">
              Completed
            </p>

            <p className="mt-1 text-3xl font-bold text-emerald-300">
              {
                matches.filter(
                  (match) =>
                    match.status === "COMPLETED"
                ).length
              }
            </p>
          </div>

        </div>

        {/* ================================================= */}
        {/* MATCH TABLE */}
        {/* ================================================= */}

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/10 p-12 text-center shadow-lg backdrop-blur-md">
            <p className="text-sm text-slate-300">
              Loading matches...
            </p>
          </div>
        ) : (
          <MatchTable
            matches={matches}
            onEdit={handleEdit}
            onRefresh={loadMatches}
            onStartMatch={handleStartMatch}

            // =================================================
            // VIEW SUMMARY
            // =================================================

            onViewSummary={(match) => {

              // -----------------------------------------------
              // FOOTBALL
              // -----------------------------------------------

              if (
                match.game?.sportType ===
                "FOOTBALL"
              ) {
                router.push(
                  `/admin/matches/${match.id}/football/summary`
                );

                return;
              }

              // -----------------------------------------------
              // HANDBALL
              // -----------------------------------------------

              if (
                match.game?.sportType ===
                "HANDBALL"
              ) {
                router.push(
                  `/admin/matches/${match.id}/handball/summary`
                );

                return;
              }

              // -----------------------------------------------
              // THROWBALL
              // -----------------------------------------------

              if (
                match.game?.sportType ===
                "THROWBALL"
              ) {
                router.push(
                  `/admin/matches/${match.id}/throwball/summary`
                );

                return;
              }

              // -----------------------------------------------
              // OTHER SPORTS
              // -----------------------------------------------

              router.push(
                `/admin/matches/${match.id}/summary`
              );
            }}
          />
        )}

      </div>

      {/* ================================================= */}
      {/* ADD MATCH */}
      {/* ================================================= */}

      <AddMatchForm
        open={addOpen}
        onClose={() =>
          setAddOpen(false)
        }
        onMatchAdded={() => {
          setAddOpen(false);
          loadMatches();
        }}
      />

      {/* ================================================= */}
      {/* EDIT MATCH */}
      {/* ================================================= */}

      <EditMatchForm
        open={editOpen}
        onClose={closeEdit}
        match={selectedMatch}
        onUpdated={() => {
          closeEdit();
          loadMatches();
        }}
      />

      {/* ================================================= */}
      {/* START MATCH */}
      {/* ================================================= */}

      <StartMatchModal
        open={startMatchOpen}
        match={selectedMatch}
        onClose={closeStartMatch}
        onStarted={(inningsId) => {

          setStartMatchOpen(false);

          if (!selectedMatch) return;

          const matchId =
            selectedMatch.id;

          setSelectedMatch(null);

          router.push(
            `/admin/matches/${matchId}/cricket?inningsId=${inningsId}`
          );
        }}
      />

    </div>
  );
}