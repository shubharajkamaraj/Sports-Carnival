"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Trophy,
  Volleyball,
  MapPin,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

/* =========================================================
   TYPES
========================================================= */

type Team = {
  id: number;
  name: string;
  captain?: string | null;
};

type Game = {
  id: number;
  name: string;
  sportType?: string | null;
};

type ThrowballScore = {
  id: number;
  matchId: number;

  team1Id: number;
  team2Id: number;

  /*
   * FINAL THROWBALL SCORE
   * One set only
   */
  team1Score: number;
  team2Score: number;

  /*
   * These fields may still exist in Prisma/database
   * for compatibility, but are NOT used by this UI.
   */
  currentSet?: number;

  team1Set1?: number;
  team2Set1?: number;

  team1SetsWon?: number;
  team2SetsWon?: number;

  status: string;

  winnerTeamId: number | null;
};

type Match = {
  id: number;

  tournamentId: number;
  gameId: number;

  team1Id: number;
  team2Id: number;

  matchNumber: number | null;

  matchDate: string;
  venue: string;

  status: string;

  result: string | null;

  winnerTeamId: number | null;

  overs: number;

  team1Score: number;
  team2Score: number;

  game: Game;

  team1: Team;
  team2: Team;

  throwballScore: ThrowballScore | null;
};

type ApiResponse = {
  success: boolean;
  match?: Match;
  error?: string;
};

/* =========================================================
   PAGE
========================================================= */

