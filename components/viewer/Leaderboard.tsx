"use client";

import { Trophy } from "lucide-react";
import { motion } from "framer-motion";

const teams = [
  {
    rank: 1,
    team: "Team Alpha",
    played: 8,
    won: 7,
    lost: 1,
    points: 21,
  },
  {
    rank: 2,
    team: "Team Bravo",
    played: 8,
    won: 6,
    lost: 2,
    points: 18,
  },
  {
    rank: 3,
    team: "Team Warriors",
    played: 8,
    won: 5,
    lost: 3,
    points: 15,
  },
  {
    rank: 4,
    team: "Team Titans",
    played: 8,
    won: 4,
    lost: 4,
    points: 12,
  },
  {
    rank: 5,
    team: "Team Falcons",
    played: 8,
    won: 3,
    lost: 5,
    points: 9,
  },
];

export default function Leaderboard() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">

        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold">
            Tournament Leaderboard
          </h2>

          <p className="mt-3 text-gray-500">
            Current rankings of all participating teams.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl shadow-lg">

          <table className="w-full">

            <thead className="bg-blue-600 text-white">

              <tr>
                <th className="p-4 text-left">Rank</th>
                <th className="p-4 text-left">Team</th>
                <th className="p-4 text-center">Played</th>
                <th className="p-4 text-center">Won</th>
                <th className="p-4 text-center">Lost</th>
                <th className="p-4 text-center">Points</th>
              </tr>

            </thead>

            <tbody>

              {teams.map((team, index) => (

                <motion.tr
                  key={team.rank}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.1,
                  }}
                  viewport={{ once: true }}
                  className="border-b hover:bg-blue-50"
                >

                  <td className="p-4 font-bold">

                    {team.rank === 1 && (
                      <span className="flex items-center gap-2 text-yellow-500">
                        <Trophy size={18} />
                        #{team.rank}
                      </span>
                    )}

                    {team.rank !== 1 && <>#{team.rank}</>}

                  </td>

                  <td className="p-4 font-semibold">
                    {team.team}
                  </td>

                  <td className="p-4 text-center">
                    {team.played}
                  </td>

                  <td className="p-4 text-center">
                    {team.won}
                  </td>

                  <td className="p-4 text-center">
                    {team.lost}
                  </td>

                  <td className="p-4 text-center font-bold text-blue-600">
                    {team.points}
                  </td>

                </motion.tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>
    </section>
  );
}