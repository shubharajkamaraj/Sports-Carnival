"use client";

import Link from "next/link";

const sections = [
  {
    href: "/viewer/matches",
    icon: "🏆",
    title: "Matches",
    description: "View live matches, upcoming matches and results.",
    action: "View Matches →",
  },
  {
    href: "/viewer/points-table",
    icon: "📊",
    title: "Points Table",
    description: "Check team points, wins, losses and standings.",
    action: "View Points Table →",
  },
  {
    href: "/viewer/standings",
    icon: "🏅",
    title: "Tournament Standings",
    description: "See the current tournament standings.",
    action: "View Standings →",
  },
  {
    href: "/viewer/competition-games",
    icon: "🎯",
    title: "Competition Games",
    description: "View the special competition games and results.",
    action: "View Competition Games →",
  },
  {
    href: "/viewer/overall-awards",
    icon: "⭐",
    title: "Overall Awards",
    description: "See the best players of the Sports Carnival.",
    action: "View Awards →",
  },
  {
    href: "/viewer/teams",
    icon: "👥",
    title: "Teams",
    description: "View participating teams and their players.",
    action: "View Teams →",
  },
];

export default function ViewerHome() {
  return (
    <main
      className="
        min-h-screen
        w-full
        overflow-x-hidden
        bg-[radial-gradient(circle_at_50%_40%,#263a70_0%,#111936_35%,#070b19_70%,#03050c_100%)]
        px-4
        pb-8
        pt-20
        text-white

        sm:px-6
        sm:pb-10
        sm:pt-20

        md:px-8
        md:pb-12
        md:pt-8

        lg:px-10
        lg:pb-14
        lg:pt-10

        xl:px-12
        xl:pb-16
        xl:pt-12
      "
    >
      <div className="mx-auto w-full max-w-7xl">

        {/* ================= HEADER ================= */}

        <header
          className="
            mb-6
            text-center

            sm:mb-8

            md:text-left

            lg:mb-10
          "
        >
          <h1
            className="
              break-words
              text-3xl
              font-bold
              leading-tight
              tracking-tight
              text-white

              sm:text-4xl

              md:text-4xl

              lg:text-5xl
            "
          >
            Sports Carnival
          </h1>

          <p
            className="
              mt-2
              text-sm
              leading-6
              text-slate-300

              sm:text-base

              md:text-base
            "
          >
            Welcome to the Sports Carnival
          </p>
        </header>

        {/* ================= CARDS ================= */}

        <section
          className="
            grid
            w-full
            grid-cols-1
            gap-4

            sm:grid-cols-2
            sm:gap-5

            lg:grid-cols-3
            lg:gap-6
          "
        >
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="
                group
                flex
                min-h-[220px]
                min-w-0
                flex-col
                overflow-hidden
                rounded-2xl
                border
                border-white/10
                bg-white/10
                p-5
                shadow-lg
                backdrop-blur-md
                transition-all
                duration-300

                hover:-translate-y-1
                hover:bg-white/15
                hover:shadow-xl

                active:scale-[0.98]

                sm:min-h-[230px]
                sm:p-6

                lg:min-h-[250px]
                lg:p-7

                xl:min-h-[260px]
              "
            >
              {/* Icon */}
              <div
                className="
                  mb-4
                  text-4xl
                  leading-none

                  sm:text-5xl
                "
              >
                {section.icon}
              </div>

              {/* Title */}
              <h2
                className="
                  break-words
                  text-lg
                  font-semibold
                  leading-7
                  text-white

                  sm:text-xl

                  lg:text-2xl
                "
              >
                {section.title}
              </h2>

              {/* Description */}
              <p
                className="
                  mt-2
                  break-words
                  text-sm
                  leading-6
                  text-slate-300

                  lg:text-base
                  lg:leading-7
                "
              >
                {section.description}
              </p>

              {/* Action */}
              <div
                className="
                  mt-auto
                  pt-5
                  text-sm
                  font-semibold
                  text-slate-200
                  transition-colors

                  group-hover:text-white
                "
              >
                {section.action}
              </div>
            </Link>
          ))}
        </section>

        {/* ================= BOTTOM INFORMATION ================= */}

        <section
          className="
            mt-6
            w-full
            overflow-hidden
            rounded-2xl
            border
            border-white/10
            bg-white/10
            p-5
            shadow-lg
            backdrop-blur-md

            sm:mt-8
            sm:p-6

            lg:mt-10
            lg:p-8
          "
        >
          <h2
            className="
              text-lg
              font-semibold
              text-white

              sm:text-xl

              lg:text-2xl
            "
          >
            Sports Carnival
          </h2>

          <p
            className="
              mt-2
              max-w-4xl
              text-sm
              leading-6
              text-slate-300

              sm:text-base
              sm:leading-7
            "
          >
            Follow the tournament, check match results, view team
            standings and discover the top performers.
          </p>
        </section>
      </div>
    </main>
  );
}