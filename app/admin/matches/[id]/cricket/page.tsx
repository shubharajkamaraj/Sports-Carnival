"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
  useSearchParams,
  useRouter,
  usePathname,
} from "next/navigation";

import Link from "next/link";

import {
  ArrowLeft,
  CircleDot,
  RotateCcw,
  Trophy,
} from "lucide-react";

import { toast } from "sonner";

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
  captain: string;
  playerIds: number[];
  players: Player[];
}

interface BallEvent {
  id: number;

  inningsId?: number;

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

  dismissalType: string | null;
  dismissedPlayerId: number | null;
  fielderId: number | null;

  striker?: Player | null;
  nonStriker?: Player | null;
  bowler?: Player | null;
  dismissedPlayer?: Player | null;
  fielder?: Player | null;
}

interface Innings {
  id: number;

  inningsNumber: number;

  battingTeamId: number;
  bowlingTeamId: number;

  totalRuns: number;
  totalWickets: number;
  legalBalls: number;

  battingTeam: Team;
  bowlingTeam: Team;

  ballEvents: BallEvent[];
}

interface Match {
  id: number;

  tournamentId: number;
  gameId: number;

  team1Id: number;
  team2Id: number;

  matchNumber: number | null;

  matchDate: string;
  venue: string;
  status: string;

  team1Score: number;
  team2Score: number;

  /*
   * IMPORTANT
   *
   * This must exist in your Match Prisma model.
   */
  overs: number;

  team1: Team;
  team2: Team;

  game: {
    id: number;
    name: string;
    sportType: string;
  };

  tournament: {
    id: number;
    name: string;
    season: string;
  };

  cricketInnings: Innings[];
}

interface NextInningsResponse {
  id: number;
  inningsNumber: number;
  battingTeamId: number;
  bowlingTeamId: number;
  totalRuns: number;
  totalWickets: number;
  legalBalls: number;
}

interface BallResponse {
  success?: boolean;

  inningsCompleted?: boolean;

  completionReason?:
    | "ALL_OUT"
    | "OVERS_COMPLETED"
    | "TARGET_CHASED"
    | null;

  nextInnings:
    | NextInningsResponse
    | null;

  matchCompleted?: boolean;

  target?: number | null;

  targetChased?: boolean;

  result?:
    | "TEAM1_WIN"
    | "TEAM2_WIN"
    | "DRAW"
    | "TIE"
    | "NO_RESULT"
    | null;

  winnerTeamId?: number | null;

  team1Score?: number;

  team2Score?: number;
   legalBalls?: number;
  ballCount?: number;

  overCompleted?: boolean;
}

const dismissalTypes = [
  "BOWLED",
  "CAUGHT",
  "LBW",
  "RUN_OUT",
  "STUMPED",
  "HIT_WICKET",
  "RETIRED_HURT",
];

const extras = [
  {
    label: "WD",
    value: "WIDE",
  },
  {
    label: "NB",
    value: "NO_BALL",
  },
  {
    label: "BYE",
    value: "BYE",
  },
  {
    label: "LB",
    value: "LEG_BYE",
  },
];

