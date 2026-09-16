"use client";

import { Medal } from "lucide-react";
import { motion } from "framer-motion";

const medalData = [
  {
    team: "Team Alpha",
    gold: 8,
    silver: 4,
    bronze: 2,
  },
  {
    team: "Team Bravo",
    gold: 6,
    silver: 5,
    bronze: 3,
  },
  {
    team: "Team Titans",
    gold: 5,
    silver: 4,
    bronze: 4,
  },
  {
    team: "Team Falcons",
    gold: 4,
    silver: 3,
    bronze: 5,
  },
];

export default function MedalTally() {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-md">

      <div className="mb-6 flex items-center gap-3">
        <Medal className="text-yellow-500" />
        <h2 className="text-2xl font-bold">
          Medal Tally
        </h2>
      </div>

      <div className="overflow-x-auto">

        <table className="w-full">

          <thead className="border-b">

            <tr className="text-left">

              <th className="pb-4">Team</th>

              <th className="pb-4 text-center">🥇 Gold</th>

              <th className="pb-4 text-center">🥈 Silver</th>

              <th className="pb-4 text-center">🥉 Bronze</th>

              <th className="pb-4 text-center">Total</th>

            </tr>

          </thead>

          <tbody>

            {medalData.map((team, index) => (

              <motion.tr
                key={team.team}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.1,
                }}
                viewport={{ once: true }}
                className="border-b hover:bg-slate-50"
              >

                <td className="py-4 font-semibold">
                  {team.team}
                </td>

                <td className="text-center font-bold text-yellow-500">
                  {team.gold}
                </td>

                <td className="text-center font-bold text-gray-500">
                  {team.silver}
                </td>

                <td className="text-center font-bold text-orange-500">
                  {team.bronze}
                </td>

                <td className="text-center font-bold text-blue-600">
                  {team.gold + team.silver + team.bronze}
                </td>

              </motion.tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}