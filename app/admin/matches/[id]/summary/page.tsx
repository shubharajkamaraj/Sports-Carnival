"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

/* =========================================================
   TYPES
========================================================= */

type Player = {
  id: number;
  name: string;
  jerseyNo?: number | null;
  role?: string | null;
  photo?: string | null;
};

type Team = {
  id: number;
  name: string;
  captain?: string | null;
  players: Player[];
};

type BallEvent = {
  id: number;

  inningsId: number;

  overNumber: number;
  ballNumber: number;

  strikerId: number;
  nonStrikerId: number;
  bowlerId: number;

  runsOffBat: number;
  extraRuns: number;
  totalRuns: number;

  extraType: string;

  isLegalDelivery: boolean;
  isWicket: boolean;

  dismissalType?: string | null;
  dismissedPlayerId?: number | null;
  fielderId?: number | null;

  createdAt?: string;
};

type Innings = {
  id: number;

  matchId: number;

  inningsNumber: number;

  battingTeamId: number;
  bowlingTeamId: number;

  totalRuns: number;
  totalWickets: number;
  legalBalls: number;

  createdAt?: string;
  updatedAt?: string;

  battingTeam: Team;
  bowlingTeam: Team;

  ballEvents: BallEvent[];
};

type MatchAward = {
  id: number;

  matchId: number;
  playerId: number;
  tournamentId: number;

  awardType:
    | "MAN_OF_THE_MATCH"
    | "BEST_PLAYER"
    | "BEST_BOWLER";

  reason: string | null;

  player: Player;
};

type Match = {
  id: number;

  tournamentId?: number;
  gameId?: number;

  matchNumber: number | null;

  matchDate?: string;
  venue?: string;

  status: string;

  result: string | null;

  winnerTeamId: number | null;

  overs: number;

  team1Score: number;
  team2Score: number;

  team1: Team;
  team2: Team;

  winnerTeam: Team | null;

  cricketInnings: Innings[];

  awards?: MatchAward[];
};

type SummaryResponse = {
  success: boolean;
  match: Match;
};

type AwardsResponse = {
  success: boolean;

  bestBatter?: {
    playerId: number;
    playerName: string;
    runs: number;
  } | null;

  bestBowler?: {
    playerId: number;
    playerName: string;
    wickets: number;
    runsConceded: number;
  } | null;

  awards: MatchAward[];
};

/* =========================================================
   SCORECARD TYPES
========================================================= */

type BattingRow = {
  player: Player;

  runs: number;

  balls: number;

  fours: number;

  sixes: number;

  strikeRate: number;

  dismissal: BallEvent | null;
};

type BowlingRow = {
  player: Player;

  legalBalls: number;

  runs: number;

  wickets: number;

  economy: number;
};

/* =========================================================
   HELPERS
========================================================= */

function formatOvers(legalBalls: number) {
  const overs = Math.floor(legalBalls / 6);

  const balls = legalBalls % 6;

  return `${overs}.${balls}`;
}

function formatStrikeRate(
  runs: number,
  balls: number
) {
  if (balls === 0) return 0;

  return (runs / balls) * 100;
}

function formatEconomy(
  runs: number,
  legalBalls: number
) {
  if (legalBalls === 0) return 0;

  return runs / (legalBalls / 6);
}

/* =========================================================
   RESULT
========================================================= */

function getResultText(match: Match) {
  if (match.result === "TEAM1_WIN") {
    const margin = Math.abs(
      match.team1Score -
        match.team2Score
    );

    return `${match.team1.name} won by ${margin} runs`;
  }

  if (match.result === "TEAM2_WIN") {
    const margin = Math.abs(
      match.team2Score -
        match.team1Score
    );

    return `${match.team2.name} won by ${margin} runs`;
  }

  if (match.result === "TIE") {
    return "Match tied";
  }

  if (match.result === "DRAW") {
    return "Match drawn";
  }

  if (match.result === "NO_RESULT") {
    return "No result";
  }

  return "Match completed";
}

/* =========================================================
   DISMISSAL TEXT
========================================================= */

