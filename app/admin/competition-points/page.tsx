"use client";

import {
  useEffect,
  useState,
} from "react";

type GameResult = {
  gameId: number;
  gameName: string;
  category: string | null;

  position: number;
  points: number;

  playerName: string;
};

type LeaderboardTeam = {
  rank: number;

  teamId: number;
  teamName: string;

  totalPoints: number;

  firstPlace: number;
  secondPlace: number;
  thirdPlace: number;

  gamesPlayed: number;

  games: GameResult[];
};

type Summary = {
  totalTeams: number;
  totalGames: number;
  completedResults: number;
  totalPoints: number;
};

export default function CompetitionPointsPage() {
  const [
    leaderboard,
    setLeaderboard,
  ] = useState<
    LeaderboardTeam[]
  >([]);

  const [
    summary,
    setSummary,
  ] = useState<Summary>({
    totalTeams: 0,
    totalGames: 0,
    completedResults: 0,
    totalPoints: 0,
  });

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [expandedTeam, setExpandedTeam] =
    useState<number | null>(null);

  // =====================================================
  // LOAD
  // =====================================================

  useEffect(() => {
    loadLeaderboard();
  }, []);

  async function loadLeaderboard() {
    try {
      setError("");

      const response =
        await fetch(
          "/api/competition-points",
          {
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ??
            "Failed to load leaderboard."
        );
      }

      setLeaderboard(
        data.leaderboard ?? []
      );

      setSummary(
        data.summary ?? {
          totalTeams: 0,
          totalGames: 0,
          completedResults: 0,
          totalPoints: 0,
        }
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load leaderboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // =====================================================
  // REFRESH
  // =====================================================

  async function handleRefresh() {
    setRefreshing(true);
    await loadLeaderboard();
  }

  // =====================================================
  // POSITION
  // =====================================================

  function getPositionLabel(
    position: number
  ) {
    if (position === 1) {
      return "1st";
    }

    if (position === 2) {
      return "2nd";
    }

    if (position === 3) {
      return "3rd";
    }

    return `${position}th`;
  }

  function getPositionMedal(
    position: number
  ) {
    if (position === 1) {
      return "🥇";
    }

    if (position === 2) {
      return "🥈";
    }

    if (position === 3) {
      return "🥉";
    }

    return "🏅";
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="font-semibold text-slate-700">
              Loading championship points...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="mb-6 rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-blue-700 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-3xl">
                  🏆
                </span>

                <span className="text-sm font-bold uppercase tracking-[0.2em] text-blue-200">
                  Sports Carnival
                </span>
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Championship Points
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-blue-100 sm:text-base">
                Overall team standings based on
                competition game results.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {refreshing
                ? "Refreshing..."
                : "↻ Refresh Points"}
            </button>
          </div>
        </div>

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* ================================================= */}
        {/* SUMMARY CARDS */}
        {/* ================================================= */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <SummaryCard
            title="Teams"
            value={summary.totalTeams}
            icon="👥"
            description="Teams in leaderboard"
          />

          <SummaryCard
            title="Games"
            value={summary.totalGames}
            icon="🎯"
            description="Games with results"
          />

          <SummaryCard
            title="Results"
            value={
              summary.completedResults
            }
            icon="📊"
            description="Positions recorded"
          />

          <SummaryCard
            title="Total Points"
            value={
              summary.totalPoints
            }
            icon="⭐"
            description="Points awarded"
          />
        </div>

        {/* ================================================= */}
        {/* PODIUM */}
        {/* ================================================= */}

        {leaderboard.length > 0 && (
          <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

            <div className="mb-6">
              <h2 className="text-xl font-black text-slate-900">
                Top Teams
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current championship leaders.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">

              {leaderboard
                .slice(0, 3)
                .map((team) => (
                  <PodiumCard
                    key={team.teamId}
                    team={team}
                  />
                ))}
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* LEADERBOARD */}
        {/* ================================================= */}

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-5 sm:p-7">
            <h2 className="text-xl font-black text-slate-900">
              Overall Leaderboard
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Teams ranked by total championship
              points.
            </p>
          </div>

          {/* Desktop table */}

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">
                    Rank
                  </th>

                  <th className="px-6 py-4">
                    Team
                  </th>

                  <th className="px-6 py-4 text-center">
                    🥇
                  </th>

                  <th className="px-6 py-4 text-center">
                    🥈
                  </th>

                  <th className="px-6 py-4 text-center">
                    🥉
                  </th>

                  <th className="px-6 py-4 text-center">
                    Games
                  </th>

                  <th className="px-6 py-4 text-right">
                    Points
                  </th>

                  <th className="px-6 py-4" />
                </tr>
              </thead>

              <tbody>
                {leaderboard.map(
                  (team) => (
                    <LeaderboardRow
                      key={
                        team.teamId
                      }
                      team={team}
                      expanded={
                        expandedTeam ===
                        team.teamId
                      }
                      onToggle={() =>
                        setExpandedTeam(
                          expandedTeam ===
                            team.teamId
                            ? null
                            : team.teamId
                        )
                      }
                    />
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}

          <div className="divide-y divide-slate-100 md:hidden">
            {leaderboard.map(
              (team) => (
                <MobileLeaderboardCard
                  key={
                    team.teamId
                  }
                  team={team}
                  expanded={
                    expandedTeam ===
                    team.teamId
                  }
                  onToggle={() =>
                    setExpandedTeam(
                      expandedTeam ===
                        team.teamId
                        ? null
                        : team.teamId
                    )
                  }
                />
              )
            )}
          </div>

          {/* Empty */}

          {leaderboard.length === 0 && (
            <div className="p-12 text-center">
              <div className="mb-3 text-5xl">
                🏆
              </div>

              <h3 className="font-bold text-slate-900">
                No competition results yet
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Save competition results to see
                the championship leaderboard.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// SUMMARY CARD
// =====================================================

function SummaryCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: number;
  icon: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-black text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// PODIUM CARD
// =====================================================

function PodiumCard({
  team,
}: {
  team: LeaderboardTeam;
}) {
  const rankStyle =
    team.rank === 1
      ? "border-amber-300 bg-gradient-to-br from-amber-50 to-white"
      : team.rank === 2
      ? "border-slate-300 bg-gradient-to-br from-slate-50 to-white"
      : "border-orange-200 bg-gradient-to-br from-orange-50 to-white";

  const medal =
    team.rank === 1
      ? "🥇"
      : team.rank === 2
      ? "🥈"
      : "🥉";

  return (
    <div
      className={`rounded-2xl border-2 p-5 ${rankStyle}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-4xl">
          {medal}
        </span>

        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500 shadow-sm">
          #{team.rank}
        </span>
      </div>

      <h3 className="mt-4 text-xl font-black text-slate-900">
        {team.teamName}
      </h3>

      <div className="mt-3 flex items-end gap-2">
        <span className="text-4xl font-black text-blue-700">
          {team.totalPoints}
        </span>

        <span className="mb-1 text-sm font-bold text-slate-500">
          points
        </span>
      </div>

      <div className="mt-4 flex gap-2 text-xs font-bold">
        <span className="rounded-lg bg-amber-100 px-2 py-1 text-amber-700">
          🥇 {team.firstPlace}
        </span>

        <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-700">
          🥈 {team.secondPlace}
        </span>

        <span className="rounded-lg bg-orange-100 px-2 py-1 text-orange-700">
          🥉 {team.thirdPlace}
        </span>
      </div>
    </div>
  );
}

// =====================================================
// DESKTOP ROW
// =====================================================

function LeaderboardRow({
  team,
  expanded,
  onToggle,
}: {
  team: LeaderboardTeam;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className={`border-b border-slate-100 transition hover:bg-slate-50 ${
          team.rank === 1
            ? "bg-amber-50/40"
            : ""
        }`}
      >
        <td className="px-6 py-5">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black ${
              team.rank === 1
                ? "bg-amber-100 text-amber-700"
                : team.rank === 2
                ? "bg-slate-200 text-slate-700"
                : team.rank === 3
                ? "bg-orange-100 text-orange-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {team.rank}
          </div>
        </td>

        <td className="px-6 py-5">
          <div className="font-black text-slate-900">
            {team.teamName}
          </div>

          <div className="mt-1 text-xs text-slate-400">
            {team.gamesPlayed} competition
            {team.gamesPlayed === 1
              ? ""
              : "s"} completed
          </div>
        </td>

        <td className="px-6 py-5 text-center font-bold text-amber-600">
          {team.firstPlace}
        </td>

        <td className="px-6 py-5 text-center font-bold text-slate-600">
          {team.secondPlace}
        </td>

        <td className="px-6 py-5 text-center font-bold text-orange-600">
          {team.thirdPlace}
        </td>

        <td className="px-6 py-5 text-center font-semibold text-slate-600">
          {team.gamesPlayed}
        </td>

        <td className="px-6 py-5 text-right">
          <span className="text-2xl font-black text-blue-700">
            {team.totalPoints}
          </span>

          <span className="ml-1 text-xs font-bold text-slate-400">
            pts
          </span>
        </td>

        <td className="px-6 py-5 text-right">
          <button
            type="button"
            onClick={onToggle}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            {expanded
              ? "Hide"
              : "Details"}
          </button>
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-slate-200 bg-slate-50">
          <td
            colSpan={8}
            className="px-6 py-5"
          >
            <GameDetails
              games={team.games}
            />
          </td>
        </tr>
      )}
    </>
  );
}

// =====================================================
// MOBILE CARD
// =====================================================

function MobileLeaderboardCard({
  team,
  expanded,
  onToggle,
}: {
  team: LeaderboardTeam;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`p-5 ${
        team.rank === 1
          ? "bg-amber-50/40"
          : ""
      }`}
    >
      <div className="flex items-center gap-4">

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-black ${
            team.rank === 1
              ? "bg-amber-100 text-amber-700"
              : team.rank === 2
              ? "bg-slate-200 text-slate-700"
              : team.rank === 3
              ? "bg-orange-100 text-orange-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          #{team.rank}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-black text-slate-900">
            {team.teamName}
          </h3>

          <p className="mt-1 text-xs text-slate-400">
            {team.gamesPlayed} game
            {team.gamesPlayed === 1
              ? ""
              : "s"}
          </p>
        </div>

        <div className="text-right">
          <p className="text-2xl font-black text-blue-700">
            {team.totalPoints}
          </p>

          <p className="text-[10px] font-bold uppercase text-slate-400">
            Points
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-2 text-xs font-bold">
          <span className="rounded-lg bg-amber-100 px-2 py-1 text-amber-700">
            🥇 {team.firstPlace}
          </span>

          <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-700">
            🥈 {team.secondPlace}
          </span>

          <span className="rounded-lg bg-orange-100 px-2 py-1 text-orange-700">
            🥉 {team.thirdPlace}
          </span>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600"
        >
          {expanded
            ? "Hide"
            : "Details"}
        </button>
      </div>

      {expanded && (
        <div className="mt-4">
          <GameDetails
            games={team.games}
          />
        </div>
      )}
    </div>
  );
}

// =====================================================
// GAME DETAILS
// =====================================================

function GameDetails({
  games,
}: {
  games: GameResult[];
}) {
  if (games.length === 0) {
    return (
      <div className="rounded-xl bg-white p-5 text-sm text-slate-500">
        No points earned yet.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h4 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
        Points Breakdown
      </h4>

      <div className="space-y-2">
        {games.map(
          (game, index) => (
            <div
              key={`${game.gameId}-${index}`}
              className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {getMedal(
                    game.position
                  )}
                </span>

                <div>
                  <p className="font-bold text-slate-900">
                    {game.gameName}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {game.category ??
                      "Competition"}
                    {" • "}
                    {getPosition(
                      game.position
                    )}
                    {" • "}
                    {game.playerName}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-lg font-black text-blue-700">
                  +{game.points}
                </span>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// =====================================================
// HELPERS
// =====================================================

function getMedal(
  position: number
) {
  if (position === 1) {
    return "🥇";
  }

  if (position === 2) {
    return "🥈";
  }

  if (position === 3) {
    return "🥉";
  }

  return "🏅";
}

function getPosition(
  position: number
) {
  if (position === 1) {
    return "1st place";
  }

  if (position === 2) {
    return "2nd place";
  }

  if (position === 3) {
    return "3rd place";
  }

  return `${position}th place`;
}