export default function CricketScoringPage() {
  const params = useParams();

  const searchParams =
    useSearchParams();

  const router = useRouter();

  const pathname = usePathname();

  const matchId = Number(
    params.id
  );

  const inningsId = Number(
    searchParams.get(
      "inningsId"
    )
  );

  const [match, setMatch] =
    useState<Match | null>(null);

  const [innings, setInnings] =
    useState<Innings | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [strikerId, setStrikerId] =
    useState("");

  const [
    nonStrikerId,
    setNonStrikerId,
  ] = useState("");

  const [bowlerId, setBowlerId] =
    useState("");

  const [showWicket, setShowWicket] =
    useState(false);

  const [
    dismissalType,
    setDismissalType,
  ] = useState("");

  const [
    dismissedPlayerId,
    setDismissedPlayerId,
  ] = useState("");

  const [fielderId, setFielderId] =
    useState("");

    const [noBallMode, setNoBallMode] = useState(false);
    const [noBallActive, setNoBallActive] = useState(false);
const [undoing, setUndoing] = useState(false);

  /*
   * =====================================================
   * STORAGE KEY
   * =====================================================
   *
   * IMPORTANT:
   *
   * inningsId is included.
   *
   * Therefore Innings 1 and Innings 2
   * never share active-player state.
   */

  const activePlayersStorageKey =
    `cricket-active-${matchId}-${inningsId}`;

  /*
   * =====================================================
   * SAVE ACTIVE PLAYERS
   * =====================================================
   */

  function saveActivePlayers(
    striker: string,
    nonStriker: string,
    bowler: string
  ) {
    if (
      !Number.isInteger(matchId) ||
      matchId <= 0 ||
      !Number.isInteger(inningsId) ||
      inningsId <= 0
    ) {
      return;
    }

    try {
      sessionStorage.setItem(
        activePlayersStorageKey,
        JSON.stringify({
          strikerId: striker,
          nonStrikerId: nonStriker,
          bowlerId: bowler,
        })
      );
    } catch (error) {
      console.error(
        "Failed to save active players:",
        error
      );
    }
  }

  /*
   * =====================================================
   * CLEAR ACTIVE PLAYERS
   * =====================================================
   */

  function clearActivePlayers(
    inningsToClearId?: number
  ) {
    try {
      const key =
        inningsToClearId
          ? `cricket-active-${matchId}-${inningsToClearId}`
          : activePlayersStorageKey;

      sessionStorage.removeItem(key);
    } catch (error) {
      console.error(
        "Failed to clear active players:",
        error
      );
    }

    setStrikerId("");

    setNonStrikerId("");

    setBowlerId("");
  }

  /*
   * =====================================================
   * LOAD SAVED ACTIVE PLAYERS
   * =====================================================
   */

  function getSavedActivePlayers() {
    try {
      const saved =
        sessionStorage.getItem(
          activePlayersStorageKey
        );

      if (!saved) {
        return null;
      }

      return JSON.parse(saved) as {
        strikerId?: string;
        nonStrikerId?: string;
        bowlerId?: string;
      };
    } catch (error) {
      console.error(
        "Failed to read active player state:",
        error
      );

      return null;
    }
  }

  /*
   * =====================================================
   * FIND ACTIVE INNINGS
   * =====================================================
   *
   * This is important after Innings 1 completes.
   *
   * If the URL still contains the old inningsId,
   * but Innings 2 exists, we move to Innings 2.
   */

  function findActiveInnings(
    cricketInnings: Innings[]
  ) {
    if (!cricketInnings?.length) {
      return null;
    }

    /*
     * First try the innings from URL.
     */

    const urlInnings =
      cricketInnings.find(
        (item) =>
          item.id === inningsId
      );

    /*
     * If URL innings is 1 and innings 2
     * already exists, innings 2 is active.
     */

    const innings2 =
      cricketInnings.find(
        (item) =>
          item.inningsNumber === 2
      );

    if (
      urlInnings?.inningsNumber === 1 &&
      innings2
    ) {
      return innings2;
    }

    /*
     * If URL innings doesn't exist,
     * use innings 2 if available.
     */

    if (!urlInnings && innings2) {
      return innings2;
    }

    /*
     * Otherwise use URL innings.
     */

    if (urlInnings) {
      return urlInnings;
    }

    /*
     * Fallback:
     * highest innings number.
     */

    return [...cricketInnings].sort(
      (a, b) =>
        b.inningsNumber -
        a.inningsNumber
    )[0];
  }

  /*
   * =====================================================
   * NAVIGATE TO INNINGS
   * =====================================================
   */

  function navigateToInnings(
    nextInningsId: number
  ) {
    /*
     * Clear current player selections first.
     */

    clearActivePlayers(inningsId);

    /*
     * Reset wicket UI.
     */

    setShowWicket(false);

    setDismissalType("");

    setDismissedPlayerId("");

    setFielderId("");

    /*
     * Build new URL.
     *
     * We keep the current pathname and
     * replace only inningsId.
     */

    const nextUrl =
      `${pathname}?inningsId=${nextInningsId}`;

    router.replace(nextUrl);

    router.refresh();
  }

  /*
   * =====================================================
   * LOAD MATCH
   * =====================================================
   */

async function loadMatch() {
  try {
    const res = await fetch(
      `/api/matches/${matchId}`,
      {
        cache: "no-store",
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error ||
          "Failed to load match."
      );
    }

    console.log(
      "RELOADED MATCH:",
      data
    );

    setMatch(data);

    const cricketInnings =
      data.cricketInnings ?? [];

    if (cricketInnings.length === 0) {
      throw new Error(
        "Cricket innings not found."
      );
    }

    /*
     * =====================================================
     * COMPLETED MATCH
     * =====================================================
     *
     * IMPORTANT:
     * When match is completed, keep Innings 2 selected.
     *
     * Do NOT let findActiveInnings()
     * switch us somewhere else.
     */

    let selectedInnings;

    if (
      data.status === "COMPLETED"
    ) {
      selectedInnings =
        cricketInnings.find(
          (item: any) =>
            item.inningsNumber === 2
        ) ??
        cricketInnings[
          cricketInnings.length - 1
        ];
    } else {
      /*
       * Normal live-match behaviour.
       */

      selectedInnings =
        findActiveInnings(
          cricketInnings
        );
    }

    if (!selectedInnings) {
      throw new Error(
        "Cricket innings not found."
      );
    }

    console.log(
      "SELECTED INNINGS:",
      selectedInnings
    );

    console.log(
      "FINAL BALL EVENTS:",
      selectedInnings.ballEvents
    );

    /*
     * =====================================================
     * UPDATE INNINGS
     * =====================================================
     */

    setInnings(
      selectedInnings
    );

    /*
     * =====================================================
     * URL
     * =====================================================
     */

    if (
      selectedInnings.id !==
      inningsId
    ) {
      const nextUrl =
        `${pathname}?inningsId=${selectedInnings.id}`;

      router.replace(
        nextUrl
      );

      /*
       * Don't restore players here.
       * The new URL will reload the page.
       */

      return;
    }

    /*
     * =====================================================
     * ACTIVE PLAYERS
     * =====================================================
     */

    if (
      data.status !== "COMPLETED"
    ) {
      restoreActivePlayers(
        selectedInnings
      );

      restoreBowler(
        selectedInnings
      );
    }
  } catch (error) {
    console.error(
      "LOAD MATCH ERROR:",
      error
    );

    toast.error(
      error instanceof Error
        ? error.message
        : "Failed to load match."
    );
  } finally {
    setLoading(false);
  }
}

  /*
   * =====================================================
   * LOAD ON MATCH / INNINGS CHANGE
   * =====================================================
   */

  useEffect(() => {
    if (
      Number.isInteger(matchId) &&
      matchId > 0 &&
      Number.isInteger(inningsId) &&
      inningsId > 0
    ) {
      setLoading(true);

      loadMatch();
    }
  }, [
    matchId,
    inningsId,
  ]);

    async function handleUndoLast() {
    if (!innings || undoing || saving) return;

    if (!innings.ballEvents?.length) {
      toast.error("There is no ball to undo.");
      return;
    }

    const confirmed = window.confirm(
      "Undo the last ball? This will remove the most recent delivery and restore the score."
    );

    if (!confirmed) return;

    try {
      setUndoing(true);

      const res = await fetch(
        `/api/matches/${matchId}/cricket/innings/${innings.id}/undo`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const responseText = await res.text();
      let data: { error?: string; message?: string } = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(
          data.error ||
            data.message ||
            responseText ||
            "Failed to undo the last ball."
        );
      }

      // Clear cached player selections so the UI reconstructs the
      // striker/non-striker/bowler from the new latest ball.
      try {
        sessionStorage.removeItem(activePlayersStorageKey);
      } catch (error) {
        console.error(
          "Failed to clear active player state after undo:",
          error
        );
      }

      setStrikerId("");
      setNonStrikerId("");
      setBowlerId("");
      setShowWicket(false);
      setDismissalType("");
      setDismissedPlayerId("");
      setFielderId("");

      await loadMatch();

      toast.success(
        data.message || "Last ball undone successfully."
      );
    } catch (error) {
      console.error("UNDO LAST BALL ERROR:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to undo the last ball."
      );
    } finally {
      setUndoing(false);
    }
  }

  /*
   * =====================================================
   * PLAYERS
   * =====================================================
   */

  const battingPlayers =
    useMemo(() => {
      return (
        innings?.battingTeam
          ?.players ?? []
      );
    }, [innings]);

  const bowlingPlayers =
    useMemo(() => {
      return (
        innings?.bowlingTeam
          ?.players ?? []
      );
    }, [innings]);

  /*
   * =====================================================
   * DISMISSED PLAYERS
   * =====================================================
   */

  const dismissedIds =
    useMemo(() => {
      const ids =
        new Set<number>();

      for (
        const ball of
          innings?.ballEvents ?? []
      ) {
        if (
          ball.isWicket &&
          ball.dismissedPlayerId
        ) {
          ids.add(
            ball.dismissedPlayerId
          );
        }
      }

      return ids;
    }, [innings]);

  /*
   * =====================================================
   * AVAILABLE BATTERS
   * =====================================================
   */

  const availableBatters =
    useMemo(() => {
      return battingPlayers.filter(
        (player) =>
          !dismissedIds.has(
            player.id
          )
      );
    }, [
      battingPlayers,
      dismissedIds,
    ]);

  /*
   * =====================================================
   * ACTIVE PLAYER OBJECTS
   * =====================================================
   */

  const striker =
    battingPlayers.find(
      (player) =>
        String(player.id) ===
        strikerId
    );

  const nonStriker =
    battingPlayers.find(
      (player) =>
        String(player.id) ===
        nonStrikerId
    );

  const bowler =
    bowlingPlayers.find(
      (player) =>
        String(player.id) ===
        bowlerId
    );

  /*
   * =====================================================
   * RESTORE ACTIVE PLAYERS
   * =====================================================
   */

  function restoreActivePlayers(
    selectedInnings: Innings
  ) {
    /*
     * If this is a brand-new innings,
     * do NOT carry Innings 1 players.
     */

    if (
      selectedInnings.inningsNumber ===
        2 &&
      selectedInnings.legalBalls === 0 &&
      selectedInnings.ballEvents.length ===
        0
    ) {
      clearActivePlayers(
        selectedInnings.id
      );

      return;
    }

    const balls =
      selectedInnings.ballEvents ??
      [];

    const saved =
      getSavedActivePlayers();

    if (saved) {
      const dismissed =
        new Set<number>();

      for (
        const ball of balls
      ) {
        if (
          ball.isWicket &&
          ball.dismissedPlayerId
        ) {
          dismissed.add(
            ball.dismissedPlayerId
          );
        }
      }

      const savedStriker =
        saved.strikerId ?? "";

      const savedNonStriker =
        saved.nonStrikerId ?? "";

      const savedBowler =
        saved.bowlerId ?? "";

      const strikerValid =
        savedStriker !== "" &&
        battingPlayers.some(
          (player) =>
            String(player.id) ===
            savedStriker
        ) &&
        !dismissed.has(
          Number(
            savedStriker
          )
        );

      const nonStrikerValid =
        savedNonStriker !== "" &&
        battingPlayers.some(
          (player) =>
            String(player.id) ===
            savedNonStriker
        ) &&
        !dismissed.has(
          Number(
            savedNonStriker
          )
        );

      const bowlerValid =
        savedBowler !== "" &&
        selectedInnings
          .bowlingTeam
          .players.some(
            (player) =>
              String(player.id) ===
              savedBowler
          );

      if (strikerValid) {
        setStrikerId(
          savedStriker
        );
      }

      if (nonStrikerValid) {
        setNonStrikerId(
          savedNonStriker
        );
      }

      if (bowlerValid) {
        setBowlerId(
          savedBowler
        );
      }

      if (
        strikerValid &&
        nonStrikerValid &&
        bowlerValid
      ) {
        return;
      }
    }

    if (
      balls.length === 0
    ) {
      return;
    }

    const lastBall =
      balls[balls.length - 1];

    /*
     * WICKET
     */

    if (lastBall.isWicket) {
      const dismissed =
        lastBall.dismissedPlayerId;

      setBowlerId(
        String(
          lastBall.bowlerId
        )
      );

      if (
        dismissed ===
        lastBall.strikerId
      ) {
        setStrikerId("");

        setNonStrikerId(
          String(
            lastBall.nonStrikerId
          )
        );

        saveActivePlayers(
          "",
          String(
            lastBall.nonStrikerId
          ),
          String(
            lastBall.bowlerId
          )
        );

        return;
      }

      if (
        dismissed ===
        lastBall.nonStrikerId
      ) {
        setStrikerId(
          String(
            lastBall.strikerId
          )
        );

        setNonStrikerId("");

        saveActivePlayers(
          String(
            lastBall.strikerId
          ),
          "",
          String(
            lastBall.bowlerId
          )
        );

        return;
      }
    }

    /*
     * NORMAL BALL
     */

    let currentStriker =
      lastBall.strikerId;

    let currentNonStriker =
      lastBall.nonStrikerId;

    /*
     * Odd legal runs change strike.
     */

    if (
      lastBall.isLegalDelivery &&
      lastBall.runsOffBat % 2 ===
        1
    ) {
      [
        currentStriker,
        currentNonStriker,
      ] = [
        currentNonStriker,
        currentStriker,
      ];
    }

    setStrikerId(
      String(
        currentStriker
      )
    );

    setNonStrikerId(
      String(
        currentNonStriker
      )
    );

    setBowlerId(
      String(
        lastBall.bowlerId
      )
    );

    saveActivePlayers(
      String(
        currentStriker
      ),
      String(
        currentNonStriker
      ),
      String(
        lastBall.bowlerId
      )
    );
  }

  /*
   * =====================================================
   * RESTORE BOWLER
   * =====================================================
   */

  function restoreBowler(
    selectedInnings: Innings
  ) {
    const balls =
      selectedInnings.ballEvents ??
      [];

    if (
      balls.length === 0
    ) {
      setBowlerId("");

      return;
    }

    /*
     * New over = bowler must be selected.
     */

    if (
      selectedInnings.legalBalls >
        0 &&
      selectedInnings.legalBalls %
        6 ===
        0
    ) {
      setBowlerId("");

      return;
    }

    const lastBall =
      balls[balls.length - 1];

    setBowlerId(
      String(
        lastBall.bowlerId
      )
    );
  }

  /*
   * =====================================================
   * SCORE / OVERS
   * =====================================================
   */

  const overs =
    useMemo(() => {
      if (!innings) {
        return "0.0";
      }

      return `${Math.floor(
        innings.legalBalls /
          6
      )}.${innings.legalBalls % 6}`;
    }, [innings]);

  /*
   * =====================================================
   * OVER GROUPING
   * =====================================================
   */

  const overGroups =
    useMemo(() => {
      if (!innings) {
        return [];
      }

      const map =
        new Map<
          number,
          BallEvent[]
        >();

      for (
        const ball of
          innings.ballEvents ?? []
      ) {
        if (
          !map.has(
            ball.overNumber
          )
        ) {
          map.set(
            ball.overNumber,
            []
          );
        }

        map
          .get(
            ball.overNumber
          )!
          .push(ball);
      }

      return Array.from(
        map.entries()
      )
        .map(
          ([
            overNumber,
            balls,
          ]) => {
            const sortedBalls =
              [...balls].sort(
                (a, b) => {
                  if (
                    a.ballNumber !==
                    b.ballNumber
                  ) {
                    return (
                      a.ballNumber -
                      b.ballNumber
                    );
                  }

                  return (
                    a.id - b.id
                  );
                }
              );

            const legalBalls =
              sortedBalls.filter(
                (ball) =>
                  ball.isLegalDelivery
              ).length;

            /*
             * IMPORTANT:
             *
             * Runs belong only to this over.
             *
             * Wide = 1 run
             * Wd+2 = 3 total runs
             * No-ball etc. included.
             */

            const totalRuns =
              sortedBalls.reduce(
                (
                  sum,
                  ball
                ) =>
                  sum +
                  ball.totalRuns,
                0
              );

            return {
              overNumber,

              balls:
                sortedBalls,

              legalBalls,

              totalRuns,

              completed:
                legalBalls >= 6,
            };
          }
        )
        .sort(
          (a, b) =>
            a.overNumber -
            b.overNumber
        );
    }, [innings]);

  /*
   * =====================================================
   * CURRENT OVER
   * =====================================================
   */

/*
 * =====================================================
 * CURRENT OVER
 * =====================================================
 */

const currentOverData =
  useMemo(() => {
    if (!innings) {
      return {
        overNumber: 0,

        balls:
          [] as BallEvent[],

        legalBalls: 0,

        totalRuns: 0,
      };
    }

    /*
     * =================================================
     * MATCH COMPLETED
     * =================================================
     *
     * When the match ends exactly at the end of
     * an over, there is no incomplete over.
     *
     * Therefore show the LAST completed over
     * instead of creating an empty next over.
     */

    if (
      match?.status ===
        "COMPLETED"
    ) {
      const lastOver =
        overGroups.length > 0
          ? overGroups[
              overGroups.length - 1
            ]
          : null;

      if (lastOver) {
        return lastOver;
      }
    }

    /*
     * =================================================
     * FIND INCOMPLETE OVER
     * =================================================
     */

    const incompleteOver =
      [...overGroups]
        .reverse()
        .find(
          (over) =>
            over.legalBalls < 6
        );

    if (
      incompleteOver
    ) {
      return incompleteOver;
    }

    /*
     * =================================================
     * ALL OVERS COMPLETED BUT MATCH STILL LIVE
     * =================================================
     *
     * Normally this is the moment before the next
     * over starts.
     */

    const lastOver =
      overGroups.length > 0
        ? overGroups[
            overGroups.length - 1
          ]
        : null;

    return {
      overNumber:
        lastOver
          ? lastOver.overNumber + 1
          : 0,

      balls:
        [] as BallEvent[],

      legalBalls: 0,

      totalRuns: 0,
    };
  }, [
    innings,
    overGroups,
    match?.status,
  ]);

  const currentOverNumber =
    currentOverData.overNumber;

  const currentOver =
    currentOverData.balls;

  /*
   * =====================================================
   * PREVIOUS OVERS
   * =====================================================
   */

  const previousOvers =
    useMemo(() => {
      return overGroups
        .filter(
          (over) =>
            over.completed &&
            over.overNumber !==
              currentOverNumber
        )
        .sort(
          (a, b) =>
            b.overNumber -
            a.overNumber
        )
        .slice(0, 5);
    }, [
      overGroups,
      currentOverNumber,
    ]);

  /*
   * =====================================================
   * RUN RATE
   * =====================================================
   */

  const currentRate =
    innings &&
    innings.legalBalls > 0
      ? (
          (innings.totalRuns /
            innings.legalBalls) *
          6
        ).toFixed(2)
      : "0.00";

  /*
   * =====================================================
   * TARGET
   * =====================================================
   */

const target =
  innings?.inningsNumber === 2
    ? (() => {
        const firstInnings =
          match?.cricketInnings?.find(
            (item) =>
              item.inningsNumber === 1
          );

        return firstInnings
          ? Number(firstInnings.totalRuns) + 1
          : null;
      })()
    : null;

  const runsRemaining =
    target !== null &&
    innings
      ? Math.max(
          target -
            innings.totalRuns,
          0
        )
      : 0;

  const legalBallsRemaining =
    innings
      ? Math.max(
          match?.overs
            ? match.overs *
                6 -
                innings.legalBalls
            : 0,
          0
        )
      : 0;

  const requiredRate =
    target !== null &&
    legalBallsRemaining > 0
      ? (
          (runsRemaining /
            legalBallsRemaining) *
          6
        ).toFixed(2)
      : "0.00";

      /*
 * =====================================================
 * CHASE MESSAGE
 * =====================================================
 */

const chaseMessage =
  innings?.inningsNumber === 2 &&
  target !== null &&
  runsRemaining > 0 &&
  legalBallsRemaining > 0
    ? `Need ${runsRemaining} runs from ${legalBallsRemaining} balls`
    : null;

  /*
   * =====================================================
   * BALL DISPLAY
   * =====================================================
   */

  // function getBallDisplay(
  //   ball: BallEvent
  // ) {
  //   if (
  //     ball.isWicket
  //   ) {
  //     return "W";
  //   }

  //   if (
  //     ball.extraType ===
  //     "WIDE"
  //   ) {
  //     if (
  //       ball.extraRuns > 1
  //     ) {
  //       return `Wd+${ball.extraRuns - 1}`;
  //     }

  //     return "Wd";
  //   }

  //   if (
  //     ball.extraType ===
  //     "NO_BALL"
  //   ) {
  //     if (
  //       ball.extraRuns > 1
  //     ) {
  //       return `Nb+${ball.extraRuns - 1}`;
  //     }

  //     return "Nb";
  //   }

  //   if (
  //     ball.extraType ===
  //     "BYE"
  //   ) {
  //     return `B${ball.extraRuns}`;
  //   }

  //   if (
  //     ball.extraType ===
  //     "LEG_BYE"
  //   ) {
  //     return `LB${ball.extraRuns}`;
  //   }

  //   return String(
  //     ball.runsOffBat
  //   );
  // }
function getBallDisplay(ball: BallEvent) {
  if (ball.isWicket) {
    return "W";
  }

  if (ball.extraType === "WIDE") {
    if (ball.extraRuns > 1) {
      return `Wd+${ball.extraRuns - 1}`;
    }

    return "Wd";
  }

  if (ball.extraType === "NO_BALL") {
    const batRuns = ball.runsOffBat ?? 0;

    if (batRuns > 0) {
      return `Nb+${batRuns}`;
    }

    return "Nb";
  }

  if (ball.extraType === "BYE") {
    return `B${ball.extraRuns}`;
  }

  if (ball.extraType === "LEG_BYE") {
    return `LB${ball.extraRuns}`;
  }

  return String(ball.runsOffBat ?? 0);
}
  /*
   * =====================================================
   * BALL CLASS
   * =====================================================
   */

  function getBallClass(
    ball: BallEvent
  ) {
    if (
      ball.isWicket
    ) {
      return "bg-red-600 text-white border-red-600";
    }

    if (
      ball.extraType ===
      "WIDE"
    ) {
      return "bg-orange-100 text-orange-700 border-orange-200";
    }

    if (
      ball.extraType ===
      "NO_BALL"
    ) {
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }

    if (
      ball.extraType ===
        "BYE" ||
      ball.extraType ===
        "LEG_BYE"
    ) {
      return "bg-slate-100 text-slate-700 border-slate-200";
    }

    if (
      ball.runsOffBat ===
      6
    ) {
      return "bg-purple-600 text-white border-purple-600";
    }

    if (
      ball.runsOffBat ===
      4
    ) {
      return "bg-blue-600 text-white border-blue-600";
    }

    if (
      ball.totalRuns ===
      0
    ) {
      return "bg-slate-100 text-slate-500 border-slate-200";
    }

    return "bg-white text-slate-800 border-slate-200";
  }

  /*
   * =====================================================
   * DISMISSAL TEXT
   * =====================================================
   */

  function getDismissalText(
    ball: BallEvent
  ) {
    const bowlerName =
      ball.bowler?.name ??
      bowlingPlayers.find(
        (player) =>
          player.id ===
          ball.bowlerId
      )?.name ??
      "Unknown bowler";

    const fielderName =
      ball.fielder?.name ??
      bowlingPlayers.find(
        (player) =>
          player.id ===
          ball.fielderId
      )?.name ??
      "Unknown fielder";

    switch (
      ball.dismissalType
    ) {
      case "CAUGHT":
        return `c ${fielderName} b ${bowlerName}`;

      case "BOWLED":
        return `b ${bowlerName}`;

      case "LBW":
        return `lbw b ${bowlerName}`;

      case "RUN_OUT":
        return `run out (${fielderName})`;

      case "STUMPED":
        return `st ${fielderName} b ${bowlerName}`;

      case "HIT_WICKET":
        return `hit wicket b ${bowlerName}`;

      case "RETIRED_HURT":
        return "retired hurt";

      default:
        return "dismissed";
    }
  }

  /*
   * =====================================================
   * BATTING SCORECARD
   * =====================================================
   */

  // const battingScorecard =
  //   useMemo(() => {
  //     if (!innings) {
  //       return [];
  //     }

  //     return battingPlayers
  //       .map((player) => {
  //         let runs = 0;

  //         let balls = 0;

  //         let fours = 0;

  //         let sixes = 0;

  //         let dismissal:
  //           | BallEvent
  //           | undefined;

  //         for (
  //           const ball of
  //             innings.ballEvents ??
  //             []
  //         ) {
  //           if (
  //             ball.strikerId ===
  //               player.id &&
  //             ball.isLegalDelivery
  //           ) {
  //             balls++;

  //             runs +=
  //               ball.runsOffBat;

  //             if (
  //               ball.runsOffBat ===
  //               4
  //             ) {
  //               fours++;
  //             }

  //             if (
  //               ball.runsOffBat ===
  //               6
  //             ) {
  //               sixes++;
  //             }
  //           }

  //           if (
  //             ball.isWicket &&
  //             ball.dismissedPlayerId ===
  //               player.id
  //           ) {
  //             dismissal =
  //               ball;
  //           }
  //         }

  //         const isActive =
  //           player.id ===
  //             Number(
  //               strikerId
  //             ) ||
  //           player.id ===
  //             Number(
  //               nonStrikerId
  //             );

  //         return {
  //           player,

  //           runs,

  //           balls,

  //           fours,

  //           sixes,

  //           dismissal,

  //           isActive,
  //         };
  //       })
  //       .filter(
  //         (item) =>
  //           item.balls > 0 ||
  //           item.dismissal ||
  //           item.isActive
  //       );
  //   }, [
  //     innings,
  //     battingPlayers,
  //     strikerId,
  //     nonStrikerId,
  //   ]);

  // const battingScorecard =
  // useMemo(() => {
  //   if (!innings) {
  //     return [];
  //   }

  //   return battingPlayers
  //     .map((player) => {
  //       let runs = 0;
  //       let balls = 0;
  //       let fours = 0;
  //       let sixes = 0;

  //       let dismissal:
  //         | BallEvent
  //         | undefined;

  //       for (
  //         const ball of
  //           innings.ballEvents ?? []
  //       ) {
  //         if (
  //           ball.strikerId === player.id &&
  //           ball.isLegalDelivery
  //         ) {
  //           balls++;

  //           runs += ball.runsOffBat;

  //           if (ball.runsOffBat === 4) {
  //             fours++;
  //           }

  //           if (ball.runsOffBat === 6) {
  //             sixes++;
  //           }
  //         }

  //         if (
  //           ball.isWicket &&
  //           ball.dismissedPlayerId === player.id
  //         ) {
  //           dismissal = ball;
  //         }
  //       }

  //       // ============================================
  //       // STRIKE RATE
  //       // ============================================

  //       const strikeRate =
  //         balls > 0
  //           ? (runs / balls) * 100
  //           : 0;

  //       const isActive =
  //         player.id === Number(strikerId) ||
  //         player.id === Number(nonStrikerId);

  //       return {
  //         player,

  //         runs,

  //         balls,

  //         fours,

  //         sixes,

  //         strikeRate,

  //         dismissal,

  //         isActive,
  //       };
  //     })
  //     .filter(
  //       (item) =>
  //         item.balls > 0 ||
  //         item.dismissal ||
  //         item.isActive
  //     );
  // }, [
  //   innings,
  //   battingPlayers,
  //   strikerId,
  //   nonStrikerId,
  // ]);

  const battingScorecard =
  useMemo(() => {
    if (!innings) {
      return [];
    }

    return battingPlayers
      .map((player) => {
        let runs = 0;
        let balls = 0;
        let fours = 0;
        let sixes = 0;

        let dismissal:
          | BallEvent
          | undefined;

        for (
          const ball of
            innings.ballEvents ?? []
        ) {
          // =================================================
          // BATTER RUNS
          // =================================================
          //
          // IMPORTANT:
          // Count runsOffBat even on NO BALL.
          //
          // NB + 4
          // runsOffBat = 4
          // extraRuns  = 1
          // totalRuns   = 5
          //
          // Batter gets: 4
          // Team gets:   5
          //
          // =================================================

          if (
            ball.strikerId === player.id
          ) {
            runs += Number(
              ball.runsOffBat ?? 0
            );

            // -----------------------------------------------
            // FOURS
            // -----------------------------------------------

            if (
              Number(
                ball.runsOffBat ?? 0
              ) === 4
            ) {
              fours++;
            }

            // -----------------------------------------------
            // SIXES
            // -----------------------------------------------

            if (
              Number(
                ball.runsOffBat ?? 0
              ) === 6
            ) {
              sixes++;
            }

            // -----------------------------------------------
            // BALLS FACED
            // -----------------------------------------------
            //
            // No Ball = NOT counted
            // Wide = NOT counted
            // Normal delivery = counted
            //
            // -----------------------------------------------

            if (
              ball.isLegalDelivery
            ) {
              balls++;
            }
          }

          // =================================================
          // DISMISSAL
          // =================================================

          if (
            ball.isWicket &&
            ball.dismissedPlayerId ===
              player.id
          ) {
            dismissal = ball;
          }
        }

        // =================================================
        // STRIKE RATE
        // =================================================

        const strikeRate =
          balls > 0
            ? (runs / balls) * 100
            : 0;

        // =================================================
        // ACTIVE BATTER
        // =================================================

        const isActive =
          player.id ===
            Number(strikerId) ||
          player.id ===
            Number(nonStrikerId);

        return {
          player,

          runs,

          balls,

          fours,

          sixes,

          strikeRate,

          dismissal,

          isActive,
        };
      })
      .filter(
        (item) =>
          item.runs > 0 ||
          item.balls > 0 ||
          item.dismissal ||
          item.isActive
      );
  }, [
    innings,
    battingPlayers,
    strikerId,
    nonStrikerId,
  ]);

  /*
   * =====================================================
   * BOWLING SCORECARD
   * =====================================================
   */

  // const bowlingScorecard =
  //   useMemo(() => {
  //     if (!innings) {
  //       return [];
  //     }

  //     return bowlingPlayers
  //       .map((player) => {
  //         const balls =
  //           innings.ballEvents.filter(
  //             (ball) =>
  //               ball.bowlerId ===
  //               player.id
  //           );

  //         if (
  //           !balls.length
  //         ) {
  //           return null;
  //         }

  //         const legalBalls =
  //           balls.filter(
  //             (ball) =>
  //               ball.isLegalDelivery
  //           ).length;

  //         const runs =
  //           balls.reduce(
  //             (
  //               sum,
  //               ball
  //             ) =>
  //               sum +
  //               ball.totalRuns,
  //             0
  //           );

  //         const wickets =
  //           balls.filter(
  //             (ball) =>
  //               ball.isWicket &&
  //               ball.dismissalType !==
  //                 "RUN_OUT" &&
  //               ball.dismissalType !==
  //                 "RETIRED_HURT"
  //           ).length;

  //         return {
  //           player,

  //           legalBalls,

  //           runs,

  //           wickets,
  //         };
  //       })
  //       .filter(Boolean) as {
  //       player: Player;
  //       legalBalls: number;
  //       runs: number;
  //       wickets: number;
  //     }[];
  //   }, [
  //     innings,
  //     bowlingPlayers,
  //   ]);

  const bowlingScorecard =
  useMemo(() => {
    if (!innings) {
      return [];
    }

    return bowlingPlayers
      .map((player) => {
        const balls =
          innings.ballEvents.filter(
            (ball) =>
              ball.bowlerId === player.id
          );

        if (!balls.length) {
          return null;
        }

        const legalBalls =
          balls.filter(
            (ball) =>
              ball.isLegalDelivery
          ).length;

        const runs =
          balls.reduce(
            (sum, ball) =>
              sum + ball.totalRuns,
            0
          );

        const wickets =
          balls.filter(
            (ball) =>
              ball.isWicket &&
              ball.dismissalType !==
                "RUN_OUT" &&
              ball.dismissalType !==
                "RETIRED_HURT"
          ).length;

        const economy =
          legalBalls > 0
            ? runs / (legalBalls / 6)
            : 0;

        return {
          player,
          legalBalls,
          runs,
          wickets,
          economy,
        };
      })
      .filter(Boolean) as {
      player: Player;
      legalBalls: number;
      runs: number;
      wickets: number;
      economy: number;
    }[];
  }, [
    innings,
    bowlingPlayers,
  ]);
  /*
   * =====================================================
   * HANDLE COMPLETED INNINGS
   * =====================================================
   */

async function handleCompletedInnings(
  data: BallResponse
) {
  /*
   * =====================================================
   * INNINGS 1 → INNINGS 2
   * =====================================================
   */

  if (
    data.inningsCompleted &&
    data.nextInnings &&
    innings?.inningsNumber === 1
  ) {
    clearActivePlayers(
      innings.id
    );

    setShowWicket(false);

    setDismissalType("");
    setDismissedPlayerId("");
    setFielderId("");

    if (
      data.completionReason ===
      "ALL_OUT"
    ) {
      toast.success(
        "Innings 1 completed — All Out. Starting Innings 2."
      );
    } else {
      toast.success(
        "Innings 1 completed — Overs completed. Starting Innings 2."
      );
    }

    navigateToInnings(
      data.nextInnings.id
    );

    return true;
  }

  /*
   * =====================================================
   * INNINGS 2 → MATCH COMPLETED
   * =====================================================
   */

  if (
    data.matchCompleted &&
    innings?.inningsNumber === 2
  ) {
    clearActivePlayers(
      innings.id
    );

    setShowWicket(false);

    setDismissalType("");
    setDismissedPlayerId("");
    setFielderId("");

    /*
     * Update React match state.
     */

    setMatch((prev) =>
      prev
        ? {
            ...prev,

            status: "COMPLETED",

            result:
              data.result ?? null,

            winnerTeamId:
              data.winnerTeamId ??
              null,

            team1Score:
              data.team1Score ??
              prev.team1Score,

            team2Score:
              data.team2Score ??
              prev.team2Score,
          }
        : prev
    );

    /*
     * Reload match so the final ball
     * is available in innings.ballEvents.
     */

    await loadMatch();

    /*
     * Final result toast.
     */

    if (
      data.result === "TIE"
    ) {
      toast.success(
        "🏆 MATCH COMPLETED — Match tied!"
      );
    } else if (
      data.result === "TEAM1_WIN"
    ) {
      toast.success(
        "🏆 MATCH COMPLETED — Team 1 won!"
      );
    } else if (
      data.result === "TEAM2_WIN"
    ) {
      toast.success(
        "🏆 MATCH COMPLETED — Team 2 won!"
      );
    } else {
      toast.success(
        "🏆 MATCH COMPLETED"
      );
    }

    router.push(
  `/admin/matches/${matchId}/summary`
);

return true;
  }

  return false;
}

  /*
 * =====================================================
 * MANUAL END INNINGS
 * =====================================================
 *
 * IMPORTANT:
 *
 * This does NOT replace or modify the existing
 * automatic innings-end logic.
 *
 * It is only used when the scorer presses
 * "END INNINGS".
 */

async function endInningsManually() {
  if (!innings) {
    return;
  }

  /*
   * Do not allow another request while saving.
   */

  if (saving) {
    return;
  }

  /*
   * Confirmation
   */

  const confirmed =
    window.confirm(
      innings.inningsNumber === 1
        ? "Are you sure you want to end Innings 1? Innings 2 will start."
        : "Are you sure you want to end Innings 2? The match will be completed."
    );

  if (!confirmed) {
    return;
  }

  try {
    setSaving(true);

    /*
     * Close wicket panel if it is open.
     */

    setShowWicket(false);

    setDismissalType("");

    setDismissedPlayerId("");

    setFielderId("");

    /*
     * Call manual innings-end API.
     */

    const res =
      await fetch(
        `/api/matches/${matchId}/cricket/innings/${innings.id}/end`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );

    const data =
      (await res.json()) as
        | BallResponse
        | {
            error?: string;
          };

    /*
     * API error
     */

    if (!res.ok) {
      throw new Error(
        "error" in data
          ? data.error ||
              "Failed to end innings."
          : "Failed to end innings."
      );
    }

    /*
     * =================================================
     * INNINGS 1 → INNINGS 2
     * =================================================
     */

    if (
      "inningsCompleted" in data &&
      data.inningsCompleted &&
      "nextInnings" in data &&
      data.nextInnings &&
      innings.inningsNumber === 1
    ) {
      /*
       * Clear Innings 1 active players.
       */

      clearActivePlayers(
        innings.id
      );

      /*
       * Reset wicket UI.
       */

      setShowWicket(false);

      setDismissalType("");

      setDismissedPlayerId("");

      setFielderId("");

      toast.success(
        "Innings 1 ended. Starting Innings 2."
      );

      /*
       * Navigate to the new innings.
       */

      navigateToInnings(
        data.nextInnings.id
      );

      return;
    }

    /*
     * =================================================
     * INNINGS 2 → MATCH COMPLETE
     * =================================================
     */

    if (
      "matchCompleted" in data &&
      data.matchCompleted &&
      innings.inningsNumber === 2
    ) {
      /*
       * Clear active players.
       */

      clearActivePlayers(
        innings.id
      );

      /*
       * Reset wicket UI.
       */

      setShowWicket(false);

      setDismissalType("");

      setDismissedPlayerId("");

      setFielderId("");

      toast.success(
        "Innings 2 ended. Match completed."
      );

      /*
       * Refresh final match data.
       */

      await awaitReloadMatch();

      return;
    }
  } catch (error) {
    console.error(
      "Manual end innings error:",
      error
    );

    toast.error(
      error instanceof Error
        ? error.message
        : "Failed to end innings."
    );
  } finally {
    setSaving(false);
  }
}
  /*
   * =====================================================
   * RELOAD MATCH
   * =====================================================
   */

  async function awaitReloadMatch() {
    try {
      const res =
        await fetch(
          `/api/matches/${matchId}`,
          {
            cache: "no-store",
          }
        );

      const data =
        await res.json();

      if (res.ok) {
        setMatch(data);
      }
    } catch (error) {
      console.error(
        "Failed to refresh match:",
        error
      );
    }
  }


  async function addNoBallDelivery(
  batRuns: number
) {
  if (!innings) {
    return;
  }

  if (!strikerId) {
    toast.error("Select striker.");
    return;
  }

  if (!nonStrikerId) {
    toast.error("Select non-striker.");
    return;
  }

  if (!bowlerId) {
    toast.error("Select bowler.");
    return;
  }

  if (strikerId === nonStrikerId) {
    toast.error(
      "Striker and non-striker must be different."
    );
    return;
  }

  try {
    setSaving(true);

    const runsOffBat = batRuns;

    const extraRuns = 1;

    const totalRuns =
      runsOffBat + extraRuns;

    const res = await fetch(
      `/api/matches/${matchId}/cricket/innings/${innings.id}/balls`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          strikerId: Number(strikerId),

          nonStrikerId:
            Number(nonStrikerId),

          bowlerId:
            Number(bowlerId),

          runsOffBat,

          extraRuns,

          totalRuns,

          extraType: "NO_BALL",

          // IMPORTANT:
          // No-ball is NOT a legal delivery.
          isLegalDelivery: false,

          isWicket: false,

          dismissalType: null,

          dismissedPlayerId: null,

          fielderId: null,
        }),
      }
    );

    const data =
      (await res.json()) as
        | BallResponse
        | {
            error?: string;
          };

    if (!res.ok) {
      throw new Error(
        "error" in data
          ? data.error ||
              "Failed to save no-ball."
          : "Failed to save no-ball."
      );
    }

    // =================================================
    // NO BALL STRIKE CHANGE
    // =================================================
    //
    // Total runs on a no-ball determine whether
    // striker changes.
    //
    // NB       = 1 total -> no change
    // NB+1     = 2 total -> no change
    // NB+2     = 3 total -> change
    // NB+3     = 4 total -> no change
    // NB+4     = 5 total -> change
    // NB+6     = 7 total -> change
    //

    let nextStriker =
      strikerId;

    let nextNonStriker =
      nonStrikerId;

    if (totalRuns % 2 === 1) {
      [
        nextStriker,
        nextNonStriker,
      ] = [
        nextNonStriker,
        nextStriker,
      ];
    }

    setStrikerId(
      nextStriker
    );

    setNonStrikerId(
      nextNonStriker
    );

    saveActivePlayers(
      nextStriker,
      nextNonStriker,
      bowlerId
    );

    await loadMatch();

    toast.success(
      batRuns === 0
        ? "No Ball"
        : `NB+${batRuns}`
    );

  } catch (error) {
    console.error(
      "NO BALL ERROR:",
      error
    );

    toast.error(
      error instanceof Error
        ? error.message
        : "Failed to save no-ball."
    );

  } finally {
    setSaving(false);
  }
}
  /*
   * =====================================================
   * ADD BALL
   * =====================================================
   */

