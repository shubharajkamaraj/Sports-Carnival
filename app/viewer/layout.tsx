"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const navItems = [
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

export default function ViewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="
        min-h-screen
        w-full
        overflow-x-hidden
        bg-[radial-gradient(circle_at_50%_40%,#263a70_0%,#111936_35%,#070b19_70%,#03050c_100%)]
        text-white
      "
    >
      {/* =====================================================
          HEADER
      ====================================================== */}
      <header
        className="
          sticky
          top-0
          z-[100]
          w-full
          border-b
          border-white/10
          bg-[#070b19]/95
          backdrop-blur-md
        "
      >
        <div
          className="
            mx-auto
            flex
            h-20
            w-full
            items-center
            px-4

            sm:h-24
            sm:px-6

            md:px-8

            lg:h-24
            lg:px-7
          "
        >
          {/* =================================================
              MOBILE / TABLET MENU BUTTON
          ================================================== */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            className="
              mr-3
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-white/10
              bg-[#111936]
              text-white
              shadow-lg
              transition
              hover:bg-[#1b274d]
              active:scale-95

              lg:hidden
            "
          >
            <Menu size={25} strokeWidth={2.5} />
          </button>

          {/* =================================================
              TEAM GC BRAND
          ================================================== */}
          <Link
            href="/viewer"
            onClick={() => setMenuOpen(false)}
            className="
              flex
              min-w-0
              items-center
              gap-3
              transition
              hover:opacity-90

              sm:gap-4
            "
          >
            {/* Logo */}
            <img
              src="/team-logos/team-gc-logo.png"
              alt="Team GC Logo"
              className="
                h-12
                w-12
                shrink-0
                object-contain

                sm:h-16
                sm:w-16
              "
            />

            {/* Brand */}
            <div className="flex min-w-0 flex-col justify-center">
              <span
                className="
                  truncate
                  text-xl
                  font-extrabold
                  leading-none
                  tracking-wide
                  text-white

                  sm:text-3xl
                "
              >
                TEAM GC
              </span>

              <span
                className="
                  mt-1
                  truncate
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.18em]
                  text-slate-300

                  sm:mt-2
                  sm:text-sm
                  sm:tracking-[0.28em]
                "
              >
                SPORTS CARNIVAL
              </span>
            </div>
          </Link>
        </div>
      </header>

      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}
      {menuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMenuOpen(false)}
          className="
            fixed
            inset-0
            z-[110]
            cursor-default
            bg-black/60
            backdrop-blur-[2px]

            lg:hidden
          "
        />
      )}

      {/* =====================================================
          PAGE LAYOUT
      ====================================================== */}
      <div className="flex min-h-[calc(100vh-80px)] sm:min-h-[calc(100vh-96px)]">

        {/* ===================================================
            SIDEBAR
        ==================================================== */}
        <aside
          className={`
            fixed
            left-0
            top-0
            z-[120]
            h-screen
            w-[280px]
            border-r
            border-white/10
            bg-[#070b19]
            shadow-2xl
            transition-transform
            duration-300
            ease-in-out

            lg:sticky
            lg:top-0
            lg:z-40
            lg:h-[calc(100vh-96px)]
            lg:w-64
            lg:translate-x-0
            lg:bg-[#070b19]/70
            lg:shadow-none
            lg:backdrop-blur-md

            ${
              menuOpen
                ? "translate-x-0"
                : "-translate-x-full"
            }
          `}
        >
          {/* =================================================
              MOBILE SIDEBAR HEADER
          ================================================== */}
          <div
            className="
              flex
              h-20
              items-center
              justify-between
              border-b
              border-white/10
              px-4

              sm:h-24

              lg:hidden
            "
          >
            <div className="flex min-w-0 items-center gap-3">
              <img
                src="/team-logos/team-gc-logo.png"
                alt="Team GC Logo"
                className="
                  h-12
                  w-12
                  shrink-0
                  object-contain
                "
              />

              <div className="min-w-0">
                <p
                  className="
                    truncate
                    text-lg
                    font-extrabold
                    text-white
                  "
                >
                  TEAM GC
                </p>

                <p
                  className="
                    truncate
                    text-[9px]
                    font-semibold
                    tracking-[0.15em]
                    text-slate-300
                  "
                >
                  SPORTS CARNIVAL
                </p>
              </div>
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close navigation menu"
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-lg
                text-slate-300
                transition
                hover:bg-white/10
                hover:text-white
              "
            >
              <X size={24} />
            </button>
          </div>

          {/* =================================================
              SIDEBAR NAVIGATION
          ================================================== */}
          <nav
            className="
              h-[calc(100vh-80px)]
              overflow-y-auto
              p-3

              sm:h-[calc(100vh-96px)]
              sm:p-4

              lg:h-full
            "
          >
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="
                    flex
                    min-h-[52px]
                    w-full
                    items-center
                    rounded-lg
                    px-4
                    py-3
                    text-sm
                    font-medium
                    text-slate-200
                    transition

                    hover:bg-white/10
                    hover:text-white

                    sm:text-base
                  "
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </nav>
        </aside>

        {/* ===================================================
            MAIN CONTENT
        ==================================================== */}
        <main
          className="
            min-h-[calc(100vh-80px)]
            min-w-0
            flex-1
            overflow-x-hidden

            sm:min-h-[calc(100vh-96px)]
          "
        >
          {children}
        </main>
      </div>
    </div>
  );
}