function getDismissalText(
  ball: BallEvent,
  players: Player[]
) {
  if (!ball.dismissalType) {
    return "Out";
  }

  const type =
    ball.dismissalType
      .replaceAll("_", " ")
      .toLowerCase();

  const dismissedPlayer =
    players.find(
      (player) =>
        player.id ===
        ball.dismissedPlayerId
    );

  const fielder =
    players.find(
      (player) =>
        player.id ===
        ball.fielderId
    );

  if (
    type.includes("caught") &&
    fielder
  ) {
    return `c ${fielder.name} b ${dismissedPlayer ? "Bowler" : ""}`;
  }

  if (
    type.includes("run") &&
    fielder
  ) {
    return `run out (${fielder.name})`;
  }

  if (type.includes("bowled")) {
    return "b Bowler";
  }

  if (type.includes("lbw")) {
    return "lbw";
  }

  if (type.includes("stumped")) {
    return `st ${fielder?.name ?? ""} b Bowler`;
  }

  return type;
}

/* =========================================================
   BALL DISPLAY
========================================================= */

function getBallDisplay(
  ball: BallEvent
) {
  if (ball.isWicket) {
    return "W";
  }

  if (
    ball.extraType ===
      "NO_BALL"
  ) {
    if (ball.runsOffBat > 0) {
      return `NB+${ball.runsOffBat}`;
    }

    return "NB";
  }

  if (
    ball.extraType ===
      "WIDE"
  ) {
    return "Wd";
  }

  if (
    ball.extraType ===
      "BYE"
  ) {
    return `B${ball.totalRuns}`;
  }

  if (
    ball.extraType ===
      "LEG_BYE"
  ) {
    return `Lb${ball.totalRuns}`;
  }

  return String(
    ball.totalRuns
  );
}

/* =========================================================
   BALL CLASS
========================================================= */

function getBallClass(
  ball: BallEvent
) {
  if (ball.isWicket) {
    return "border-red-500 bg-red-500/15 text-red-400";
  }

  if (
    ball.extraType ===
      "NO_BALL" ||
    ball.extraType ===
      "WIDE"
  ) {
    return "border-orange-500/30 bg-orange-500/10 text-orange-400";
  }

  if (ball.totalRuns === 4) {
    return "border-blue-500/30 bg-blue-500/10 text-blue-400";
  }

  if (ball.totalRuns === 6) {
    return "border-purple-500/30 bg-purple-500/10 text-purple-400";
  }

  if (ball.totalRuns === 0) {
    return "border-slate-700 bg-slate-900 text-slate-400";
  }

  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
}

/* =========================================================
   PAGE
========================================================= */