export default function ThrowballSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [matchId, setMatchId] =
    useState<number | null>(null);

  const [match, setMatch] =
    useState<Match | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /* =======================================================
     GET MATCH ID
  ======================================================= */

  useEffect(() => {
    async function getParams() {
      try {
        const result = await params;

        const id = Number(result.id);

        if (!Number.isInteger(id) || id <= 0) {
          setError("Invalid match ID.");
          setLoading(false);
          return;
        }

        setMatchId(id);
      } catch {
        setError("Unable to read match ID.");
        setLoading(false);
      }
    }

    getParams();
  }, [params]);

  /* =======================================================
     LOAD MATCH
  ======================================================= */

  async function loadMatch() {
    if (!matchId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/matches/${matchId}/throwball`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const text = await response.text();

      let data: ApiResponse;

      try {
        data = text
          ? (JSON.parse(text) as ApiResponse)
          : {
              success: false,
            };
      } catch {
        console.error(
          "THROWBALL API RAW RESPONSE:",
          text
        );

        throw new Error(
          "Invalid response from Throwball API."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load Throwball summary."
        );
      }

      if (!data.success || !data.match) {
        throw new Error(
          data.error ||
            "Throwball match not found."
        );
      }

      setMatch(data.match);
    } catch (err) {
      console.error(
        "THROWBALL SUMMARY LOAD ERROR:",
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : "Failed to load Throwball summary.";

      setError(message);

      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     LOAD AFTER ID
  ======================================================= */

  useEffect(() => {
    if (matchId !== null) {
      loadMatch();
    }
  }, [matchId]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-2xl border bg-white px-8 py-7 text-center shadow-sm">
          <RefreshCw
            size={30}
            className="mx-auto animate-spin text-orange-600"
          />

          <p className="mt-3 text-sm font-bold text-slate-700">
            Loading Throwball summary...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (!match || error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-5">
        <div className="w-full max-w-md rounded-2xl border bg-white p-7 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
            <Volleyball size={28} />
          </div>

          <h1 className="mt-4 text-xl font-black text-slate-900">
            Summary unavailable
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error ||
              "Unable to load the Throwball match."}
          </p>

          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              onClick={loadMatch}
              className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-700"
            >
              <RefreshCw size={16} />
              Retry
            </button>

            <Link
              href="/admin/matches"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Matches
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     SCORE
  ======================================================= */

  const score = match.throwballScore;

  if (!score) {
    return (
      <div className="min-h-screen bg-slate-100">
        <SummaryHeader match={match} />

        <main className="mx-auto max-w-5xl p-5">
          <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
            <Volleyball
              size={42}
              className="mx-auto text-orange-500"
            />

            <h2 className="mt-4 text-xl font-black text-slate-900">
              No Throwball score found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              This match has not started scoring yet.
            </p>

            <Link
              href={`/admin/matches/${match.id}/throwball`}
              className="mt-5 inline-flex rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white"
            >
              Open Live Match
            </Link>
          </div>
        </main>
      </div>
    );
  }

  /* =======================================================
     FINAL SCORES
  ======================================================= */

  const team1Score = score.team1Score ?? 0;
  const team2Score = score.team2Score ?? 0;

  /* =======================================================
     THROWBALL WINNING RULE
     
     First to 11 AND at least 2 points ahead.

     Examples:
       11-9  = winner
       11-10 = continue
       12-10 = winner
       13-11 = winner
       15-14 = continue
  ======================================================= */

  function hasWon(
    ownScore: number,
    opponentScore: number
  ) {
    return (
      ownScore >= 11 &&
      ownScore - opponentScore >= 2
    );
  }

  const team1Won = hasWon(
    team1Score,
    team2Score
  );

  const team2Won = hasWon(
    team2Score,
    team1Score
  );

  /* =======================================================
     WINNER
  ======================================================= */

  let winnerTeamId: number | null =
    score.winnerTeamId ??
    match.winnerTeamId ??
    null;

  /*
   * Calculate winner from the current score
   * if winnerTeamId is not saved yet.
   */

  if (winnerTeamId === null) {
    if (team1Won) {
      winnerTeamId = match.team1Id;
    } else if (team2Won) {
      winnerTeamId = match.team2Id;
    }
  }

  let winnerName = "No Winner";

  if (winnerTeamId === match.team1Id) {
    winnerName = match.team1.name;
  }

  if (winnerTeamId === match.team2Id) {
    winnerName = match.team2.name;
  }

  /* =======================================================
     COMPLETED
  ======================================================= */

  const completed =
    score.status === "COMPLETED" ||
    match.status === "COMPLETED" ||
    team1Won ||
    team2Won;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-100">
      <SummaryHeader match={match} />

      <main className="mx-auto max-w-5xl p-4 sm:p-5">

        {/* =================================================
            RESULT BANNER
        ================================================= */}

        <section
          className={`rounded-2xl border p-5 text-center shadow-sm ${
            completed
              ? "border-green-200 bg-green-50"
              : "border-orange-200 bg-orange-50"
          }`}
        >
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
              completed
                ? "bg-green-100 text-green-600"
                : "bg-orange-100 text-orange-600"
            }`}
          >
            {completed ? (
              <Trophy size={28} />
            ) : (
              <Volleyball size={28} />
            )}
          </div>

          <p
            className={`mt-3 text-[10px] font-black uppercase tracking-[0.2em] ${
              completed
                ? "text-green-600"
                : "text-orange-600"
            }`}
          >
            Throwball Result
          </p>

          <h1
            className={`mt-1 text-2xl font-black sm:text-3xl ${
              completed
                ? "text-green-950"
                : "text-orange-950"
            }`}
          >
            {completed
              ? `${winnerName} Won`
              : "Match In Progress"}
          </h1>

          <p
            className={`mt-1 text-xs ${
              completed
                ? "text-green-700"
                : "text-orange-700"
            }`}
          >
            Match #
            {match.matchNumber ?? "-"}
          </p>
        </section>

        {/* =================================================
            FINAL SCORE
        ================================================= */}

        <section className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">

          <div className="mb-4 text-center">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Throwball • Single Set
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              First to 11 points with a 2-point lead
            </p>
          </div>

          <div className="grid grid-cols-3 items-center gap-2">

            {/* TEAM 1 */}

            <FinalTeam
              team={match.team1}
              points={team1Score}
              winner={
                winnerTeamId === match.team1Id
              }
            />

            {/* CENTER */}

            <div className="text-center">

              <p className="text-[10px] font-black uppercase text-slate-400">
                Final Score
              </p>

              <div className="mt-2 text-4xl font-black text-slate-900 sm:text-5xl">
                {team1Score}

                <span className="mx-2 text-slate-300">
                  -
                </span>

                {team2Score}
              </div>

              <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                1 Set
              </p>

            </div>

            {/* TEAM 2 */}

            <FinalTeam
              team={match.team2}
              points={team2Score}
              winner={
                winnerTeamId === match.team2Id
              }
            />

          </div>
        </section>

        {/* =================================================
            SINGLE SET RESULT
        ================================================= */}

        <section className="mt-4">
          <SectionTitle title="Set Result" />

          <SingleSetCard
            team1Name={match.team1.name}
            team2Name={match.team2.name}
            team1Score={team1Score}
            team2Score={team2Score}
            completed={completed}
          />
        </section>

        {/* =================================================
            WINNER CARD
        ================================================= */}

        {completed && winnerTeamId !== null && (
          <section className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-5 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
              <Trophy
                size={24}
                className="text-yellow-600"
              />
            </div>

            <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-yellow-700">
              Winner
            </p>

            <h2 className="mt-1 text-2xl font-black text-yellow-950">
              {winnerName}
            </h2>

            <p className="mt-1 text-xs font-bold text-yellow-700">
              Final Score{" "}
              {team1Score} - {team2Score}
            </p>

            <p className="mt-1 text-[10px] text-yellow-600">
              Won by{" "}
              {Math.abs(
                team1Score - team2Score
              )} points
            </p>

          </section>
        )}

        {/* =================================================
            MATCH INFORMATION
        ================================================= */}

        <section className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
          <SectionTitle title="Match Information" />

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">

            <InfoCard
              icon={<Trophy size={15} />}
              label="Match"
              value={`#${match.matchNumber ?? "-"}`}
            />

            <InfoCard
              icon={<MapPin size={15} />}
              label="Venue"
              value={match.venue}
            />

            <InfoCard
              icon={<CalendarDays size={15} />}
              label="Date"
              value={formatDate(
                match.matchDate
              )}
            />

            <InfoCard
              icon={<CheckCircle2 size={15} />}
              label="Status"
              value={
                completed
                  ? "COMPLETED"
                  : "LIVE"
              }
            />

          </div>
        </section>

        {/* =================================================
            TEAM SUMMARY
        ================================================= */}

        <section className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">

          <SectionTitle title="Team Summary" />

          <div className="grid grid-cols-2 gap-3">

            <TeamSummary
              teamName={match.team1.name}
              points={team1Score}
              winner={
                winnerTeamId === match.team1Id
              }
            />

            <TeamSummary
              teamName={match.team2.name}
              points={team2Score}
              winner={
                winnerTeamId === match.team2Id
              }
            />

          </div>
        </section>

        {/* =================================================
            POINTS RULE
        ================================================= */}

        <section className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4">

          <div className="flex items-start gap-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <Volleyball size={18} />
            </div>

            <div>

              <h3 className="text-sm font-black text-orange-950">
                Throwball Scoring Rule
              </h3>

              <p className="mt-1 text-xs leading-5 text-orange-800">
                The match consists of one set.
                A team must reach at least
                11 points and lead by at least
                2 points to win.
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">

                <RuleCard
                  score="11 - 9"
                  result="Win"
                />

                <RuleCard
                  score="11 - 10"
                  result="Continue"
                />

                <RuleCard
                  score="12 - 10"
                  result="Win"
                />

                <RuleCard
                  score="13 - 11"
                  result="Win"
                />

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            BUTTONS
        ================================================= */}

        <div className="mt-5 flex justify-center gap-3">

          <Link
            href="/admin/matches"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back to Matches
          </Link>

          <Link
            href={`/admin/matches/${match.id}/throwball`}
            className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-orange-700"
          >
            Live Match
          </Link>

        </div>

      </main>
    </div>
  );
}

