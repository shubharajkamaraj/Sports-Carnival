"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";

/* =========================================================
   TYPES
========================================================= */

type Player = {
  id: number;
  name: string;
  jerseyNo: number | null;
  role?: string | null;
  photo?: string | null;
  teamId?: number | null;
};

type Team = {
  id: number;
  name: string;
  captain?: string | null;
  playerIds?: number[];
  players?: Player[];
  createdAt?: string;
  updatedAt?: string;
};

type Game = {
  id: number;
  name: string;
  sportType: string;
};

type Tournament = {
  id: number;
  name: string;
  season: string;
};

type CricketBallEvent = {
  id: number;
  inningsId: number;
  overNumber: number;
  ballNumber: number;

  strikerId?: number | null;
  nonStrikerId?: number | null;
  bowlerId?: number | null;

  runsOffBat: number;
  extraRuns: number;
  totalRuns: number;

  extraType?: string | null;

  isLegalDelivery: boolean;
  isWicket: boolean;

  dismissalType?: string | null;
  dismissedPlayerId?: number | null;
  fielderId?: number | null;

  createdAt?: string;
};

type CricketInnings = {
  id: number;
  matchId?: number;

  inningsNumber: number;

  battingTeamId: number;
  bowlingTeamId: number;

  totalRuns: number;
  totalWickets: number;
  legalBalls: number;

  battingTeam?: Team | null;
  bowlingTeam?: Team | null;

  ballEvents?: CricketBallEvent[];
};

type FootballEvent = {
  id: number;
  matchId: number;

  playerId?: number | null;
  teamId?: number | null;

  eventType: string;
  minute?: number | null;
  description?: string | null;

  player?: Player | null;
  team?: Team | null;
};

type FootballSummary = {
  success?: boolean;

  match?: any;

  statistics?: {
    totalGoals?: number;
    normalGoals?: number;
    penaltyGoals?: number;
    ownGoals?: number;
    yellowCards?: number;
    redCards?: number;
    totalEvents?: number;
  };

  topScorer?: {
    playerId: number;
    playerName: string;
    teamId: number;
    teamName: string;
    goals: number;
    normalGoals?: number;
    penaltyGoals?: number;
    ownGoals?: number;
  } | null;

  goalScorers?: any[];
  penaltyGoals?: any[];
  ownGoals?: any[];
  yellowCards?: any[];
  redCards?: any[];

  teamStatistics?: any;

  events?: FootballEvent[];
};

type HandballEvent = {
  id: number;
  matchId: number;

  playerId?: number | null;
  teamId?: number | null;

  eventType: string;
  minute?: number | null;

  description?: string | null;

  player?: Player | null;
  team?: Team | null;
};

type HandballSummary = {
  success?: boolean;
  match?: any;
  events?: HandballEvent[];
  statistics?: any;
  teamStatistics?: any;
};

type ThrowballScore = {
  // This tournament uses ONE set per Throwball match.
  currentSet?: number | null;

  // Set won counters are kept separately from the live points.
  team1SetsWon?: number | null;
  team2SetsWon?: number | null;

  // Set 1 live points.
  set1Team1?: number | null;
  set1Team2?: number | null;

  // Support alternative backend field names too.
  team1Set1Score?: number | null;
  team2Set1Score?: number | null;
  set1Team1Score?: number | null;
  set1Team2Score?: number | null;
};

type Match = {
  id: number;
  matchNumber: number;

  status: string;

  result?: string | null;
  winnerTeamId?: number | null;

  stage?: string | null;

  /*
   * Only meaningful for cricket.
   */
  overs?: number | null;

  team1Score: number;
  team2Score: number;

  team1: Team;
  team2: Team;

  game: Game;

  tournament?: Tournament | null;

  cricketInnings?: CricketInnings[];

  footballSummary?: FootballSummary | null;

  handballSummary?: HandballSummary | null;

  throwballScore?: ThrowballScore | null;
};

/* =========================================================
   HELPERS
========================================================= */

function formatOvers(
  legalBalls: number | null | undefined
) {
  const balls = Number(legalBalls ?? 0);

  const overs = Math.floor(balls / 6);
  const remainingBalls = balls % 6;

  return `${overs}.${remainingBalls}`;
}

function mergeTeams(
  first?: Team | null,
  second?: Team | null
): Team | undefined {
  if (!first && !second) {
    return undefined;
  }

  const firstPlayers = first?.players ?? [];
  const secondPlayers = second?.players ?? [];

  return {
    ...(second ?? {}),
    ...(first ?? {}),

    players:
      firstPlayers.length > 0
        ? firstPlayers
        : secondPlayers.length > 0
          ? secondPlayers
          : [],
  } as Team;
}

/* =========================================================
   LOAD TEAM PLAYERS
========================================================= */

