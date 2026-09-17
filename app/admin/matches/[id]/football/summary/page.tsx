"use client";

import {
  ArrowLeft,
  Trophy,
  Target,
  ShieldAlert,
  CreditCard,
  CircleAlert,
  Users,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// =====================================================
// TYPES
// =====================================================

interface Player {
  id: number;
  name: string;
  jerseyNo: number | null;
  role: string | null;
}

interface Team {
  id: number;
  name: string;
  score: number;
}

interface FootballEvent {
  id: number;
  eventType:
    | "GOAL"
    | "OWN_GOAL"
    | "PENALTY"
    | "YELLOW_CARD"
    | "RED_CARD";
  penaltyResult: "GOAL" | "MISSED" | null;
  minute: number | null;
  description: string | null;
  team: {
    id: number;
    name: string;
  };
  player: Player | null;
  createdAt: string;
}

interface GoalScorer {
  playerId: number;
  playerName: string;
  teamId: number;
  teamName: string;
  goals: number;
  normalGoals: number;
  penaltyGoals: number;
  ownGoals: number;
}

interface TeamStatistic {
  teamId: number;
  goals: number;
  penaltyGoals: number;
  ownGoals: number;
  yellowCards: number;
  redCards: number;
  totalEvents: number;
}

interface SummaryData {
  success: boolean;

  match: {
    id: number;
    matchNumber: number | null;
    status: string;

    tournament: {
      id: number;
      name: string;
      season: string | null;
    };

    game: {
      id: number;
      name: string;
      sportType: string;
    };

    team1: Team;
    team2: Team;

    winner: {
      id: number;
      name: string;
    } | null;

    result:
      | "TEAM1_WIN"
      | "TEAM2_WIN"
      | "DRAW"
      | null;
  };

  statistics: {
    totalGoals: number;
    normalGoals: number;
    penaltyGoals: number;
    ownGoals: number;
    yellowCards: number;
    redCards: number;
    totalEvents: number;
  };

  topScorer: GoalScorer | null;
  goalScorers: GoalScorer[];

  penaltyGoals: FootballEvent[];
  ownGoals: FootballEvent[];
  yellowCards: FootballEvent[];
  redCards: FootballEvent[];

  teamStatistics: {
    team1: TeamStatistic;
    team2: TeamStatistic;
  };

  events: FootballEvent[];
}

interface LiveFootballData {
  success: boolean;
  match?: {
    footballEvents?: FootballEvent[];
  };
}

// =====================================================
// PAGE
// =====================================================

export default function FootballSummaryPage() {
  const params = useParams();
  const router = useRouter();

  const matchId = String(params.id);

  const [data, setData] =
    useState<SummaryData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =====================================================
  // LOAD DATA
  // =====================================================

  async function loadSummary() {
    try {
      setLoading(true);
      setError("");

      // -------------------------------------------------
      // LOAD SUMMARY
      // -------------------------------------------------

      const summaryResponse = await fetch(
        `/api/matches/${matchId}/football/summary`,
        {
          cache: "no-store",
        }
      );

      const summaryResult =
        await summaryResponse.json();

      if (!summaryResponse.ok) {
        throw new Error(
          summaryResult.error ||
            "Failed to load football summary."
        );
      }

      // -------------------------------------------------
      // LOAD LIVE EVENTS
      // -------------------------------------------------

      let liveEvents: FootballEvent[] = [];

      try {
        const liveResponse = await fetch(
          `/api/matches/${matchId}/football/live`,
          {
            cache: "no-store",
          }
        );

        if (liveResponse.ok) {
          const liveResult: LiveFootballData =
            await liveResponse.json();

          liveEvents =
            liveResult.match?.footballEvents ?? [];
        }
      } catch (liveError) {
        console.warn(
          "Could not load live football events:",
          liveError
        );
      }

      // -------------------------------------------------
      // SUMMARY EVENTS
      // -------------------------------------------------

      const summaryEvents: FootballEvent[] =
        Array.isArray(summaryResult.events)
          ? summaryResult.events
          : [];

      // -------------------------------------------------
      // MERGE EVENTS
      //
      // LIVE API penaltyResult has priority.
      // -------------------------------------------------

      const events: FootballEvent[] =
        summaryEvents.map(
          (summaryEvent) => {
            const liveEvent =
              liveEvents.find(
                (event) =>
                  event.id === summaryEvent.id
              );

            if (!liveEvent) {
              return summaryEvent;
            }

            return {
              ...summaryEvent,

              penaltyResult:
                liveEvent.penaltyResult ??
                summaryEvent.penaltyResult,

              minute:
                liveEvent.minute ??
                summaryEvent.minute,

              description:
                liveEvent.description ??
                summaryEvent.description,

              player:
                liveEvent.player ??
                summaryEvent.player,

              team:
                liveEvent.team ??
                summaryEvent.team,
            };
          }
        );

      // =================================================
      // NORMAL GOALS
      //
      // ONLY eventType === GOAL
      //
      // PENALTY IS NOT INCLUDED.
      // =================================================

      const normalGoalEvents =
        events.filter(
          (event) =>
            event.eventType === "GOAL"
        );

      // =================================================
      // SUCCESSFUL PENALTIES
      //
      // ONLY PENALTY + GOAL
      // =================================================

      const successfulPenaltyGoals =
        events.filter(
          (event) =>
            event.eventType === "PENALTY" &&
            event.penaltyResult === "GOAL"
        );

      // =================================================
      // MISSED PENALTIES
      // =================================================

      const missedPenalties =
        events.filter(
          (event) =>
            event.eventType === "PENALTY" &&
            event.penaltyResult === "MISSED"
        );

      // =================================================
      // OWN GOALS
      // =================================================

      const ownGoalEvents =
        events.filter(
          (event) =>
            event.eventType === "OWN_GOAL"
        );

      // =================================================
      // CARDS
      // =================================================

      const yellowCardEvents =
        events.filter(
          (event) =>
            event.eventType ===
            "YELLOW_CARD"
        );

      const redCardEvents =
        events.filter(
          (event) =>
            event.eventType ===
            "RED_CARD"
        );

      // =================================================
      // GOAL SCORERS
      //
      // IMPORTANT:
      // PENALTY EVENTS ARE NEVER COUNTED HERE.
      // =================================================

      const scorerMap =
        new Map<number, GoalScorer>();

      for (const event of normalGoalEvents) {
        if (!event.player) {
          continue;
        }

        const existing =
          scorerMap.get(
            event.player.id
          );

        if (existing) {
          existing.goals += 1;
          existing.normalGoals += 1;
        } else {
          scorerMap.set(
            event.player.id,
            {
              playerId:
                event.player.id,

              playerName:
                event.player.name,

              teamId:
                event.team.id,

              teamName:
                event.team.name,

              goals: 1,

              normalGoals: 1,

              penaltyGoals: 0,

              ownGoals: 0,
            }
          );
        }
      }

      const goalScorers =
        Array.from(
          scorerMap.values()
        ).sort(
          (a, b) =>
            b.normalGoals -
              a.normalGoals ||
            a.playerName.localeCompare(
              b.playerName
            )
        );

      // =================================================
      // TOP SCORER
      // =================================================

      const topScorer =
        goalScorers.length > 0
          ? goalScorers[0]
          : null;

      // =================================================
      // TEAM STATISTICS
      // =================================================

      function calculateTeamStatistics(
        teamId: number
      ): TeamStatistic {
        const teamEvents =
          events.filter(
            (event) =>
              event.team.id === teamId
          );

        const goals =
          teamEvents.filter(
            (event) =>
              event.eventType === "GOAL"
          ).length;

        const penaltyGoals =
          teamEvents.filter(
            (event) =>
              event.eventType ===
                "PENALTY" &&
              event.penaltyResult ===
                "GOAL"
          ).length;

        const ownGoals =
          teamEvents.filter(
            (event) =>
              event.eventType ===
              "OWN_GOAL"
          ).length;

        const yellowCards =
          teamEvents.filter(
            (event) =>
              event.eventType ===
              "YELLOW_CARD"
          ).length;

        const redCards =
          teamEvents.filter(
            (event) =>
              event.eventType ===
              "RED_CARD"
          ).length;

        return {
          teamId,

          goals,

          penaltyGoals,

          ownGoals,

          yellowCards,

          redCards,

          totalEvents:
            teamEvents.length,
        };
      }

      const teamStatistics = {
        team1:
          calculateTeamStatistics(
            summaryResult.match.team1.id
          ),

        team2:
          calculateTeamStatistics(
            summaryResult.match.team2.id
          ),
      };

      // =================================================
      // MATCH STATISTICS
      // =================================================

      const statistics = {
        // Match score:
        // normal goals + successful penalties
        totalGoals:
          normalGoalEvents.length +
          successfulPenaltyGoals.length,

        normalGoals:
          normalGoalEvents.length,

        penaltyGoals:
          successfulPenaltyGoals.length,

        ownGoals:
          ownGoalEvents.length,

        yellowCards:
          yellowCardEvents.length,

        redCards:
          redCardEvents.length,

        totalEvents:
          events.length,
      };

      // =================================================
      // FINAL DATA
      // =================================================

      setData({
        ...summaryResult,

        events,

        statistics,

        goalScorers,

        topScorer,

        penaltyGoals:
          successfulPenaltyGoals,

        ownGoals:
          ownGoalEvents,

        yellowCards:
          yellowCardEvents,

        redCards:
          redCardEvents,

        teamStatistics,
      });
    } catch (err) {
      console.error(
        "FOOTBALL SUMMARY PAGE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load football summary."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    if (matchId) {
      loadSummary();
    }
  }, [matchId]);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border bg-white p-12 text-center shadow-sm">
            <p className="text-sm text-slate-500">
              Loading football match summary...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-200 bg-white p-12 text-center shadow-sm">
            <p className="text-lg font-semibold text-red-600">
              Unable to load summary
            </p>

            <p className="mt-2 text-sm text-slate-500">
              {error ||
                "Football summary not available."}
            </p>

            <button
              type="button"
              onClick={() => router.back()}
              className="mt-6 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // DATA
  // =====================================================

  const {
    match,
    statistics,
    topScorer,
    goalScorers,
    ownGoals,
    yellowCards,
    redCards,
    teamStatistics,
    events,
  } = data;

  const successfulPenaltyGoals =
    events.filter(
      (event) =>
        event.eventType === "PENALTY" &&
        event.penaltyResult === "GOAL"
    );

  const missedPenalties =
    events.filter(
      (event) =>
        event.eventType === "PENALTY" &&
        event.penaltyResult === "MISSED"
    );

  const allPenalties =
    events.filter(
      (event) =>
        event.eventType === "PENALTY"
    );

  // =====================================================
  // RESULT
  // =====================================================

  const resultText =
    match.result === "DRAW"
      ? "Match Drawn"
      : match.winner
        ? `${match.winner.name} won the match`
        : "Result unavailable";

  // =====================================================
  // EVENT ICON
  // =====================================================

  function eventIcon(
    event: FootballEvent
  ) {
    switch (event.eventType) {
      case "GOAL":
        return "⚽";

      case "PENALTY":
        if (
          event.penaltyResult ===
          "MISSED"
        ) {
          return "❌";
        }

        if (
          event.penaltyResult ===
          "GOAL"
        ) {
          return "🎯";
        }

        return "⚠️";

      case "OWN_GOAL":
        return "🔴";

      case "YELLOW_CARD":
        return "🟨";

      case "RED_CARD":
        return "🟥";

      default:
        return "•";
    }
  }

  // =====================================================
  // EVENT LABEL
  // =====================================================

  function eventLabel(
    event: FootballEvent
  ) {
    switch (event.eventType) {
      case "GOAL":
        return "Goal";

      case "PENALTY":
        if (
          event.penaltyResult ===
          "GOAL"
        ) {
          return "Penalty Goal";
        }

        if (
          event.penaltyResult ===
          "MISSED"
        ) {
          return "Penalty Missed";
        }

        return "Penalty Result Unknown";

      case "OWN_GOAL":
        return "Own Goal";

      case "YELLOW_CARD":
        return "Yellow Card";

      case "RED_CARD":
        return "Red Card";

      default:
        return event.eventType;
    }
  }

  // =====================================================
  // PENALTY DISPLAY
  // =====================================================

  function getPenaltyDisplay(
    event: FootballEvent
  ) {
    if (
      event.eventType !==
      "PENALTY"
    ) {
      return null;
    }

    if (
      event.penaltyResult ===
      "GOAL"
    ) {
      return {
        icon: "🎯",
        label: "Penalty Goal",
        score: "1",
        className:
          "bg-emerald-100 text-emerald-700",
      };
    }

    if (
      event.penaltyResult ===
      "MISSED"
    ) {
      return {
        icon: "❌",
        label: "Penalty Missed",
        score: "0",
        className:
          "bg-red-100 text-red-700",
      };
    }

    return {
      icon: "⚠️",
      label: "Penalty Result Unknown",
      score: "0",
      className:
        "bg-amber-100 text-amber-700",
    };
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>

            <button
              type="button"
              onClick={() => router.back()}
              className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft size={17} />
              Back to Matches
            </button>

            <h1 className="text-3xl font-bold text-slate-900">
              Football Match Summary
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Match{" "}
              {match.matchNumber ??
                match.id}{" "}
              •{" "}
              {match.tournament.name}
            </p>

          </div>

          <div className="flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
            <Trophy size={18} />
            {match.status}
          </div>

        </div>

        {/* ================================================= */}
        {/* SCORE */}
        {/* ================================================= */}

        <div className="overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl">

          <div className="p-6">

            <div className="mb-6 text-center">

              <p className="text-sm font-medium uppercase tracking-widest text-slate-400">
                {match.game.name}
              </p>

              {match.tournament.season && (
                <p className="mt-1 text-xs text-slate-500">
                  {match.tournament.season}
                </p>
              )}

            </div>

            <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_auto_1fr]">

              <div className="text-center">

                <p className="text-xl font-bold">
                  {match.team1.name}
                </p>

                <p className="mt-2 text-6xl font-black">
                  {match.team1.score}
                </p>

              </div>

              <div className="text-center">

                <div className="text-sm font-semibold uppercase tracking-widest text-slate-400">
                  Full Time
                </div>

                <div className="mt-2 text-2xl font-bold text-slate-300">
                  VS
                </div>

              </div>

              <div className="text-center">

                <p className="text-xl font-bold">
                  {match.team2.name}
                </p>

                <p className="mt-2 text-6xl font-black">
                  {match.team2.score}
                </p>

              </div>

            </div>

            <div className="mt-7 border-t border-slate-700 pt-5 text-center">

              <p className="flex items-center justify-center gap-2 text-lg font-bold text-emerald-400">
                <Trophy size={20} />
                {resultText}
              </p>

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* STATISTICS */}
        {/* ================================================= */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Goals
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {statistics.totalGoals}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Normal Goals
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {statistics.normalGoals}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Penalty Goals
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600">
              {successfulPenaltyGoals.length}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Own Goals
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {statistics.ownGoals}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Yellow Cards
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-500">
              {statistics.yellowCards}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Red Cards
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {statistics.redCards}
            </p>
          </div>

        </div>

        {/* ================================================= */}
        {/* TOP SCORER */}
        {/* ================================================= */}

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <div className="mb-5 flex items-center gap-3">

            <div className="rounded-xl bg-amber-100 p-3 text-amber-600">
              <Trophy size={22} />
            </div>

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Top Goal Scorer
              </h2>

              <p className="text-sm text-slate-500">
                Normal goals scored during the match
              </p>

            </div>

          </div>

          {topScorer ? (

            <div className="rounded-2xl bg-slate-50 p-5">

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                <div>

                  <p className="text-xl font-bold text-slate-900">
                    {topScorer.playerName}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {topScorer.teamName}
                  </p>

                </div>

                <div>

                  <div className="rounded-xl bg-white px-5 py-3 text-center shadow-sm">

                    <p className="text-2xl font-black text-emerald-600">
                      {topScorer.normalGoals}
                    </p>

                    <p className="text-xs text-slate-500">
                      {topScorer.normalGoals ===
                      1
                        ? "Goal"
                        : "Goals"}
                    </p>

                  </div>

                </div>

              </div>

            </div>

          ) : (

            <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
              No normal goals were recorded.
            </p>

          )}

        </div>

        {/* ================================================= */}
        {/* TEAM STATISTICS */}
        {/* ================================================= */}

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center gap-3">

            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <Users size={22} />
            </div>

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Team Statistics
              </h2>

              <p className="text-sm text-slate-500">
                Football events recorded for both teams
              </p>

            </div>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[650px]">

              <thead>

                <tr className="border-b text-left text-xs uppercase text-slate-500">

                  <th className="px-4 py-3">
                    Team
                  </th>

                  <th className="px-4 py-3 text-center">
                    Goals
                  </th>

                  <th className="px-4 py-3 text-center">
                    Penalty Goals
                  </th>

                  <th className="px-4 py-3 text-center">
                    Own Goals
                  </th>

                  <th className="px-4 py-3 text-center">
                    Yellow
                  </th>

                  <th className="px-4 py-3 text-center">
                    Red
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y">

                <tr>

                  <td className="px-4 py-4 font-semibold text-slate-900">
                    {match.team1.name}
                  </td>

                  <td className="px-4 py-4 text-center font-bold">
                    {teamStatistics.team1.goals}
                  </td>

                  <td className="px-4 py-4 text-center font-bold text-blue-600">
                    {teamStatistics.team1.penaltyGoals}
                  </td>

                  <td className="px-4 py-4 text-center text-red-600">
                    {teamStatistics.team1.ownGoals}
                  </td>

                  <td className="px-4 py-4 text-center text-yellow-500">
                    {teamStatistics.team1.yellowCards}
                  </td>

                  <td className="px-4 py-4 text-center text-red-600">
                    {teamStatistics.team1.redCards}
                  </td>

                </tr>

                <tr>

                  <td className="px-4 py-4 font-semibold text-slate-900">
                    {match.team2.name}
                  </td>

                  <td className="px-4 py-4 text-center font-bold">
                    {teamStatistics.team2.goals}
                  </td>

                  <td className="px-4 py-4 text-center font-bold text-blue-600">
                    {teamStatistics.team2.penaltyGoals}
                  </td>

                  <td className="px-4 py-4 text-center text-red-600">
                    {teamStatistics.team2.ownGoals}
                  </td>

                  <td className="px-4 py-4 text-center text-yellow-500">
                    {teamStatistics.team2.yellowCards}
                  </td>

                  <td className="px-4 py-4 text-center text-red-600">
                    {teamStatistics.team2.redCards}
                  </td>

                </tr>

              </tbody>

            </table>

          </div>

        </div>

        {/* ================================================= */}
        {/* GOAL SCORERS */}
        {/* ================================================= */}

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <div className="mb-5 flex items-center gap-3">

            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
              <Target size={22} />
            </div>

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Goal Scorers
              </h2>

              <p className="text-sm text-slate-500">
                Normal goals scored during the match
              </p>

            </div>

          </div>

          {goalScorers.length === 0 ? (

            <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
              No normal goals recorded.
            </p>

          ) : (

            <div className="grid gap-3 md:grid-cols-2">

              {goalScorers.map(
                (scorer) => (

                  <div
                    key={scorer.playerId}
                    className="flex items-center justify-between rounded-xl border p-4"
                  >

                    <div>

                      <p className="font-semibold text-slate-900">
                        {scorer.playerName}
                      </p>

                      <p className="text-sm text-slate-500">
                        {scorer.teamName}
                      </p>

                    </div>

                    <div className="text-right">

                      <p className="text-2xl font-black text-emerald-600">
                        {scorer.normalGoals}
                      </p>

                      <p className="text-xs text-slate-500">
                        {scorer.normalGoals ===
                        1
                          ? "Goal"
                          : "Goals"}
                      </p>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

        {/* ================================================= */}
        {/* PENALTY GOALS */}
        {/* ================================================= */}

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <div className="mb-5 flex items-center gap-3">

            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <Target size={22} />
            </div>

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Penalty Goals
              </h2>

              <p className="text-sm text-slate-500">
                Successfully converted penalty kicks
              </p>

            </div>

          </div>

          {successfulPenaltyGoals.length === 0 ? (

            <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
              No penalty goals recorded.
            </p>

          ) : (

            <div className="space-y-3">

              {successfulPenaltyGoals.map(
                (event) => (

                  <div
                    key={event.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"
                  >

                    <div className="flex items-center gap-3">

                      <span className="text-2xl">
                        🎯
                      </span>

                      <div>

                        <p className="font-semibold text-slate-900">
                          {event.player?.name ??
                            "Unknown player"}
                        </p>

                        <p className="text-sm text-slate-500">
                          {event.team.name}
                        </p>

                      </div>

                    </div>

                    <div className="flex items-center gap-3">

                      <span className="rounded-lg bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">
                        Penalty Goal
                      </span>

                      <span className="text-lg font-black text-emerald-600">
                        1
                      </span>

                      <span className="text-sm font-semibold text-blue-600">
                        {event.minute !== null
                          ? `${event.minute}'`
                          : "—"}
                      </span>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

        {/* ================================================= */}
        {/* MISSED PENALTIES */}
        {/* ================================================= */}

        {missedPenalties.length > 0 && (

          <div className="rounded-2xl border bg-white p-6 shadow-sm">

            <div className="mb-5 flex items-center gap-3">

              <div className="rounded-xl bg-red-100 p-3 text-red-600">
                <Target size={22} />
              </div>

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  Penalties Missed
                </h2>

                <p className="text-sm text-slate-500">
                  Penalty kicks that were not converted
                </p>

              </div>

            </div>

            <div className="space-y-3">

              {missedPenalties.map(
                (event) => (

                  <div
                    key={event.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"
                  >

                    <div className="flex items-center gap-3">

                      <span className="text-2xl">
                        ❌
                      </span>

                      <div>

                        <p className="font-semibold text-slate-900">
                          {event.player?.name ??
                            "Unknown player"}
                        </p>

                        <p className="text-sm text-slate-500">
                          {event.team.name}
                        </p>

                      </div>

                    </div>

                    <div className="flex items-center gap-3">

                      <span className="rounded-lg bg-red-100 px-3 py-1 text-sm font-bold text-red-700">
                        Penalty Missed
                      </span>

                      <span className="text-lg font-black text-red-600">
                        0
                      </span>

                      <span className="text-sm font-semibold text-red-600">
                        {event.minute !== null
                          ? `${event.minute}'`
                          : "—"}
                      </span>

                    </div>

                  </div>

                )
              )}

            </div>

          </div>

        )}

        {/* ================================================= */}
        {/* UNKNOWN PENALTY */}
        {/* ================================================= */}

        {allPenalties.some(
          (event) =>
            event.penaltyResult ===
            null
        ) && (

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">

            <div className="flex gap-3">

              <CircleAlert
                size={22}
                className="shrink-0 text-amber-600"
              />

              <div>

                <p className="font-semibold text-amber-800">
                  Some penalty results are missing
                </p>

                <p className="mt-1 text-sm text-amber-700">
                  One or more penalty events
                  do not have a GOAL or MISSED
                  result.
                </p>

              </div>

            </div>

          </div>

        )}

        {/* ================================================= */}
        {/* CARDS */}
        {/* ================================================= */}

        <div className="grid gap-6 lg:grid-cols-2">

          {/* YELLOW */}

          <div className="rounded-2xl border bg-white p-6 shadow-sm">

            <div className="mb-5 flex items-center gap-3">

              <div className="rounded-xl bg-yellow-100 p-3">

                <CreditCard
                  size={22}
                  className="text-yellow-600"
                />

              </div>

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  Yellow Cards
                </h2>

                <p className="text-sm text-slate-500">
                  Players booked during the match
                </p>

              </div>

            </div>

            {yellowCards.length === 0 ? (

              <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                No yellow cards.
              </p>

            ) : (

              <div className="space-y-3">

                {yellowCards.map(
                  (event) => (

                    <div
                      key={event.id}
                      className="flex items-center justify-between rounded-xl border p-4"
                    >

                      <div>

                        <p className="font-semibold text-slate-900">
                          {event.player?.name ??
                            "Unknown player"}
                        </p>

                        <p className="text-sm text-slate-500">
                          {event.team.name}
                        </p>

                      </div>

                      <span className="font-semibold text-yellow-600">
                        {event.minute !== null
                          ? `${event.minute}'`
                          : "—"}
                      </span>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

          {/* RED */}

          <div className="rounded-2xl border bg-white p-6 shadow-sm">

            <div className="mb-5 flex items-center gap-3">

              <div className="rounded-xl bg-red-100 p-3">

                <ShieldAlert
                  size={22}
                  className="text-red-600"
                />

              </div>

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  Red Cards
                </h2>

                <p className="text-sm text-slate-500">
                  Players sent off during the match
                </p>

              </div>

            </div>

            {redCards.length === 0 ? (

              <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                No red cards.
              </p>

            ) : (

              <div className="space-y-3">

                {redCards.map(
                  (event) => (

                    <div
                      key={event.id}
                      className="flex items-center justify-between rounded-xl border p-4"
                    >

                      <div>

                        <p className="font-semibold text-slate-900">
                          {event.player?.name ??
                            "Unknown player"}
                        </p>

                        <p className="text-sm text-slate-500">
                          {event.team.name}
                        </p>

                      </div>

                      <span className="font-semibold text-red-600">
                        {event.minute !== null
                          ? `${event.minute}'`
                          : "—"}
                      </span>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        </div>

        {/* ================================================= */}
        {/* OWN GOALS */}
        {/* ================================================= */}

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <div className="mb-5 flex items-center gap-3">

            <div className="rounded-xl bg-red-100 p-3 text-red-600">
              <CircleAlert size={22} />
            </div>

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Own Goals
              </h2>

              <p className="text-sm text-slate-500">
                Own goals recorded during the match
              </p>

            </div>

          </div>

          {ownGoals.length === 0 ? (

            <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
              No own goals.
            </p>

          ) : (

            <div className="space-y-3">

              {ownGoals.map(
                (event) => (

                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-xl border p-4"
                  >

                    <div>

                      <p className="font-semibold text-slate-900">
                        {event.player?.name ??
                          "Unknown player"}
                      </p>

                      <p className="text-sm text-slate-500">
                        {event.team.name}
                      </p>

                    </div>

                    <span className="font-semibold text-red-600">
                      {event.minute !== null
                        ? `${event.minute}'`
                        : "—"}
                    </span>

                  </div>

                )
              )}

            </div>

          )}

        </div>

        {/* ================================================= */}
        {/* MATCH TIMELINE */}
        {/* ================================================= */}

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <div className="mb-6">

            <h2 className="text-xl font-bold text-slate-900">
              Match Timeline
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Every football event recorded during the match
            </p>

          </div>

          {events.length === 0 ? (

            <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
              No events recorded.
            </p>

          ) : (

            <div className="relative space-y-4">

              {events.map(
                (event) => {

                  const penalty =
                    getPenaltyDisplay(
                      event
                    );

                  const isMissedPenalty =
                    event.eventType ===
                      "PENALTY" &&
                    event.penaltyResult ===
                      "MISSED";

                  const isScoredPenalty =
                    event.eventType ===
                      "PENALTY" &&
                    event.penaltyResult ===
                      "GOAL";

                  return (
                    <div
                      key={event.id}
                      className="flex gap-4"
                    >

                      {/* MINUTE */}

                      <div className="flex w-14 shrink-0 justify-center">

                        <span className="rounded-lg bg-slate-100 px-2 py-1 text-sm font-bold text-slate-700">
                          {event.minute !== null
                            ? `${event.minute}'`
                            : "—"}
                        </span>

                      </div>

                      {/* EVENT */}

                      <div className="flex-1 rounded-xl border p-4">

                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

                          {/* EVENT INFORMATION */}

                          <div className="flex items-center gap-3">

                            <span className="text-xl">
                              {eventIcon(
                                event
                              )}
                            </span>

                            <div>

                              <p
                                className={`font-semibold ${
                                  isMissedPenalty
                                    ? "text-red-600"
                                    : isScoredPenalty
                                      ? "text-emerald-600"
                                      : "text-slate-900"
                                }`}
                              >
                                {eventLabel(
                                  event
                                )}
                              </p>

                              <p className="text-sm text-slate-500">

                                {event.player?.name ??
                                  "No player"}

                                {" • "}

                                {event.team.name}

                              </p>

                            </div>

                          </div>

                          {/* PENALTY RESULT */}

                          {penalty && (

                            <div
                              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${penalty.className}`}
                            >

                              <span>
                                {penalty.icon}
                              </span>

                              <span>
                                {penalty.label}
                              </span>

                              <span className="text-base">
                                {penalty.score}
                              </span>

                            </div>

                          )}

                          {/* DESCRIPTION */}

                          {!penalty &&
                            event.description && (

                              <p className="text-sm text-slate-500">
                                {event.description}
                              </p>

                            )}

                        </div>

                        {penalty &&
                          event.description && (

                            <p className="mt-2 text-sm text-slate-500">
                              {event.description}
                            </p>

                          )}

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          )}

        </div>

        {/* ================================================= */}
        {/* FOOTER */}
        {/* ================================================= */}

        <div className="flex justify-center pb-6">

          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            ← Back to Matches
          </button>

        </div>

      </div>
    </div>
  );
}

