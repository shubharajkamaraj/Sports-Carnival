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
  currentSet?: number | null;

  team1SetsWon?: number | null;
  team2SetsWon?: number | null;

  set1Team1?: number | null;
  set1Team2?: number | null;

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
   CRICKET DISPLAY TYPES
========================================================= */

type BattingStat = {
  player: Player | null;
  playerId: number;

  runs: number;
  balls: number;
  fours: number;
  sixes: number;

  isOut: boolean;
  dismissalType?: string | null;
};

type BowlingStat = {
  player: Player | null;
  playerId: number;

  legalBalls: number;
  runs: number;
  wickets: number;
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
   PLAYER LOOKUP
========================================================= */

function findPlayer(
  playerId: number | null | undefined,
  battingTeam: Team,
  bowlingTeam: Team,
  matchTeam1: Team,
  matchTeam2: Team
): Player | null {
  if (playerId == null) {
    return null;
  }

  const allPlayers = [
    ...(battingTeam.players ?? []),
    ...(bowlingTeam.players ?? []),
    ...(matchTeam1.players ?? []),
    ...(matchTeam2.players ?? []),
  ];

  return (
    allPlayers.find(
      (player) =>
        Number(player.id) === Number(playerId)
    ) ?? null
  );
}

/* =========================================================
   LOAD TEAM PLAYERS
========================================================= */

async function fetchTeamWithPlayers(
  team: Team | null | undefined
): Promise<Team | undefined> {
  if (!team?.id) {
    return team ?? undefined;
  }

  if (
    Array.isArray(team.players) &&
    team.players.length > 0
  ) {
    return team;
  }

  const possibleUrls = [
    `/api/teams/${team.id}`,
    `/api/teams/${team.id}/players`,
  ];

  for (const url of possibleUrls) {
    try {
      const response = await fetch(url, {
        cache: "no-store",
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();

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
        `Unable to load players for team ${team.id}`,
        error
      );
    }
  }

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
   CRICKET BATTING STATS
========================================================= */

function getBattingStats(
  innings: CricketInnings,
  battingTeam: Team,
  bowlingTeam: Team,
  team1: Team,
  team2: Team
): BattingStat[] {
  const balls =
    innings.ballEvents ?? [];

  const map =
    new Map<number, BattingStat>();

  for (const ball of balls) {
    if (ball.strikerId == null) {
      continue;
    }

    const player =
      findPlayer(
        ball.strikerId,
        battingTeam,
        bowlingTeam,
        team1,
        team2
      );

    const existing =
      map.get(ball.strikerId);

    const stat: BattingStat =
      existing ?? {
        player,
        playerId: ball.strikerId,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
        dismissalType: null,
      };

    stat.runs +=
      Number(ball.runsOffBat ?? 0);

    /*
     * Wides are not counted as balls
     * faced by the batter.
     */
    const isWide =
      String(
        ball.extraType ?? ""
      ).toUpperCase() === "WIDE";

    if (
      ball.isLegalDelivery ||
      !isWide
    ) {
      stat.balls += 1;
    }

    if (
      Number(ball.runsOffBat) === 4
    ) {
      stat.fours += 1;
    }

    if (
      Number(ball.runsOffBat) === 6
    ) {
      stat.sixes += 1;
    }

    if (
      ball.isWicket &&
      ball.dismissedPlayerId ===
        ball.strikerId
    ) {
      stat.isOut = true;
      stat.dismissalType =
        ball.dismissalType;
    }

    map.set(
      ball.strikerId,
      stat
    );
  }

  /*
   * Also add players who were dismissed
   * but don't appear as striker in the
   * available event data.
   */
  for (const ball of balls) {
    if (
      ball.dismissedPlayerId == null
    ) {
      continue;
    }

    const playerId =
      ball.dismissedPlayerId;

    if (!map.has(playerId)) {
      map.set(playerId, {
        player:
          findPlayer(
            playerId,
            battingTeam,
            bowlingTeam,
            team1,
            team2
          ),
        playerId,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isOut: true,
        dismissalType:
          ball.dismissalType,
      });
    }
  }

  return Array.from(
    map.values()
  );
}

/* =========================================================
   CURRENT BATTERS
========================================================= */

function getCurrentBatters(
  innings: CricketInnings,
  battingTeam: Team,
  bowlingTeam: Team,
  team1: Team,
  team2: Team
) {
  const balls =
    innings.ballEvents ?? [];

  if (balls.length === 0) {
    return {
      strikerId: null,
      nonStrikerId: null,
    };
  }

  const latestBall =
    balls[balls.length - 1];

  return {
    strikerId:
      latestBall.strikerId ??
      null,

    nonStrikerId:
      latestBall.nonStrikerId ??
      null,
  };
}

/* =========================================================
   CRICKET BOWLING STATS
========================================================= */

function isBowlerWicket(
  ball: CricketBallEvent
) {
  if (!ball.isWicket) {
    return false;
  }

  const dismissal =
    String(
      ball.dismissalType ?? ""
    ).toUpperCase();

  /*
   * These dismissals are normally not
   * credited as wickets to the bowler.
   */
  const nonBowlerWickets = [
    "RUN_OUT",
    "RETIRED_HURT",
    "RETIRED_OUT",
    "OBSTRUCTING_THE_FIELD",
    "TIMED_OUT",
  ];

  return !nonBowlerWickets.includes(
    dismissal
  );
}

function getBowlingStats(
  innings: CricketInnings,
  battingTeam: Team,
  bowlingTeam: Team,
  team1: Team,
  team2: Team
): BowlingStat[] {
  const balls =
    innings.ballEvents ?? [];

  const map =
    new Map<number, BowlingStat>();

  for (const ball of balls) {
    if (ball.bowlerId == null) {
      continue;
    }

    const player =
      findPlayer(
        ball.bowlerId,
        battingTeam,
        bowlingTeam,
        team1,
        team2
      );

    const existing =
      map.get(ball.bowlerId);

    const stat: BowlingStat =
      existing ?? {
        player,
        playerId: ball.bowlerId,
        legalBalls: 0,
        runs: 0,
        wickets: 0,
      };

    if (ball.isLegalDelivery) {
      stat.legalBalls += 1;
    }

    const extraType =
      String(
        ball.extraType ?? ""
      ).toUpperCase();

    /*
     * Byes and leg-byes are not charged
     * to the bowler.
     */
    if (
      extraType !== "BYE" &&
      extraType !== "LEG_BYE"
    ) {
      stat.runs += Number(
        ball.totalRuns ?? 0
      );
    }

    if (isBowlerWicket(ball)) {
      stat.wickets += 1;
    }

    map.set(
      ball.bowlerId,
      stat
    );
  }

  return Array.from(
    map.values()
  );
}

/* =========================================================
   CURRENT BOWLER
========================================================= */

function getCurrentBowlerId(
  innings: CricketInnings
) {
  const balls =
    innings.ballEvents ?? [];

  if (balls.length === 0) {
    return null;
  }

  return (
    balls[balls.length - 1]
      .bowlerId ?? null
  );
}

/* =========================================================
   WICKET DETAILS
========================================================= */

function getWicketEvents(
  innings: CricketInnings
) {
  return (innings.ballEvents ?? [])
    .filter(
      (ball) =>
        ball.isWicket
    )
    .sort(
      (a, b) =>
        a.overNumber -
          b.overNumber ||
        a.ballNumber -
          b.ballNumber
    );
}

/* =========================================================
   PLAYER NAME
========================================================= */

function playerName(
  player: Player | null,
  playerId?: number | null
) {
  if (player?.name) {
    return player.name;
  }

  if (playerId != null) {
    return `Player #${playerId}`;
  }

  return "Unknown Player";
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function ViewerMatchPage() {
  const router = useRouter();

  const params = useParams();

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

  const [refreshing, setRefreshing] =
    useState(false);

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
      } else {
        setRefreshing(true);
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

        /*
         * Load players for all sports.
         * This is especially useful for Cricket,
         * because striker/bowler IDs need names.
         */
        const [
          loadedTeam1,
          loadedTeam2,
        ] = await Promise.all([
          fetchTeamWithPlayers(team1),
          fetchTeamWithPlayers(team2),
        ]);

        if (loadedTeam1) {
          team1 = loadedTeam1;
        }

        if (loadedTeam2) {
          team2 = loadedTeam2;
        }

        /* ================================================
           CRICKET INNINGS
        ================================================ */

        let cricketInnings =
          sportType === "CRICKET"
            ? mergeCricketInnings(
                basicMatch?.cricketInnings ??
                  [],
                summaryMatch?.cricketInnings ??
                  summaryData?.cricketInnings ??
                  []
              )
            : [];

        /*
         * Make sure team player information is
         * also available inside each innings.
         */
        cricketInnings =
          cricketInnings.map(
            (innings) => ({
              ...innings,

              battingTeam:
                mergeTeams(
                  innings.battingTeam,
                  innings.battingTeamId ===
                    team1.id
                    ? team1
                    : team2
                ),

              bowlingTeam:
                mergeTeams(
                  innings.bowlingTeam,
                  innings.bowlingTeamId ===
                    team1.id
                    ? team1
                    : team2
                ),
            })
          );

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
        setError("");
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

        setRefreshing(false);

        refreshingRef.current =
          false;
      }
    },
    [matchId]
  );

  /* =======================================================
     INITIAL LOAD
     
     IMPORTANT:
     NO AUTO REFRESH / NO setInterval
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
    match.game?.sportType ?? "";

  const isLive =
    match.status === "LIVE";

  const cricketInnings =
    match.cricketInnings ?? [];

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
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
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

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                loadMatch(false)
              }
              disabled={refreshing}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {refreshing
                ? "Refreshing..."
                : "↻ Refresh"}
            </button>

            {isLive && (
              <div className="flex items-center gap-2 rounded-full bg-red-500/20 px-4 py-2 text-sm font-bold text-red-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
                LIVE
              </div>
            )}
          </div>
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
                <h1 className="text-2xl font-black sm:text-3xl">
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
                <p className="break-words text-xl font-black sm:text-2xl">
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
                <p className="break-words text-xl font-black sm:text-2xl">
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
            <section className="mt-6 space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-7">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-black sm:text-2xl">
                      Cricket Innings
                    </h2>

                    <p className="mt-1 text-sm text-white/50">
                      Batting, bowling and
                      wicket information
                    </p>
                  </div>

                  {isLive && (
                    <span className="w-fit rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-300">
                      ● LIVE
                    </span>
                  )}
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
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

                      const bowlingTeam =
                        innings.bowlingTeam ??
                        (innings.bowlingTeamId ===
                        match.team1.id
                          ? match.team1
                          : match.team2);

                      const battingStats =
                        getBattingStats(
                          innings,
                          battingTeam,
                          bowlingTeam,
                          match.team1,
                          match.team2
                        );

                      const bowlingStats =
                        getBowlingStats(
                          innings,
                          battingTeam,
                          bowlingTeam,
                          match.team1,
                          match.team2
                        );

                      const currentBatters =
                        getCurrentBatters(
                          innings,
                          battingTeam,
                          bowlingTeam,
                          match.team1,
                          match.team2
                        );

                      const currentBowlerId =
                        getCurrentBowlerId(
                          innings
                        );

                      const striker =
                        battingStats.find(
                          (item) =>
                            item.playerId ===
                            currentBatters.strikerId
                        );

                      const nonStriker =
                        battingStats.find(
                          (item) =>
                            item.playerId ===
                            currentBatters.nonStrikerId
                        );

                      const currentBowler =
                        bowlingStats.find(
                          (item) =>
                            item.playerId ===
                            currentBowlerId
                        );

                      const wicketEvents =
                        getWicketEvents(
                          innings
                        );

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
                          {/* INNINGS HEADER */}

                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-white/40">
                                Innings{" "}
                                {
                                  innings.inningsNumber
                                }
                              </p>

                              <h3 className="mt-1 text-lg font-black">
                                {
                                  battingTeam.name
                                }
                              </h3>

                              <p className="mt-1 text-xs text-white/40">
                                Bowling:{" "}
                                {
                                  bowlingTeam.name
                                }
                              </p>
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

                          {/* SCORE */}

                          <div className="mt-6 flex items-end justify-between">
                            <div>
                              <p className="text-4xl font-black">
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

                                  <p className="text-lg font-black text-yellow-300">
                                    {target}
                                  </p>
                                </div>
                              )}
                          </div>

                          {/* =================================================
                              CURRENT BATTING
                          ================================================= */}

                          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                            <div className="mb-4 flex items-center justify-between">
                              <div>
                                <h4 className="text-base font-black">
                                  🏏 Batting
                                </h4>

                                <p className="mt-1 text-xs text-white/40">
                                  {battingTeam.name}
                                </p>
                              </div>

                              {isCurrent &&
                                isLive && (
                                <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-bold text-green-300">
                                  CURRENT
                                </span>
                              )}
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full min-w-[560px] text-left text-sm">
                                <thead>
                                  <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
                                    <th className="px-2 py-3">
                                      Batter
                                    </th>

                                    <th className="px-2 py-3 text-center">
                                      R
                                    </th>

                                    <th className="px-2 py-3 text-center">
                                      B
                                    </th>

                                    <th className="px-2 py-3 text-center">
                                      4s
                                    </th>

                                    <th className="px-2 py-3 text-center">
                                      6s
                                    </th>

                                    <th className="px-2 py-3 text-right">
                                      Status
                                    </th>
                                  </tr>
                                </thead>

                                <tbody>
                                  {battingStats
                                    .map(
                                      (
                                        stat
                                      ) => {
                                        const isStriker =
                                          stat.playerId ===
                                          currentBatters.strikerId;

                                        const isNonStriker =
                                          stat.playerId ===
                                          currentBatters.nonStrikerId;

                                        return (
                                          <tr
                                            key={
                                              stat.playerId
                                            }
                                            className="border-b border-white/5 last:border-0"
                                          >
                                            <td className="px-2 py-3">
                                              <div className="flex items-center gap-2">
                                                {isStriker && (
                                                  <span className="text-yellow-300">
                                                    ▶
                                                  </span>
                                                )}

                                                <div>
                                                  <p className="font-bold">
                                                    {playerName(
                                                      stat.player
                                                    )}
                                                  </p>

                                                  {(isStriker ||
                                                    isNonStriker) && (
                                                    <p className="text-[11px] text-green-300">
                                                      {isStriker
                                                        ? "Striker"
                                                        : "Non-striker"}
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                            </td>

                                            <td className="px-2 py-3 text-center font-black">
                                              {
                                                stat.runs
                                              }
                                            </td>

                                            <td className="px-2 py-3 text-center text-white/70">
                                              {
                                                stat.balls
                                              }
                                            </td>

                                            <td className="px-2 py-3 text-center text-white/70">
                                              {
                                                stat.fours
                                              }
                                            </td>

                                            <td className="px-2 py-3 text-center text-white/70">
                                              {
                                                stat.sixes
                                              }
                                            </td>

                                            <td className="px-2 py-3 text-right">
                                              {stat.isOut ? (
                                                <span className="text-xs font-bold text-red-300">
                                                  OUT
                                                </span>
                                              ) : (
                                                <span className="text-xs font-bold text-green-300">
                                                  NOT OUT
                                                </span>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      }
                                    )}

                                  {battingStats.length ===
                                    0 && (
                                    <tr>
                                      <td
                                        colSpan={
                                          6
                                        }
                                        className="px-2 py-5 text-center text-sm text-white/40"
                                      >
                                        No batting data
                                        available
                                        yet.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>

                            {/* CURRENT BATTERS */}

                            {isCurrent &&
                              isLive && (
                                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                  <div className="rounded-xl bg-white/5 p-4">
                                    <p className="text-xs uppercase tracking-wide text-white/40">
                                      Striker
                                    </p>

                                    <p className="mt-1 text-base font-black">
                                      {playerName(
                                        striker?.player ?? null,
                                        currentBatters.strikerId
                                      )}
                                    </p>

                                    {striker && (
                                      <p className="mt-1 text-sm text-white/50">
                                        {striker.runs}{" "}
                                        runs •{" "}
                                        {striker.balls}{" "}
                                        balls
                                      </p>
                                    )}
                                  </div>

                                  <div className="rounded-xl bg-white/5 p-4">
                                    <p className="text-xs uppercase tracking-wide text-white/40">
                                      Non-Striker
                                    </p>

                                    <p className="mt-1 text-base font-black">
                                      {playerName(
                                        nonStriker?.player ?? null,
                                        currentBatters.nonStrikerId
                                      )}
                                    </p>

                                    {nonStriker && (
                                      <p className="mt-1 text-sm text-white/50">
                                        {
                                          nonStriker.runs
                                        }{" "}
                                        runs •{" "}
                                        {
                                          nonStriker.balls
                                        }{" "}
                                        balls
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>

                          {/* =================================================
                              CURRENT BOWLING
                          ================================================= */}

                          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                            <div className="mb-4 flex items-center justify-between">
                              <div>
                                <h4 className="text-base font-black">
                                  🎯 Bowling
                                </h4>

                                <p className="mt-1 text-xs text-white/40">
                                  {bowlingTeam.name}
                                </p>
                              </div>

                              {isCurrent &&
                                isLive && (
                                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-300">
                                  CURRENT
                                </span>
                              )}
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full min-w-[500px] text-left text-sm">
                                <thead>
                                  <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
                                    <th className="px-2 py-3">
                                      Bowler
                                    </th>

                                    <th className="px-2 py-3 text-center">
                                      O
                                    </th>

                                    <th className="px-2 py-3 text-center">
                                      R
                                    </th>

                                    <th className="px-2 py-3 text-center">
                                      W
                                    </th>
                                  </tr>
                                </thead>

                                <tbody>
                                  {bowlingStats.map(
                                    (
                                      stat
                                    ) => (
                                      <tr
                                        key={
                                          stat.playerId
                                        }
                                        className="border-b border-white/5 last:border-0"
                                      >
                                        <td className="px-2 py-3">
                                          <div className="flex items-center gap-2">
                                            {stat.playerId ===
                                              currentBowlerId && (
                                              <span className="text-blue-300">
                                                ●
                                              </span>
                                            )}

                                            <div>
                                              <p className="font-bold">
                                                {playerName(
                                                  stat.player
                                                )}
                                              </p>

                                              {stat.playerId ===
                                                currentBowlerId && (
                                                <p className="text-[11px] text-blue-300">
                                                  Current
                                                  Bowler
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        </td>

                                        <td className="px-2 py-3 text-center font-bold">
                                          {formatOvers(
                                            stat.legalBalls
                                          )}
                                        </td>

                                        <td className="px-2 py-3 text-center">
                                          {
                                            stat.runs
                                          }
                                        </td>

                                        <td className="px-2 py-3 text-center font-black">
                                          {
                                            stat.wickets
                                          }
                                        </td>
                                      </tr>
                                    )
                                  )}

                                  {bowlingStats.length ===
                                    0 && (
                                    <tr>
                                      <td
                                        colSpan={
                                          4
                                        }
                                        className="px-2 py-5 text-center text-sm text-white/40"
                                      >
                                        No bowling data
                                        available
                                        yet.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>

                            {isCurrent &&
                              isLive && (
                                <div className="mt-4 rounded-xl bg-white/5 p-4">
                                  <p className="text-xs uppercase tracking-wide text-white/40">
                                    Current Bowler
                                  </p>

                                  <p className="mt-1 text-lg font-black">
                                    {playerName(
                                      currentBowler?.player ?? null,
                                      currentBowlerId
                                    )}
                                  </p>

                                  {currentBowler && (
                                    <p className="mt-1 text-sm text-white/50">
                                      {formatOvers(
                                        currentBowler.legalBalls
                                      )}{" "}
                                      overs •{" "}
                                      {
                                        currentBowler.runs
                                      }{" "}
                                      runs •{" "}
                                      {
                                        currentBowler.wickets
                                      }{" "}
                                      wickets
                                    </p>
                                  )}
                                </div>
                              )}
                          </div>

                          {/* =================================================
                              WICKET DATA
                          ================================================= */}

                          <div className="mt-5 rounded-2xl border border-red-400/10 bg-red-500/[0.04] p-4">
                            <div className="mb-4 flex items-center justify-between">
                              <div>
                                <h4 className="text-base font-black">
                                  🏏 Wickets
                                </h4>

                                <p className="mt-1 text-xs text-white/40">
                                  Dismissal details
                                </p>
                              </div>

                              <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-300">
                                {
                                  wicketEvents.length
                                }{" "}
                                Wicket
                                {wicketEvents.length !==
                                1
                                  ? "s"
                                  : ""}
                              </span>
                            </div>

                            {wicketEvents.length ===
                            0 ? (
                              <div className="rounded-xl bg-white/5 p-4 text-center text-sm text-white/40">
                                No wickets yet.
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {wicketEvents.map(
                                  (
                                    wicket,
                                    index
                                  ) => {
                                    const dismissedPlayer =
                                      findPlayer(
                                        wicket.dismissedPlayerId,
                                        battingTeam,
                                        bowlingTeam,
                                        match.team1,
                                        match.team2
                                      );

                                    const fielder =
                                      findPlayer(
                                        wicket.fielderId,
                                        battingTeam,
                                        bowlingTeam,
                                        match.team1,
                                        match.team2
                                      );

                                    const bowler =
                                      findPlayer(
                                        wicket.bowlerId,
                                        battingTeam,
                                        bowlingTeam,
                                        match.team1,
                                        match.team2
                                      );

                                    return (
                                      <div
                                        key={
                                          wicket.id
                                        }
                                        className="rounded-xl border border-white/10 bg-white/5 p-4"
                                      >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 text-xs font-black text-red-300">
                                                {index +
                                                  1}
                                              </span>

                                              <div>
                                                <p className="font-black">
                                                  {playerName(
                                                    dismissedPlayer,
                                                    wicket.dismissedPlayerId
                                                  )}
                                                </p>

                                                <p className="text-xs text-red-300">
                                                  {wicket.dismissalType ??
                                                    "WICKET"}
                                                </p>
                                              </div>
                                            </div>
                                          </div>

                                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/60">
                                            Over{" "}
                                            {
                                              wicket.overNumber
                                            }
                                            .
                                            {
                                              wicket.ballNumber
                                            }
                                          </span>
                                        </div>

                                        <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                                          <div className="rounded-lg bg-black/20 p-3">
                                            <p className="text-[11px] uppercase text-white/30">
                                              Bowler
                                            </p>

                                            <p className="mt-1 font-semibold">
                                              {playerName(
                                                bowler,
                                                wicket.bowlerId
                                              )}
                                            </p>
                                          </div>

                                          <div className="rounded-lg bg-black/20 p-3">
                                            <p className="text-[11px] uppercase text-white/30">
                                              Fielder
                                            </p>

                                            <p className="mt-1 font-semibold">
                                              {fielder
                                                ? fielder.name
                                                : wicket.fielderId !=
                                                    null
                                                  ? `Player #${wicket.fielderId}`
                                                  : "—"}
                                            </p>
                                          </div>

                                          <div className="rounded-lg bg-black/20 p-3">
                                            <p className="text-[11px] uppercase text-white/30">
                                              Ball Runs
                                            </p>

                                            <p className="mt-1 font-semibold">
                                              {
                                                wicket.totalRuns
                                              }
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            )}
                          </div>

                          {/* =================================================
                              RECENT BALLS
                          ================================================= */}

                          <div className="mt-5">
                            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/40">
                              Recent Balls
                            </p>

                            {lastBalls.length >
                            0 ? (
                              <div className="flex flex-wrap gap-2">
                                {lastBalls.map(
                                  (ball) => (
                                    <span
                                      key={
                                        ball.id
                                      }
                                      className={`flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-sm font-bold ${
                                        ball.isWicket
                                          ? "bg-red-500/20 text-red-300"
                                          : "bg-white/10"
                                      }`}
                                    >
                                      {ballDisplay(
                                        ball
                                      )}
                                    </span>
                                  )
                                )}
                              </div>
                            ) : (
                              <div className="rounded-xl bg-white/5 p-4 text-center text-sm text-white/40">
                                Waiting for the
                                first ball...
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
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
                      {match.throwballScore.team1SetsWon ??
                        0}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/5 p-4 text-center">
                    <p className="break-words text-xs uppercase tracking-wide text-white/40">
                      {match.team2.name} Sets Won
                    </p>

                    <p className="mt-1 text-base font-black">
                      {match.throwballScore.team2SetsWon ??
                        0}
                    </p>
                  </div>
                </div>

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
              Use the Refresh button above
              to see the latest live score.
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