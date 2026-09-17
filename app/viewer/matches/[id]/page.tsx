"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// =====================================================
// TYPES
// =====================================================

interface Player {
  id: number;
  name: string;
  jerseyNo?: number | null;
  role?: string | null;
  photo?: string | null;
}

interface Team {
  id: number;
  name: string;
  captain?: string | null;
  score?: number | null;
  players?: Player[];
}

interface Game {
  id: number;
  name: string;
  sportType?: string | null;
}

interface ThrowballScore {
  id?: number;
  matchId?: number;
  team1Id?: number;
  team2Id?: number;

  team1Score?: number | null;
  team2Score?: number | null;

  currentSet?: number | null;

  team1Set1?: number | null;
  team2Set1?: number | null;

  team1SetsWon?: number | null;
  team2SetsWon?: number | null;

  status?: string | null;

  winnerTeamId?: number | null;

  winnerTeam?: {
    id: number;
    name: string;
  } | null;
}

interface Match {
  id: number;

  matchNumber?: number | null;

  stage?: string | null;

  status: string;

  result?: string | null;

  winnerTeamId?: number | null;

  team1Score?: number | null;

  team2Score?: number | null;

  overs?: number | null;

  team1: Team;

  team2: Team;

  game: Game;

  winner?: {
    id: number;
    name: string;
  } | null;

  throwballScore?: ThrowballScore | null;
}

// =====================================================
// PAGE
// =====================================================

