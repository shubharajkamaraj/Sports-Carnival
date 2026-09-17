"use client";

import { Trophy, Users, CalendarDays, Medal } from "lucide-react";
import { motion } from "framer-motion";

const stats = [
  {
    title: "Teams",
    value: "16",
    icon: Trophy,
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "Players",
    value: "240",
    icon: Users,
    color: "bg-green-100 text-green-600",
  },
  {
    title: "Games",
    value: "6",
    icon: CalendarDays,
    color: "bg-orange-100 text-orange-600",
  },
  {
    title: "Matches",
    value: "48",
    icon: Medal,
    color: "bg-purple-100 text-purple-600",
  },
];

export default function Statistics() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">

        <div className="mb-14 text-center">
          <h2 className="text-4xl font-bold">
            Carnival Statistics
          </h2>

          <p className="mt-3 text-gray-500">
            Everything you need to know at a glance.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">

          {stats.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.15,
                }}
                viewport={{ once: true }}
                className="rounded-2xl border bg-white p-8 text-center shadow-md transition hover:-translate-y-2 hover:shadow-xl"
              >
                <div
                  className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${item.color}`}
                >
                  <Icon size={32} />
                </div>

                <h3 className="text-5xl font-bold text-slate-800">
                  {item.value}
                </h3>

                <p className="mt-3 text-lg text-gray-600">
                  {item.title}
                </p>
              </motion.div>
            );
          })}

        </div>
      </div>
    </section>
  );
}