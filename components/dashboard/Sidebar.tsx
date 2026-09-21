
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserRound,
  Trophy,
  CalendarDays,
  ListOrdered,
  X,
} from "lucide-react";

const menu = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin/dashboard",
  },
  {
    title: "Teams",
    icon: Users,
    href: "/admin/teams",
  },
  {
    title: "Players",
    icon: UserRound,
    href: "/admin/players",
  },
  {
    title: "Games",
    icon: Trophy,
    href: "/admin/games",
  },
  {
    title: "Matches",
    icon: CalendarDays,
    href: "/admin/matches",
  },
  {
    title: "Event Games",
    icon: Trophy,
    href: "/admin/results",
  },
  {
    title: "Points Table",
    icon: ListOrdered,
    href: "/admin/points-table",
  },
  {
    title: "Points Assignment",
    icon: Trophy,
    href: "/admin/points-assignment",
  },
  {
    title: "Tournament Standings",
    icon: Trophy,
    href: "/admin/tournament-standings",
  },
  {
    title: "Overall Awards",
    icon: Trophy,
    href: "/admin/overall-awards",
  },
];

type SidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({
  mobileOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50
          h-screen w-72
          bg-slate-900 text-white
          shadow-xl
          transition-transform duration-300
          lg:sticky lg:top-0 lg:z-30
          lg:block lg:translate-x-0
          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 p-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-400">
              Sports Carnival
            </h1>

            <p className="text-sm text-slate-400">
              Team GC
            </p>
          </div>

          {/* Mobile Close */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 overflow-y-auto px-4 pb-6">
          {menu.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.title}
                href={item.href}
                onClick={onClose}
                className={`mb-2 flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Icon size={20} />

                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

