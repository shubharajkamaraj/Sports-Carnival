"use client";

import Link from "next/link";

export default function ViewerPage() {
  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_50%_40%,#263a70_0%,#111936_35%,#070b19_70%,#03050c_100%)] p-6 text-white">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Sports Carnival
        </h1>

        <p className="mt-1 text-sm text-slate-300">
          Welcome to the Sports Carnival
        </p>
      </div>

      {/* Main Sections */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

        {/* Matches */}
        <Link
          href="/viewer/matches"
          className="group rounded-2xl border border-white/10 bg-white/10 p-6 shadow-lg backdrop-blur-md transition hover:bg-white/15 hover:shadow-xl"
        >
          <div className="mb-4 text-4xl">🏆</div>

          <h2 className="text-xl font-semibold text-white">
            Matches
          </h2>

          <p className="mt-2 text-sm text-slate-300">
            View live matches, upcoming matches and results.
          </p>

          <div className="mt-5 text-sm font-semibold text-slate-200 group-hover:text-white">
            View Matches →
          </div>
        </Link>

        {/* Points Table */}
        <Link
          href="/viewer/points-table"
          className="group rounded-2xl border border-white/10 bg-white/10 p-6 shadow-lg backdrop-blur-md transition hover:bg-white/15 hover:shadow-xl"
        >
          <div className="mb-4 text-4xl">📊</div>

          <h2 className="text-xl font-semibold text-white">
            Points Table
          </h2>

          <p className="mt-2 text-sm text-slate-300">
            Check team points, wins, losses and standings.
          </p>

          <div className="mt-5 text-sm font-semibold text-slate-200 group-hover:text-white">
            View Points Table →
          </div>
        </Link>

        {/* Standings */}
        <Link
          href="/viewer/standings"
          className="group rounded-2xl border border-white/10 bg-white/10 p-6 shadow-lg backdrop-blur-md transition hover:bg-white/15 hover:shadow-xl"
        >
          <div className="mb-4 text-4xl">🏅</div>

          <h2 className="text-xl font-semibold text-white">
            Tournament Standings
          </h2>

          <p className="mt-2 text-sm text-slate-300">
            See the current tournament standings.
          </p>

          <div className="mt-5 text-sm font-semibold text-slate-200 group-hover:text-white">
            View Standings →
          </div>
        </Link>

        {/* Competition Games */}
        <Link
          href="/viewer/competition-games"
          className="group rounded-2xl border border-white/10 bg-white/10 p-6 shadow-lg backdrop-blur-md transition hover:bg-white/15 hover:shadow-xl"
        >
          <div className="mb-4 text-4xl">🎯</div>

          <h2 className="text-xl font-semibold text-white">
            Competition Games
          </h2>

          <p className="mt-2 text-sm text-slate-300">
            View the special competition games and results.
          </p>

          <div className="mt-5 text-sm font-semibold text-slate-200 group-hover:text-white">
            View Competition Games →
          </div>
        </Link>

        {/* Overall Awards */}
        <Link
          href="/viewer/overall-awards"
          className="group rounded-2xl border border-white/10 bg-white/10 p-6 shadow-lg backdrop-blur-md transition hover:bg-white/15 hover:shadow-xl"
        >
          <div className="mb-4 text-4xl">⭐</div>

          <h2 className="text-xl font-semibold text-white">
            Overall Awards
          </h2>

          <p className="mt-2 text-sm text-slate-300">
            See the best players of the Sports Carnival.
          </p>

          <div className="mt-5 text-sm font-semibold text-slate-200 group-hover:text-white">
            View Awards →
          </div>
        </Link>

        {/* Teams */}
        <Link
          href="/viewer/teams"
          className="group rounded-2xl border border-white/10 bg-white/10 p-6 shadow-lg backdrop-blur-md transition hover:bg-white/15 hover:shadow-xl"
        >
          <div className="mb-4 text-4xl">👥</div>

          <h2 className="text-xl font-semibold text-white">
            Teams
          </h2>

          <p className="mt-2 text-sm text-slate-300">
            View participating teams and their players.
          </p>

          <div className="mt-5 text-sm font-semibold text-slate-200 group-hover:text-white">
            View Teams →
          </div>
        </Link>

      </div>

      {/* Bottom Information */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/10 p-6 shadow-lg backdrop-blur-md">

        <h2 className="text-lg font-semibold text-white">
          Sports Carnival
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-300">
          Follow the tournament, check match results, view team
          standings and discover the top performers.
        </p>

      </div>

    </div>
  );
}