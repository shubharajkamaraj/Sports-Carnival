import Link from "next/link";

export default function ViewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="
        min-h-screen
        w-full
        bg-[radial-gradient(circle_at_50%_40%,#263a70_0%,#111936_35%,#070b19_70%,#03050c_100%)]
        text-white
      "
    >
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070b19]/90 backdrop-blur-md">
        <div className="flex h-24 items-center px-7">

          {/* Team GC Logo + Title */}
          <Link
            href="/viewer"
            className="flex items-center gap-4 transition hover:opacity-90"
          >
            {/* Logo */}
            <img
              src="/team-logos/team-gc-logo.png"
              alt="Team GC Logo"
              className="h-16 w-16 object-contain"
            />

            {/* Brand Text */}
            <div className="flex flex-col justify-center">
              <span className="text-3xl font-extrabold leading-none tracking-wide text-white">
                TEAM GC
              </span>

              <span className="mt-2 text-sm font-semibold uppercase tracking-[0.28em] text-slate-300">
                SPORTS CARNIVAL
              </span>
            </div>
          </Link>

        </div>
      </header>

      {/* Main Layout */}
      <div className="flex min-h-[calc(100vh-96px)]">

        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r border-white/10 bg-[#070b19]/70 backdrop-blur-md">

          <nav className="space-y-1 p-4">

            {/* Home */}
            <Link
              href="/viewer"
              className="
                block rounded-lg px-4 py-3
                text-sm font-medium text-slate-200
                transition
                hover:bg-white/10
                hover:text-white
              "
            >
              🏠 Home
            </Link>

            {/* Matches */}
            <Link
              href="/viewer/matches"
              className="
                block rounded-lg px-4 py-3
                text-sm font-medium text-slate-200
                transition
                hover:bg-white/10
                hover:text-white
              "
            >
              🏆 Matches
            </Link>

            {/* Points Table */}
            <Link
              href="/viewer/points-table"
              className="
                block rounded-lg px-4 py-3
                text-sm font-medium text-slate-200
                transition
                hover:bg-white/10
                hover:text-white
              "
            >
              📊 Points Table
            </Link>

            {/* Standings */}
            <Link
              href="/viewer/standings"
              className="
                block rounded-lg px-4 py-3
                text-sm font-medium text-slate-200
                transition
                hover:bg-white/10
                hover:text-white
              "
            >
              🏅 Standings
            </Link>

            {/* Overall Awards */}
            <Link
              href="/viewer/overall-awards"
              className="
                block rounded-lg px-4 py-3
                text-sm font-medium text-slate-200
                transition
                hover:bg-white/10
                hover:text-white
              "
            >
              ⭐ Overall Awards
            </Link>

            {/* Teams */}
            <Link
              href="/viewer/teams"
              className="
                block rounded-lg px-4 py-3
                text-sm font-medium text-slate-200
                transition
                hover:bg-white/10
                hover:text-white
              "
            >
              👥 Teams
            </Link>

          </nav>
        </aside>

        {/* Main Content */}
        <main
          className="
            min-h-[calc(100vh-96px)]
            min-w-0
            flex-1
            overflow-x-hidden
            bg-transparent
          "
        >
          {children}
        </main>

      </div>
    </div>
  );
}