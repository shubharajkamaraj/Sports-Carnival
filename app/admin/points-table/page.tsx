"use client";

import { useRouter } from "next/navigation";
import {
  Trophy,
  ChevronRight,
  TableProperties,
} from "lucide-react";

export default function PointsTablePage() {
  const router = useRouter();

  const games = [
    {
      name: "Cricket",
      description:
        "View team standings, wins, losses, points and net run rate.",
      icon: "🏏",
      href: "/admin/points-table/cricket",
      color:
        "from-emerald-500/20 to-emerald-950/20",
      border:
        "border-emerald-500/20 hover:border-emerald-500/50",
      iconBg:
        "bg-emerald-500/10 text-emerald-400",
      badge:
        "Cricket standings",
    },

    {
      name: "Football",
      description:
        "View team standings, matches played, wins, draws, losses and points.",
      icon: "⚽",
      href: "/admin/points-table/football",
      color:
        "from-blue-500/20 to-blue-950/20",
      border:
        "border-blue-500/20 hover:border-blue-500/50",
      iconBg:
        "bg-blue-500/10 text-blue-400",
      badge:
        "Football standings",
    },

    {
      name: "Handball",
      description:
        "View team standings, matches played, wins, draws, losses and points.",
      icon: "🤾",
      href: "/admin/points-table/handball",
      color:
        "from-purple-500/20 to-purple-950/20",
      border:
        "border-purple-500/20 hover:border-purple-500/50",
      iconBg:
        "bg-purple-500/10 text-purple-400",
      badge:
        "Handball standings",
    },

    {
      name: "Throwball",
      description:
        "View team standings, wins, losses, sets and tournament points.",
      icon: "🏐",
      href: "/admin/points-table/throwball",
      color:
        "from-orange-500/20 to-orange-950/20",
      border:
        "border-orange-500/20 hover:border-orange-500/50",
      iconBg:
        "bg-orange-500/10 text-orange-400",
      badge:
        "Throwball standings",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white md:p-6">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950">

          <div className="p-6 md:p-8">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 ring-1 ring-blue-500/20">
                <TableProperties
                  size={27}
                  className="text-blue-400"
                />
              </div>

              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-400">
                  Sports Carnival
                </p>

                <h1 className="mt-1 text-2xl font-black md:text-3xl">
                  Points Table
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Select a game to view tournament standings
                </p>
              </div>

            </div>

          </div>

        </section>

        {/* GAME SELECTION */}
        <section className="mt-6">

          <div className="mb-4">

            <h2 className="text-lg font-black">
              Select Game
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Choose a sport to view its points table
            </p>

          </div>

          <div className="grid gap-4 md:grid-cols-2">

            {games.map((game) => (
              <button
                key={game.name}
                type="button"
                onClick={() => router.push(game.href)}
                className={`group overflow-hidden rounded-3xl border bg-gradient-to-br p-5 text-left transition-all hover:-translate-y-1 hover:shadow-2xl md:p-6 ${game.color} ${game.border}`}
              >

                <div className="flex items-start justify-between gap-4">

                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl ${game.iconBg}`}
                  >
                    {game.icon}
                  </div>

                  <ChevronRight
                    size={22}
                    className="mt-1 text-slate-500 transition group-hover:translate-x-1 group-hover:text-white"
                  />

                </div>

                <div className="mt-6">

                  <span className="rounded-full bg-slate-950/50 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
                    {game.badge}
                  </span>

                  <h3 className="mt-3 text-xl font-black">
                    {game.name}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {game.description}
                  </p>

                </div>

                <div className="mt-6 flex items-center gap-2 text-xs font-black text-slate-300">

                  <Trophy
                    size={15}
                    className="text-yellow-400"
                  />

                  View Points Table

                </div>

              </button>
            ))}

          </div>

        </section>

      </div>
    </main>
  );
}