export default function MatchSummaryPage() {
  const params = useParams();

  const router = useRouter();

  const matchId = Number(
    params.id
  );

  const [match, setMatch] =
    useState<Match | null>(null);

  const [awards, setAwards] =
    useState<MatchAward[]>([]);

  const [bestBatter, setBestBatter] =
    useState<
      AwardsResponse["bestBatter"]
    >(null);

  const [bestBowler, setBestBowler] =
    useState<
      AwardsResponse["bestBowler"]
    >(null);

  const [loading, setLoading] =
    useState(true);

  const [awardsLoading, setAwardsLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =======================================================
     LOAD AWARDS
  ======================================================= */

  async function loadAwards() {
    try {
      setAwardsLoading(true);

      if (
        match?.status !==
        "COMPLETED"
      ) {
        return;
      }

      const generateRes =
        await fetch(
          `/api/matches/${matchId}/awards`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            cache: "no-store",
          }
        );

      if (!generateRes.ok) {
        throw new Error(
          "Failed to generate awards."
        );
      }

      const awardsRes =
        await fetch(
          `/api/matches/${matchId}/awards`,
          {
            cache: "no-store",
          }
        );

      const data =
        (await awardsRes.json()) as
          | AwardsResponse
          | { error?: string };

      if (!awardsRes.ok) {
        throw new Error(
          "error" in data
            ? data.error ??
                "Failed to load awards."
            : "Failed to load awards."
        );
      }

      if (
        !("awards" in data)
      ) {
        return;
      }

      setAwards(
        data.awards ?? []
      );

      setBestBatter(
        data.bestBatter ?? null
      );

      setBestBowler(
        data.bestBowler ?? null
      );
    } catch (error) {
      console.error(
        "AWARDS ERROR:",
        error
      );

      setAwards([]);

      setBestBatter(null);

      setBestBowler(null);
    } finally {
      setAwardsLoading(false);
    }
  }

  /* =======================================================
     LOAD SUMMARY
  ======================================================= */

  useEffect(() => {
    if (
      !Number.isInteger(matchId) ||
      matchId <= 0
    ) {
      setError(
        "Invalid match ID."
      );

      setLoading(false);

      return;
    }

    async function loadSummary() {
      try {
        setLoading(true);

        setError("");

        const res =
          await fetch(
            `/api/matches/${matchId}/summary`,
            {
              cache: "no-store",
            }
          );

        const data =
          (await res.json()) as
            | SummaryResponse
            | { error?: string };

        if (!res.ok) {
          throw new Error(
            "error" in data
              ? data.error ??
                  "Failed to load summary."
              : "Failed to load summary."
          );
        }

        if (
          !("match" in data)
        ) {
          throw new Error(
            "Match data not found."
          );
        }

        setMatch(
          data.match
        );
      } catch (error) {
        console.error(
          "SUMMARY ERROR:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load match summary."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, [matchId]);

  /* =======================================================
     LOAD AWARDS AFTER MATCH
  ======================================================= */

  useEffect(() => {
    if (
      match?.status ===
      "COMPLETED"
    ) {
      loadAwards();
    }
  }, [match]);

  /* =======================================================
     SCORECARD CALCULATION
  ======================================================= */

  function calculateBattingScorecard(
    innings: Innings
  ): BattingRow[] {
    const players =
      innings.battingTeam.players;

    const rows =
      new Map<
        number,
        BattingRow
      >();

    players.forEach(
      (player) => {
        rows.set(player.id, {
          player,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          strikeRate: 0,
          dismissal: null,
        });
      }
    );

    for (const ball of innings.ballEvents) {
      const row =
        rows.get(
          ball.strikerId
        );

      if (!row) continue;

      row.runs +=
        ball.runsOffBat;

      /*
       * Legal delivery counts as a ball.
       * No-ball and wide do not count.
       */
      if (
        ball.isLegalDelivery
      ) {
        row.balls += 1;
      }

      if (
        ball.runsOffBat === 4
      ) {
        row.fours += 1;
      }

      if (
        ball.runsOffBat === 6
      ) {
        row.sixes += 1;
      }

      if (
        ball.isWicket &&
        ball.dismissedPlayerId ===
          ball.strikerId
      ) {
        row.dismissal =
          ball;
      }
    }

    return Array.from(
      rows.values()
    ).map((row) => ({
      ...row,
      strikeRate:
        formatStrikeRate(
          row.runs,
          row.balls
        ),
    }));
  }

  function calculateBowlingScorecard(
    innings: Innings
  ): BowlingRow[] {
    const players =
      innings.bowlingTeam.players;

    const rows =
      new Map<
        number,
        BowlingRow
      >();

    players.forEach(
      (player) => {
        rows.set(player.id, {
          player,
          legalBalls: 0,
          runs: 0,
          wickets: 0,
          economy: 0,
        });
      }
    );

    for (const ball of innings.ballEvents) {
      const row =
        rows.get(
          ball.bowlerId
        );

      if (!row) continue;

      /*
       * Bowler gets charged with:
       * - bat runs
       * - no-ball
       * - wide
       *
       * Bye and leg-bye are not charged.
       */
      const isBye =
        ball.extraType ===
        "BYE";

      const isLegBye =
        ball.extraType ===
        "LEG_BYE";

      if (
        !isBye &&
        !isLegBye
      ) {
        row.runs +=
          ball.totalRuns;
      }

      if (
        ball.isLegalDelivery
      ) {
        row.legalBalls += 1;
      }

      if (
        ball.isWicket
      ) {
        const dismissal =
          ball.dismissalType ??
          "";

        const bowlerWicketTypes = [
          "BOWLED",
          "CAUGHT",
          "LBW",
          "STUMPED",
          "HIT_WICKET",
        ];

        if (
          bowlerWicketTypes.includes(
            dismissal
          )
        ) {
          row.wickets += 1;
        }
      }
    }

    return Array.from(
      rows.values()
    )
      .filter(
        (row) =>
          row.legalBalls > 0 ||
          row.runs > 0 ||
          row.wickets > 0
      )
      .map((row) => ({
        ...row,
        economy:
          formatEconomy(
            row.runs,
            row.legalBalls
          ),
      }));
  }

  /* =======================================================
     MEMOIZED SCORECARDS
  ======================================================= */

  const inningsScorecards =
    useMemo(() => {
      if (!match) return [];

      return match.cricketInnings.map(
        (innings) => ({
          innings,
          batting:
            calculateBattingScorecard(
              innings
            ),
          bowling:
            calculateBowlingScorecard(
              innings
            ),
        })
      );
    }, [match]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <p className="text-slate-400">
              Loading match summary...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-8">
            <h1 className="text-xl font-bold text-red-400">
              Unable to load match
            </h1>

            <p className="mt-2 text-sm text-red-300">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/matches"
                )
              }
              className="mt-6 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900"
            >
              Back to Matches
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!match) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <p className="text-slate-400">
              Match not found.
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     INNINGS
  ======================================================= */

  const innings1 =
    match.cricketInnings.find(
      (innings) =>
        innings.inningsNumber === 1
    );

  const innings2 =
    match.cricketInnings.find(
      (innings) =>
        innings.inningsNumber === 2
    );

  /* =======================================================
     AWARDS
  ======================================================= */

  const manOfTheMatch =
    awards.find(
      (award) =>
        award.awardType ===
        "MAN_OF_THE_MATCH"
    );

  const bestPlayerAward =
    awards.find(
      (award) =>
        award.awardType ===
        "BEST_PLAYER"
    );

  const bestBowlerAward =
    awards.find(
      (award) =>
        award.awardType ===
        "BEST_BOWLER"
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <p className="text-sm font-semibold text-slate-500">
              MATCH SUMMARY
              {match.matchNumber
                ? ` • MATCH #${match.matchNumber}`
                : ""}
            </p>

            <h1 className="mt-1 text-3xl font-black">
              {match.team1.name}
              <span className="mx-3 text-slate-600">
                vs
              </span>
              {match.team2.name}
            </h1>

            {match.venue && (
              <p className="mt-2 text-sm text-slate-500">
                {match.venue}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/matches"
              )
            }
            className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-bold text-slate-200 hover:bg-slate-800"
          >
            ← Back to Matches
          </button>
        </header>

        {/* =================================================
            RESULT
        ================================================= */}

        <section className="overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/50 via-slate-900 to-slate-950">

          <div className="border-b border-slate-800 p-6 text-center">

            <div className="text-4xl">
              {match.status ===
              "COMPLETED"
                ? "🏆"
                : "🏏"}
            </div>

            <h2 className="mt-3 text-2xl font-black text-emerald-400">
              {match.status ===
              "COMPLETED"
                ? "MATCH COMPLETED"
                : "MATCH IN PROGRESS"}
            </h2>

            {match.status ===
              "COMPLETED" && (
              <p className="mt-2 text-lg font-bold">
                {getResultText(
                  match
                )}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 divide-x divide-slate-800">

            <div className="p-6 text-center">

              <p className="text-sm font-bold text-slate-400">
                {match.team1.name}
              </p>

              <p className="mt-2 text-4xl font-black">
                {match.team1Score}
              </p>

              {innings1 && (
                <p className="mt-1 text-sm text-slate-500">
                  {formatOvers(
                    innings1.legalBalls
                  )} overs
                </p>
              )}

            </div>

            <div className="p-6 text-center">

              <p className="text-sm font-bold text-slate-400">
                {match.team2.name}
              </p>

              <p className="mt-2 text-4xl font-black">
                {match.team2Score}
              </p>

              {innings2 && (
                <p className="mt-1 text-sm text-slate-500">
                  {formatOvers(
                    innings2.legalBalls
                  )} overs
                </p>
              )}

            </div>

          </div>
        </section>

        {/* =================================================
            FULL SCORECARDS
        ================================================= */}

        {inningsScorecards.map(
          ({
            innings,
            batting,
            bowling,
          }) => (
            <section
              key={innings.id}
              className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900"
            >

              {/* SCORECARD HEADER */}

              <div className="border-b border-slate-800 bg-slate-950/70 p-5">

                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

                  <div>

                    <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Innings{" "}
                      {
                        innings.inningsNumber
                      }
                    </p>

                    <h2 className="mt-1 text-2xl font-black">
                      {
                        innings
                          .battingTeam
                          .name
                      }
                    </h2>

                  </div>

                  <div className="text-left md:text-right">

                    <p className="text-3xl font-black">
                      {
                        innings.totalRuns
                      }
                      /
                      {
                        innings.totalWickets
                      }
                    </p>

                    <p className="text-sm text-slate-500">
                      {formatOvers(
                        innings.legalBalls
                      )} overs
                    </p>

                  </div>

                </div>

              </div>

              {/* =========================================
                  BATTING
              ========================================= */}

              <div className="p-5">

                <div className="mb-3 flex items-center justify-between">

                  <h3 className="text-lg font-black">
                    🏏 Batting
                  </h3>

                  <span className="text-xs font-bold text-slate-500">
                    {innings.battingTeam.name}
                  </span>

                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-800">

                  <div className="min-w-[700px]">

                    {/* HEADER */}

                    <div className="grid grid-cols-[minmax(240px,1fr)_70px_70px_60px_60px_90px] bg-slate-950 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">

                      <span>
                        Batter
                      </span>

                      <span className="text-right">
                        R
                      </span>

                      <span className="text-right">
                        B
                      </span>

                      <span className="text-right">
                        4s
                      </span>

                      <span className="text-right">
                        6s
                      </span>

                      <span className="text-right">
                        SR
                      </span>

                    </div>

                    {batting.map(
                      (row) => (
                        <div
                          key={
                            row.player.id
                          }
                          className="grid grid-cols-[minmax(240px,1fr)_70px_70px_60px_60px_90px] border-t border-slate-800 px-4 py-3"
                        >

                          <div>

                            <p className="font-bold">
                              {
                                row
                                  .player
                                  .name
                              }

                              {row.player.jerseyNo && (
                                <span className="ml-2 text-xs text-slate-600">
                                  #
                                  {
                                    row
                                      .player
                                      .jerseyNo
                                  }
                                </span>
                              )}
                            </p>

                            {row.dismissal && (
                              <p className="mt-1 text-xs font-semibold text-red-400">
                                {getDismissalText(
                                  row.dismissal,
                                  innings
                                    .battingTeam
                                    .players
                                )}
                              </p>
                            )}

                          </div>

                          <span className="text-right font-black">
                            {row.runs}
                          </span>

                          <span className="text-right font-semibold text-slate-400">
                            {row.balls}
                          </span>

                          <span className="text-right font-semibold text-slate-400">
                            {row.fours}
                          </span>

                          <span className="text-right font-semibold text-slate-400">
                            {row.sixes}
                          </span>

                          <span className="text-right font-bold text-blue-400">
                            {row.strikeRate.toFixed(
                              2
                            )}
                          </span>

                        </div>
                      )
                    )}

                    {/* EXTRAS */}

                    <div className="grid grid-cols-[minmax(240px,1fr)_70px_70px_60px_60px_90px] border-t border-slate-800 bg-slate-950/50 px-4 py-3">

                      <span className="font-bold text-slate-400">
                        Extras
                      </span>

                      <span className="col-span-5 text-right font-black">
                        {innings.ballEvents.reduce(
                          (
                            sum,
                            ball
                          ) =>
                            sum +
                            ball.extraRuns,
                          0
                        )}
                      </span>

                    </div>

                    {/* TOTAL */}

                    <div className="grid grid-cols-[minmax(240px,1fr)_70px_70px_60px_60px_90px] border-t border-slate-800 bg-emerald-950/20 px-4 py-4">

                      <span className="font-black text-emerald-400">
                        TOTAL
                      </span>

                      <span className="text-right text-lg font-black">
                        {
                          innings.totalRuns
                        }
                      </span>

                      <span className="col-span-4 text-right text-xs font-bold text-slate-500">
                        {
                          innings.totalWickets
                        } wickets •{" "}
                        {formatOvers(
                          innings.legalBalls
                        )} overs
                      </span>

                    </div>

                  </div>

                </div>

              </div>

              {/* =========================================
                  BOWLING
              ========================================= */}

              <div className="border-t border-slate-800 p-5">

                <div className="mb-3 flex items-center justify-between">

                  <h3 className="text-lg font-black">
                    🎯 Bowling
                  </h3>

                  <span className="text-xs font-bold text-slate-500">
                    {innings.bowlingTeam.name}
                  </span>

                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-800">

                  <div className="min-w-[650px]">

                    {/* HEADER */}

                    <div className="grid grid-cols-[minmax(250px,1fr)_80px_80px_70px_90px] bg-slate-950 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">

                      <span>
                        Bowler
                      </span>

                      <span className="text-right">
                        O
                      </span>

                      <span className="text-right">
                        R
                      </span>

                      <span className="text-right">
                        W
                      </span>

                      <span className="text-right">
                        ECON
                      </span>

                    </div>

                    {bowling.map(
                      (row) => (
                        <div
                          key={
                            row.player.id
                          }
                          className="grid grid-cols-[minmax(250px,1fr)_80px_80px_70px_90px] border-t border-slate-800 px-4 py-3"
                        >

                          <div>

                            <p className="font-bold">
                              {
                                row
                                  .player
                                  .name
                              }

                              {row.player.jerseyNo && (
                                <span className="ml-2 text-xs text-slate-600">
                                  #
                                  {
                                    row
                                      .player
                                      .jerseyNo
                                  }
                                </span>
                              )}
                            </p>

                          </div>

                          <span className="text-right font-semibold">
                            {formatOvers(
                              row.legalBalls
                            )}
                          </span>

                          <span className="text-right font-semibold text-slate-400">
                            {row.runs}
                          </span>

                          <span className="text-right font-black text-red-400">
                            {row.wickets}
                          </span>

                          <span className="text-right font-bold text-blue-400">
                            {row.economy.toFixed(
                              2
                            )}
                          </span>

                        </div>
                      )
                    )}

                    {bowling.length ===
                      0 && (
                      <div className="p-5 text-center text-sm text-slate-500">
                        No bowling data available.
                      </div>
                    )}

                  </div>

                </div>

              </div>

            </section>
          )
        )}

        {/* =================================================
            MATCH AWARDS
        ================================================= */}

        {match.status ===
          "COMPLETED" && (
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 md:p-6">

            <div className="mb-5">

              <h2 className="text-xl font-black">
                🏅 Match Awards
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Individual performance
              </p>

            </div>

            {awardsLoading ? (
              <div className="rounded-xl bg-slate-950 p-6 text-center">
                <p className="text-slate-400">
                  Calculating match awards...
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">

                {manOfTheMatch && (
                  <div className="rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-950/30 to-slate-950 p-5">

                    <div className="text-3xl">
                      🏆
                    </div>

                    <p className="mt-3 text-xs font-black uppercase tracking-wider text-yellow-400">
                      Man of the Match
                    </p>

                    <h3 className="mt-2 text-xl font-black">
                      {
                        manOfTheMatch
                          .player
                          .name
                      }
                    </h3>

                    {manOfTheMatch.reason && (
                      <p className="mt-2 text-sm text-slate-400">
                        {
                          manOfTheMatch.reason
                        }
                      </p>
                    )}

                  </div>
                )}

                {(bestPlayerAward ||
                  bestBatter) && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-slate-950 p-5">

                    <div className="text-3xl">
                      🏏
                    </div>

                    <p className="mt-3 text-xs font-black uppercase tracking-wider text-emerald-400">
                      Best Batter
                    </p>

                    <h3 className="mt-2 text-xl font-black">
                      {bestPlayerAward
                        ?.player.name ??
                        bestBatter?.playerName}
                    </h3>

                    {bestBatter && (
                      <p className="mt-2 font-bold text-white">
                        {
                          bestBatter.runs
                        }{" "}
                        runs
                      </p>
                    )}

                  </div>
                )}

                {(bestBowlerAward ||
                  bestBowler) && (
                  <div className="rounded-2xl border border-blue-500/20 bg-slate-950 p-5">

                    <div className="text-3xl">
                      🎯
                    </div>

                    <p className="mt-3 text-xs font-black uppercase tracking-wider text-blue-400">
                      Best Bowler
                    </p>

                    <h3 className="mt-2 text-xl font-black">
                      {bestBowlerAward
                        ?.player.name ??
                        bestBowler?.playerName}
                    </h3>

                    {bestBowler && (
                      <p className="mt-2 font-bold">
                        {
                          bestBowler.wickets
                        } wickets{" "}
                        for{" "}
                        {
                          bestBowler.runsConceded
                        } runs
                      </p>
                    )}

                  </div>
                )}

              </div>
            )}
          </section>
        )}

        {/* =================================================
            BALL BY BALL
        ================================================= */}

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 md:p-6">

          <div className="mb-5">

            <h2 className="text-xl font-black">
              📋 Ball-by-Ball
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Complete delivery history
            </p>

          </div>

          <div className="space-y-5">

            {match.cricketInnings.map(
              (innings) => {

                const grouped =
                  innings.ballEvents.reduce(
                    (
                      groups,
                      ball
                    ) => {
                      if (
                        !groups[
                          ball.overNumber
                        ]
                      ) {
                        groups[
                          ball.overNumber
                        ] = [];
                      }

                      groups[
                        ball.overNumber
                      ].push(ball);

                      return groups;
                    },
                    {} as Record<
                      number,
                      BallEvent[]
                    >
                  );

                return (
                  <div
                    key={
                      innings.id
                    }
                    className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
                  >

                    <div className="mb-4 flex items-center justify-between">

                      <div>
                        <p className="text-xs font-bold text-slate-500">
                          Innings{" "}
                          {
                            innings.inningsNumber
                          }
                        </p>

                        <h3 className="text-lg font-black">
                          {
                            innings
                              .battingTeam
                              .name
                          }
                        </h3>
                      </div>

                      <div className="text-right">

                        <p className="text-xl font-black">
                          {
                            innings.totalRuns
                          }
                          /
                          {
                            innings.totalWickets
                          }
                        </p>

                        <p className="text-xs text-slate-500">
                          {formatOvers(
                            innings.legalBalls
                          )} overs
                        </p>

                      </div>

                    </div>

                    <div className="space-y-3">

                      {Object.entries(
                        grouped
                      )
                        .sort(
                          (
                            [a],
                            [b]
                          ) =>
                            Number(a) -
                            Number(b)
                        )
                        .map(
                          ([
                            over,
                            balls,
                          ]) => (

                            <div
                              key={
                                over
                              }
                              className="rounded-xl border border-slate-800 bg-slate-900 p-3"
                            >

                              <div className="mb-3 flex items-center justify-between">

                                <span className="text-sm font-black">
                                  Over{" "}
                                  {Number(
                                    over
                                  ) + 1}
                                </span>

                                <span className="text-xs font-bold text-slate-500">
                                  {balls.reduce(
                                    (
                                      sum,
                                      ball
                                    ) =>
                                      sum +
                                      ball.totalRuns,
                                    0
                                  )}{" "}
                                  runs
                                </span>

                              </div>

                              <div className="flex flex-wrap gap-2">

                                {balls.map(
                                  (
                                    ball
                                  ) => (
                                    <div
                                      key={
                                        ball.id
                                      }
                                      title={
                                        ball.isWicket
                                          ? "Wicket"
                                          : `${ball.totalRuns} runs`
                                      }
                                      className={`flex h-10 min-w-10 items-center justify-center rounded-full border px-2 text-xs font-black ${getBallClass(
                                        ball
                                      )}`}
                                    >
                                      {getBallDisplay(
                                        ball
                                      )}
                                    </div>
                                  )
                                )}

                              </div>

                            </div>
                          )
                        )}

                    </div>
                  </div>
                );
              }
            )}

          </div>

        </section>

        {/* =================================================
            FOOTER ACTION
        ================================================= */}

        <div className="flex justify-end pb-8">

          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/matches"
              )
            }
            className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 text-sm font-bold text-slate-200 hover:bg-slate-800"
          >
            ← Back to Matches
          </button>

        </div>

      </div>
    </main>
  );
}