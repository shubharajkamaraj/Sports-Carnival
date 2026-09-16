"use client";

import { useEffect, useState } from "react";

// =====================================================
// TYPES
// =====================================================

type AwardPlayer = {
  playerId: number;
  playerName: string;

  teamId: number;
  teamName: string;

  matches: number;

  // Cricket
  runs?: number;
  wickets?: number;
  balls?: number;
  innings?: number;
  strikeRate?: number;
  runsConceded?: number;
  legalBalls?: number;
  overs?: string;
  economy?: number;

  // Football / Handball
  goals?: number;

  // Throwball
  points?: number;
};

type LeaderboardPlayer = AwardPlayer;

type AwardsResponse = {
  success: boolean;

  summary?: {
    completedMatches: number;
    cricketMatches: number;
    footballMatches: number;
    handballMatches: number;
    throwballMatches: number;
  };

  awards?: {
    bestBatter: AwardPlayer | null;
    bestBowler: AwardPlayer | null;
    bestFootballPlayer: AwardPlayer | null;
    bestHandballPlayer: AwardPlayer | null;
    bestThrowballPlayer: AwardPlayer | null;
  };

  leaderboards?: {
    cricketBatters: LeaderboardPlayer[];
    cricketBowlers: LeaderboardPlayer[];
    football: LeaderboardPlayer[];
    handball: LeaderboardPlayer[];
    throwball: LeaderboardPlayer[];
  };

  error?: string;
  message?: string;
};

type AwardCardProps = {
  title: string;
  sport: string;

  player: AwardPlayer | null;

  statLabel: string;
  statValue: number;

  icon: string;
};

// =====================================================
// PAGE
// =====================================================

