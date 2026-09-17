import Link from "next/link";

export default function ViewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white">
        <div className="flex h-16 items-center justify-between px-6">
          <Link
            href="/viewer"
            className="text-xl font-bold text-slate-900"
          >
            Sports Carnival
          </Link>

          <div className="text-sm font-medium text-slate-500">
            Viewer
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-white">
          <nav className="space-y-1 p-4">

            <Link
              href="/viewer"
              className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              🏠 Home
            </Link>

            <Link
              href="/viewer/matches"
              className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              🏆 Matches
            </Link>

            <Link
              href="/viewer/points-table"
              className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              📊 Points Table
            </Link>

            <Link
              href="/viewer/standings"
              className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              🏅 Standings
            </Link>
            <Link
              href="/viewer/overall-awards"
              className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              ⭐ Overall Awards
            </Link>

            <Link
              href="/viewer/teams"
              className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              👥 Teams
            </Link>

          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}