//   async function addBall(
//     runs: number,
//     extraType = "NONE"
//   ) {
//     if (!innings) {
//       return;
//     }

//     // =====================================================
// // NO BALL MODE
// // =====================================================
// //
// // When NB is clicked, we don't save a ball immediately.
// // The next run button decides the bat runs.
// //
// // Example:
// // NB -> 6
// // = 1 no-ball + 6 bat runs
// // = 7 total runs
// //
// // NB -> 0
// // = 1 no-ball only
// // = 1 total run
// //

// if (noBallMode && extraType === "NONE") {
//   setNoBallMode(false);

//   await addNoBallDelivery(runs);

//   return;
// }

//     /*
//      * Check innings already complete.
//      */
// const maximumLegalBalls =
//   Number(match?.overs ?? 0) * 6;

// if (
//   maximumLegalBalls > 0 &&
//   innings.legalBalls >= maximumLegalBalls
// ) {
//   /*
//    * The local UI may be stale.
//    * Reload the match before showing an error.
//    */
//   await loadMatch();

//   return;
// }
//     if (!strikerId) {
//       toast.error(
//         "Select striker."
//       );

//       return;
//     }

//     if (!nonStrikerId) {
//       toast.error(
//         "Select non-striker."
//       );

//       return;
//     }

//     if (!bowlerId) {
//       toast.error(
//         "Select bowler."
//       );

