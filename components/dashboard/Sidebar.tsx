"use client";

import Image from "next/image";
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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50
          h-screen w-72
          overflow-hidden
          border-r border-white/10
          bg-transparent
          text-white
          shadow-2xl
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
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5 py-5">
          {/* Logo + Text */}
          <div className="flex min-w-0 items-center gap-3">
            {/* Team GC Logo */}
            <div className="relative h-14 w-14 shrink-0">
              <Image
                src="/team-logos/team-gc-logo.png"
                alt="Team GC"
                fill
                priority
                sizes="56px"
                className="object-contain"
              />
            </div>

            {/* Text */}
            <div className="flex min-w-0 flex-col leading-none">
              <h1 className="truncate text-2xl font-black tracking-wide text-white">
                TEAM GC
              </h1>

              <p className="mt-1 text-[9px] font-bold tracking-[0.22em] text-slate-300">
                SPORTS CARNIVAL
              </p>
            </div>
          </div>

          {/* Mobile Close */}
          <button
            type="button"
            onClick={onClose}
            className="ml-2 shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-5 h-[calc(100vh-100px)] overflow-y-auto px-4 pb-6">
          {menu.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.title}
                href={item.href}
                onClick={onClose}
                className={`mb-2 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
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