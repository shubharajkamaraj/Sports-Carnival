import Link from "next/link";
import {
  Users,
  UserRound,
  Trophy,
  CalendarDays,
  Radio,
  CheckCircle2,
  Clock3,
  Medal,
  ClipboardList,
  Award,
  Plus,
  ArrowRight,
} from "lucide-react";

type DashboardStats = {
  teams: number;
  players: number;
  games: number;
  matches: number;
  upcomingMatches: number;
  liveMatches: number;
  completedMatches: number;
};

type StandingsTeam = {
  rank: number;
  teamId: number;
  teamName: string;
  gamesPlayed: number;
  points: number;
};

type UpcomingMatch = {
  id: number;
  matchNumber: number | null;
  stage: "LEAGUE" | "THIRD_PLACE" | "FINAL";
  status: "UPCOMING" | "LIVE" | "COMPLETED" | "CANCELLED";
  game: {
    id: number;
    name: string;
    sportType: string | null;
  };
  team1: {
    id: number;
    name: string;
  };
  team2: {
    id: number;
    name: string;
  };
};

async function getDashboardData() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const response = await fetch(`${baseUrl}/api/dashboard`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to load dashboard data");
    }

    return await response.json();
  } catch (error) {
    console.error("Dashboard fetch error:", error);

    return {
      stats: {
        teams: 0,
        players: 0,
        games: 0,
        matches: 0,
        upcomingMatches: 0,
        liveMatches: 0,
        completedMatches: 0,
      },
      standings: [],
      upcomingMatches: [],
    };
  }
}

function stageLabel(stage: string) {
  switch (stage) {
    case "FINAL":
      return "Final";

    case "THIRD_PLACE":
      return "3rd Place";

    default:
      return "League";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "LIVE":
      return "Live";

    case "COMPLETED":
      return "Completed";

    case "CANCELLED":
      return "Cancelled";

    default:
      return "Upcoming";
  }
}