//       return;
//     }

//     if (
//       strikerId ===
//       nonStrikerId
//     ) {
//       toast.error(
//         "Striker and non-striker must be different."
//       );

//       return;
//     }

//     try {
//       setSaving(true);

//       const isWide =
//         extraType ===
//         "WIDE";

//       const isNoBall =
//         extraType ===
//         "NO_BALL";

//         const runsOffBat =
//   extraType === "NONE"
//     ? runs
//     : extraType === "NO_BALL"
//       ? runs
//       : 0;

// const extraRuns =
//   extraType === "NONE"
//     ? 0
//     : extraType === "NO_BALL"
//       ? 1
//       : runs;

//       /*
//        * IMPORTANT:
//        *
//        * For normal run:
//        * runsOffBat = runs
//        * extraRuns = 0
//        *
//        * For wide/no-ball:
//        * the current UI sends 1.
//        */

//       // const runsOffBat =
//       //   extraType ===
//       //   "NONE"
//       //     ? runs
//       //     : 0;

//       // const extraRuns =
//       //   extraType ===
//       //   "NONE"
//       //     ? 0
//       //     : runs;
// //       let runsOffBat = 0;
// // let extraRuns = 0;

// // if (extraType === "NONE") {
// //   // Normal delivery
// //   runsOffBat = runs;
// //   extraRuns = 0;
// // } else if (extraType === "NO_BALL") {
// //   // No-ball always gives 1 extra run
// //   // Player's bat runs are added separately
// //   runsOffBat = runs;
// //   extraRuns = 1;
// // } else if (extraType === "WIDE") {
// //   // Wide always gives at least 1 extra run
// //   runsOffBat = 0;
// //   extraRuns = Math.max(1, runs);
// // } else if (extraType === "BYE") {
// //   runsOffBat = 0;
// //   extraRuns = runs;
// // } else if (extraType === "LEG_BYE") {
// //   runsOffBat = 0;
// //   extraRuns = runs;
// // }