/*
 * Football/Handball/Throwball APIs sometimes return:
 *
 * {
 *   id: 7,
 *   name: "CHRIST KINGDOM",
 *   playerIds: [39,40,41,...]
 * }
 *
 * but don't return:
 *
 * players: [...]
 *
 * This function tries the team API and also the
 * /players endpoint.
 */

async function fetchTeamWithPlayers(
  team: Team | null | undefined
): Promise<Team | undefined> {
  if (!team?.id) {
    return team ?? undefined;
  }

  /*
   * If players already exist, don't request again.
   */
  if (
    Array.isArray(team.players) &&
    team.players.length > 0
  ) {
    return team;
  }

  const cacheBust = `t=${Date.now()}`;

  const possibleUrls = [
    `/api/teams/${team.id}?${cacheBust}`,
    `/api/teams/${team.id}/players?${cacheBust}`,
  ];

  for (const url of possibleUrls) {
    try {
      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();

      /*
       * Different APIs may return:
       *
       * { team: {...} }
       *
       * OR
       *
       * { players: [...] }
       *
       * OR
       *
       * [...]
       */

      let fetchedTeam: any = null;
      let fetchedPlayers: Player[] = [];

      if (Array.isArray(data)) {
        fetchedPlayers = data;
      } else {
        fetchedTeam =
          data?.team ??
          data;

        if (Array.isArray(data?.players)) {
          fetchedPlayers = data.players;
        }

        if (
          Array.isArray(
            data?.team?.players
          )
        ) {
          fetchedPlayers =
            data.team.players;
        }

        if (
          Array.isArray(
            fetchedTeam?.players
          )
        ) {
          fetchedPlayers =
            fetchedTeam.players;
        }
      }

      /*
       * If we received players, use them.
       */
      if (fetchedPlayers.length > 0) {
        return {
          ...team,
          ...(fetchedTeam ?? {}),

          id: team.id,

          name:
            fetchedTeam?.name ??
            team.name,

          captain:
            fetchedTeam?.captain ??
            team.captain ??
            null,

          playerIds:
            fetchedTeam?.playerIds ??
            team.playerIds ??
            fetchedPlayers.map(
              (player) => player.id
            ),

          players: fetchedPlayers,
        };
      }
    } catch (error) {
      console.warn(
        `Unable to load players for team ${team.id} from ${url}`,
        error
      );
    }
  }

  /*
   * If no API returned players, preserve the
   * original team object.
   */
  return team;
}

/* =========================================================
   MERGE CRICKET INNINGS
========================================================= */

function mergeCricketInnings(
  basic: CricketInnings[] = [],
  summary: CricketInnings[] = []
): CricketInnings[] {
  const map =
    new Map<string, CricketInnings>();

  const all = [
    ...basic,
    ...summary,
  ];

  for (const innings of all) {
    const key = String(
      innings.id ??
        `innings-${innings.inningsNumber}`
    );

    const existing = map.get(key);

    if (!existing) {
      map.set(key, innings);
      continue;
    }

    const existingBalls =
      existing.ballEvents ?? [];

    const incomingBalls =
      innings.ballEvents ?? [];

    map.set(key, {
      ...existing,
      ...innings,

      battingTeam:
        mergeTeams(
          innings.battingTeam,
          existing.battingTeam
        ) ?? undefined,

      bowlingTeam:
        mergeTeams(
          innings.bowlingTeam,
          existing.bowlingTeam
        ) ?? undefined,

      ballEvents:
        incomingBalls.length >=
        existingBalls.length
          ? incomingBalls
          : existingBalls,
    });
  }

  return Array.from(
    map.values()
  ).sort(
    (a, b) =>
      a.inningsNumber -
      b.inningsNumber
  );
}

/* =========================================================
   CRICKET SCORE
========================================================= */

function getCricketTeamScore(
  innings: CricketInnings[],
  teamId: number,
  fallback: number
) {
  const teamInnings = innings
    .filter(
      (item) =>
        item.battingTeamId === teamId
    )
    .sort(
      (a, b) =>
        a.inningsNumber -
        b.inningsNumber
    );

  if (teamInnings.length === 0) {
    return fallback;
  }

  return (
    teamInnings[
      teamInnings.length - 1
    ].totalRuns ?? fallback
  );
}

function getCricketTeamWickets(
  innings: CricketInnings[],
  teamId: number
) {
  const teamInnings = innings
    .filter(
      (item) =>
        item.battingTeamId === teamId
    )
    .sort(
      (a, b) =>
        a.inningsNumber -
        b.inningsNumber
    );

  if (teamInnings.length === 0) {
    return 0;
  }

  return (
    teamInnings[
      teamInnings.length - 1
    ].totalWickets ?? 0
  );
}