export default function OverallAwardsPage() {
  const [data, setData] =
    useState<AwardsResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ===================================================
  // LOAD
  // ===================================================

  useEffect(() => {
    loadAwards();
  }, []);

  async function loadAwards() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/awards/overall",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const text =
        await response.text();

      let result: AwardsResponse;

      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(
          `Invalid API response: ${text.slice(
            0,
            300
          )}`
        );
      }

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "Failed to load overall awards"
        );
      }

      if (!result.success) {
        throw new Error(
          result?.error ||
            result?.message ||
            "Failed to load overall awards"
        );
      }

      setData(result);
    } catch (err) {
      console.error(
        "OVERALL AWARDS ERROR:",
        err
      );

      setData(null);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load overall awards"
      );
    } finally {
      setLoading(false);
    }
  }

  const awards =
    data?.awards;

  const leaderboards =
    data?.leaderboards;

  const summary =
    data?.summary;

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>
              <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
                Overall Awards
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Top performers across the Sports Carnival
              </p>
            </div>

            <button
              type="button"
              onClick={loadAwards}
              disabled={loading}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Refreshing..."
                : "Refresh"}
            </button>

          </div>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">

            <p className="text-sm font-semibold text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={loadAwards}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Retry
            </button>

          </div>
        )}

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">

            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="text-sm text-slate-500">
              Loading overall awards...
            </p>

          </div>
        ) : (
          <>
            {/* =================================================
                SUMMARY
            ================================================= */}

            {summary && (
              <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">

                <SummaryCard
                  label="Completed Matches"
                  value={
                    summary.completedMatches
                  }
                />

                <SummaryCard
                  label="Cricket"
                  value={
                    summary.cricketMatches
                  }
                />

                <SummaryCard
                  label="Football"
                  value={
                    summary.footballMatches
                  }
                />

                <SummaryCard
                  label="Handball"
                  value={
                    summary.handballMatches
                  }
                />

                <SummaryCard
                  label="Throwball"
                  value={
                    summary.throwballMatches
                  }
                />

              </div>
            )}

            {/* =================================================
                AWARDS
            ================================================= */}

            <div className="mb-10">

              <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-900">
                  Tournament Awards
                </h2>

                <p className="text-sm text-slate-500">
                  Best individual performers from completed matches
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

                {/* =========================================
                    CRICKET BATTER
                ========================================= */}

                <AwardCard
                  title="Overall Best Batter"
                  sport="CRICKET"
                  player={
                    awards?.bestBatter ??
                    null
                  }
                  statLabel="Runs"
                  statValue={
                    awards?.bestBatter?.runs ??
                    0
                  }
                  icon="🏏"
                />

                {/* =========================================
                    CRICKET BOWLER
                ========================================= */}

                <AwardCard
                  title="Overall Best Bowler"
                  sport="CRICKET"
                  player={
                    awards?.bestBowler ??
                    null
                  }
                  statLabel="Wickets"
                  statValue={
                    awards?.bestBowler?.wickets ??
                    0
                  }
                  icon="🎯"
                />

                {/* =========================================
                    FOOTBALL
                ========================================= */}

                <AwardCard
                  title="Best Football Player"
                  sport="FOOTBALL"
                  player={
                    awards?.bestFootballPlayer ??
                    null
                  }
                  statLabel="Goals"
                  statValue={
                    awards?.bestFootballPlayer
                      ?.goals ?? 0
                  }
                  icon="⚽"
                />

                {/* =========================================
                    HANDBALL
                ========================================= */}

                <AwardCard
                  title="Best Handball Player"
                  sport="HANDBALL"
                  player={
                    awards?.bestHandballPlayer ??
                    null
                  }
                  statLabel="Goals"
                  statValue={
                    awards?.bestHandballPlayer
                      ?.goals ?? 0
                  }
                  icon="🤾"
                />

                {/* =========================================
                    THROWBALL
                ========================================= */}

                <AwardCard
                  title="Best Throwball Player"
                  sport="THROWBALL"
                  player={
                    awards?.bestThrowballPlayer ??
                    null
                  }
                  statLabel="Points"
                  statValue={
                    awards?.bestThrowballPlayer
                      ?.points ?? 0
                  }
                  icon="🏐"
                />

              </div>
            </div>

            {/* =================================================
                CRICKET BATTING
            ================================================= */}

            <CricketBattingLeaderboard
              players={
                leaderboards?.cricketBatters ??
                []
              }
            />

            {/* =================================================
                CRICKET BOWLING
            ================================================= */}

            <CricketBowlingLeaderboard
              players={
                leaderboards?.cricketBowlers ??
                []
              }
            />

            {/* =================================================
                FOOTBALL
            ================================================= */}

            <LeaderboardSection
              title="Football Leaderboard"
              icon="⚽"
              players={
                leaderboards?.football ??
                []
              }
              statLabel="Goals"
              statKey="goals"
            />

            {/* =================================================
                HANDBALL
            ================================================= */}

            <LeaderboardSection
              title="Handball Leaderboard"
              icon="🤾"
              players={
                leaderboards?.handball ??
                []
              }
              statLabel="Goals"
              statKey="goals"
            />

            {/* =================================================
                THROWBALL
            ================================================= */}

            <LeaderboardSection
              title="Throwball Leaderboard"
              icon="🏐"
              players={
                leaderboards?.throwball ??
                []
              }
              statLabel="Points"
              statKey="points"
            />
          </>
        )}
      </div>
    </div>
  );
}

// =====================================================
// SUMMARY CARD
// =====================================================

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>

    </div>
  );
}

// =====================================================
// AWARD CARD
// =====================================================

function AwardCard({
  title,
  sport,
  player,
  statLabel,
  statValue,
  icon,
}: AwardCardProps) {
  const hasWinner =
    Boolean(player);

  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">

      {/* TOP */}

      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-2xl">
            {icon}
          </div>

          <div>
            <p className="font-bold text-slate-900">
              {title}
            </p>

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {sport}
            </p>
          </div>

        </div>

        {hasWinner && (
          <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-bold text-yellow-700">
            WINNER
          </span>
        )}

      </div>

      {/* PLAYER */}

      <div className="p-5">

        {player ? (
          <>
            <div className="mb-5 flex items-center gap-4">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
                {getInitials(
                  player.playerName
                )}
              </div>

              <div className="min-w-0">

                <h3 className="truncate text-lg font-bold text-slate-900">
                  {player.playerName}
                </h3>

                <p className="truncate text-sm text-slate-500">
                  {player.teamName}
                </p>

              </div>

            </div>

            <div className="grid grid-cols-2 gap-3">

              <div className="rounded-xl bg-slate-50 p-3">

                <p className="text-xs text-slate-500">
                  Matches
                </p>

                <p className="mt-1 text-lg font-bold text-slate-900">
                  {player.matches}
                </p>

              </div>

              <div className="rounded-xl bg-blue-50 p-3">

                <p className="text-xs text-blue-600">
                  {statLabel}
                </p>

                <p className="mt-1 text-lg font-bold text-blue-700">
                  {statValue}
                </p>

              </div>

            </div>
          </>
        ) : (
          <div className="py-6 text-center">

            <div className="mb-3 text-4xl">
              {icon}
            </div>

            <p className="font-semibold text-slate-600">
              No winner yet
            </p>

            <p className="mt-1 text-xs text-slate-400">
              More completed matches are required.
            </p>

          </div>
        )}

      </div>
    </div>
  );
}