// // let runsOffBat = 0;
// // let extraRuns = 0;

// // if (extraType === "NONE") {
// //   // Normal delivery
// //   runsOffBat = runs;
// //   extraRuns = 0;
// // } else if (isWide) {
// //   // Wide = 1 extra run
// //   runsOffBat = 0;
// //   extraRuns = 1;
// // } else if (isNoBall) {
// //   // No-ball = 1 automatic extra run
// //   // Plus whatever runs were scored off the bat
// //   runsOffBat = runs;
// //   extraRuns = 1;
// // }
// console.log(
//   "========== SENDING BALL =========="
// );

// console.log({
//   matchId,
//   inningsId: innings.id,
//   inningsNumber: innings.inningsNumber,
//   strikerId,
//   nonStrikerId,
//   bowlerId,
//   runsOffBat,
//   extraRuns,
//   totalRuns:
//     runsOffBat + extraRuns,
//   extraType,
//   isLegalDelivery:
//     !isWide && !isNoBall,
// });

// console.log(
//   "CURRENT LEGAL BALLS:",
//   innings.legalBalls
// );

// console.log(
//   "CURRENT TOTAL RUNS:",
//   innings.totalRuns
// );

// console.log(
//   "=================================="
// );
//       const res =
//         await fetch(
//           `/api/matches/${matchId}/cricket/innings/${innings.id}/balls`,
//           {
//             method: "POST",

//             headers: {
//               "Content-Type":
//                 "application/json",
//             },

//             body: JSON.stringify({
//               strikerId:
//                 Number(
//                   strikerId
//                 ),

//               nonStrikerId:
//                 Number(
//                   nonStrikerId
//                 ),

//               bowlerId:
//                 Number(
//                   bowlerId
//                 ),

//               runsOffBat,

//               extraRuns,

//               totalRuns:
//                 runsOffBat +
//                 extraRuns,

//               extraType,

//               isLegalDelivery:
//                 !isWide &&
//                 !isNoBall,

//               isWicket: false,

//               dismissalType:
//                 null,

//               dismissedPlayerId:
//                 null,

//               fielderId:
//                 null,
//             }),
//           }
//         );

//       const data =
//         (await res.json()) as
//           | BallResponse
//           | {
//               error?: string;
//             };
// console.log(
//   "========== BALL API RESPONSE =========="
// );

// console.log(
//   "HTTP STATUS:",
//   res.status
// );

// console.log(
//   "BALL RESPONSE:",
//   data
// );

// console.log(
//   "======================================="
// );
     
//      if (!res.ok) {
//   /*
//    * =================================================
//    * MATCH ALREADY COMPLETED
//    * =================================================
//    *
//    * API returns 400 when the innings is already
//    * completed. If it is innings 2, the API also
//    * sends matchCompleted: true.
//    */

//   if (
//     "matchCompleted" in data &&
//     data.matchCompleted
//   ) {
//     await loadMatch();

//     handleCompletedInnings(
//       data as BallResponse
//     );

//     return;
//   }

//   /*
//    * =================================================
//    * OTHER ERRORS
//    * =================================================
//    */

//   throw new Error(
//     "error" in data
//       ? data.error ||
//           "Failed to save ball."
//       : "Failed to save ball."
//   );
// }
      

//       /*
//        * =================================================
//        * AUTOMATIC INNINGS SWITCH
//        * =================================================
//        */

//       if (
//         "inningsCompleted" in
//           data &&
//         data.inningsCompleted &&
//         "nextInnings" in data &&
//         data.nextInnings
//       ) {
//         handleCompletedInnings(
//           data
//         );

//         return;
//       }

//       /*
//        * =================================================
//        * MATCH COMPLETED
//        * =================================================
//        */

//       if (
//         "matchCompleted" in
//           data &&
//         data.matchCompleted
//       ) {
//         handleCompletedInnings(
//           data
//         );

//         return;
//       }

//       /*
//        * =================================================
//        * NORMAL STRIKE CHANGE
//        * =================================================
//        *
//        * Odd legal runs change strike.
//        *
//        * Wide/no-ball do not use this
//        * simple rule.
//        */

//       // let nextStriker =
//       //   strikerId;

//       // let nextNonStriker =
//       //   nonStrikerId;

//       // if (
//       //   runs % 2 === 1 &&
//       //   !isWide &&
//       //   !isNoBall
//       // ) {
//       //   [
//       //     nextStriker,
//       //     nextNonStriker,
//       //   ] = [
//       //     nextNonStriker,
//       //     nextStriker,
//       //   ];
//       // }

// let nextStriker = strikerId;
// let nextNonStriker = nonStrikerId;

// // =====================================================
// // NORMAL BALL STRIKE ROTATION
// // =====================================================

// if (
//   runs % 2 === 1 &&
//   !isWide &&
//   !isNoBall
// ) {
//   [nextStriker, nextNonStriker] = [
//     nextNonStriker,
//     nextStriker,
//   ];
// }

// // =====================================================
// // END OF OVER STRIKE ROTATION
// // =====================================================

// if (legalBalls === 6) {
//   /*
//    * The end-of-over rotation happens in addition
//    * to the normal odd-run rotation.
//    *
//    * Therefore:
//    *
//    * Odd runs  -> two swaps -> same striker
//    * Even runs -> one swap  -> other striker
//    */

//   if (
//     runs % 2 === 0 &&
//     !isWide &&
//     !isNoBall
//   ) {
//     [nextStriker, nextNonStriker] = [
//       nextNonStriker,
//       nextStriker,
//     ];
//   }
// }

// // =====================================================
// // UPDATE UI
// // =====================================================

// setStrikerId(nextStriker);
// setNonStrikerId(nextNonStriker);

// saveActivePlayers(
//   nextStriker,
//   nextNonStriker,
//   bowlerId
// );

// await loadMatch();

//       setStrikerId(
//         nextStriker
//       );

//       setNonStrikerId(
//         nextNonStriker
//       );

//       saveActivePlayers(
//         nextStriker,
//         nextNonStriker,
//         bowlerId
//       );

//       await loadMatch();

//       toast.success(
//         runs === 0
//           ? "Dot ball"
//           : `${runs} run${
//               runs !== 1
//                 ? "s"
//                 : ""
//             }`
//       );
//     } catch (error) {
//       console.error(error);