/* =========================================================
   HEADER
========================================================= */

function SummaryHeader({
  match,
}: {
  match: Match;
}) {
  return (
    <header className="sticky top-0 z-30 border-b bg-white">

      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">

        <div className="flex min-w-0 items-center gap-3">

          <Link
            href="/admin/matches"
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
            <Volleyball size={21} />
          </div>

          <div className="min-w-0">

            <h1 className="truncate text-base font-black text-slate-900">
              Throwball Summary
            </h1>

            <p className="truncate text-[11px] text-slate-500">
              {match.team1.name}
              {" vs "}
              {match.team2.name}
            </p>

          </div>

        </div>

        <span
          className={`rounded-full px-3 py-1 text-[10px] font-black ${
            match.status === "COMPLETED"
              ? "bg-green-100 text-green-700"
              : "bg-orange-100 text-orange-700"
          }`}
        >
          {match.status}
        </span>

      </div>

    </header>
  );
}

/* =========================================================
   FINAL TEAM
========================================================= */

function FinalTeam({
  team,
  points,
  winner,
}: {
  team: Team;
  points: number;
  winner: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3 text-center ${
        winner
          ? "bg-green-50 ring-1 ring-green-200"
          : "bg-slate-50"
      }`}
    >

      {winner && (
        <Trophy
          size={17}
          className="mx-auto mb-1 text-yellow-500"
        />
      )}

      <p className="text-[9px] font-bold uppercase text-slate-400">
        Team
      </p>

      <h2 className="truncate text-base font-black text-slate-900 sm:text-xl">
        {team.name}
      </h2>

      <p
        className={`mt-2 text-4xl font-black ${
          winner
            ? "text-green-600"
            : "text-blue-600"
        }`}
      >
        {points}
      </p>

      <p className="text-[9px] font-bold uppercase text-slate-400">
        Points
      </p>

    </div>
  );
}

/* =========================================================
   SINGLE SET CARD
========================================================= */

function SingleSetCard({
  team1Name,
  team2Name,
  team1Score,
  team2Score,
  completed,
}: {
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
  completed: boolean;
}) {
  let winner = "";

  if (
    completed &&
    team1Score > team2Score
  ) {
    winner = team1Name;
  }

  if (
    completed &&
    team2Score > team1Score
  ) {
    winner = team2Name;
  }

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-[10px] font-black uppercase tracking-wider text-orange-500">
            Set 1
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Single set • 11 points • 2-point lead
          </p>

        </div>

        {winner && (
          <span className="rounded-full bg-green-100 px-3 py-1 text-[9px] font-black uppercase text-green-700">
            Won
          </span>
        )}

      </div>

      <div className="mt-5 grid grid-cols-3 items-center gap-3">

        {/* TEAM 1 */}

        <div className="text-center">

          <p className="truncate text-xs font-black text-slate-700">
            {team1Name}
          </p>

          <p className="mt-2 text-4xl font-black text-slate-900">
            {team1Score}
          </p>

        </div>

        {/* VS */}

        <div className="text-center">

          <span className="text-xs font-black text-slate-300">
            VS
          </span>

        </div>

        {/* TEAM 2 */}

        <div className="text-center">

          <p className="truncate text-xs font-black text-slate-700">
            {team2Name}
          </p>

          <p className="mt-2 text-4xl font-black text-slate-900">
            {team2Score}
          </p>

        </div>

      </div>

      {!completed && (
        <div className="mt-4 rounded-xl bg-orange-50 p-3 text-center">

          <p className="text-xs font-bold text-orange-700">
            Match still in progress
          </p>

          <p className="mt-1 text-[10px] text-orange-600">
            A team needs 11 points with a
            minimum 2-point lead.
          </p>

        </div>
      )}

    </div>
  );
}

/* =========================================================
   TEAM SUMMARY
========================================================= */

function TeamSummary({
  teamName,
  points,
  winner,
}: {
  teamName: string;
  points: number;
  winner: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        winner
          ? "border-green-200 bg-green-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >

      <div className="flex items-center justify-between gap-2">

        <h3 className="truncate text-sm font-black text-slate-900">
          {teamName}
        </h3>

        {winner && (
          <Trophy
            size={16}
            className="shrink-0 text-yellow-500"
          />
        )}

      </div>

      <div className="mt-3">

        <div className="rounded-lg bg-white p-3 text-center">

          <p className="text-[9px] uppercase text-slate-400">
            Final Points
          </p>

          <p className="text-2xl font-black text-slate-900">
            {points}
          </p>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   RULE CARD
========================================================= */

function RuleCard({
  score,
  result,
}: {
  score: string;
  result: string;
}) {
  const won = result === "Win";

  return (
    <div className="rounded-xl bg-white/80 p-2 text-center">

      <p className="text-xs font-black text-slate-900">
        {score}
      </p>

      <p
        className={`mt-0.5 text-[9px] font-black uppercase ${
          won
            ? "text-green-600"
            : "text-orange-600"
        }`}
      >
        {result}
      </p>

    </div>
  );
}

/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">

      <div className="flex items-center gap-1.5 text-slate-400">

        {icon}

        <span className="text-[9px] font-bold uppercase">
          {label}
        </span>

      </div>

      <p className="mt-1 truncate text-xs font-black text-slate-800">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   SECTION TITLE
========================================================= */

function SectionTitle({
  title,
}: {
  title: string;
}) {
  return (
    <div className="mb-2 flex items-center gap-2">

      <div className="h-4 w-1 rounded-full bg-orange-600" />

      <h2 className="text-sm font-black text-slate-900">
        {title}
      </h2>

    </div>
  );
}

/* =========================================================
   DATE
========================================================= */

function formatDate(
  value: string
): string {
  try {
    return new Date(
      value
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  } catch {
    return "-";
  }
}