"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserRound,
  Trophy,
  CalendarDays,
  ClipboardList,
  Medal,
  Image,
  BarChart3,
  Settings,
  Radio,
    ListOrdered,
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
//   {
//   title: "Live Matches",
//   href: "/admin/live-matches",
//   icon: Radio,
// },
//   {
//     title: "Medals",
//     icon: Medal,
//     href: "/admin/medals",
//   },
//   {
//     title: "Gallery",
//     icon: Image,
//     href: "/admin/gallery",
//   },
//   {
//     title: "Analytics",
//     icon: BarChart3,
//     href: "/admin/analytics",
//   },
//   {
//     title: "Settings",
//     icon: Settings,
//     href: "/admin/settings",
//   },
  {
  title: "Points Table",
  href: "/admin/points-table",
  icon: ListOrdered,
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
},{
  title: "Overall Awards",
  href: "/admin/overall-awards",
  icon: Trophy,
}
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 bg-slate-900 text-white lg:block">
      <div className="border-b border-slate-700 p-6">
        <h1 className="text-2xl font-bold text-blue-400">
          Sports Carnival
        </h1>
        <p className="text-sm text-slate-400">
          Team GC
        </p>
      </div>

      <nav className="mt-6 px-4">
        {menu.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.title}
              href={item.href}
              className={`mb-2 flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Icon size={20} />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}