//       toast.error(
//         error instanceof Error
//           ? error.message
//           : "Failed to save ball."
//       );
//     } finally {
//       setSaving(false);
//     }
//   }
async function addBall(
  runs: number,
  extraType = "NONE"
) {
  if (!innings) {
    return;
  }

  // =====================================================
  // NO BALL MODE
  // =====================================================
  //
  // When NB is clicked, we don't save immediately.
  // The next run button determines the bat runs.
  //
  // Example:
  //
  // NB -> 0 = 1 total
  // NB -> 1 = 2 total
  // NB -> 2 = 3 total
  // NB -> 4 = 5 total
  // NB -> 6 = 7 total
  //
  // =====================================================

  if (
    noBallMode &&
    extraType === "NONE"
  ) {
    setNoBallMode(false);

    await addNoBallDelivery(runs);

    return;
  }

  // =====================================================
  // CHECK MAXIMUM LEGAL BALLS
  // =====================================================

  const maximumLegalBalls =
    Number(match?.overs ?? 0) * 6;

  if (
    maximumLegalBalls > 0 &&
    innings.legalBalls >=
      maximumLegalBalls
  ) {
    await loadMatch();

    return;
  }

  // =====================================================
  // VALIDATE STRIKER
  // =====================================================

  if (!strikerId) {
    toast.error(
      "Select striker."
    );

    return;
  }

  // =====================================================
  // VALIDATE NON-STRIKER
  // =====================================================

  if (!nonStrikerId) {
    toast.error(
      "Select non-striker."
    );

    return;
  }

  // =====================================================
  // VALIDATE BOWLER
  // =====================================================

  if (!bowlerId) {
    toast.error(
      "Select bowler."
    );

    return;
  }

  // =====================================================
  // STRIKER / NON-STRIKER MUST BE DIFFERENT
  // =====================================================

  if (
    strikerId ===
    nonStrikerId
  ) {
    toast.error(
      "Striker and non-striker must be different."
    );

    return;
  }

  try {
    setSaving(true);

    // =====================================================
    // DELIVERY TYPE
    // =====================================================

    const isWide =
      extraType === "WIDE";

    const isNoBall =
      extraType === "NO_BALL";

    const isLegalBall =
      !isWide &&
      !isNoBall;

    // =====================================================
    // CALCULATE RUNS
    // =====================================================
    //
    // NORMAL:
    //
    // 1 run  -> 1 bat + 0 extra
    // 4 runs -> 4 bat + 0 extra
    // 6 runs -> 6 bat + 0 extra
    //
    // NO BALL:
    //
    // 0 bat -> 0 bat + 1 extra
    // 1 bat -> 1 bat + 1 extra
    // 4 bat -> 4 bat + 1 extra
    // 6 bat -> 6 bat + 1 extra
    //
    // WIDE:
    //
    // 1 wide -> 0 bat + 1 extra
    //
    // =====================================================

    const runsOffBat =
      extraType === "NONE"
        ? runs
        : extraType === "NO_BALL"
          ? runs
          : 0;

    const extraRuns =
      extraType === "NONE"
        ? 0
        : extraType === "NO_BALL"
          ? 1
          : runs;

    const totalRuns =
      runsOffBat +
      extraRuns;

    // =====================================================
    // CURRENT LEGAL BALL COUNT
    // =====================================================

    const currentLegalBalls =
      innings.legalBalls;

    // =====================================================
    // LEGAL BALL COUNT AFTER THIS DELIVERY
    // =====================================================
    //
    // Wide / No-ball:
    //
    //     legalBalls stays same
    //
    // Normal delivery:
    //
    //     legalBalls + 1
    //
    // =====================================================

    const newLegalBalls =
      isLegalBall
        ? currentLegalBalls + 1
        : currentLegalBalls;

    // =====================================================
    // IS THIS THE LAST BALL OF THE OVER?
    // =====================================================
    //
    // Every 6 legal deliveries completes an over.
    //
    // 6
    // 12
    // 18
    // 24
    // ...
    //
    // =====================================================

    const overCompleted =
      isLegalBall &&
      newLegalBalls > 0 &&
      newLegalBalls % 6 === 0;

    // =====================================================
    // DEBUG
    // =====================================================

    console.log(
      "========== SENDING BALL =========="
    );

    console.log({
      matchId,
      inningsId: innings.id,
      inningsNumber:
        innings.inningsNumber,

      strikerId,
      nonStrikerId,
      bowlerId,

      runsOffBat,
      extraRuns,
      totalRuns,

      extraType,

      isWide,
      isNoBall,
      isLegalBall,

      currentLegalBalls,
      newLegalBalls,
      overCompleted,
    });

    console.log(
      "CURRENT TOTAL RUNS:",
      innings.totalRuns
    );

    console.log(
      "=================================="
    );

    // =====================================================
    // SAVE BALL TO API
    // =====================================================

    const res =
      await fetch(
        `/api/matches/${matchId}/cricket/innings/${innings.id}/balls`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            strikerId:
              Number(strikerId),

            nonStrikerId:
              Number(nonStrikerId),

            bowlerId:
              Number(bowlerId),

            runsOffBat,

            extraRuns,

            totalRuns,

            extraType,

            isLegalDelivery:
              isLegalBall,

            isWicket: false,

            dismissalType:
              null,

            dismissedPlayerId:
              null,

            fielderId:
              null,
          }),
        }
      );

    // =====================================================
    // READ RESPONSE SAFELY
    // =====================================================

    const responseText =
      await res.text();

    let data:
      | BallResponse
      | {
          error?: string;
        } = {};

    try {
      data = responseText
        ? JSON.parse(responseText)
        : {};
    } catch {
      console.error(
        "BALL API INVALID RESPONSE:",
        responseText
      );

      throw new Error(
        "Server returned an invalid response."
      );
    }

    // =====================================================
    // DEBUG RESPONSE
    // =====================================================

    console.log(
      "========== BALL API RESPONSE =========="
    );

    console.log(
      "HTTP STATUS:",
      res.status
    );

    console.log(
      "BALL RESPONSE:",
      data
    );

    console.log(
      "======================================="
    );

    // =====================================================
    // API ERROR
    // =====================================================

    if (!res.ok) {
      // -----------------------------------------------
      // MATCH COMPLETED
      // -----------------------------------------------

      if (
        "matchCompleted" in data &&
        data.matchCompleted
      ) {
        await loadMatch();

        handleCompletedInnings(
          data as BallResponse
        );

        return;
      }

      // -----------------------------------------------
      // OTHER ERROR
      // -----------------------------------------------

      throw new Error(
        "error" in data
          ? data.error ||
              "Failed to save ball."
          : "Failed to save ball."
      );
    }

    // =====================================================
    // AUTOMATIC INNINGS SWITCH
    // =====================================================

    if (
      "inningsCompleted" in data &&
      data.inningsCompleted &&
      "nextInnings" in data &&
      data.nextInnings
    ) {
      handleCompletedInnings(
        data as BallResponse
      );

      return;
    }

    // =====================================================
    // MATCH COMPLETED
    // =====================================================

    if (
      "matchCompleted" in data &&
      data.matchCompleted
    ) {
      handleCompletedInnings(
        data as BallResponse
      );

      return;
    }

    // =====================================================
    // CALCULATE NEXT BATTERS
    // =====================================================

    let nextStriker =
      strikerId;

    let nextNonStriker =
      nonStrikerId;

    // =====================================================
    // NORMAL BALL STRIKE ROTATION
    // =====================================================
    //
    // Odd runs:
    //
    // 1 -> swap
    // 3 -> swap
    // 5 -> swap
    //
    // Even runs:
    //
    // 0 -> no swap
    // 2 -> no swap
    // 4 -> no swap
    // 6 -> no swap
    //
    // This happens only on legal deliveries.
    //
    // =====================================================

    if (
      isLegalBall &&
      runs % 2 === 1
    ) {
      [
        nextStriker,
        nextNonStriker,
      ] = [
        nextNonStriker,
        nextStriker,
      ];
    }

    // =====================================================
    // END OF OVER STRIKE ROTATION
    // =====================================================
    //
    // This is the important part.
    //
    // At the end of every over, the two batters
    // change ends.
    //
    // Example:
    //
    // BEFORE LAST BALL
    //
    // A = striker
    // B = non-striker
    //
    // -----------------------------------------------------
    //
    // LAST BALL = 1 RUN
    //
    // Normal odd-run swap:
    //
    // B = striker
    // A = non-striker
    //
    // End-of-over swap:
    //
    // A = striker
    // B = non-striker
    //
    // Therefore A remains striker next over.
    //
    // -----------------------------------------------------
    //
    // LAST BALL = 4 RUNS
    //
    // Normal swap:
    //
    // A = striker
    // B = non-striker
    //
    // End-of-over swap:
    //
    // B = striker
    // A = non-striker
    //
    // Therefore B becomes striker next over.
    //
    // -----------------------------------------------------
    //
    // LAST BALL = 6 RUNS
    //
    // Same as 4:
    //
    // B becomes striker next over.
    //
    // =====================================================

    if (overCompleted) {
      [
        nextStriker,
        nextNonStriker,
      ] = [
        nextNonStriker,
        nextStriker,
      ];
    }

    // =====================================================
    // DEBUG STRIKE RESULT
    // =====================================================

    console.log(
      "========== STRIKE UPDATE =========="
    );

    console.log({
      previousStriker:
        strikerId,

      previousNonStriker:
        nonStrikerId,

      runs,

      isLegalBall,

      currentLegalBalls,

      newLegalBalls,

      overCompleted,

      nextStriker,

      nextNonStriker,
    });

    console.log(
      "==================================="
    );

    // =====================================================
    // UPDATE LOCAL UI
    // =====================================================

    setStrikerId(
      nextStriker
    );

    setNonStrikerId(
      nextNonStriker
    );

    // =====================================================
    // SAVE ACTIVE PLAYERS
    // =====================================================

    saveActivePlayers(
      nextStriker,
      nextNonStriker,
      bowlerId
    );

    // =====================================================
    // RELOAD MATCH
    // =====================================================

    await loadMatch();

    // =====================================================
    // SUCCESS MESSAGE
    // =====================================================

    if (overCompleted) {
      toast.success(
        `Over completed • ${
          runs === 0
            ? "Dot ball"
            : `${runs} run${
                runs !== 1
                  ? "s"
                  : ""
              }`
        }`
      );
    } else {
      toast.success(
        runs === 0
          ? "Dot ball"
          : `${runs} run${
              runs !== 1
                ? "s"
                : ""
            }`
      );
    }
  } catch (error) {
    console.error(
      "ADD BALL ERROR:",
      error
    );

    toast.error(
      error instanceof Error
        ? error.message
        : "Failed to save ball."
    );
  } finally {
    setSaving(false);
  }
}
  /*
   * =====================================================
   * WICKET
   * =====================================================
   */

  async function addWicket() {
    if (!innings) {
      return;
    }

    if (!strikerId) {
      toast.error(
        "Select striker."
      );

      return;
    }

    if (!nonStrikerId) {
      toast.error(
        "Select non-striker."
      );

      return;
    }

    if (!bowlerId) {
      toast.error(
        "Select bowler."
      );

      return;
    }

    if (!dismissalType) {
      toast.error(
        "Select dismissal type."
      );

      return;
    }

    if (!dismissedPlayerId) {
      toast.error(
        "Select dismissed player."
      );

      return;
    }

    if (
      (
        dismissalType ===
          "CAUGHT" ||
        dismissalType ===
          "RUN_OUT" ||
        dismissalType ===
          "STUMPED"
      ) &&
      !fielderId
    ) {
      toast.error(
        "Select fielder."
      );

      return;
    }

    try {
      setSaving(true);

      const dismissed =
        dismissedPlayerId;

      const res =
        await fetch(
          `/api/matches/${matchId}/cricket/innings/${innings.id}/balls`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              strikerId:
                Number(
                  strikerId
                ),

              nonStrikerId:
                Number(
                  nonStrikerId
                ),

              bowlerId:
                Number(
                  bowlerId
                ),

              runsOffBat: 0,

              extraRuns: 0,

              totalRuns: 0,

              extraType: "NONE",

              isLegalDelivery:
                true,

              isWicket:
                true,

              dismissalType,

              dismissedPlayerId:
                Number(
                  dismissedPlayerId
                ),

              fielderId:
                fielderId
                  ? Number(
                      fielderId
                    )
                  : null,
            }),
          }
        );

      const data =
        (await res.json()) as
          | BallResponse
          | {
              error?: string;
            };

      if (!res.ok) {
        throw new Error(
          "error" in data
            ? data.error ||
                "Failed to save wicket."
            : "Failed to save wicket."
        );
      }

      /*
       * =================================================
       * AUTOMATIC INNINGS SWITCH
       * =================================================
       */

      if (
        "inningsCompleted" in
          data &&
        data.inningsCompleted &&
        "nextInnings" in data &&
        data.nextInnings
      ) {
        handleCompletedInnings(
          data
        );

        return;
      }

      /*
       * =================================================
       * MATCH COMPLETED
       * =================================================
       */

      if (
        "matchCompleted" in
          data &&
        data.matchCompleted
      ) {
        handleCompletedInnings(
          data
        );

        return;
      }

      /*
       * =================================================
       * NORMAL WICKET
       * =================================================
       */

      setShowWicket(false);

      setDismissalType("");

      setDismissedPlayerId("");

      setFielderId("");

      let nextStriker = "";

      let nextNonStriker =
        "";

      if (
        dismissed ===
        strikerId
      ) {
        /*
         * Striker is out.
         *
         * New striker needs to be selected.
         */

        nextStriker = "";

        nextNonStriker =
          nonStrikerId;
      } else {
        /*
         * Non-striker is out.
         */

        nextStriker =
          strikerId;

        nextNonStriker = "";
      }

      setStrikerId(
        nextStriker
      );

      setNonStrikerId(
        nextNonStriker
      );

      setBowlerId(
        bowlerId
      );

      saveActivePlayers(
        nextStriker,
        nextNonStriker,
        bowlerId
      );

      await loadMatch();

      toast.success(
        "Wicket recorded."
      );
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save wicket."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * =====================================================
   * LOADING
   * =====================================================
   */

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <CircleDot
            size={32}
            className="mx-auto mb-3 animate-spin text-blue-600"
          />

          <p className="text-sm font-semibold text-slate-600">
            Loading cricket scoring...
          </p>
        </div>
      </div>
    );
  }

  /*
   * =====================================================
   * NO DATA
   * =====================================================
   */

  if (
    !match ||
    !innings
  ) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <div className="rounded-2xl bg-white p-8 text-center shadow">
          <h1 className="text-xl font-black">
            Match data not found
          </h1>

          <Link
            href="/admin/matches"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white"
          >
            Back to Matches
          </Link>
        </div>
      </div>
    );
  }

  /*
   * =====================================================
   * UI
   * =====================================================
   */

  return (
    <div className="h-screen overflow-hidden bg-slate-100 text-slate-900">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="h-[64px] border-b bg-white">
        <div className="mx-auto flex h-full max-w-[1550px] items-center justify-between px-5">

          <div className="flex items-center gap-3">

            <Link
              href="/admin/matches"
              className="rounded-lg p-2 transition hover:bg-slate-100"
            >
              <ArrowLeft size={19} />
            </Link>

            <div>

              <div className="flex items-center gap-2">

                <span className="text-sm font-black">
                  Sports Carnival
                </span>

                <span className="text-slate-300">
                  /
                </span>

                <span className="text-sm font-bold text-slate-700">
                  {match.team1.name}
                </span>

                <span className="text-xs text-slate-400">
                  vs
                </span>

                <span className="text-sm font-bold text-slate-700">
                  {match.team2.name}
                </span>

              </div>

              <p className="text-[11px] text-slate-400">
                {match.tournament.name}
                {" · "}
                {match.tournament.season}
              </p>

            </div>

          </div>

          <div className="flex items-center gap-3">
             {/* UNDO LAST BALL */}
  <button
    type="button"
    onClick={handleUndoLast}
    disabled={
      undoing ||
      saving ||
      !innings.ballEvents?.length
    }
    title={
      innings.ballEvents?.length
        ? "Undo last ball"
        : "No ball to undo"
    }
    className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
  >
    <RotateCcw
      size={14}
      className={undoing ? "animate-spin" : ""}
    />

    {undoing ? "UNDOING..." : "UNDO LAST"}
  </button>

  <button
    type="button"
    disabled={saving}
    onClick={
      endInningsManually
    }
    className="rounded-lg bg-red-600 px-3 py-2 text-[11px] font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {saving
      ? "ENDING..."
      : "END INNINGS"}
  </button>

  <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-black text-red-600">
    🔴 LIVE
  </span>

  <span className="text-xs font-semibold text-slate-500">
    {match.venue}
  </span>

