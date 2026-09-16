"use client";

import { useEffect, useState } from "react";
import {
  Trophy,
  ArrowLeft,
  Medal,
  Target,
  CircleUserRound,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

interface Player {
  id: number;
  name: string;
  jerseyNumber?: number | null;
}

interface MatchResult {
  success: boolean;

  match: {
    id: number;
    game: {
      id: number;
      name: string;
    };
    date: string;
    venue: string;
    status: string;
  };

  teams: {
    team1: {
      id: number;
      name: string;
      score: number;
    };

    team2: {
      id: number;
      name: string;
      score: number;
    };
  };

  result: {
    type: string;

    winner: {
      id: number;
      name: string;
      score: number;
    } | null;

    loser: {
      id: number;
      name: string;
      score: number;
    } | null;

    message: string;
  };

  bestBatsman: {
    player: Player;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    isOut: boolean;
  } | null;

  bestBowler: {
    player: Player;
    overs: number;
    balls: number;
    runs: number;
    wickets: number;
    wides: number;
    noBalls: number;
  } | null;

  allBattingStats: any[];
  allBowlingStats: any[];
}

export default function MatchResultPage() {
  const params = useParams();

  const router = useRouter();

  const [result, setResult] =
    useState<MatchResult | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadResult();
  }, []);

  async function loadResult() {
    try {
      setLoading(true);

      const id = params.id;

      const res = await fetch(
        `/api/matches/${id}/result`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Failed to load result"
        );
      }

      setResult(data);
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to load match result"
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-gray-500">
          Loading match result...
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-gray-500">
          Result not available.
        </p>
      </div>
    );
  }

  /*
   * ----------------------------------------
   * TIE
   * ----------------------------------------
   */

  if (result.result.type === "TIE") {
    return (
      <div className="space-y-6">
        <button
          onClick={() =>
            router.push("/admin/matches")
          }
          className="flex items-center gap-2 rounded-lg border px-4 py-2 hover:bg-gray-100"
        >
          <ArrowLeft size={18} />
          Back to Matches
        </button>

        <div className="rounded-2xl bg-white p-8 text-center shadow">
          <Trophy
            size={60}
            className="mx-auto mb-4"
          />

          <h1 className="text-3xl font-bold">
            Match Tied
          </h1>

          <p className="mt-2 text-gray-500">
            {result.teams.team1.name}{" "}
            {result.teams.team1.score} -{" "}
            {result.teams.team2.score}{" "}
            {result.teams.team2.name}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Back */}
      <button
        onClick={() =>
          router.push("/admin/matches")
        }
        className="flex items-center gap-2 rounded-lg border px-4 py-2 hover:bg-gray-100"
      >
        <ArrowLeft size={18} />
        Back to Matches
      </button>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Match Result
        </h1>

        <p className="mt-1 text-gray-500">
          {result.match.game.name} •{" "}
          {result.match.venue}
        </p>
      </div>

      {/* Winner */}
      <div className="rounded-2xl bg-white p-8 text-center shadow">

        <Trophy
          size={70}
          className="mx-auto mb-4"
        />

        <p className="text-sm font-medium text-gray-500">
          WINNER
        </p>

        <h2 className="mt-2 text-4xl font-bold">
          {result.result.winner?.name}
        </h2>

        <p className="mt-3 text-xl font-semibold">
          {result.result.message}
        </p>

      </div>

      {/* Score */}
      <div className="grid gap-6 md:grid-cols-2">

        {/* Team 1 */}
        <div
          className={`rounded-2xl p-6 shadow ${
            result.result.winner?.id ===
            result.teams.team1.id
              ? "bg-green-50 border-2 border-green-400"
              : "bg-white"
          }`}
        >
          <p className="text-sm text-gray-500">
            Team 1
          </p>

          <h3 className="mt-2 text-2xl font-bold">
            {result.teams.team1.name}
          </h3>

          <p className="mt-4 text-5xl font-bold">
            {result.teams.team1.score}
          </p>
        </div>

        {/* Team 2 */}
        <div
          className={`rounded-2xl p-6 shadow ${
            result.result.winner?.id ===
            result.teams.team2.id
              ? "bg-green-50 border-2 border-green-400"
              : "bg-white"
          }`}
        >
          <p className="text-sm text-gray-500">
            Team 2
          </p>

          <h3 className="mt-2 text-2xl font-bold">
            {result.teams.team2.name}
          </h3>

          <p className="mt-4 text-5xl font-bold">
            {result.teams.team2.score}
          </p>
        </div>

      </div>

      {/* Awards */}
      <div className="grid gap-6 md:grid-cols-2">

        {/* Best Batsman */}
        <div className="rounded-2xl bg-white p-6 shadow">

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-100 p-3 text-orange-600">
              <Medal size={26} />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Best Batsman
              </p>

              <h3 className="text-xl font-bold">
                {result.bestBatsman
                  ?.player.name ||
                  "Not available"}
              </h3>
            </div>
          </div>

          {result.bestBatsman && (
            <div className="mt-6 grid grid-cols-4 gap-3">

              <div className="rounded-xl bg-gray-50 p-3 text-center">
                <p className="text-xs text-gray-500">
                  Runs
                </p>

                <p className="text-xl font-bold">
                  {result.bestBatsman.runs}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-3 text-center">
                <p className="text-xs text-gray-500">
                  Balls
                </p>

                <p className="text-xl font-bold">
                  {result.bestBatsman.balls}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-3 text-center">
                <p className="text-xs text-gray-500">
                  4s
                </p>

                <p className="text-xl font-bold">
                  {result.bestBatsman.fours}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-3 text-center">
                <p className="text-xs text-gray-500">
                  6s
                </p>

                <p className="text-xl font-bold">
                  {result.bestBatsman.sixes}
                </p>
              </div>

            </div>
          )}

        </div>

        {/* Best Bowler */}
        <div className="rounded-2xl bg-white p-6 shadow">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <Target size={26} />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Best Bowler
              </p>

              <h3 className="text-xl font-bold">
                {result.bestBowler
                  ?.player.name ||
                  "Not available"}
              </h3>
            </div>

          </div>

          {result.bestBowler && (
            <div className="mt-6 grid grid-cols-4 gap-3">

              <div className="rounded-xl bg-gray-50 p-3 text-center">
                <p className="text-xs text-gray-500">
                  Overs
                </p>

                <p className="text-xl font-bold">
                  {result.bestBowler.overs}.
                  {result.bestBowler.balls}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-3 text-center">
                <p className="text-xs text-gray-500">
                  Runs
                </p>

                <p className="text-xl font-bold">
                  {result.bestBowler.runs}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-3 text-center">
                <p className="text-xs text-gray-500">
                  Wickets
                </p>

                <p className="text-xl font-bold">
                  {result.bestBowler.wickets}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-3 text-center">
                <p className="text-xs text-gray-500">
                  Wides
                </p>

                <p className="text-xl font-bold">
                  {result.bestBowler.wides}
                </p>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Winning Team */}
      <div className="rounded-2xl bg-white p-6 shadow">

        <div className="mb-5 flex items-center gap-3">

          <CircleUserRound
            size={24}
          />

          <h2 className="text-xl font-bold">
            Winning Team
          </h2>

        </div>

        <div className="rounded-xl bg-green-50 p-5">

          <h3 className="text-2xl font-bold text-green-700">
            {result.result.winner?.name}
          </h3>

          <p className="mt-1 text-gray-600">
            {result.result.message}
          </p>

        </div>

      </div>

    </div>
  );
}