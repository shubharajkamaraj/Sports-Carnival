"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const menuItems = [
  {
    name: "🏠 Home",
    href: "/viewer",
  },
  {
    name: "🏆 Matches",
    href: "/viewer/matches",
  },
  {
    name: "📊 Points Table",
    href: "/viewer/points-table",
  },
  {
    name: "🏅 Standings",
    href: "/viewer/standings",
  },
  {
    name: "⭐ Overall Awards",
    href: "/viewer/overall-awards",
  },
  {
    name: "👥 Teams",
    href: "/viewer/teams",
  },
];

export default function ViewerSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* =====================================================
          MOBILE MENU BUTTON
          Visible ONLY on mobile/tablet
      ====================================================== */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="
          fixed
          left-4
          top-4
          z-[9999]
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-xl
          border
          border-white/20
          bg-[#111936]
          text-white
          shadow-lg
          lg:hidden
        "
        aria-label="Open menu"
      >
        <Menu size={26} />
      </button>

      {/* =====================================================
          MOBILE BACKDROP
      ====================================================== */}
      {open && (
        <div
          className="
            fixed
            inset-0
            z-[9997]
            bg-black/60
            lg:hidden
          "
          onClick={() => setOpen(false)}
        />
      )}

      {/* =====================================================
          SIDEBAR
          
          MOBILE:
          hidden by default
          opens when ☰ is clicked

          DESKTOP:
          always visible
      ====================================================== */}
      <aside
        className={`
          fixed
          left-0
          top-0
          z-[9998]
          flex
          h-screen
          w-[300px]
          flex-col
          border-r
          border-white/10
          bg-[#070b19]

          transform
          transition-transform
          duration-300
          ease-in-out

          ${
            open
              ? "translate-x-0"
              : "-translate-x-full"
          }

          lg:translate-x-0
        `}
      >

        {/* =====================================================
            LOGO AREA
        ====================================================== */}
        <div
          className="
            flex
            h-[123px]
            shrink-0
            items-center
            border-b
            border-white/10
            px-4
          "
        >
          <Image
            src="/team-logos/team-gc.jpg"
            alt="Team GC"
            width={80}
            height={80}
            className="
              h-20
              w-20
              shrink-0
              object-contain
            "
          />

          <div className="ml-5 min-w-0">
            <h1
              className="
                whitespace-nowrap
                font-serif
                text-3xl
                font-bold
                tracking-wide
                text-white
              "
            >
              TEAM GC
            </h1>

            <p
              className="
                mt-1
                whitespace-nowrap
                font-serif
                text-sm
                font-semibold
                tracking-[0.25em]
                text-slate-300
              "
            >
              SPORTS CARNIVAL
            </p>
          </div>

          {/* Close button - mobile only */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="
              ml-auto
              rounded-lg
              p-2
              text-slate-300
              hover:bg-white/10
              hover:text-white
              lg:hidden
            "
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        {/* =====================================================
            MENU ITEMS
        ====================================================== */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <div className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="
                  flex
                  min-h-[55px]
                  w-full
                  items-center
                  rounded-xl
                  px-4
                  py-3
                  font-serif
                  text-lg
                  text-slate-200
                  transition
                  hover:bg-white/10
                  hover:text-white
                "
              >
                {item.name}
              </Link>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}