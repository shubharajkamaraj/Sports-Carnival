import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: string;
}

export default function StatsCard({
  title,
  value,
  icon,
  color,
}: StatsCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-6 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm font-medium text-slate-400">
            {title}
          </p>

          <h2 className="mt-2 text-3xl font-bold text-white">
            {value}
          </h2>
        </div>

        <div
          className={`${color} rounded-xl p-4 text-white shadow-lg`}
        >
          {icon}
        </div>

      </div>
    </div>
  );
}