export default function ViewerMatchPage() {
  const params = useParams();

  const matchId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [match, setMatch] =
    useState<Match | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ===================================================
  // LOAD MATCH
  // ===================================================

  useEffect(() => {
    if (!matchId) return;

    loadMatch();
  }, [matchId]);

  async function loadMatch() {
    try {
      setLoading(true);
      setError("");

      // =================================================
      // STEP 1
      // BASIC MATCH API
      // =================================================

      const basicResponse =
        await fetch(
          `/api/matches/${matchId}`,
          {
            cache: "no-store",
          }
        );

      if (!basicResponse.ok) {
        throw new Error(
          "Failed to load match."
        );
      }

      const basicData =
        await basicResponse.json();

      const basicMatch =
        basicData?.match ??
        basicData;

      if (!basicMatch) {
        throw new Error(
          "Match details not available."
        );
      }

      // =================================================
      // SPORT
      // =================================================

      const sportType =
        basicMatch?.game?.sportType
          ?.toString()
          .toUpperCase();

      if (!sportType) {
        throw new Error(
          "Sport type not available."
        );
      }

      // =================================================
      // STEP 2
      // SELECT CORRECT API
      // =================================================

      let summaryApi = "";

      switch (sportType) {
        // -----------------------------------------------
        // CRICKET
        // -----------------------------------------------

        case "CRICKET":
          summaryApi =
            `/api/matches/${matchId}/summary`;
          break;

        // -----------------------------------------------
        // FOOTBALL
        // -----------------------------------------------

        case "FOOTBALL":
          summaryApi =
            `/api/matches/${matchId}/football/summary`;
          break;

        // -----------------------------------------------
        // HANDBALL
        // -----------------------------------------------

        case "HANDBALL":
          summaryApi =
            `/api/matches/${matchId}/handball/summary`;
          break;

        // -----------------------------------------------
        // THROWBALL
        // -----------------------------------------------

        case "THROWBALL":
          summaryApi =
            `/api/matches/${matchId}/throwball`;
          break;

        default:
          throw new Error(
            `Unsupported sport: ${sportType}`
          );
      }

      console.log(
        "VIEWER SUMMARY API:",
        summaryApi
      );

      // =================================================
      // STEP 3
      // CALL SPORT API
      // =================================================

      const summaryResponse =
        await fetch(
          summaryApi,
          {
            cache: "no-store",
          }
        );

      // Read response as text first.
      // This prevents JSON parsing errors
      // when Next.js returns an HTML error page.

      const responseText =
        await summaryResponse.text();

      let summaryData: any;

      try {
        summaryData =
          JSON.parse(responseText);
      } catch {
        console.error(
          "INVALID API RESPONSE:",
          responseText
        );

        throw new Error(
          `Invalid response from ${sportType.toLowerCase()} API.`
        );
      }

      console.log(
        "VIEWER API RESPONSE:",
        summaryData
      );

      // =================================================
      // API ERROR
      // =================================================

      if (!summaryResponse.ok) {
        throw new Error(
          summaryData?.error ||
            `Failed to load ${sportType.toLowerCase()} summary.`
        );
      }

      if (
        summaryData?.success === false
      ) {
        throw new Error(
          summaryData?.error ||
            `Failed to load ${sportType.toLowerCase()} match.`
        );
      }

      // =================================================
      // MATCH FROM SPORT API
      // =================================================

      const summaryMatch =
        summaryData?.match;

      if (!summaryMatch) {
        throw new Error(
          "Match data not available from sport API."
        );
      }

      // =================================================
      // SCORE
      // =================================================

      let team1Score = 0;
      let team2Score = 0;

      // -------------------------------------------------
      // THROWBALL SCORE
      // -------------------------------------------------

      if (
        sportType ===
        "THROWBALL"
      ) {
        team1Score =
          summaryMatch
            ?.throwballScore
            ?.team1Score ??
          summaryData?.score
            ?.team1Score ??
          0;

        team2Score =
          summaryMatch
            ?.throwballScore
            ?.team2Score ??
          summaryData?.score
            ?.team2Score ??
          0;
      }

      // -------------------------------------------------
      // OTHER SPORTS
      // -------------------------------------------------

      else {
        team1Score =
          summaryMatch?.team1Score ??
          summaryMatch?.team1?.score ??
          summaryData?.score
            ?.team1Score ??
          basicMatch?.team1Score ??
          0;

        team2Score =
          summaryMatch?.team2Score ??
          summaryMatch?.team2?.score ??
          summaryData?.score
            ?.team2Score ??
          basicMatch?.team2Score ??
          0;
      }

      // =================================================
      // WINNER TEAM ID
      // =================================================

      let winnerTeamId =
        summaryMatch?.winnerTeamId ??
        summaryMatch
          ?.throwballScore
          ?.winnerTeamId ??
        summaryData?.score
          ?.winnerTeamId ??
        basicMatch?.winnerTeamId ??
        null;

      // =================================================
      // WINNER OBJECT
      // =================================================

      let winner =
        summaryMatch?.winner ??
        null;

      // Throwball winner
      if (
        !winner &&
        sportType ===
          "THROWBALL"
      ) {
        winner =
          summaryMatch
            ?.throwballScore
            ?.winnerTeam ??
          summaryData?.score
            ?.winnerTeam ??
          null;
      }

      // Create winner object from ID
      if (
        !winner &&
        winnerTeamId
      ) {
        if (
          winnerTeamId ===
          summaryMatch?.team1?.id
        ) {
          winner = {
            id:
              summaryMatch.team1.id,

            name:
              summaryMatch.team1.name,
          };
        } else if (
          winnerTeamId ===
          summaryMatch?.team2?.id
        ) {
          winner = {
            id:
              summaryMatch.team2.id,

            name:
              summaryMatch.team2.name,
          };
        }
      }

      // =================================================
      // TEAM 1
      // =================================================

      const team1: Team = {
        id:
          summaryMatch?.team1?.id ??
          basicMatch?.team1?.id,

        name:
          summaryMatch?.team1?.name ??
          basicMatch?.team1?.name ??
          "Team 1",

        captain:
          summaryMatch?.team1
            ?.captain ??
          basicMatch?.team1
            ?.captain ??
          null,

        score:
          team1Score,

        players:
          summaryMatch?.team1
            ?.players ??
          basicMatch?.team1
            ?.players ??
          summaryData?.teams
            ?.team1?.players ??
          summaryData?.players
            ?.team1 ??
          [],
      };

      // =================================================
      // TEAM 2
      // =================================================

      const team2: Team = {
        id:
          summaryMatch?.team2?.id ??
          basicMatch?.team2?.id,

        name:
          summaryMatch?.team2?.name ??
          basicMatch?.team2?.name ??
          "Team 2",

        captain:
          summaryMatch?.team2
            ?.captain ??
          basicMatch?.team2
            ?.captain ??
          null,

        score:
          team2Score,

        players:
          summaryMatch?.team2
            ?.players ??
          basicMatch?.team2
            ?.players ??
          summaryData?.teams
            ?.team2?.players ??
          summaryData?.players
            ?.team2 ??
          [],
      };

      // =================================================
      // THROWBALL WINNER FALLBACK
      // =================================================

      if (
        sportType ===
          "THROWBALL" &&
        !winnerTeamId &&
        summaryMatch
          ?.throwballScore
          ?.winnerTeamId
      ) {
        winnerTeamId =
          summaryMatch
            .throwballScore
            .winnerTeamId;
      }

      // =================================================
      // FINAL MATCH OBJECT
      // =================================================

      const normalizedMatch: Match = {
        id:
          summaryMatch?.id ??
          basicMatch?.id,

        matchNumber:
          summaryMatch
            ?.matchNumber ??
          basicMatch
            ?.matchNumber ??
          null,

        stage:
          summaryMatch?.stage ??
          basicMatch?.stage ??
          null,

        status:
          summaryMatch?.status ??
          basicMatch?.status ??
          "UPCOMING",

        result:
          summaryMatch?.result ??
          basicMatch?.result ??
          null,

        winnerTeamId,

        team1Score,

        team2Score,

        overs:
          summaryMatch?.overs ??
          basicMatch?.overs ??
          null,

        team1,

        team2,

        game: {
          id:
            summaryMatch
              ?.game?.id ??
            basicMatch
              ?.game?.id,

          name:
            summaryMatch
              ?.game?.name ??
            basicMatch
              ?.game?.name ??
            "Match",

          sportType:
            summaryMatch
              ?.game?.sportType ??
            sportType,
        },

        winner,

        throwballScore:
          summaryMatch
            ?.throwballScore ??
          null,
      };

      console.log(
        "NORMALIZED VIEWER MATCH:",
        normalizedMatch
      );

      setMatch(
        normalizedMatch
      );
    } catch (err) {
      console.error(
        "VIEWER MATCH ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load match details."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // SPORT NAME
  // =====================================================

  function getSportName() {
    if (
      !match?.game?.sportType
    ) {
      return "SPORT";
    }

    return match.game.sportType;
  }

  // =====================================================
  // RESULT
  // =====================================================

  function getResultText() {
    if (!match) {
      return "";
    }

    if (
      match.status !==
      "COMPLETED"
    ) {
      return "";
    }

    // Winner object
    if (
      match.winner?.name
    ) {
      return `${match.winner.name} won`;
    }

    // Stored result
    if (
      match.result ===
      "TEAM1_WIN"
    ) {
      return `${match.team1.name} won`;
    }

    if (
      match.result ===
      "TEAM2_WIN"
    ) {
      return `${match.team2.name} won`;
    }

    if (
      match.result ===
      "DRAW"
    ) {
      return "Draw";
    }

    if (
      match.result ===
      "TIE"
    ) {
      return "Tie";
    }

    if (
      match.result ===
      "NO_RESULT"
    ) {
      return "No Result";
    }

    // Winner ID
    if (
      match.winnerTeamId ===
      match.team1.id
    ) {
      return `${match.team1.name} won`;
    }

    if (
      match.winnerTeamId ===
      match.team2.id
    ) {
      return `${match.team2.name} won`;
    }

    // Score fallback
    const team1Score =
      match.team1Score ?? 0;

    const team2Score =
      match.team2Score ?? 0;

    if (
      team1Score >
      team2Score
    ) {
      return `${match.team1.name} won`;
    }

    if (
      team2Score >
      team1Score
    ) {
      return `${match.team2.name} won`;
    }

    return "Draw";
  }

  // =====================================================
  // STATUS STYLE
  // =====================================================

  function getStatusStyle() {
    if (!match) {
      return "";
    }

    switch (
      match.status
    ) {
      case "LIVE":
        return "bg-red-100 text-red-600";

      case "UPCOMING":
        return "bg-blue-100 text-blue-600";

      case "COMPLETED":
        return "bg-green-100 text-green-600";

      case "CANCELLED":
        return "bg-slate-100 text-slate-500";

      default:
        return "bg-slate-100 text-slate-600";
    }
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">

        <div className="mx-auto max-w-5xl">

          <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">

            <p className="text-sm text-slate-500">
              Loading match...
            </p>

          </div>

        </div>

      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (
    error ||
    !match
  ) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">

        <div className="mx-auto max-w-5xl">

          <Link
            href="/viewer/matches"
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Back to Matches
          </Link>

          <div className="mt-5 rounded-2xl border bg-white p-10 text-center shadow-sm">

            <div className="text-4xl">
              ⚠️
            </div>

            <h1 className="mt-3 text-xl font-semibold text-slate-900">
              Match not found
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {error ||
                "The requested match could not be found."}
            </p>

            <button
              onClick={loadMatch}
              className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Try Again
            </button>

          </div>

        </div>

      </div>
    );
  }

  const team1Score =
    match.team1Score ?? 0;

  const team2Score =
    match.team2Score ?? 0;

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="border-b bg-white">

        <div className="mx-auto max-w-5xl px-6 py-5">

          <Link
            href="/viewer/matches"
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Back to Matches
          </Link>

        </div>

      </div>

      <main className="mx-auto max-w-5xl px-6 py-8">

        {/* =================================================
            MATCH HEADER
        ================================================= */}

        <div className="rounded-2xl border bg-white shadow-sm">

          <div className="border-b px-6 py-5">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <div className="flex flex-wrap items-center gap-2">

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {getSportName()}
                  </span>

                  {match.stage && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                      {match.stage}
                    </span>
                  )}

                </div>

                <h1 className="mt-3 text-2xl font-bold text-slate-900">
                  {match.game?.name ||
                    "Match"}
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  {match.matchNumber
                    ? `Match ${match.matchNumber}`
                    : `Match #${match.id}`}
                </p>

              </div>

              <div>

                <span
                  className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold ${getStatusStyle()}`}
                >

                  {match.status ===
                    "LIVE" && (
                    <span className="mr-1.5">
                      ●
                    </span>
                  )}

                  {match.status}

                </span>

              </div>

            </div>

          </div>

          {/* =================================================
              SCORE
          ================================================= */}

          <div className="px-6 py-8">

            <div className="grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">

              {/* TEAM 1 */}

              <div className="text-center md:text-right">

                <p
                  className={`text-xl font-bold ${
                    match.winnerTeamId ===
                    match.team1.id
                      ? "text-slate-900"
                      : "text-slate-700"
                  }`}
                >
                  {match.team1.name}
                </p>

                <p className="mt-2 text-4xl font-black text-slate-900">
                  {team1Score}
                </p>

              </div>

              {/* VS */}

              <div className="text-center">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500">
                  VS
                </div>

                {match.overs && (
                  <p className="mt-2 text-xs text-slate-400">
                    {match.overs} overs
                  </p>
                )}

              </div>

              {/* TEAM 2 */}

              <div className="text-center md:text-left">

                <p
                  className={`text-xl font-bold ${
                    match.winnerTeamId ===
                    match.team2.id
                      ? "text-slate-900"
                      : "text-slate-700"
                  }`}
                >
                  {match.team2.name}
                </p>

                <p className="mt-2 text-4xl font-black text-slate-900">
                  {team2Score}
                </p>

              </div>

            </div>

            {/* =================================================
                RESULT
            ================================================= */}

            {match.status ===
              "COMPLETED" && (
              <div className="mt-8 rounded-xl bg-slate-50 px-5 py-4 text-center">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Result
                </p>

                <p className="mt-1 text-lg font-bold text-slate-900">
                  {getResultText()}
                </p>

              </div>
            )}

            {/* =================================================
                LIVE
            ================================================= */}

            {match.status ===
              "LIVE" && (
              <div className="mt-8 rounded-xl bg-red-50 px-5 py-4 text-center">

                <p className="text-sm font-semibold text-red-600">
                  🔴 Match is currently live
                </p>

                <p className="mt-1 text-xs text-red-500">
                  Follow the live match for the latest score.
                </p>

              </div>
            )}

          </div>

        </div>

        {/* =================================================
            TEAMS
        ================================================= */}

        <div className="mt-6 grid gap-5 md:grid-cols-2">

          {/* TEAM 1 */}

          <div className="rounded-2xl border bg-white shadow-sm">

            <div className="border-b px-5 py-4">

              <h2 className="font-semibold text-slate-900">
                {match.team1.name}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Team Players
              </p>

            </div>

            <div className="divide-y">

              {(match.team1.players ??
                []).length === 0 ? (

                <div className="px-5 py-5 text-sm text-slate-400">
                  Player details not available.
                </div>

              ) : (

                match.team1.players?.map(
                  (player) => (
                    <div
                      key={player.id}
                      className="flex items-center px-5 py-3"
                    >

                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                        {player.jerseyNo ??
                          "-"}
                      </div>

                      <div className="ml-3">

                        <p className="text-sm font-medium text-slate-800">
                          {player.name}
                        </p>

                        {player.role && (
                          <p className="text-xs text-slate-400">
                            {player.role}
                          </p>
                        )}

                      </div>

                    </div>
                  )
                )

              )}

            </div>

          </div>

          {/* TEAM 2 */}

          <div className="rounded-2xl border bg-white shadow-sm">

            <div className="border-b px-5 py-4">

              <h2 className="font-semibold text-slate-900">
                {match.team2.name}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Team Players
              </p>

            </div>

            <div className="divide-y">

              {(match.team2.players ??
                []).length === 0 ? (

                <div className="px-5 py-5 text-sm text-slate-400">
                  Player details not available.
                </div>

              ) : (

                match.team2.players?.map(
                  (player) => (
                    <div
                      key={player.id}
                      className="flex items-center px-5 py-3"
                    >

                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                        {player.jerseyNo ??
                          "-"}
                      </div>

                      <div className="ml-3">

                        <p className="text-sm font-medium text-slate-800">
                          {player.name}
                        </p>

                        {player.role && (
                          <p className="text-xs text-slate-400">
                            {player.role}
                          </p>
                        )}

                      </div>

                    </div>
                  )
                )

              )}

            </div>

          </div>

        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="mt-8 text-center">

          <Link
            href="/viewer"
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            Back to Viewer Home
          </Link>

        </div>

      </main>

    </div>
  );
}