function statusClass(status: string) {
  switch (status) {
    case "LIVE":
      return "bg-red-500/15 text-red-300 border border-red-400/20";

    case "COMPLETED":
      return "bg-green-500/15 text-green-300 border border-green-400/20";

    case "CANCELLED":
      return "bg-white/10 text-slate-300 border border-white/10";

    default:
      return "bg-blue-500/15 text-blue-300 border border-blue-400/20";
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  const stats: DashboardStats = data.stats;
  const standings: StandingsTeam[] = data.standings;
  const upcomingMatches: UpcomingMatch[] = data.upcomingMatches;

  const totalMatches = stats.matches;
  const completedMatches = stats.completedMatches;

  const progress =
    totalMatches > 0
      ? Math.round((completedMatches / totalMatches) * 100)
      : 0;

  return (
    <div
      className="
        min-h-screen
        w-full
        bg-transparent
        px-4
        py-6
        text-white
        sm:px-6
        lg:px-8
      "
    >
      <div className="mx-auto max-w-[1600px] space-y-7">

        {/* HEADER */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Sports Carnival Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-300">
              Manage teams, matches, tournament standings and awards.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            <Link
              href="/admin/matches"
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-white/10
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
                ring-1
                ring-white/10
                backdrop-blur-md
                transition
                hover:bg-white/15
              "
            >
              <CalendarDays size={17} />
              Manage Matches
            </Link>

            <Link
              href="/admin/points-assignment"
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-blue-600
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-blue-700
              "
            >
              <Trophy size={17} />
              Points Assignment
            </Link>

          </div>
        </div>

        {/* MAIN STATISTICS */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Teams"
            value={stats.teams}
            icon={<Users size={21} />}
            description="Registered tournament teams"
            iconClass="bg-blue-500/15 text-blue-300"
          />

          <StatCard
            title="Players"
            value={stats.players}
            icon={<UserRound size={21} />}
            description="Players across all teams"
            iconClass="bg-green-500/15 text-green-300"
          />

          <StatCard
            title="Games"
            value={stats.games}
            icon={<Trophy size={21} />}
            description="Sports and competition games"
            iconClass="bg-orange-500/15 text-orange-300"
          />

          <StatCard
            title="Matches"
            value={stats.matches}
            icon={<CalendarDays size={21} />}
            description="Total tournament matches"
            iconClass="bg-purple-500/15 text-purple-300"
          />

        </div>

        {/* MATCH STATUS */}
        <div className="grid gap-4 sm:grid-cols-3">

          <StatusCard
            title="Upcoming"
            value={stats.upcomingMatches}
            icon={<Clock3 size={20} />}
            className="bg-blue-500/10 text-blue-300 border-blue-400/20"
          />

          <StatusCard
            title="Live Matches"
            value={stats.liveMatches}
            icon={<Radio size={20} />}
            className="bg-red-500/10 text-red-300 border-red-400/20"
          />

          <StatusCard
            title="Completed"
            value={stats.completedMatches}
            icon={<CheckCircle2 size={20} />}
            className="bg-green-500/10 text-green-300 border-green-400/20"
          />

        </div>

        {/* TOURNAMENT PROGRESS */}
        <div className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-lg backdrop-blur-md">

          <div className="mb-4 flex items-center justify-between">

            <div>
              <h2 className="text-lg font-bold text-white">
                Tournament Progress
              </h2>

              <p className="mt-1 text-sm text-slate-300">
                Overall match completion
              </p>
            </div>

            <div className="text-right">
              <p className="text-2xl font-bold text-white">
                {progress}%
              </p>

              <p className="text-xs text-slate-400">
                {completedMatches} of {totalMatches} matches
              </p>
            </div>

          </div>

          <div className="h-3 overflow-hidden rounded-full bg-white/10">

            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{
                width: `${progress}%`,
              }}
            />

          </div>

        </div>

        {/* TWO COLUMN SECTION */}
        <div className="grid gap-6 xl:grid-cols-2">

          {/* TOURNAMENT STANDINGS */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-lg backdrop-blur-md">

            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">

              <div>
                <h2 className="text-lg font-bold text-white">
                  Tournament Standings
                </h2>

                <p className="text-xs text-slate-400">
                  Overall points ranking
                </p>
              </div>

              <Link
                href="/admin/tournament-standings"
                className="inline-flex items-center gap-1 text-sm font-semibold text-blue-300 hover:text-blue-200"
              >
                View all
                <ArrowRight size={15} />
              </Link>

            </div>

            {standings.length === 0 ? (

              <div className="px-5 py-10 text-center">

                <Trophy
                  size={30}
                  className="mx-auto mb-3 text-slate-500"
                />

                <p className="text-sm font-medium text-slate-300">
                  No points assigned yet.
                </p>

                <Link
                  href="/admin/points-assignment"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-300"
                >
                  Assign Points
                  <ArrowRight size={14} />
                </Link>

              </div>

            ) : (

              <div className="divide-y divide-white/10">

                {standings.slice(0, 5).map((team) => (

                  <div
                    key={team.teamId}
                    className="flex items-center justify-between px-5 py-3.5 transition hover:bg-white/5"
                  >

                    <div className="flex items-center gap-3">

                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                          team.rank === 1
                            ? "bg-yellow-500/15 text-yellow-300"
                            : team.rank === 2
                            ? "bg-white/10 text-slate-200"
                            : team.rank === 3
                            ? "bg-orange-500/15 text-orange-300"
                            : "bg-blue-500/15 text-blue-300"
                        }`}
                      >
                        {team.rank}
                      </div>

                      <div>
                        <p className="font-semibold text-white">
                          {team.teamName}
                        </p>

                        <p className="text-xs text-slate-400">
                          {team.gamesPlayed}{" "}
                          {team.gamesPlayed === 1 ? "game" : "games"}
                        </p>
                      </div>

                    </div>

                    <div className="text-right">

                      <p className="text-lg font-bold text-white">
                        {team.points}
                      </p>

                      <p className="text-[11px] text-slate-400">
                        points
                      </p>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </div>

          {/* UPCOMING MATCHES */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-lg backdrop-blur-md">

            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">

              <div>
                <h2 className="text-lg font-bold text-white">
                  Matches
                </h2>

                <p className="text-xs text-slate-400">
                  Upcoming tournament fixtures
                </p>
              </div>

              <Link
                href="/admin/matches"
                className="inline-flex items-center gap-1 text-sm font-semibold text-blue-300 hover:text-blue-200"
              >
                Manage
                <ArrowRight size={15} />
              </Link>

            </div>

            {upcomingMatches.length === 0 ? (

              <div className="px-5 py-10 text-center">

                <CalendarDays
                  size={30}
                  className="mx-auto mb-3 text-slate-500"
                />

                <p className="text-sm font-medium text-slate-300">
                  No upcoming matches.
                </p>

              </div>

            ) : (

              <div className="divide-y divide-white/10">

                {upcomingMatches.slice(0, 5).map((match) => (

                  <Link
                    key={match.id}
                    href={`/admin/matches/${match.id}`}
                    className="block px-5 py-3.5 transition hover:bg-white/5"
                  >

                    <div className="flex items-center justify-between gap-4">

                      <div className="min-w-0">

                        <div className="mb-1 flex items-center gap-2">

                          <span className="truncate text-xs font-semibold uppercase tracking-wide text-blue-300">
                            {match.game.name}
                          </span>

                          <span className="text-slate-500">
                            •
                          </span>

                          <span className="text-xs text-slate-400">
                            {stageLabel(match.stage)}
                          </span>

                        </div>

                        <p className="truncate text-sm font-semibold text-white">
                          {match.team1.name}
                          <span className="mx-2 text-slate-500">
                            vs
                          </span>
                          {match.team2.name}
                        </p>

                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                          match.status
                        )}`}
                      >
                        {statusLabel(match.status)}
                      </span>

                    </div>

                  </Link>

                ))}

              </div>

            )}

          </div>

        </div>

        {/* QUICK ACTIONS */}
        <div>

          <div className="mb-4">

            <h2 className="text-lg font-bold text-white">
              Quick Actions
            </h2>

            <p className="text-sm text-slate-300">
              Frequently used organizer tools
            </p>

          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

            <QuickAction
              href="/admin/teams"
              icon={<Users size={20} />}
              title="Add Team"
              description="Manage teams"
              className="bg-blue-600"
            />

            <QuickAction
              href="/admin/players"
              icon={<UserRound size={20} />}
              title="Add Player"
              description="Manage players"
              className="bg-green-600"
            />

            <QuickAction
              href="/admin/matches"
              icon={<Plus size={20} />}
              title="Create Match"
              description="Schedule match"
              className="bg-orange-600"
            />

            <QuickAction
              href="/admin/points-assignment"
              icon={<ClipboardList size={20} />}
              title="Assign Points"
              description="Game results"
              className="bg-purple-600"
            />

            <QuickAction
              href="/admin/overall-awards"
              icon={<Award size={20} />}
              title="Overall Awards"
              description="Best players"
              className="bg-gray-900"
            />

          </div>

        </div>

        {/* FOOTER SHORTCUTS */}
        <div className="grid gap-4 md:grid-cols-3">

          <FooterShortcut
            href="/admin/points-table"
            icon={<Trophy size={22} />}
            iconClass="text-blue-300"
            title="Points Table"
            description="View game-wise points distribution."
            textClass="text-blue-300"
          />

          <FooterShortcut
            href="/admin/tournament-standings"
            icon={<Medal size={22} />}
            iconClass="text-green-300"
            title="Tournament Standings"
            description="Overall team ranking across all games."
            textClass="text-green-300"
          />

          <FooterShortcut
            href="/admin/overall-awards"
            icon={<Award size={22} />}
            iconClass="text-orange-300"
            title="Overall Awards"
            description="Best Batter, Bowler and sport-wise players."
            textClass="text-orange-300"
          />

        </div>

      </div>
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  icon,
  description,
  iconClass,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-lg backdrop-blur-md">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm font-medium text-slate-300">
            {title}
          </p>

          <p className="mt-1 text-3xl font-bold tracking-tight text-white">
            {value}
          </p>

        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

      </div>

      <p className="mt-3 text-xs text-slate-400">
        {description}
      </p>

    </div>
  );
}

/* =========================================================
   STATUS CARD
========================================================= */

function StatusCard({
  title,
  value,
  icon,
  className,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  className: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${className}`}
    >

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm font-semibold">
            {title}
          </p>

          <p className="mt-1 text-2xl font-bold">
            {value}
          </p>

        </div>

        {icon}

      </div>

    </div>
  );
}

/* =========================================================
   QUICK ACTION
========================================================= */

function QuickAction({
  href,
  icon,
  title,
  description,
  className,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  className: string;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-2xl p-4 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${className}`}
    >

      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
        {icon}
      </div>

      <p className="font-semibold">
        {title}
      </p>

      <p className="mt-0.5 text-xs text-white/75">
        {description}
      </p>

    </Link>
  );
}

/* =========================================================
   FOOTER SHORTCUT
========================================================= */

function FooterShortcut({
  href,
  icon,
  iconClass,
  title,
  description,
  textClass,
}: {
  href: string;
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  description: string;
  textClass: string;
}) {
  return (
    <Link
      href={href}
      className="
        group
        rounded-2xl
        border
        border-white/10
        bg-white/10
        p-5
        shadow-lg
        backdrop-blur-md
        transition
        hover:border-white/20
        hover:bg-white/15
      "
    >

      <div className={`mb-3 ${iconClass}`}>
        {icon}
      </div>

      <h3 className="font-bold text-white">
        {title}
      </h3>

      <p className="mt-1 text-sm text-slate-300">
        {description}
      </p>

      <div
        className={`mt-3 flex items-center gap-1 text-sm font-semibold ${textClass}`}
      >
        Open

        <ArrowRight
          size={15}
          className="transition group-hover:translate-x-1"
        />
      </div>

    </Link>
  );
}