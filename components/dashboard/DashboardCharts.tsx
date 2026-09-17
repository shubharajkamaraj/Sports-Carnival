"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const matchData = [
  { game: "Football", matches: 12 },
  { game: "Cricket", matches: 8 },
  { game: "Handball", matches: 10 },
  { game: "Throwball", matches: 6 },
  { game: "Relay", matches: 5 },
  { game: "Tug of War", matches: 7 },
];

const playerData = [
  { name: "Boys", value: 160 },
  { name: "Girls", value: 80 },
];

const COLORS = [
  "#2563EB",
  "#10B981",
];

export default function DashboardCharts() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">

      {/* Bar Chart */}

      <div className="rounded-2xl bg-white p-6 shadow-md">

        <h2 className="mb-6 text-xl font-bold">
          Matches by Game
        </h2>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={matchData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="game" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="matches" fill="#2563EB" radius={[8,8,0,0]} />
          </BarChart>
        </ResponsiveContainer>

      </div>

      {/* Pie Chart */}

      <div className="rounded-2xl bg-white p-6 shadow-md">

        <h2 className="mb-6 text-xl font-bold">
          Player Distribution
        </h2>

        <ResponsiveContainer width="100%" height={300}>
          <PieChart>

            <Pie
              data={playerData}
              dataKey="value"
              outerRadius={110}
              label
            >

              {playerData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}

            </Pie>

            <Tooltip />

          </PieChart>
        </ResponsiveContainer>

      </div>

    </div>
  );
}