/* =========================================================
   CRICKET BALL DISPLAY
========================================================= */

function ballDisplay(
  ball: CricketBallEvent
) {
  if (ball.isWicket) {
    return "W";
  }

  if (
    ball.extraType &&
    ball.extraType !== "NONE"
  ) {
    return `${ball.totalRuns} ${ball.extraType}`;
  }

  return String(ball.totalRuns);
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function ViewerMatchPage() {
  const router = useRouter();

  const params = useParams();

  /*
   * Supports:
   *
   * /viewer/matches/[matchId]
   *
   * and:
   *
   * /viewer/matches/[id]
   */

  const rawMatchId =
    (params as any)?.matchId ??
    (params as any)?.id;

  const matchId = Array.isArray(
    rawMatchId
  )
    ? rawMatchId[0]
    : rawMatchId;

  const [match, setMatch] =
    useState<Match | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const refreshingRef =
    useRef(false);

  /* =======================================================
     LOAD MATCH
  ======================================================= */

  const loadMatch = useCallback(
    async (initial = false) => {
      if (!matchId) {
        setLoading(false);

        setError(
          "Match ID was not found in the URL."
        );

        return;
      }

      if (refreshingRef.current) {
        return;
      }

      refreshingRef.current = true;

      if (initial) {
        setLoading(true);
        setError("");
      }

      try {
        const cacheBust =
          `?t=${Date.now()}`;

        /* ================================================
           BASIC MATCH
        ================================================ */

        const matchResponse =
          await fetch(
            `/api/matches/${matchId}${cacheBust}`,
            {
              cache: "no-store",
              headers: {
                "Cache-Control":
                  "no-cache",
              },
            }
          );

        if (!matchResponse.ok) {
          throw new Error(
            `Match API returned ${matchResponse.status}`
          );
        }

        const basicData =
          await matchResponse.json();

        const basicMatch =
          basicData?.match ??
          basicData;

        if (!basicMatch) {
          throw new Error(
            "Match data is empty."
          );
        }

        const sportType =
          basicMatch?.game?.sportType ??
          "";

        /* ================================================
           SPORT SUMMARY
        ================================================ */

        let summaryData: any = null;

        try {
          let summaryUrl = "";

          switch (sportType) {
            case "CRICKET":
              summaryUrl =
                `/api/matches/${matchId}/summary${cacheBust}`;
              break;

            case "FOOTBALL":
              summaryUrl =
                `/api/matches/${matchId}/football/summary${cacheBust}`;
              break;

            case "HANDBALL":
              summaryUrl =
                `/api/matches/${matchId}/handball/summary${cacheBust}`;
              break;

            case "THROWBALL":
              summaryUrl =
                `/api/matches/${matchId}/throwball${cacheBust}`;
              break;
          }

          if (summaryUrl) {
            const response =
              await fetch(summaryUrl, {
                cache: "no-store",
                headers: {
                  "Cache-Control":
                    "no-cache",
                },
              });

            if (response.ok) {
              summaryData =
                await response.json();
            }
          }
        } catch (summaryError) {
          console.error(
            "Sport summary error:",
            summaryError
          );
        }

        const summaryMatch =
          summaryData?.match ??
          summaryData;

        /* ================================================
           TEAM DATA
        ================================================ */

        let team1 =
          mergeTeams(
            summaryMatch?.team1,
            basicMatch?.team1
          ) ?? {
            id:
              basicMatch.team1Id,
            name: "Team 1",
            players: [],
          };

        let team2 =
          mergeTeams(
            summaryMatch?.team2,
            basicMatch?.team2
          ) ?? {
            id:
              basicMatch.team2Id,
            name: "Team 2",
            players: [],
          };

        /* ================================================
           LOAD PLAYERS FOR NON-CRICKET SPORTS
        ================================================ */

        /*
         * Cricket already has players inside
         * cricketInnings.
         *
         * Football / Handball / Throwball
         * need the team API when only playerIds
         * are returned.
         */

        if (sportType !== "CRICKET") {
          const [
            loadedTeam1,
            loadedTeam2,
          ] = await Promise.all([
            fetchTeamWithPlayers(
              team1
            ),
            fetchTeamWithPlayers(
              team2
            ),
          ]);

          if (loadedTeam1) {
            team1 = loadedTeam1;
          }

          if (loadedTeam2) {
            team2 = loadedTeam2;
          }
        }

        /* ================================================
           CRICKET INNINGS
        ================================================ */

        const cricketInnings =
          sportType === "CRICKET"
            ? mergeCricketInnings(
                basicMatch?.cricketInnings ??
                  [],
                summaryMatch?.cricketInnings ??
                  summaryData?.cricketInnings ??
                  []
              )
            : [];

        /* ================================================
           FOOTBALL
        ================================================ */

        const footballSummary =
          sportType === "FOOTBALL"
            ? summaryData
            : null;

        /* ================================================
           HANDBALL
        ================================================ */

        const handballSummary =
          sportType === "HANDBALL"
            ? summaryData
            : null;

        /* ================================================
           SCORES
        ================================================ */

        let team1Score = Number(
          summaryMatch?.team1Score ??
            summaryMatch?.team1?.score ??
            basicMatch?.team1Score ??
            0
        );

        let team2Score = Number(
          summaryMatch?.team2Score ??
            summaryMatch?.team2?.score ??
            basicMatch?.team2Score ??
            0
        );

        /*
         * CRICKET:
         * Always calculate score from innings.
         */

        if (
          sportType === "CRICKET" &&
          cricketInnings.length > 0
        ) {
          team1Score =
            getCricketTeamScore(
              cricketInnings,
              team1.id,
              team1Score
            );

          team2Score =
            getCricketTeamScore(
              cricketInnings,
              team2.id,
              team2Score
            );
        }

        /* ================================================
           THROWBALL
        ================================================ */

        const throwballScore =
          sportType === "THROWBALL"
            ? (
                summaryData?.throwballScore ??
                summaryData?.score ??
                summaryMatch?.throwballScore ??
                basicMatch?.throwballScore ??
                null
              )
            : null;

        /* ================================================
           WINNER
        ================================================ */

        const winnerTeamId =
          summaryMatch?.winner?.id ??
          summaryMatch?.winnerTeamId ??
          basicMatch?.winnerTeamId ??
          basicMatch?.winnerTeam?.id ??
          null;

        /* ================================================
           NORMALIZED MATCH
        ================================================ */

        const normalized: Match = {
          id: Number(
            basicMatch.id
          ),

          matchNumber: Number(
            basicMatch.matchNumber ??
              0
          ),

          status:
            summaryMatch?.status ??
            basicMatch?.status ??
            "UPCOMING",

          result:
            summaryMatch?.result ??
            basicMatch?.result ??
            null,

          winnerTeamId,

          stage:
            basicMatch?.stage ??
            summaryMatch?.stage ??
            null,

          /*
           * IMPORTANT:
           * Only Cricket uses overs.
           */
          overs:
            sportType === "CRICKET"
              ? basicMatch?.overs ??
                null
              : null,

          team1Score,
          team2Score,

          team1,
          team2,

          game:
            basicMatch?.game ??
            summaryMatch?.game ??
            {
              id:
                basicMatch.gameId,
              name: sportType,
              sportType,
            },

          tournament:
            basicMatch?.tournament ??
            summaryMatch?.tournament ??
            null,

          cricketInnings,

          footballSummary,

          handballSummary,

          throwballScore,
        };

        setMatch(normalized);

        console.log(
          "================================"
        );

        console.log(
          "VIEWER MATCH:",
          normalized
        );

        console.log(
          "MATCH ID:",
          matchId
        );

        console.log(
          "SPORT:",
          sportType
        );

        console.log(
          "TEAM 1:",
          normalized.team1
        );

        console.log(
          "TEAM 1 PLAYERS:",
          normalized.team1
            .players
        );

        console.log(
          "TEAM 2:",
          normalized.team2
        );

        console.log(
          "TEAM 2 PLAYERS:",
          normalized.team2
            .players
        );

        console.log(
          "================================"
        );
      } catch (err) {
        console.error(
          "Failed to load match:",
          err
        );

        if (initial) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load match."
          );
        }
      } finally {
        if (initial) {
          setLoading(false);
        }

        refreshingRef.current =
          false;
      }
    },
    [matchId]
  );

  /* =======================================================
     INITIAL LOAD + POLLING
  ======================================================= */

  useEffect(() => {
    if (!matchId) {
      setLoading(false);

      setError(
        "Match ID is missing from the URL."
      );

      return;
    }

    loadMatch(true);

    const interval =
      window.setInterval(() => {
        loadMatch(false);
      }, 3000);

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [
    matchId,
    loadMatch,
  ]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050816] px-4 text-white">
        <div className="text-center">
          <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-white" />

          <p className="text-lg text-white/80">
            Loading live match...
          </p>

          <p className="mt-2 text-sm text-white/40">
            Match ID:{" "}
            {matchId || "not found"}
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error && !match) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050816] px-4 text-white">
        <div className="w-full max-w-lg rounded-2xl border border-red-400/20 bg-red-500/10 p-8 text-center">
          <h1 className="text-2xl font-bold text-red-300">
            Unable to load match
          </h1>

          <p className="mt-4 text-white/70">
            {error}
          </p>

          <p className="mt-3 text-sm text-white/40">
            Match ID:{" "}
            {matchId || "undefined"}
          </p>

          <button
            onClick={() =>
              loadMatch(true)
            }
            className="mt-6 rounded-xl bg-white px-5 py-3 font-semibold text-black"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  if (!match) {
    return null;
  }

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const sportType =
    match.game?.sportType ??
    "";

  const isLive =
    match.status === "LIVE";

  const cricketInnings =
    match.cricketInnings ??
    [];

  const currentCricketInnings =
    cricketInnings.length > 0
      ? cricketInnings[
          cricketInnings.length - 1
        ]
      : null;

  const previousCricketInnings =
    cricketInnings.filter(
      (innings) =>
        innings.inningsNumber <
        (currentCricketInnings?.inningsNumber ??
          Infinity)
    );

  const target =
    previousCricketInnings.length >
    0
      ? previousCricketInnings[
          previousCricketInnings.length - 1
        ].totalRuns + 1
      : null;

  const footballEvents =
    match.footballSummary
      ?.events ?? [];

  const handballEvents =
    match.handballSummary
      ?.events ?? [];

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="border-b border-white/10 bg-[#0b1022]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <button
            onClick={() =>
              router.push(
                "/viewer/matches"
              )
            }
            className="text-sm text-white/70 transition hover:text-white sm:text-base"
          >
            ← Back to Matches
          </button>

          {isLive && (
            <div className="flex items-center gap-2 rounded-full bg-red-500/20 px-4 py-2 text-sm font-bold text-red-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
              LIVE
            </div>
          )}
        </div>
      </header>

      {/* ===================================================
          PAGE
      =================================================== */}

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* =================================================
            MATCH HEADER
        ================================================= */}

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#202b4b] to-[#111729] shadow-2xl">
          <div className="border-b border-white/10 p-5 sm:p-7 lg:p-9">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white/80">
                {match.game.name}
              </span>

              {match.stage && (
                <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white/70">
                  {match.stage}
                </span>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-base font-black sm:text-3xl">
                  {match.game.name}
                </h1>

                <p className="mt-2 text-white/50">
                  Match{" "}
                  {match.matchNumber}
                </p>
              </div>

              <div className="text-sm text-white/40">
                {match.status}
              </div>
            </div>
          </div>

          {/* =================================================
              SCORE
          ================================================= */}

          <div className="p-5 sm:p-8 lg:p-10">
            <div className="grid grid-cols-1 items-center gap-7 md:grid-cols-[1fr_auto_1fr]">
              {/* TEAM 1 */}

              <div className="text-center md:text-right">
                <p className="break-words text-base font-black sm:text-3xl">
                  {match.team1.name}
                </p>

                <p className="mt-2 text-4xl font-black sm:text-5xl">
                  {match.team1Score}

                  {sportType ===
                    "CRICKET" && (
                    <span className="text-xl text-white/50 sm:text-2xl">
                      /
                      {getCricketTeamWickets(
                        cricketInnings,
                        match.team1.id
                      )}
                    </span>
                  )}
                </p>
              </div>

              {/* VS */}

              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/10 font-black">
                  VS
                </div>

                {sportType ===
                  "CRICKET" &&
                  currentCricketInnings && (
                    <p className="mt-3 text-sm text-white/50">
                      {formatOvers(
                        currentCricketInnings.legalBalls
                      )}{" "}
                      overs
                    </p>
                  )}
              </div>

              {/* TEAM 2 */}

              <div className="text-center md:text-left">
                <p className="break-words text-base font-black sm:text-3xl">
                  {match.team2.name}
                </p>

                <p className="mt-2 text-4xl font-black sm:text-5xl">
                  {match.team2Score}

                  {sportType ===
                    "CRICKET" && (
                    <span className="text-xl text-white/50 sm:text-2xl">
                      /
                      {getCricketTeamWickets(
                        cricketInnings,
                        match.team2.id
                      )}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            CRICKET
        ================================================= */}

        {sportType ===
          "CRICKET" &&
          cricketInnings.length >
            0 && (
            <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-7">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-black">
                    Cricket Innings
                  </h2>

                  <p className="mt-1 text-sm text-white/50">
                    Completed and ongoing
                    innings
                  </p>
                </div>

                {isLive && (
                  <span className="w-fit rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-300">
                    ● LIVE
                  </span>
                )}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {cricketInnings.map(
                  (innings) => {
                    const isCurrent =
                      innings.id ===
                      currentCricketInnings?.id;

                    const balls =
                      innings.ballEvents ??
                      [];

                    const lastBalls =
                      balls.slice(-6);

                    const battingTeam =
                      innings.battingTeam ??
                      (innings.battingTeamId ===
                      match.team1.id
                        ? match.team1
                        : match.team2);

                    return (
                      <div
                        key={
                          innings.id
                        }
                        className={`rounded-2xl border p-5 ${
                          isCurrent &&
                          isLive
                            ? "border-red-400/40 bg-red-500/[0.08]"
                            : "border-white/10 bg-black/10"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-white/40">
                              Innings{" "}
                              {
                                innings.inningsNumber
                              }
                            </p>

                            <h3 className="mt-1 text-base font-black">
                              {
                                battingTeam.name
                              }
                            </h3>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              isCurrent &&
                              isLive
                                ? "bg-red-500/20 text-red-300"
                                : "bg-white/10 text-white/50"
                            }`}
                          >
                            {isCurrent &&
                            isLive
                              ? "ONGOING"
                              : "COMPLETED"}
                          </span>
                        </div>

                        <div className="mt-6 flex items-end justify-between">
                          <div>
                            <p className="text-3xl font-black">
                              {
                                innings.totalRuns
                              }
                              /
                              {
                                innings.totalWickets
                              }
                            </p>

                            <p className="mt-1 text-sm text-white/50">
                              {formatOvers(
                                innings.legalBalls
                              )}{" "}
                              overs
                            </p>
                          </div>

                          {isCurrent &&
                            target !==
                              null && (
                              <div className="text-right">
                                <p className="text-xs uppercase text-white/40">
                                  Target
                                </p>

                                <p className="text-base font-black text-yellow-300">
                                  {target}
                                </p>
                              </div>
                            )}
                        </div>

                        {lastBalls.length >
                          0 && (
                          <div className="mt-5">
                            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/40">
                              Recent balls
                            </p>

                            <div className="flex flex-wrap gap-2">
                              {lastBalls.map(
                                (ball) => (
                                  <span
                                    key={
                                      ball.id
                                    }
                                    className="flex h-9 min-w-9 items-center justify-center rounded-full bg-white/10 px-2 text-sm font-bold"
                                  >
                                    {ballDisplay(
                                      ball
                                    )}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {balls.length ===
                          0 &&
                          isCurrent &&
                          isLive && (
                            <div className="mt-5 rounded-xl bg-white/5 p-4 text-center text-sm text-white/40">
                              Waiting for
                              the first
                              ball...
                            </div>
                          )}
                      </div>
                    );
                  }
                )}
              </div>
            </section>
          )}

        {/* =================================================
            FOOTBALL
        ================================================= */}

        {sportType ===
          "FOOTBALL" && (
          <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black">
                  Football Live Match
                </h2>

                <p className="mt-1 text-sm text-white/50">
                  Goals, cards and match
                  events
                </p>
              </div>

              {isLive && (
                <span className="w-fit rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-300">
                  ● LIVE
                </span>
              )}
            </div>

            {/* SCORE */}

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/5 p-6 text-center">
                <p className="text-base font-bold">
                  {match.team1.name}
                </p>

                <p className="mt-2 text-4xl font-black">
                  {match.team1Score}
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-6 text-center">
                <p className="text-base font-bold">
                  {match.team2.name}
                </p>

                <p className="mt-2 text-4xl font-black">
                  {match.team2Score}
                </p>
              </div>
            </div>

            {/* STATISTICS */}

            {match
              .footballSummary
              ?.statistics && (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-white/5 p-4 text-center">
                  <p className="text-xs text-white/40">
                    Goals
                  </p>

                  <p className="mt-1 text-base font-black">
                    {match
                      .footballSummary
                      .statistics
                      .totalGoals ??
                      0}
                  </p>
                </div>

                <div className="rounded-xl bg-white/5 p-4 text-center">
                  <p className="text-xs text-white/40">
                    Yellow
                  </p>

                  <p className="mt-1 text-base font-black">
                    {match
                      .footballSummary
                      .statistics
                      .yellowCards ??
                      0}
                  </p>
                </div>

                <div className="rounded-xl bg-white/5 p-4 text-center">
                  <p className="text-xs text-white/40">
                    Red
                  </p>

                  <p className="mt-1 text-base font-black">
                    {match
                      .footballSummary
                      .statistics
                      .redCards ??
                      0}
                  </p>
                </div>

                <div className="rounded-xl bg-white/5 p-4 text-center">
                  <p className="text-xs text-white/40">
                    Events
                  </p>

                  <p className="mt-1 text-base font-black">
                    {match
                      .footballSummary
                      .statistics
                      .totalEvents ??
                      0}
                  </p>
                </div>
              </div>
            )}

            {/* EVENTS */}

            <div className="mt-6">
              <h3 className="mb-3 text-base font-bold">
                Match Events
              </h3>

              {footballEvents.length ===
              0 ? (
                <div className="rounded-xl bg-white/5 p-5 text-center text-white/40">
                  No football events
                  yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {footballEvents
                    .slice()
                    .reverse()
                    .map(
                      (event) => (
                        <div
                          key={
                            event.id
                          }
                          className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-black">
                              {event.minute !=
                              null
                                ? `${event.minute}'`
                                : "•"}
                            </div>

                            <div>
                              <p className="font-bold">
                                {
                                  event.eventType
                                }
                              </p>

                              <p className="text-sm text-white/50">
                                {
                                  event
                                    .player
                                    ?.name ??
                                  "Team event"
                                }
                              </p>

                              {event.description && (
                                <p className="mt-1 text-xs text-white/30">
                                  {
                                    event.description
                                  }
                                </p>
                              )}
                            </div>
                          </div>

                          <p className="text-sm text-white/40">
                            {
                              event
                                .team
                                ?.name
                            }
                          </p>
                        </div>
                      )
                    )}
                </div>
              )}
            </div>

            {/* TOP SCORER */}

            {match
              .footballSummary
              ?.topScorer && (
              <div className="mt-6 rounded-2xl bg-yellow-500/10 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-yellow-300/70">
                  Top Scorer
                </p>

                <p className="mt-2 text-base font-black">
                  {
                    match
                      .footballSummary
                      .topScorer
                      .playerName
                  }
                </p>

                <p className="mt-1 text-sm text-white/50">
                  {
                    match
                      .footballSummary
                      .topScorer
                      .goals
                  }{" "}
                  goal(s)
                </p>
              </div>
            )}
          </section>
        )}

        {/* =================================================
            HANDBALL
        ================================================= */}

        {sportType ===
          "HANDBALL" && (
          <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black">
                  Handball Live Match
                </h2>

                <p className="mt-1 text-sm text-white/50">
                  Live goals, cards and
                  events
                </p>
              </div>

              {isLive && (
                <span className="w-fit rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-300">
                  ● LIVE
                </span>
              )}
            </div>

            {/* SCORE */}

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/5 p-6 text-center">
                <p className="text-base font-bold">
                  {match.team1.name}
                </p>

                <p className="mt-2 text-4xl font-black">
                  {match.team1Score}
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-6 text-center">
                <p className="text-base font-bold">
                  {match.team2.name}
                </p>

                <p className="mt-2 text-4xl font-black">
                  {match.team2Score}
                </p>
              </div>
            </div>

            {/* EVENTS */}

            <div className="mt-6">
              <h3 className="mb-3 text-base font-bold">
                Handball Events
              </h3>

              {handballEvents.length ===
              0 ? (
                <div className="rounded-xl bg-white/5 p-5 text-center text-white/40">
                  No handball events
                  yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {handballEvents
                    .slice()
                    .reverse()
                    .map(
                      (event) => (
                        <div
                          key={
                            event.id
                          }
                          className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-bold">
                              {
                                event.eventType
                              }
                            </p>

                            <p className="text-sm text-white/50">
                              {
                                event
                                  .player
                                  ?.name ??
                                "Team event"
                              }

                              {event.minute !=
                                null &&
                                ` • ${event.minute}'`}
                            </p>
                          </div>

                          <p className="text-sm text-white/40">
                            {
                              event
                                .team
                                ?.name
                            }
                          </p>
                        </div>
                      )
                    )}
                </div>
              )}
            </div>

            <div className="mt-5 rounded-xl bg-white/5 p-5 text-center text-sm text-white/40">
              {isLive
                ? "Handball match is currently live. Refresh the page to see the latest score."
                : "Match data is available above."}
            </div>
          </section>
        )}

        {/* =================================================
            THROWBALL
        ================================================= */}

        {sportType ===
          "THROWBALL" && (
          <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black">
                  Throwball Live Match
                </h2>

                <p className="mt-1 text-sm text-white/50">
                  Single-set match • Live score
                </p>
              </div>

              {isLive && (
                <span className="w-fit rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-300">
                  ● LIVE
                </span>
              )}
            </div>

            {/* LIVE SCORE */}

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/5 p-6 text-center">
                <p className="break-words text-base font-bold">
                  {match.team1.name}
                </p>

                <p className="mt-2 text-4xl font-black">
                  {match.team1Score}
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-6 text-center">
                <p className="break-words text-base font-bold">
                  {match.team2.name}
                </p>

                <p className="mt-2 text-4xl font-black">
                  {match.team2Score}
                </p>
              </div>
            </div>

            {match.throwballScore && (
              <>
                {/*
                 * SINGLE SET ONLY
                 *
                 * Current Set is always Set 1 for this match format.
                 * Sets Won is separate and changes only when the backend
                 * records that the single set has been won.
                 */}
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-white/5 p-4 text-center">
                    <p className="text-xs uppercase tracking-wide text-white/40">
                      Current Set
                    </p>

                    <p className="mt-1 text-base font-black">
                      1
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/5 p-4 text-center">
                    <p className="break-words text-xs uppercase tracking-wide text-white/40">
                      {match.team1.name} Sets Won
                    </p>

                    <p className="mt-1 text-base font-black">
                      {match.throwballScore.team1SetsWon ?? 0}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/5 p-4 text-center">
                    <p className="break-words text-xs uppercase tracking-wide text-white/40">
                      {match.team2.name} Sets Won
                    </p>

                    <p className="mt-1 text-base font-black">
                      {match.throwballScore.team2SetsWon ?? 0}
                    </p>
                  </div>
                </div>

                {/* ONLY SET 1 */}

                <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
                  <div className="grid grid-cols-3 bg-white/10 p-3 text-sm font-bold">
                    <span>Set</span>

                    <span className="break-words text-center">
                      {match.team1.name}
                    </span>

                    <span className="break-words text-center">
                      {match.team2.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 border-t border-white/10 p-3 text-sm">
                    <span className="text-white/50">
                      Set 1
                    </span>

                    <span className="text-center text-base font-bold">
                      {match.throwballScore.set1Team1 ??
                        match.throwballScore.team1Set1Score ??
                        match.throwballScore.set1Team1Score ??
                        match.team1Score ??
                        0}
                    </span>

                    <span className="text-center text-base font-bold">
                      {match.throwballScore.set1Team2 ??
                        match.throwballScore.team2Set1Score ??
                        match.throwballScore.set1Team2Score ??
                        match.team2Score ??
                        0}
                    </span>
                  </div>
                </div>
              </>
            )}

            {!match.throwballScore && (
              <div className="mt-5 rounded-xl bg-white/5 p-5 text-center text-sm text-white/40">
                Throwball set information is not available yet.
              </div>
            )}
          </section>
        )}

        {/* =================================================
            LIVE MESSAGE
        ================================================= */}

        {isLive && (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-center">
            <div className="flex items-center justify-center gap-2 font-bold text-red-300">
              <span className="h-3 w-3 animate-pulse rounded-full bg-red-400" />

              Match is currently
              live
            </div>

            <p className="mt-2 text-sm text-red-200/60">
              Refresh the page to see the latest live score.
            </p>
          </div>
        )}

        {/* =================================================
            TEAM PLAYERS
        ================================================= */}

        <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {[match.team1, match.team2].map(
            (team) => (
              <div
                key={team.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]"
              >
                {/* TEAM HEADER */}

                <div className="border-b border-white/10 p-5">
                  <h2 className="text-xl font-black">
                    {team.name}
                  </h2>

                  {team.captain && (
                    <p className="mt-1 text-sm text-white/40">
                      Captain:{" "}
                      {team.captain}
                    </p>
                  )}

                  <p className="mt-1 text-sm text-white/40">
                    Team Players
                  </p>
                </div>

                {/* PLAYERS */}

                <div className="p-4">
                  {Array.isArray(
                    team.players
                  ) &&
                  team.players.length >
                    0 ? (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {team.players.map(
                        (player) => (
                          <div
                            key={
                              player.id
                            }
                            className="flex items-center gap-3 rounded-xl bg-white/5 p-3"
                          >
                            {/* PHOTO */}

                            {player.photo ? (
                              <img
                                src={
                                  player.photo
                                }
                                alt={
                                  player.name
                                }
                                className="h-10 w-10 shrink-0 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
                                {player.jerseyNo ??
                                  "#"}
                              </div>
                            )}

                            {/* PLAYER */}

                            <div className="min-w-0">
                              <p className="truncate font-semibold">
                                {
                                  player.name
                                }
                              </p>

                              <div className="flex gap-2 text-xs text-white/40">
                                {player.jerseyNo !=
                                  null && (
                                  <span>
                                    #
                                    {
                                      player.jerseyNo
                                    }
                                  </span>
                                )}

                                {player.role && (
                                  <span>
                                    {
                                      player.role
                                    }
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-white/5 p-5 text-center">
                      <p className="text-white/40">
                        Player details not
                        available.
                      </p>

                      {team.playerIds &&
                        team.playerIds
                          .length >
                          0 && (
                          <p className="mt-2 text-xs text-white/20">
                            {
                              team
                                .playerIds
                                .length
                            }{" "}
                            player IDs found,
                            but player
                            details could
                            not be loaded.
                          </p>
                        )}
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </section>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="py-8 text-center">
          <button
            onClick={() =>
              router.push(
                "/viewer"
              )
            }
            className="text-white/70 transition hover:text-white"
          >
            Back to Viewer Home
          </button>
        </div>
      </div>
    </main>
  );
}