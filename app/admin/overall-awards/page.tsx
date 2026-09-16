"use client";

import { useEffect, useState } from "react";
import {
  Trophy,
  Medal,
  Target,
  Shield,
  Zap,
  RefreshCw,
  Users,
  Award,
} from "lucide-react";

type AwardPlayer = {
  playerId: number;
  playerName: string;
  teamName: string;
  matches: number;
  runs?: number;
  balls?: number;
  strikeRate?: number;
  wickets?: number;
  economy?: number;
  goals?: number;
  points?: number;
};

type AwardsResponse = {
  success: boolean;

  summary: {
    completedMatches: number;
    cricketMatches: number;
    footballMatches: number;
    handballMatches: number;
    throwballMatches: number;
  };

  awards: {
    bestBatter: AwardPlayer | null;
    bestBowler: AwardPlayer | null;
    bestFootballPlayer: AwardPlayer | null;
    bestHandballPlayer: AwardPlayer | null;
    bestThrowballPlayer: AwardPlayer | null;
  };
};

type AwardCardProps = {
  icon: React.ReactNode;
  sport: string;
  title: string;
  player: AwardPlayer | null;
  accent: string;
  statLabel: string;
  statValue: string;
  secondaryLabel: string;
  secondaryValue: string;
};

function AwardCard({
  icon,
  sport,
  title,
  player,
  accent,
  statLabel,
  statValue,
  secondaryLabel,
  secondaryValue,
}: AwardCardProps) {
  return (
    <div
      className="
        group
        flex
        h-full
        min-h-[330px]
        flex-col
        overflow-hidden
        rounded-3xl
        border
        border-zinc-800
        bg-zinc-950
        shadow-lg
        shadow-black/30
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-zinc-700
        hover:shadow-2xl
        hover:shadow-black/50
      "
    >
      {/* Top accent */}
      <div className={`h-1.5 w-full ${accent}`} />

      <div className="flex flex-1 flex-col p-5">
        {/* Sport + trophy */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-zinc-300">
              {icon}
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                {sport}
              </p>

              <p className="truncate text-sm font-semibold text-zinc-200">
                {title}
              </p>
            </div>
          </div>

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
            <Trophy size={18} />
          </div>
        </div>

        {/* Player available */}
        {player ? (
          <>
            {/* Player details */}
            <div className="mb-5">
              <h2 className="truncate text-xl font-extrabold tracking-tight text-white">
                {player.playerName}
              </h2>

              <div className="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-400">
                <Users size={14} />

                <span className="truncate">{player.teamName}</span>
              </div>
            </div>

            {/* Main statistics */}
            <div className="mt-auto rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    {statLabel}
                  </p>

                  <p className="mt-1 text-2xl font-black text-white">
                    {statValue}
                  </p>
                </div>

                <div className="border-l border-zinc-800 pl-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    {secondaryLabel}
                  </p>

                  <p className="mt-1 text-2xl font-black text-white">
                    {secondaryValue}
                  </p>
                </div>
              </div>
            </div>

            {/* Matches */}
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-zinc-500">Matches played</span>

              <span className="font-bold text-zinc-300">
                {player.matches}
              </span>
            </div>
          </>
        ) : (
          /* No winner */
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 text-zinc-600">
              <Award size={28} />
            </div>

            <p className="font-semibold text-zinc-400">
              No award winner yet
            </p>

            <p className="mt-1 max-w-[190px] text-xs leading-5 text-zinc-600">
              Complete matches to calculate this award.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-zinc-800
        bg-zinc-900
        px-4
        py-3
        shadow-md
        shadow-black/20
      "
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

export default function OverallAwardsPage() {
  const [data, setData] = useState<AwardsResponse | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  async function loadAwards() {
    try {
      setLoading(true);

      setError("");

      const response = await fetch("/api/awards/overall", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load overall awards");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.error || "Failed to load awards"
        );
      }

      setData(result);
    } catch (err) {
      console.error("Overall awards error:", err);

      setError("Unable to load overall awards.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAwards();
  }, []);

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-black px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1700px]">
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="h-7 w-64 animate-pulse rounded-lg bg-zinc-900" />

            <div className="mt-3 h-4 w-96 animate-pulse rounded bg-zinc-900" />
          </div>

          {/* Summary skeleton */}
          <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-[75px] animate-pulse rounded-2xl bg-zinc-900"
              />
            ))}
          </div>

          {/* Award skeleton */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-[330px] animate-pulse rounded-3xl bg-zinc-950"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* =========================
     ERROR
  ========================= */

  if (error) {
    return (
      <div className="min-h-screen bg-black px-4 py-8">
        <div className="mx-auto max-w-[700px] rounded-3xl border border-red-900/50 bg-zinc-950 p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400">
            <Award size={26} />
          </div>

          <h2 className="text-xl font-bold text-white">
            Unable to load awards
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            {error}
          </p>

          <button
            onClick={loadAwards}
            className="
              mt-6
              inline-flex
              items-center
              gap-2
              rounded-xl
              bg-white
              px-5
              py-2.5
              text-sm
              font-bold
              text-black
              transition
              hover:bg-zinc-200
            "
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const {
    bestBatter,
    bestBowler,
    bestFootballPlayer,
    bestHandballPlayer,
    bestThrowballPlayer,
  } = data.awards;

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-[1700px] px-4 py-6 sm:px-6 lg:px-8">
        {/* =========================
            HEADER
        ========================= */}

        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            {/* Tournament label */}
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
              <Medal size={14} />

              Sports Carnival • Season 1
            </div>

            {/* Heading */}
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Overall Awards
            </h1>

            <p className="mt-1.5 text-sm text-zinc-500">
              Celebrating the outstanding individual performers
              across every sport.
            </p>
          </div>

          {/* Refresh button */}
          <button
            onClick={loadAwards}
            className="
              inline-flex
              w-fit
              items-center
              gap-2
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              px-4
              py-2.5
              text-sm
              font-semibold
              text-zinc-300
              shadow-lg
              shadow-black/30
              transition
              hover:border-zinc-700
              hover:bg-zinc-900
              hover:text-white
            "
          >
            <RefreshCw size={16} />

            Refresh Awards
          </button>
        </div>

        {/* =========================
            SUMMARY
        ========================= */}

        <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <SummaryItem
            label="Completed Matches"
            value={data.summary.completedMatches}
          />

          <SummaryItem
            label="Cricket"
            value={data.summary.cricketMatches}
          />

          <SummaryItem
            label="Football"
            value={data.summary.footballMatches}
          />

          <SummaryItem
            label="Handball"
            value={data.summary.handballMatches}
          />

          <SummaryItem
            label="Throwball"
            value={data.summary.throwballMatches}
          />
        </div>

        {/* =========================
            ALL 5 AWARDS
            EXACT SAME CARD SIZE
        ========================= */}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {/* 1. BEST BATTER */}
          <AwardCard
            icon={<Target size={20} />}
            sport="Cricket"
            title="Best Batter"
            player={bestBatter}
            accent="bg-emerald-500"
            statLabel="Runs"
            statValue={
              bestBatter
                ? String(bestBatter.runs ?? 0)
                : "—"
            }
            secondaryLabel="Strike Rate"
            secondaryValue={
              bestBatter
                ? Number(
                    bestBatter.strikeRate ?? 0
                  ).toFixed(1)
                : "—"
            }
          />

          {/* 2. BEST BOWLER */}
          <AwardCard
            icon={<Shield size={20} />}
            sport="Cricket"
            title="Best Bowler"
            player={bestBowler}
            accent="bg-blue-500"
            statLabel="Wickets"
            statValue={
              bestBowler
                ? String(bestBowler.wickets ?? 0)
                : "—"
            }
            secondaryLabel="Economy"
            secondaryValue={
              bestBowler
                ? Number(
                    bestBowler.economy ?? 0
                  ).toFixed(2)
                : "—"
            }
          />

          {/* 3. BEST FOOTBALL PLAYER */}
          <AwardCard
            icon={<Zap size={20} />}
            sport="Football"
            title="Best Player"
            player={bestFootballPlayer}
            accent="bg-orange-500"
            statLabel="Goals"
            statValue={
              bestFootballPlayer
                ? String(
                    bestFootballPlayer.goals ?? 0
                  )
                : "—"
            }
            secondaryLabel="Matches"
            secondaryValue={
              bestFootballPlayer
                ? String(bestFootballPlayer.matches)
                : "—"
            }
          />

          {/* 4. BEST HANDBALL PLAYER */}
          <AwardCard
            icon={<Zap size={20} />}
            sport="Handball"
            title="Best Player"
            player={bestHandballPlayer}
            accent="bg-red-500"
            statLabel="Goals"
            statValue={
              bestHandballPlayer
                ? String(
                    bestHandballPlayer.goals ?? 0
                  )
                : "—"
            }
            secondaryLabel="Matches"
            secondaryValue={
              bestHandballPlayer
                ? String(bestHandballPlayer.matches)
                : "—"
            }
          />

          {/* 5. BEST THROWBALL PLAYER */}
          <AwardCard
            icon={<Target size={20} />}
            sport="Throwball"
            title="Best Player"
            player={bestThrowballPlayer}
            accent="bg-purple-500"
            statLabel="Points"
            statValue={
              bestThrowballPlayer
                ? String(
                    bestThrowballPlayer.points ?? 0
                  )
                : "—"
            }
            secondaryLabel="Matches"
            secondaryValue={
              bestThrowballPlayer
                ? String(bestThrowballPlayer.matches)
                : "—"
            }
          />
        </div>

        {/* =========================
            INFORMATION FOOTER
        ========================= */}

        <div
          className="
            mt-7
            flex
            items-start
            gap-3
            rounded-2xl
            border
            border-zinc-800
            bg-zinc-950
            p-4
            shadow-lg
            shadow-black/20
          "
        >
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
            <Trophy size={16} />
          </div>

          <div>
            <p className="text-sm font-bold text-zinc-200">
              Individual performance awards
            </p>

            <p className="mt-0.5 text-xs leading-5 text-zinc-500">
              Awards are calculated from completed match
              performances and are independent of the winning
              team. Penalty goals are excluded from football
              and handball award calculations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

