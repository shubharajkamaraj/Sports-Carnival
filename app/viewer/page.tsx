
"use client";

import Link from "next/link";

export default function ViewerPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Sports Carnival
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Welcome to the Sports Carnival
        </p>
      </div>

      {/* Main Sections */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

        {/* Matches */}
        <Link
          href="/viewer/matches"
          className="group rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <div className="mb-4 text-4xl">🏆</div>

          <h2 className="text-xl font-semibold text-slate-900">
            Matches
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            View live matches, upcoming matches and results.
          </p>

          <div className="mt-5 text-sm font-semibold text-slate-700 group-hover:text-slate-900">
            View Matches →
          </div>
        </Link>

        {/* Points Table */}
        <Link
          href="/viewer/points-table"
          className="group rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <div className="mb-4 text-4xl">📊</div>

          <h2 className="text-xl font-semibold text-slate-900">
            Points Table
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Check team points, wins, losses and standings.
          </p>

          <div className="mt-5 text-sm font-semibold text-slate-700 group-hover:text-slate-900">
            View Points Table →
          </div>
        </Link>

        {/* Standings */}
        <Link
          href="/viewer/standings"
          className="group rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <div className="mb-4 text-4xl">🏅</div>

          <h2 className="text-xl font-semibold text-slate-900">
            Tournament Standings
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            See the current tournament standings.
          </p>

          <div className="mt-5 text-sm font-semibold text-slate-700 group-hover:text-slate-900">
            View Standings →
          </div>
        </Link>

        {/* Competition Games */}
        <Link
          href="/viewer/competition-games"
          className="group rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <div className="mb-4 text-4xl">🎯</div>

          <h2 className="text-xl font-semibold text-slate-900">
            Competition Games
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            View the special competition games and results.
          </p>

          <div className="mt-5 text-sm font-semibold text-slate-700 group-hover:text-slate-900">
            View Competition Games →
          </div>
        </Link>

        {/* Overall Awards */}
        <Link
          href="/viewer/overall-awards"
          className="group rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <div className="mb-4 text-4xl">⭐</div>

          <h2 className="text-xl font-semibold text-slate-900">
            Overall Awards
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            See the best players of the Sports Carnival.
          </p>

          <div className="mt-5 text-sm font-semibold text-slate-700 group-hover:text-slate-900">
            View Awards →
          </div>
        </Link>

        {/* Teams */}
        <Link
          href="/viewer/teams"
          className="group rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <div className="mb-4 text-4xl">👥</div>

          <h2 className="text-xl font-semibold text-slate-900">
            Teams
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            View participating teams and their players.
          </p>

          <div className="mt-5 text-sm font-semibold text-slate-700 group-hover:text-slate-900">
            View Teams →
          </div>
        </Link>

      </div>

      {/* Bottom Information */}
      <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">

        <h2 className="text-lg font-semibold text-slate-900">
          Sports Carnival
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Follow the tournament, check match results, view team
          standings and discover the top performers.
        </p>

      </div>

    </div>
  );
}