// =====================================================
// CRICKET BATTING LEADERBOARD
// =====================================================

function CricketBattingLeaderboard({
  players,
}: {
  players: LeaderboardPlayer[];
}) {
  if (!players.length) {
    return null;
  }

  return (
    <div className="mb-8">

      <div className="mb-4 flex items-center gap-3">

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-xl">
          🏏
        </div>

        <div>
          <h2 className="font-bold text-slate-900">
            Cricket Batting Leaderboard
          </h2>

          <p className="text-xs text-slate-500">
            Runs scored across completed matches
          </p>
        </div>

      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[750px]">

            <thead>
              <tr className="bg-slate-100 text-xs font-bold uppercase tracking-wide text-slate-500">

                <th className="px-4 py-3 text-center">
                  #
                </th>

                <th className="px-4 py-3 text-left">
                  Player
                </th>

                <th className="px-4 py-3 text-left">
                  Team
                </th>

                <th className="px-4 py-3 text-center">
                  Matches
                </th>

                <th className="px-4 py-3 text-center">
                  Innings
                </th>

                <th className="px-4 py-3 text-center">
                  Runs
                </th>

                <th className="px-4 py-3 text-center">
                  Balls
                </th>

                <th className="px-4 py-3 text-center">
                  Strike Rate
                </th>

              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">

              {players.map(
                (player, index) => (
                  <tr
                    key={player.playerId}
                    className="hover:bg-slate-50"
                  >

                    <td className="px-4 py-3 text-center">
                      <RankBadge
                        index={index}
                      />
                    </td>

                    <td className="px-4 py-3">

                      <div className="font-semibold text-slate-900">
                        {player.playerName}
                      </div>

                    </td>

                    <td className="px-4 py-3 text-sm text-slate-500">
                      {player.teamName}
                    </td>

                    <td className="px-4 py-3 text-center text-sm text-slate-700">
                      {player.matches}
                    </td>

                    <td className="px-4 py-3 text-center text-sm text-slate-700">
                      {player.innings ?? 0}
                    </td>

                    <td className="px-4 py-3 text-center">

                      <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700">
                        {player.runs ?? 0}
                      </span>

                    </td>

                    <td className="px-4 py-3 text-center text-sm text-slate-700">
                      {player.balls ?? 0}
                    </td>

                    <td className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                      {(player.strikeRate ?? 0).toFixed(2)}
                    </td>

                  </tr>
                )
              )}

            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
}

// =====================================================
// CRICKET BOWLING LEADERBOARD
// =====================================================

function CricketBowlingLeaderboard({
  players,
}: {
  players: LeaderboardPlayer[];
}) {
  if (!players.length) {
    return null;
  }

  return (
    <div className="mb-8">

      <div className="mb-4 flex items-center gap-3">

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-xl">
          🎯
        </div>

        <div>
          <h2 className="font-bold text-slate-900">
            Cricket Bowling Leaderboard
          </h2>

          <p className="text-xs text-slate-500">
            Wickets taken across completed matches
          </p>
        </div>

      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[750px]">

            <thead>
              <tr className="bg-slate-100 text-xs font-bold uppercase tracking-wide text-slate-500">

                <th className="px-4 py-3 text-center">
                  #
                </th>

                <th className="px-4 py-3 text-left">
                  Player
                </th>

                <th className="px-4 py-3 text-left">
                  Team
                </th>

                <th className="px-4 py-3 text-center">
                  Matches
                </th>

                <th className="px-4 py-3 text-center">
                  Wickets
                </th>

                <th className="px-4 py-3 text-center">
                  Runs Conceded
                </th>

                <th className="px-4 py-3 text-center">
                  Overs
                </th>

                <th className="px-4 py-3 text-center">
                  Economy
                </th>

              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">

              {players.map(
                (player, index) => (
                  <tr
                    key={player.playerId}
                    className="hover:bg-slate-50"
                  >

                    <td className="px-4 py-3 text-center">
                      <RankBadge
                        index={index}
                      />
                    </td>

                    <td className="px-4 py-3">

                      <div className="font-semibold text-slate-900">
                        {player.playerName}
                      </div>

                    </td>

                    <td className="px-4 py-3 text-sm text-slate-500">
                      {player.teamName}
                    </td>

                    <td className="px-4 py-3 text-center text-sm text-slate-700">
                      {player.matches}
                    </td>

                    <td className="px-4 py-3 text-center">

                      <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700">
                        {player.wickets ?? 0}
                      </span>

                    </td>

                    <td className="px-4 py-3 text-center text-sm text-slate-700">
                      {player.runsConceded ?? 0}
                    </td>

                    <td className="px-4 py-3 text-center text-sm text-slate-700">
                      {player.overs ?? "0.0"}
                    </td>

                    <td className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                      {(player.economy ?? 0).toFixed(2)}
                    </td>

                  </tr>
                )
              )}

            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
}

// =====================================================
// OTHER SPORTS LEADERBOARD
// =====================================================

function LeaderboardSection({
  title,
  icon,
  players,
  statLabel,
  statKey,
}: {
  title: string;
  icon: string;

  players: LeaderboardPlayer[];

  statLabel: string;

  statKey: "goals" | "points";
}) {
  if (!players.length) {
    return null;
  }

  return (
    <div className="mb-8">

      <div className="mb-4 flex items-center gap-3">

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-xl">
          {icon}
        </div>

        <div>
          <h2 className="font-bold text-slate-900">
            {title}
          </h2>

          <p className="text-xs text-slate-500">
            Top performers
          </p>
        </div>

      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[650px]">

            <thead>
              <tr className="bg-slate-100 text-xs font-bold uppercase tracking-wide text-slate-500">

                <th className="px-4 py-3 text-center">
                  #
                </th>

                <th className="px-4 py-3 text-left">
                  Player
                </th>

                <th className="px-4 py-3 text-left">
                  Team
                </th>

                <th className="px-4 py-3 text-center">
                  Matches
                </th>

                <th className="px-4 py-3 text-center">
                  {statLabel}
                </th>

              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">

              {players.map(
                (player, index) => {

                  const statValue =
                    statKey === "goals"
                      ? player.goals ?? 0
                      : player.points ?? 0;

                  return (
                    <tr
                      key={player.playerId}
                      className="hover:bg-slate-50"
                    >

                      <td className="px-4 py-3 text-center">

                        <RankBadge
                          index={index}
                        />

                      </td>

                      <td className="px-4 py-3">

                        <div className="font-semibold text-slate-900">
                          {player.playerName}
                        </div>

                      </td>

                      <td className="px-4 py-3 text-sm text-slate-500">
                        {player.teamName}
                      </td>

                      <td className="px-4 py-3 text-center text-sm text-slate-700">
                        {player.matches}
                      </td>

                      <td className="px-4 py-3 text-center">

                        <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700">
                          {statValue}
                        </span>

                      </td>

                    </tr>
                  );
                }
              )}

            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
}

// =====================================================
// RANK BADGE
// =====================================================

function RankBadge({
  index,
}: {
  index: number;
}) {
  const className =
    index === 0
      ? "bg-yellow-100 text-yellow-700"
      : index === 1
      ? "bg-slate-200 text-slate-700"
      : index === 2
      ? "bg-orange-100 text-orange-700"
      : "bg-slate-100 text-slate-600";

  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${className}`}
    >
      {index + 1}
    </span>
  );
}

// =====================================================
// INITIALS
// =====================================================

function getInitials(
  name: string
) {
  if (!name) {
    return "?";
  }

  const parts =
    name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}