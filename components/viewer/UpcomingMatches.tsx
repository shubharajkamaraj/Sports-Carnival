"use client";

import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const matches = [
  {
    game: "Football",
    team1: "Team Alpha",
    team2: "Team Bravo",
    date: "15 Aug 2026",
    time: "09:00 AM",
    venue: "Main Stadium",
  },
  {
    game: "Cricket",
    team1: "Team Warriors",
    team2: "Team Titans",
    date: "16 Aug 2026",
    time: "02:00 PM",
    venue: "Cricket Ground",
  },
  {
    game: "Handball",
    team1: "Team Falcons",
    team2: "Team Lions",
    date: "17 Aug 2026",
    time: "10:30 AM",
    venue: "Indoor Arena",
  },
];

export default function UpcomingMatches() {
  return (
    <section className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-6">

        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold text-slate-800">
            Upcoming Matches
          </h2>

          <p className="mt-3 text-gray-500">
            Stay updated with the upcoming fixtures.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {matches.map((match, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              viewport={{ once: true }}
              className="rounded-2xl bg-white p-6 shadow-lg transition hover:-translate-y-2 hover:shadow-2xl"
            >
              <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-600">
                {match.game}
              </span>

              <div className="my-8 flex items-center justify-between">
                <div className="text-center">
                  <h3 className="text-xl font-bold">{match.team1}</h3>
                </div>

                <div className="text-blue-600">
                  <ArrowRight size={28} />
                </div>

                <div className="text-center">
                  <h3 className="text-xl font-bold">{match.team2}</h3>
                </div>
              </div>

              <div className="space-y-3 text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar size={18} />
                  {match.date}
                </div>

                <div className="flex items-center gap-2">
                  <Clock size={18} />
                  {match.time}
                </div>

                <div className="flex items-center gap-2">
                  <MapPin size={18} />
                  {match.venue}
                </div>
              </div>

              <button className="mt-6 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700">
                View Details
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}