</div>

        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="mx-auto h-[calc(100vh-64px)] max-w-[1550px] px-4 py-3">

        {/* =====================================================
            INNINGS INDICATOR
        ===================================================== */}

        <div className="mb-2 flex items-center justify-between">

          <div className="flex items-center gap-2">

            <span className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-black text-blue-700">
              INNINGS{" "}
              {innings.inningsNumber}
            </span>

            <span className="text-[10px] font-bold text-slate-400">
              {innings.battingTeam.name}
              {" batting"}
            </span>

          </div>

          <span className="text-[10px] font-bold text-slate-400">
            {match.overs} overs
          </span>

        </div>

        {/* =====================================================
            SCORE HEADER
        ===================================================== */}

        <section className="mb-3 h-[92px] rounded-2xl border bg-white px-6 shadow-sm">

          <div className="grid h-full grid-cols-[1fr_auto_1fr] items-center">

            <div>

              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Innings{" "}
                {innings.inningsNumber}
              </p>

              <h1 className="text-xl font-black">
                {innings.battingTeam.name}
              </h1>

              <p className="text-xs font-semibold text-slate-400">
                Batting
              </p>

            </div>

            <div className="px-12 text-center">

              <div className="text-4xl font-black tracking-tight">
                {innings.totalRuns}/
                {innings.totalWickets}
              </div>

              <p className="text-xs font-bold text-slate-500">
                {overs} overs
              </p>
{innings.inningsNumber === 2 &&
  chaseMessage && (
    <p className="mt-1 text-sm font-black text-red-600">
      {chaseMessage}
    </p>
  )}
            </div>

            <div className="flex justify-end gap-8 text-right">

              <div>

                <p className="text-[10px] font-black text-slate-400">
                  CRR
                </p>

                <p className="text-lg font-black">
                  {currentRate}
                </p>

              </div>

              {target !== null && (
                <>
                  <div>

                    <p className="text-[10px] font-black text-slate-400">
                      TARGET
                    </p>

                    <p className="text-lg font-black">
                      {target}
                    </p>

                  </div>

                  <div>

                    <p className="text-[10px] font-black text-slate-400">
                      RRR
                    </p>

                    <p className="text-lg font-black">
                      {requiredRate}
                    </p>

                  </div>
                </>
              )}

            </div>

          </div>

        </section>

        {/* =====================================================
            TWO COLUMN
        ===================================================== */}

        <div className="grid h-[calc(100%-105px)] min-h-0 grid-cols-[330px_minmax(0,1fr)] gap-3">

          {/* =====================================================
              LEFT
          ===================================================== */}

          <section className="min-h-0 overflow-y-auto overflow-x-hidden pr-1">
