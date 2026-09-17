"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Radio, Eye } from "lucide-react";
import { toast } from "sonner";

interface Team {
  id: number;
  name: string;
}

interface Game {
  id: number;
  name: string;
}

interface Match {
  id: number;
  status: string;
  venue: string;
  matchDate: string;
  game: Game;
  team1: Team;
  team2: Team;
}

export default function LiveMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLiveMatches();

    const interval = setInterval(() => {
      loadLiveMatches();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  async function loadLiveMatches() {
    try {
      const res = await fetch("/api/matches", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to load matches");
      }

      const data = await res.json();

      const liveMatches = data.filter(
        (match: Match) => match.status === "LIVE"
      );

      setMatches(liveMatches);
    } catch (error) {
      console.error(error);
      toast.error("Unable to load live matches.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3">

          <Radio
            size={30}
            className="text-red-600"
          />

          <h1 className="text-3xl font-bold">
            Live Matches
          </h1>

        </div>

        <p className="mt-2 text-gray-500">
          Manage and monitor matches currently in progress.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl bg-white p-8 text-center shadow">
          Loading live matches...
        </div>
      )}

      {/* No live matches */}
      {!loading && matches.length === 0 && (
        <div className="rounded-2xl bg-white p-10 text-center shadow">

          <Radio
            size={45}
            className="mx-auto text-gray-300"
          />

          <h2 className="mt-4 text-xl font-bold">
            No Live Matches
          </h2>

          <p className="mt-2 text-gray-500">
            There are currently no matches in progress.
          </p>

          <Link
            href="/admin/matches"
            className="mt-5 inline-block rounded-xl bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
          >
            Go to Matches
          </Link>

        </div>
      )}

      {/* Live matches */}
      {!loading && matches.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">

          {matches.map((match) => (

            <div
              key={match.id}
              className="rounded-2xl bg-white p-6 shadow"
            >

              {/* Game + Live */}
              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-gray-500">
                    {match.game.name}
                  </p>

                  <h2 className="mt-1 text-xl font-bold">
                    {match.team1.name} vs{" "}
                    {match.team2.name}
                  </h2>
                </div>

                <span className="flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-600">

                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />

                  LIVE

                </span>

              </div>

              {/* Venue */}
              <p className="mt-4 text-sm text-gray-500">
                📍 {match.venue}
              </p>

              {/* Open */}
              <Link
                href={`/admin/live-matches/${match.id}`}
                className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
              >
                <Eye size={18} />
                Open Live Match
              </Link>

            </div>

          ))}

        </div>
      )}

    </div>
  );
}