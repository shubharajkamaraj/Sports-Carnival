"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Play, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import StartMatchModal from "@/components/forms/StartMatchModal";
interface Player {
  id: number;
  name: string;
  jerseyNo: number | null;
  role: string | null;
  photo: string | null;
}

interface Team {
  id: number;
  name: string;
  players: Player[];
}

interface Game {
  id: number;
  name: string;
  sportType: string;
}

interface Tournament {
  id: number;
  name: string;
}

interface Innings {
  id: number;
  inningsNumber: number;
  battingTeamId: number;
  bowlingTeamId: number;
  totalRuns: number;
  totalWickets: number;
  legalBalls: number;
  battingTeam: Team;
  bowlingTeam: Team;
}

interface Match {
  id: number;
  tournamentId: number;
  gameId: number;
  team1Id: number;
  team2Id: number;
  matchNumber: number | null;
  matchDate: string;
  venue: string;
  status: string;
  tournament: Tournament;
  game: Game;
  team1: Team;
  team2: Team;
  cricketInnings: Innings[];
}

export default function MatchDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const matchId = params.id as string;

  const [match, setMatch] =
    useState<Match | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [starting, setStarting] =
    useState(false);

  const [selectedBattingTeam, setSelectedBattingTeam] =
    useState("");

  // =====================================================
  // LOAD MATCH
  // =====================================================

  async function loadMatch() {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/matches/${matchId}`,
        {
          cache: "no-store",
        }
      );

      const text = await res.text();

      let data: any = {};

      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(
            "Invalid response from match API."
          );
        }
      }

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Failed to load match."
        );
      }

      setMatch(data);

      // Default Team 1 bats first
      if (data.team1) {
        setSelectedBattingTeam(
          String(data.team1.id)
        );
      }
    } catch (error) {
      console.error(
        "LOAD MATCH ERROR:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load match."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // LOAD ON PAGE
  // =====================================================

  useEffect(() => {
    if (matchId) {
      loadMatch();
    }
  }, [matchId]);

  // =====================================================
  // START MATCH
  // =====================================================

  async function startMatch() {
    if (!match) return;

    if (!selectedBattingTeam) {
      toast.error(
        "Please select the batting team."
      );
      return;
    }

    try {
      setStarting(true);

      /*
       * The current start API defaults Team 1
       * as batting team.
       *
       * We will update the API next to accept
       * battingTeamId from this UI.
       */

      const res = await fetch(
        `/api/matches/${match.id}/cricket/start`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            battingTeamId:
              Number(selectedBattingTeam),
          }),
        }
      );

      const text = await res.text();

      let data: any = {};

      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(
            "Invalid response from start match API."
          );
        }
      }

      if (!res.ok) {
        throw new Error(
          data.error ||
            data.message ||
            `Failed to start match (${res.status})`
        );
      }

      toast.success(
        "Cricket match started!"
      );

      /*
       * Reload the match from database.
       *
       * This is important because the match
       * state is stored in Prisma/PostgreSQL.
       */

      await loadMatch();
    } catch (error) {
      console.error(
        "START MATCH ERROR:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to start match."
      );
    } finally {
      setStarting(false);
    }
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border bg-white p-12 text-center">
            <RefreshCw
              className="mx-auto animate-spin text-slate-400"
              size={28}
            />

            <p className="mt-4 text-sm text-slate-500">
              Loading match...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // MATCH NOT FOUND
  // =====================================================

  if (!match) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border bg-white p-12 text-center">
            <h2 className="text-xl font-bold text-slate-900">
              Match not found
            </h2>

            <button
              onClick={() =>
                router.push(
                  "/admin/matches"
                )
              }
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Back to Matches
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // CURRENT INNINGS
  // =====================================================

  const currentInnings =
    match.cricketInnings?.length
      ? match.cricketInnings[
          match.cricketInnings.length - 1
        ]
      : null;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-6xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/matches"
              )
            }
            className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={18} />

            Back to Matches
          </button>

          <button
            type="button"
            onClick={loadMatch}
            className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={17} />

            Refresh
          </button>
        </div>

        {/* =================================================
            MATCH HEADER CARD
        ================================================= */}

        <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">

          <div className="border-b bg-slate-900 px-6 py-6 text-white md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>
                <p className="text-sm text-slate-300">
                  {match.tournament?.name}
                </p>

                <h1 className="mt-1 text-2xl font-bold">
                  Match{" "}
                  {match.matchNumber ??
                    match.id}
                </h1>

                <p className="mt-1 text-sm text-slate-300">
                  {match.game?.name}
                </p>
              </div>

              <div>
                <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
                  {match.status}
                </span>
              </div>

            </div>
          </div>

          {/* =================================================
              TEAMS
          ================================================= */}

          <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3 md:p-8">

            {/* TEAM 1 */}

            <div
              className={`rounded-2xl border p-6 text-center ${
                currentInnings?.battingTeamId ===
                match.team1Id
                  ? "border-green-300 bg-green-50"
                  : "bg-slate-50"
              }`}
            >
              <p className="text-xs font-semibold uppercase text-slate-400">
                Team 1
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-900">
                {match.team1.name}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {match.team1.players?.length ??
                  0}{" "}
                players
              </p>

              {currentInnings?.battingTeamId ===
                match.team1Id && (
                <span className="mt-3 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  Batting
                </span>
              )}

              {currentInnings?.bowlingTeamId ===
                match.team1Id && (
                <span className="mt-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  Bowling
                </span>
              )}
            </div>

            {/* VS */}

            <div className="flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-500">
                VS
              </div>
            </div>

            {/* TEAM 2 */}

            <div
              className={`rounded-2xl border p-6 text-center ${
                currentInnings?.battingTeamId ===
                match.team2Id
                  ? "border-green-300 bg-green-50"
                  : "bg-slate-50"
              }`}
            >
              <p className="text-xs font-semibold uppercase text-slate-400">
                Team 2
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-900">
                {match.team2.name}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {match.team2.players?.length ??
                  0}{" "}
                players
              </p>

              {currentInnings?.battingTeamId ===
                match.team2Id && (
                <span className="mt-3 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  Batting
                </span>
              )}

              {currentInnings?.bowlingTeamId ===
                match.team2Id && (
                <span className="mt-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  Bowling
                </span>
              )}
            </div>

          </div>

          {/* =================================================
              MATCH INFORMATION
          ================================================= */}

          <div className="grid grid-cols-1 gap-4 border-t p-6 md:grid-cols-3 md:p-8">

            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Date
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {new Date(
                  match.matchDate
                ).toLocaleDateString(
                  "en-IN",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Time
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {new Date(
                  match.matchDate
                ).toLocaleTimeString(
                  "en-IN",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Venue
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {match.venue}
              </p>
            </div>

          </div>
        </div>

        {/* =================================================
            START MATCH
        ================================================= */}

        {!currentInnings && (
          <div className="mt-6 rounded-3xl border bg-white p-6 shadow-sm md:p-8">

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Start Cricket Match
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select which team will bat first.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">

              {/* TEAM 1 OPTION */}

              <button
                type="button"
                onClick={() =>
                  setSelectedBattingTeam(
                    String(match.team1.id)
                  )
                }
                className={`rounded-2xl border-2 p-5 text-left transition ${
                  selectedBattingTeam ===
                  String(match.team1.id)
                    ? "border-green-500 bg-green-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Team 1
                </p>

                <p className="mt-1 text-lg font-bold text-slate-900">
                  {match.team1.name}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {match.team1.players.length}{" "}
                  players
                </p>
              </button>

              {/* TEAM 2 OPTION */}

              <button
                type="button"
                onClick={() =>
                  setSelectedBattingTeam(
                    String(match.team2.id)
                  )
                }
                className={`rounded-2xl border-2 p-5 text-left transition ${
                  selectedBattingTeam ===
                  String(match.team2.id)
                    ? "border-green-500 bg-green-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Team 2
                </p>

                <p className="mt-1 text-lg font-bold text-slate-900">
                  {match.team2.name}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {match.team2.players.length}{" "}
                  players
                </p>
              </button>

            </div>

            {/* START BUTTON */}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={startMatch}
                disabled={starting}
                className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play size={18} />

                {starting
                  ? "Starting..."
                  : "Start Match"}
              </button>
            </div>
          </div>
        )}

        {/* =================================================
            INNINGS CARD
        ================================================= */}

        {currentInnings && (
          <div className="mt-6 rounded-3xl border bg-white p-6 shadow-sm md:p-8">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Current Innings
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  Innings{" "}
                  {currentInnings.inningsNumber}
                </h2>
              </div>

              <div className="text-right">
                <p className="text-3xl font-bold text-slate-900">
                  {currentInnings.totalRuns}/
                  {currentInnings.totalWickets}
                </p>

                <p className="text-sm text-slate-500">
                  {currentInnings.legalBalls}{" "}
                  legal balls
                </p>
              </div>

            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">

              <div className="rounded-2xl bg-green-50 p-5">
                <p className="text-xs font-semibold uppercase text-green-600">
                  Batting
                </p>

                <p className="mt-1 text-lg font-bold text-green-900">
                  {
                    currentInnings
                      .battingTeam.name
                  }
                </p>
              </div>

              <div className="rounded-2xl bg-blue-50 p-5">
                <p className="text-xs font-semibold uppercase text-blue-600">
                  Bowling
                </p>

                <p className="mt-1 text-lg font-bold text-blue-900">
                  {
                    currentInnings
                      .bowlingTeam.name
                  }
                </p>
              </div>

            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-center">
              <p className="text-sm text-slate-500">
                Next step
              </p>

              <p className="mt-1 font-semibold text-slate-800">
                Select striker, non-striker
                and bowler.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}