<div className="flex min-w-0 flex-col gap-3">
            {/* =================================================
                PLAYERS
            ================================================= */}

            <section className="rounded-2xl border bg-white p-4 shadow-sm">

              <div className="mb-3 flex items-center justify-between">

                <h2 className="text-sm font-black">
                  PLAYERS
                </h2>

                <span className="text-[10px] font-bold text-slate-400">
                  {battingPlayers.length} batting
                </span>

              </div>

              {/* STRIKER */}

              <div className="mb-3">

                <label className="mb-1 flex items-center gap-1 text-[10px] font-black text-blue-600">
                  ⭐ STRIKER
                </label>

                <select
                  value={
                    strikerId
                  }
                  onChange={(e) => {
                    const value =
                      e.target.value;

                    setStrikerId(
                      value
                    );

                    saveActivePlayers(
                      value,
                      nonStrikerId,
                      bowlerId
                    );
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-blue-500"
                >

                  <option value="">
                    Select striker
                  </option>

                  {availableBatters.map(
                    (player) => (
                      <option
                        key={
                          player.id
                        }
                        value={
                          player.id
                        }
                        disabled={
                          String(
                            player.id
                          ) ===
                          nonStrikerId
                        }
                      >
                        {player.name}
                        {player.jerseyNo
                          ? ` #${player.jerseyNo}`
                          : ""}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* NON STRIKER */}

              <div className="mb-3">

                <label className="mb-1 block text-[10px] font-black text-slate-500">
                  NON-STRIKER
                </label>

                <select
                  value={
                    nonStrikerId
                  }
                  onChange={(e) => {
                    const value =
                      e.target.value;

                    setNonStrikerId(
                      value
                    );

                    saveActivePlayers(
                      strikerId,
                      value,
                      bowlerId
                    );
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-blue-500"
                >

                  <option value="">
                    Select non-striker
                  </option>

                  {availableBatters.map(
                    (player) => (
                      <option
                        key={
                          player.id
                        }
                        value={
                          player.id
                        }
                        disabled={
                          String(
                            player.id
                          ) ===
                          strikerId
                        }
                      >
                        {player.name}
                        {player.jerseyNo
                          ? ` #${player.jerseyNo}`
                          : ""}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* BOWLER */}

              <div>

                <label className="mb-1 block text-[10px] font-black text-slate-500">
                  🏏 BOWLER
                </label>

                <select
                  value={
                    bowlerId
                  }
                  onChange={(e) => {
                    const value =
                      e.target.value;

                    setBowlerId(
                      value
                    );

                    saveActivePlayers(
                      strikerId,
                      nonStrikerId,
                      value
                    );
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-blue-500"
                >

                  <option value="">
                    Select bowler
                  </option>

                  {bowlingPlayers.map(
                    (player) => (
                      <option
                        key={
                          player.id
                        }
                        value={
                          player.id
                        }
                      >
                        {player.name}
                        {player.jerseyNo
                          ? ` #${player.jerseyNo}`
                          : ""}
                      </option>
                    )
                  )}

                </select>

              </div>

            </section>

            {/* =================================================
                RUNS
            ================================================= */}

            <section className="rounded-2xl border bg-white p-4 shadow-sm">

              <h2 className="mb-3 text-sm font-black">
                RUNS
              </h2>

              <div className="grid grid-cols-3 gap-2">

                {[0, 1, 2, 3, 4, 6].map(
                  (run) => (
                    <button
                      key={run}
                      disabled={
                        saving
                      }
                      onClick={() =>
                        addBall(
                          run
                        )
                      }
                      className={`h-11 rounded-xl text-sm font-black transition ${
                        run === 4
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : run === 6
                            ? "bg-purple-600 text-white hover:bg-purple-700"
                            : "bg-slate-100 hover:bg-slate-200"
                      } disabled:opacity-40`}
                    >
                      {run}
                    </button>
                  )
                )}

              </div>

            </section>

            {/* =================================================
                EXTRAS
            ================================================= */}

{/* =================================================
    EXTRAS
================================================= */}

<section className="rounded-2xl border bg-white p-4 shadow-sm">

  <h2 className="mb-3 text-sm font-black">
    EXTRAS
  </h2>

  <div className="grid grid-cols-4 gap-2">

    {extras.map((extra) => {

      const isNoBall = extra.value === "NO_BALL";

      return (
        <button
          key={extra.value}
          disabled={saving}
          onClick={() => {

            // -----------------------------------------
            // NO BALL
            // -----------------------------------------

            if (isNoBall) {
              setNoBallActive(true);

              toast.info(
                "No Ball selected. Now select bat runs."
              );

              return;
            }

            // -----------------------------------------
            // OTHER EXTRAS
            // -----------------------------------------

            addBall(
              1,
              extra.value
            );
          }}
          className={`h-10 rounded-xl border text-xs font-black transition ${
            isNoBall && noBallActive
              ? "border-red-500 bg-red-100 text-red-700"
              : "border-slate-200 bg-slate-50 hover:bg-slate-100"
          } disabled:opacity-40`}
        >
          {extra.label}
        </button>
      );
    })}

  </div>

</section>
{/* =================================================
    NO BALL RUN SELECTION
================================================= */}

{noBallActive && (
  <section className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">

    <div className="mb-3 flex items-center justify-between">

      <div>
        <h2 className="text-sm font-black text-red-700">
          NO BALL
        </h2>

        <p className="text-xs text-red-500">
          Select runs scored off the bat
        </p>
      </div>

      <button
        type="button"
        onClick={() => setNoBallActive(false)}
        className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100"
      >
        Cancel
      </button>

    </div>

    <div className="grid grid-cols-6 gap-2">

      {[0, 1, 2, 3, 4, 6].map(
        (batRuns) => (

          <button
            key={batRuns}
            type="button"
            disabled={saving}
            onClick={() => {

              /*
               * NO BALL:
               *
               * 1 run = no-ball extra
               * + selected bat runs
               *
               * NB + 0 = 1
               * NB + 1 = 2
               * NB + 2 = 3
               * NB + 3 = 4
               * NB + 4 = 5
               * NB + 6 = 7
               */

              addBall(
                batRuns,
                "NO_BALL"
              );

              setNoBallActive(false);
            }}
            className="h-11 rounded-xl border border-red-200 bg-white text-sm font-black text-red-700 hover:bg-red-100 disabled:opacity-40"
          >
            NB + {batRuns}
          </button>

        )
      )}

    </div>

  </section>
)}

            {/* =================================================
                WICKET
            ================================================= */}

            <section className="w-full min-w-0 rounded-2xl border border-red-200 bg-red-50 p-3">

              {!showWicket ? (
                <button
                  disabled={
                    saving
                  }
                  onClick={() =>
                    setShowWicket(
                      true
                    )
                  }
                  className="h-11 w-full rounded-xl bg-red-600 text-sm font-black text-white hover:bg-red-700 disabled:opacity-40"
                >
                  🟥 WICKET
                </button>
              ) : (
                <>

                  <div className="mb-2 flex items-center justify-between">

                    <h2 className="text-sm font-black text-red-700">
                      RECORD WICKET
                    </h2>

                    <button
                      onClick={() => {
                        setShowWicket(
                          false
                        );

                        setDismissalType(
                          ""
                        );

                        setDismissedPlayerId(
                          ""
                        );

                        setFielderId(
                          ""
                        );
                      }}
                      className="text-[10px] font-black text-slate-500"
                    >
                      CANCEL
                    </button>

                  </div>

                  <div className="grid grid-cols-1 gap-2">

                    <select
                      value={
                        dismissedPlayerId
                      }
                      onChange={(e) =>
                        setDismissedPlayerId(
                          e.target.value
                        )
                      }
                      className="h-10 rounded-xl border bg-white px-2 text-xs font-bold"
                    >

                      <option value="">
                        Dismissed player
                      </option>

                      {[
                        striker,
                        nonStriker,
                      ]
                        .filter(
                          Boolean
                        )
                        .map(
                          (player) => (
                            <option
                              key={
                                player!.id
                              }
                              value={
                                player!.id
                              }
                            >
                              {
                                player!
                                  .name
                              }
                            </option>
                          )
                        )}

                    </select>

                    <select
                      value={
                        dismissalType
                      }
                      onChange={(e) =>
                        setDismissalType(
                          e.target.value
                        )
                      }
                      className="h-10 rounded-xl border bg-white px-2 text-xs font-bold"
                    >

                      <option value="">
                        Dismissal type
                      </option>

                      {dismissalTypes.map(
                        (type) => (
                          <option
                            key={type}
                            value={type}
                          >
                            {type.replace(
                              "_",
                              " "
                            )}
                          </option>
                        )
                      )}

                    </select>

                    <select
                      value={
                        fielderId
                      }
                      onChange={(e) =>
                        setFielderId(
                          e.target.value
                        )
                      }
                      className="h-10 rounded-xl border bg-white px-2 text-xs font-bold"
                    >

                      <option value="">
                        Fielder / Catcher
                      </option>

                      {bowlingPlayers
                        .filter(
                          (player) =>
                            player.id !==
                            Number(
                              bowlerId
                            )
                        )
                        .map(
                          (player) => (
                            <option
                              key={
                                player.id
                              }
                              value={
                                player.id
                              }
                            >
                              {
                                player.name
                              }
                            </option>
                          )
                        )}

                    </select>

                  </div>

                  <button
                    disabled={
                      saving
                    }
                    onClick={
                      addWicket
                    }
                    className="mt-2 h-10 w-full rounded-xl bg-red-600 text-xs font-black text-white hover:bg-red-700 disabled:opacity-40"
                  >
                    {saving
                      ? "SAVING..."
                      : "CONFIRM WICKET"}
                  </button>

                </>
              )}

            </section>
            </div>
 </section>

          {/* =====================================================
              RIGHT
          ===================================================== */}

          <section className="grid min-h-0 grid-cols-[1fr_340px] gap-3">

            {/* =================================================
                SCORECARDS
            ================================================= */}

            <section className="min-h-0 rounded-2xl border bg-white p-4 shadow-sm">

              {/* BATTING */}

              <div className="mb-5">

                <div className="mb-3 flex items-center gap-2">

                  <Trophy
                    size={17}
                    className="text-yellow-500"
                  />

                  <h2 className="text-sm font-black">
                    BATTING SCORECARD
                  </h2>

                </div>

                <div className="overflow-hidden rounded-xl border">

                  <div className="grid grid-cols-[1fr_55px_65px_65px_90px] bg-slate-50 px-3 py-2 text-[10px] font-black text-slate-400">

                    <span>
                      BATTER
                    </span>

                    <span className="text-right">
                      R
                    </span>

                    <span className="text-right">
                      BALLS
                    </span>
                      <span className="text-right">
    SR
  </span>

                    <span className="text-right">
                      4s / 6s
                    </span>

                  </div>

                  <div>

                    {battingScorecard.map(
                      (item) => (
                        <div
                          key={
                            item.player
                              .id
                          }
                          className="border-t px-3 py-2"
                        >

                          <div className="grid grid-cols-[1fr_55px_65px_65px_90px] items-center">

                            <div>

                              <p
                                className={`text-sm font-black ${
                                  item.isActive
                                    ? "text-blue-600"
                                    : ""
                                }`}
                              >
                                {
                                  item
                                    .player
                                    .name
                                }

                                {item.isActive &&
                                  "*"}
                              </p>

                              {item.dismissal && (
                                <p className="mt-0.5 text-[10px] font-bold text-red-600">
                                  {getDismissalText(
                                    item.dismissal
                                  )}
                                </p>
                              )}

                            </div>

                            <span className="text-right text-sm font-black">
                              {
                                item.runs
                              }
                            </span>

                            <span className="text-right text-xs font-semibold text-slate-500">
                              {
                                item.balls
                              }
                            </span>

                            <span className="text-right text-xs font-black text-slate-700">
  {item.strikeRate.toFixed(2)}
</span>

                            <span className="text-right text-xs font-bold text-slate-500">
                              {
                                item.fours
                              }x4{" "}
                              {
                                item.sixes
                              }x6
                            </span>

                          </div>

                        </div>
                      )
                    )}

                    {battingScorecard.length ===
                      0 && (
                      <p className="p-5 text-center text-xs text-slate-400">
                        No batting data yet
                      </p>
                    )}

                  </div>

                </div>

              </div>

              {/* BOWLING */}

              <div>

                <h2 className="mb-3 text-sm font-black">
                  BOWLING
                </h2>

                <div className="overflow-hidden rounded-xl border">

                  <div className="grid grid-cols-[1fr_70px_70px_60px_70px] bg-slate-50 px-3 py-2 text-[10px] font-black text-slate-400">

                    <span>
                      BOWLER
                    </span>

                    <span className="text-right">
                      OVERS
                    </span>

                    <span className="text-right">
                      RUNS
                    </span>

                    <span className="text-right">
                      W
                    </span>

  <span className="text-right">
    ECON
  </span>

                  </div>

                  {bowlingScorecard.map(
                    (item) => (
                      <div
                        key={
                          item.player
                            .id
                        }
                        className="grid grid-cols-[1fr_70px_70px_60px_70px] border-t px-3 py-2"
                      >

                        <span className="text-sm font-black">
                          {
                            item
                              .player
                              .name
                          }
                        </span>

                        <span className="text-right text-xs font-bold">

                          {Math.floor(
                            item.legalBalls /
                              6
                          )}
                          .
                          {item.legalBalls %
                            6}

                        </span>

                        <span className="text-right text-xs font-bold">
                          {
                            item.runs
                          }
                        </span>

                        <span className="text-right text-sm font-black">
                          {
                            item.wickets
                          }
                        </span>
                         <span className="text-right text-xs font-bold text-blue-600">
        {item.economy.toFixed(2)}
      </span>

                      </div>
                    )
                  )}

                  {bowlingScorecard.length ===
                    0 && (
                    <p className="p-5 text-center text-xs text-slate-400">
                      No bowling data yet
                    </p>
                  )}

                </div>

              </div>

            </section>

            {/* =================================================
                OVER PANEL
            ================================================= */}

            <aside className="flex min-h-0 flex-col gap-3">

              {/* CURRENT OVER */}

              <section className="rounded-2xl border bg-white p-4 shadow-sm">

                <div className="mb-3 flex items-center justify-between">

                  <div>

                    <h2 className="text-sm font-black">
                      CURRENT OVER
                    </h2>

                    <p className="mt-0.5 text-[10px] font-bold text-slate-400">
                      Over{" "}
                      {currentOverNumber +
                        1}
                    </p>

                  </div>

                  <div className="text-right">

                    <p className="text-sm font-black text-slate-800">
                      {
                        currentOverData.totalRuns
                      }{" "}
                      runs
                    </p>

                    <p className="text-[10px] font-bold text-slate-400">
                      {
                        currentOverData.legalBalls
                      }{" "}
                      legal balls
                    </p>

                  </div>

                </div>

                {currentOver.length ===
                0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-5 text-center">

                    <p className="text-xs font-bold text-slate-400">
                      No balls yet
                    </p>

                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">

                    {currentOver.map(
                      (ball) => (
                        <div
                          key={
                            ball.id
                          }
                          title={`${ball.isLegalDelivery ? "Legal delivery" : "Extra"} • ${ball.totalRuns} run${ball.totalRuns !== 1 ? "s" : ""}`}
                          className={`flex h-9 min-w-9 items-center justify-center rounded-full border px-2 text-[11px] font-black ${getBallClass(
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
                )}

              </section>

              {/* =================================================
                  PREVIOUS OVERS
              ================================================= */}

              <section className="min-h-0 flex-1 overflow-hidden rounded-2xl border bg-white p-4 shadow-sm">

                <div className="mb-3 flex items-center justify-between">

                  <div>

                    <h2 className="text-sm font-black">
                      PREVIOUS OVERS
                    </h2>

                    <p className="text-[10px] font-bold text-slate-400">
                      Completed overs
                    </p>

                  </div>

                  <RotateCcw
                    size={14}
                    className="text-slate-400"
                  />

                </div>

                <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">

                  {previousOvers.length ===
                  0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center">

                      <p className="text-xs font-bold text-slate-400">
                        No previous overs
                      </p>

                    </div>
                  ) : (
                    previousOvers.map(
                      (over) => (
                        <div
                          key={
                            over.overNumber
                          }
                          className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                        >

                          {/* OVER HEADER */}

                          <div className="mb-3 flex items-center justify-between">

                            <div>

                              <p className="text-xs font-black text-slate-800">
                                Over{" "}
                                {over.overNumber +
                                  1}
                              </p>

                              <p className="text-[10px] font-bold text-slate-400">
                                {
                                  over.legalBalls
                                }{" "}
                                legal balls
                              </p>

                            </div>

                            <div className="text-right">

                              <p className="text-sm font-black text-slate-800">
                                {
                                  over.totalRuns
                                }{" "}
                                runs
                              </p>

                            </div>

                          </div>

                          {/* BALLS */}

                          <div className="flex flex-wrap gap-2">

                            {over.balls.map(
                              (ball) => (
                                <div
                                  key={
                                    ball.id
                                  }
                                  title={`${ball.isLegalDelivery ? "Legal delivery" : "Extra"} • ${ball.totalRuns} run${ball.totalRuns !== 1 ? "s" : ""}`}
                                  className={`flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-[10px] font-black ${getBallClass(
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
                    )
                  )}

                </div>

              </section>

              {/* =================================================
                  CURRENT PLAYERS
              ================================================= */}

              <section className="rounded-2xl border bg-white p-4 shadow-sm">

                <h2 className="mb-3 text-sm font-black">
                  CURRENT
                </h2>

                <div className="space-y-2">

                  <div className="flex items-center justify-between rounded-xl bg-blue-50 px-3 py-2">

                    <span className="text-[10px] font-black text-blue-600">
                      STRIKER
                    </span>

                    <span className="text-xs font-black">
                      {
                        striker?.name ??
                        "Not selected"
                      }
                    </span>

                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">

                    <span className="text-[10px] font-black text-slate-500">
                      NON-STRIKER
                    </span>

                    <span className="text-xs font-black">
                      {
                        nonStriker?.name ??
                        "Not selected"
                      }
                    </span>

                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">

                    <span className="text-[10px] font-black text-slate-500">
                      BOWLER
                    </span>

                    <span className="text-xs font-black">
                      {
                        bowler?.name ??
                        "Not selected"
                      }
                    </span>

                  </div>

                </div>

              </section>

            </aside>

          </section>

        </div>

      </main>

    </div>
  );
}