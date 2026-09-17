"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Radio,
  Trophy,
  Activity,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";

import ThrowballScoring from "@/components/scoring/ThrowballScoring";
/* =========================================================
   TYPES
========================================================= */

interface CricketPlayer {
  id: number;
  name: string;
  jerseyNumber: number;
  position: string;
}

interface Team {
  id: number;
  name: string;
  playerList: CricketPlayer[];
}

interface Game {
  id: number;
  name: string;
}

interface MatchScore {
  team1Score: number;
  team2Score: number;
  period: number;
  clock: string;
  innings: number;

  // IMPORTANT
  maxOvers: number;

  overs: number;
  balls: number;
  wickets: number;

  strikerId?: number | null;
  nonStrikerId?: number | null;
  bowlerId?: number | null;

  status: string;
}

interface MatchEvent {
  id: number;
  eventType: string;
  value: number;
  teamId?: number | null;
  playerId?: number | null;
  period: number;
  clock?: string | null;
  createdAt: string;
}

interface CricketData {
  striker: CricketPlayer | null;
  nonStriker: CricketPlayer | null;
  bowler: CricketPlayer | null;
}

interface Match {
  id: number;
  status: string;
  venue: string;
  matchDate: string;
  game: Game;
  team1: Team;
  team2: Team;
  score: MatchScore | null;
  events: MatchEvent[];
  cricket?: CricketData;
}

interface BattingStat {
  id: number;
  playerId: number;
  innings: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  player: {
    id: number;
    name: string;
    jerseyNumber: number;
  };
}

interface BowlingStat {
  id: number;
  playerId: number;
  innings: number;
  overs: number;
  balls: number;
  runs: number;
  wickets: number;
  wides: number;
  noBalls: number;
  player: {
    id: number;
    name: string;
    jerseyNumber: number;
  };
}

interface CricketScorecardData {
  batting: BattingStat[];
  bowling: BowlingStat[];
}

type TabType = "LIVE" | "SCORECARD" | "EVENTS";

/* =========================================================
   MAIN PAGE
========================================================= */

export default function LiveMatchPage() {
  const params = useParams();
  const router = useRouter();

  const matchId = params.id as string;

  const [match, setMatch] = useState<Match | null>(null);

  const [scorecard, setScorecard] =
    useState<CricketScorecardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [updating, setUpdating] =
    useState(false);

  const [activeTab, setActiveTab] =
    useState<TabType>("LIVE");

  /* =========================================================
     LOAD MATCH
  ========================================================= */

  useEffect(() => {
    if (!matchId) return;

    loadMatch();
    loadScorecard();

    const interval = setInterval(() => {
      loadMatch(false);
      loadScorecard();
    }, 3000);

    return () => clearInterval(interval);
  }, [matchId]);

  async function loadMatch(
    showLoading = true
  ): Promise<void> {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const res = await fetch(
        `/api/matches/${matchId}/live`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        }
      );

      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({}));

        throw new Error(
          data.error ||
            "Failed to load live match."
        );
      }

      const data = await res.json();

      setMatch(data);
    } catch (error) {
      console.error(
        "LOAD MATCH ERROR:",
        error
      );

      if (showLoading) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to load live match."
        );
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  /* =========================================================
     LOAD SCORECARD
  ========================================================= */

  async function loadScorecard(): Promise<void> {
    if (!matchId) return;

    try {
      const res = await fetch(
        `/api/matches/${matchId}/live/cricket/scorecard`,
        {
          cache: "no-store",
        }
      );

      if (!res.ok) {
        return;
      }

      const data = await res.json();

      setScorecard({
        batting: data.batting || [],
        bowling: data.bowling || [],
      });
    } catch (error) {
      console.error(
        "SCORECARD ERROR:",
        error
      );
    }
  }

  /* =========================================================
     ADD EVENT
  ========================================================= */

  async function addEvent(
  teamId: number,
  eventType: string,
  value: number
): Promise<void> {
  if (!match) return;

  try {
    setUpdating(true);

    const gameName =
      match.game.name.toLowerCase();

    let apiUrl = "";

    if (gameName.includes("cricket")) {
      apiUrl =
        `/api/matches/${matchId}/live/event`;
    } else if (
      gameName.includes("football")
    ) {
      apiUrl =
        `/api/matches/${matchId}/live/football`;
    } else if (
      gameName.includes("throwball")
    ) {
      apiUrl =
        `/api/matches/${matchId}/live/throwball`;
    } else if (
      gameName.includes("handball")
    ) {
      apiUrl =
        `/api/matches/${matchId}/live/handball`;
    } else {
      throw new Error(
        "Unsupported sport."
      );
    }

    const res = await fetch(apiUrl, {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        teamId,
        eventType,
        value,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error ||
          "Failed to update score."
      );
    }

    // Refresh match
    await loadMatch(false);

    // Refresh scorecard
    await loadScorecard();

    // =====================================================
    // IMPORTANT MESSAGE PRIORITY
    // =====================================================
    //
    // inningsCompleted MUST be checked first.
    //
    // On the last ball of an over:
    //
    // overCompleted = true
    //
    // If it is also the max over:
    //
    // inningsCompleted = true
    //
    // Therefore we must show innings completion,
    // not "Select the next bowler".
    // =====================================================

    if (data.inningsCompleted) {
      toast.success(
        data.message ||
          "Innings completed."
      );
    } else if (data.overCompleted) {
      toast.success(
        "Over completed. Select the next bowler."
      );
    } else if (eventType === "WICKET") {
      toast.success(
        "Wicket! Select a new batsman."
      );
    }

  } catch (error) {
    console.error(
      "ADD EVENT ERROR:",
      error
    );

    toast.error(
      error instanceof Error
        ? error.message
        : "Unable to update score."
    );
  } finally {
    setUpdating(false);
  }
}

  /* =========================================================
     COMPLETE MATCH
  ========================================================= */

  async function completeMatch(): Promise<void> {
    if (!match) return;

    const confirmed = window.confirm(
      "Are you sure you want to complete this match?"
    );

    if (!confirmed) return;

    try {
      setUpdating(true);

      const res = await fetch(
        `/api/matches/${matchId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            status: "COMPLETED",
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Failed to complete match."
        );
      }

      toast.success(
        "Match completed!"
      );

      await loadMatch(false);
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to complete match."
      );
    } finally {
      setUpdating(false);
    }
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

          <p className="mt-3 text-sm text-gray-500">
            Loading live match...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     NOT FOUND
  ========================================================= */

  if (!match) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-xl font-bold">
            Match not found
          </h2>

          <button
            onClick={() =>
              router.push(
                "/admin/live-matches"
              )
            }
            className="mt-4 rounded-lg bg-blue-600 px-5 py-3 text-white"
          >
            Back to Live Matches
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     SPORT
  ========================================================= */

  const gameName =
    match.game.name.toLowerCase();

  const isCricket =
    gameName.includes("cricket");

  const isFootball =
    gameName.includes("football");

  const isThrowball =
    gameName.includes("throwball");

  const isHandball =
    gameName.includes("handball");

  const innings =
    match.score?.innings ?? 1;

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-slate-50">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-white px-3 shadow-sm">
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={() =>
              router.push(
                "/admin/live-matches"
              )
            }
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <ArrowLeft size={19} />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Radio
                size={16}
                className="shrink-0 text-red-600"
              />

              <h1 className="truncate text-base font-bold">
                {match.game.name}
              </h1>
            </div>

            <p className="truncate text-[10px] text-gray-500">
              {match.venue}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold text-red-600 sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-600" />
            LIVE
          </span>

          <button
            onClick={completeMatch}
            disabled={updating}
            className="rounded-lg bg-green-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-green-700 disabled:opacity-50"
          >
            Complete
          </button>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="min-h-0 flex-1 p-2">
        <div className="grid h-full min-h-0 grid-rows-[auto_auto_1fr] gap-2">
          {/* =================================================
              SCOREBOARD
          ================================================= */}

          <section className="shrink-0 rounded-xl border bg-white px-3 py-2.5 shadow-sm">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              {/* TEAM 1 */}

              <div className="text-center">
                <p className="truncate text-xs font-semibold text-gray-500">
                  {match.team1.name}
                </p>

                <p className="text-2xl font-black sm:text-3xl">
                  {match.score?.team1Score ??
                    0}

                  {isCricket &&
                    innings === 1 &&
                    `/${match.score?.wickets ?? 0}`}
                </p>
              </div>

              {/* CENTER */}

              <div className="text-center">
                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                  <Trophy
                    size={16}
                    className="text-orange-500"
                  />
                </div>

                {isCricket ? (
                  <p className="mt-1 text-[10px] font-bold text-gray-500">
                    {match.score?.overs ??
                      0}
                    .
                    {match.score?.balls ??
                      0}{" "}
                    /{" "}
                    {match.score?.maxOvers ??
                      5}{" "}
                    OV
                  </p>
                ) : (
                  <p className="mt-1 text-[10px] font-bold text-gray-400">
                    VS
                  </p>
                )}
              </div>

              {/* TEAM 2 */}

              <div className="text-center">
                <p className="truncate text-xs font-semibold text-gray-500">
                  {match.team2.name}
                </p>

                <p className="text-2xl font-black sm:text-3xl">
                  {match.score?.team2Score ??
                    0}

                  {isCricket &&
                    innings === 2 &&
                    `/${match.score?.wickets ?? 0}`}
                </p>
              </div>
            </div>

            {/* SPORT INFO */}

            <div className="mt-2 flex justify-center gap-2">
              {isCricket && (
                <>
                  <MiniStat
                    label="Innings"
                    value={String(
                      innings
                    )}
                  />

                  <MiniStat
                    label="Overs"
                    value={`${match.score?.overs ?? 0}.${match.score?.balls ?? 0}/${match.score?.maxOvers ?? 5}`}
                  />

                  <MiniStat
                    label="Wickets"
                    value={String(
                      match.score?.wickets ??
                        0
                    )}
                  />
                </>
              )}

              {!isCricket && (
                <MiniStat
                  label="Period"
                  value={String(
                    match.score?.period ??
                      1
                  )}
                />
              )}

              {(isFootball ||
                isHandball) && (
                <MiniStat
                  label="Time"
                  value={
                    match.score?.clock ||
                    "00:00"
                  }
                />
              )}
            </div>
          </section>

          {/* =================================================
              TABS
          ================================================= */}

          <div className="flex shrink-0 items-center rounded-lg border bg-white p-1 shadow-sm">
            <TabButton
              active={
                activeTab === "LIVE"
              }
              onClick={() =>
                setActiveTab("LIVE")
              }
              icon={
                <Activity size={14} />
              }
              label="Live"
            />

            {isCricket && (
              <TabButton
                active={
                  activeTab ===
                  "SCORECARD"
                }
                onClick={() =>
                  setActiveTab(
                    "SCORECARD"
                  )
                }
                icon={
                  <ClipboardList
                    size={14}
                  />
                }
                label="Scorecard"
              />
            )}

            <TabButton
              active={
                activeTab ===
                "EVENTS"
              }
              onClick={() =>
                setActiveTab("EVENTS")
              }
              icon={
                <ClipboardList
                  size={14}
                />
              }
              label="Events"
            />
          </div>

          {/* =================================================
              CONTENT
          ================================================= */}

          <section className="min-h-0 overflow-hidden">
            {/* =================================================
                LIVE
            ================================================= */}

            {activeTab === "LIVE" && (
              <div className="flex h-full min-h-0 flex-col gap-2">
                {isCricket && (
                  <CricketPlayers
                    match={match}
                    onPlayersUpdated={() =>
                      loadMatch(false)
                    }
                  />
                )}

                <div className="min-h-0 flex-1 overflow-hidden">
                  {isCricket && (
                    <CricketControls
                      match={match}
                      updating={updating}
                      addEvent={addEvent}
                    />
                  )}

                  {isFootball && (
                    <FootballControls
                      match={match}
                      updating={updating}
                      addEvent={addEvent}
                    />
                  )}

                  {isThrowball && (
                    <ThrowballControls
                      match={match}
                      updating={updating}
                      addEvent={addEvent}
                    />
                  )}

                  {isHandball && (
                    <HandballControls
                      match={match}
                      updating={updating}
                      addEvent={addEvent}
                    />
                  )}
                </div>
              </div>
            )}

            {/* =================================================
                SCORECARD
            ================================================= */}

            {activeTab ===
              "SCORECARD" &&
              isCricket && (
                <div className="h-full min-h-0">
                  <CricketScorecard
                    scorecard={scorecard}
                    match={match}
                  />
                </div>
              )}

            {/* =================================================
                EVENTS
            ================================================= */}

            {activeTab === "EVENTS" && (
              <RecentEvents
                events={match.events}
              />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   MINI STAT
========================================================= */

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 px-2.5 py-1 text-center">
      <p className="text-[9px] font-medium text-gray-400">
        {label}
      </p>

      <p className="text-[10px] font-bold text-gray-700">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   TAB
========================================================= */

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-bold transition ${
        active
          ? "bg-blue-600 text-white"
          : "text-gray-500 hover:bg-slate-100"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/* =========================================================
   CRICKET PLAYERS
========================================================= */

function CricketPlayers({
  match,
  onPlayersUpdated,
}: {
  match: Match;
  onPlayersUpdated: (showLoading?: boolean) => Promise<void>;
}) {
  const innings = match.score?.innings ?? 1;

  /*
   * =====================================================
   * CURRENT INNINGS TEAMS
   * =====================================================
   */

  const battingTeam =
    innings === 1
      ? match.team1
      : match.team2;

  const bowlingTeam =
    innings === 1
      ? match.team2
      : match.team1;

  /*
   * =====================================================
   * SERVER CURRENT PLAYERS
   * =====================================================
   */

  const serverStriker =
    match.cricket?.striker ?? null;

  const serverNonStriker =
    match.cricket?.nonStriker ?? null;

  const serverBowler =
    match.cricket?.bowler ?? null;

  /*
   * =====================================================
   * LOCAL SELECTIONS
   *
   * These are intentionally independent.
   *
   * Changing striker will NOT reset:
   * - non-striker
   * - bowler
   * =====================================================
   */

  const [strikerId, setStrikerId] =
    useState<number | "">(
      serverStriker?.id ?? ""
    );

  const [nonStrikerId, setNonStrikerId] =
    useState<number | "">(
      serverNonStriker?.id ?? ""
    );

  const [bowlerId, setBowlerId] =
    useState<number | "">(
      serverBowler?.id ?? ""
    );

  const [saving, setSaving] =
    useState(false);

  /*
   * =====================================================
   * REMEMBER WHICH INNINGS WAS LOADED
   * =====================================================
   */

  const [loadedInnings, setLoadedInnings] =
    useState(innings);

  /*
   * =====================================================
   * ONLY RESET PLAYERS WHEN INNINGS CHANGES
   *
   * DO NOT reset them every time the page refreshes.
   * =====================================================
   */

  useEffect(() => {
    if (loadedInnings !== innings) {
      setStrikerId("");
      setNonStrikerId("");
      setBowlerId("");

      setLoadedInnings(innings);
    }
  }, [
    innings,
    loadedInnings,
  ]);

  /*
   * =====================================================
   * IF SERVER HAS CURRENT PLAYERS AND LOCAL SELECTION
   * IS EMPTY, LOAD THEM.
   *
   * This happens when the page is opened/refreshed.
   *
   * It does NOT overwrite an active user selection.
   * =====================================================
   */

  useEffect(() => {
    if (
      strikerId === "" &&
      serverStriker
    ) {
      setStrikerId(
        serverStriker.id
      );
    }
  }, [
    serverStriker?.id,
    strikerId,
  ]);

  useEffect(() => {
    if (
      nonStrikerId === "" &&
      serverNonStriker
    ) {
      setNonStrikerId(
        serverNonStriker.id
      );
    }
  }, [
    serverNonStriker?.id,
    nonStrikerId,
  ]);

  useEffect(() => {
    if (
      bowlerId === "" &&
      serverBowler
    ) {
      setBowlerId(
        serverBowler.id
      );
    }
  }, [
    serverBowler?.id,
    bowlerId,
  ]);

  /*
   * =====================================================
   * FIND SELECTED PLAYERS
   * =====================================================
   */

  const selectedStriker =
    battingTeam.playerList.find(
      (player) =>
        player.id ===
        Number(strikerId)
    ) ?? null;

  const selectedNonStriker =
    battingTeam.playerList.find(
      (player) =>
        player.id ===
        Number(nonStrikerId)
    ) ?? null;

  const selectedBowler =
    bowlingTeam.playerList.find(
      (player) =>
        player.id ===
        Number(bowlerId)
    ) ?? null;

  /*
   * =====================================================
   * SAVE PLAYERS
   * =====================================================
   */

  async function savePlayers() {
    /*
     * STRIKER
     */

    if (!strikerId) {
      toast.error(
        "Please select the striker."
      );
      return;
    }

    /*
     * NON-STRIKER
     */

    if (!nonStrikerId) {
      toast.error(
        "Please select the non-striker."
      );
      return;
    }

    /*
     * BOWLER
     */

    if (!bowlerId) {
      toast.error(
        "Please select the bowler."
      );
      return;
    }

    /*
     * SAME BATSMAN CHECK
     */

    if (
      Number(strikerId) ===
      Number(nonStrikerId)
    ) {
      toast.error(
        "Striker and non-striker cannot be the same player."
      );
      return;
    }

    /*
     * =====================================================
     * STRIKER MUST BE BATTING TEAM
     * =====================================================
     */

    const strikerValid =
      battingTeam.playerList.some(
        (player) =>
          player.id ===
          Number(strikerId)
      );

    if (!strikerValid) {
      toast.error(
        "Striker must belong to the batting team."
      );
      return;
    }

    /*
     * =====================================================
     * NON-STRIKER MUST BE BATTING TEAM
     * =====================================================
     */

    const nonStrikerValid =
      battingTeam.playerList.some(
        (player) =>
          player.id ===
          Number(nonStrikerId)
      );

    if (!nonStrikerValid) {
      toast.error(
        "Non-striker must belong to the batting team."
      );
      return;
    }

    /*
     * =====================================================
     * BOWLER MUST BE BOWLING TEAM
     * =====================================================
     */

    const bowlerValid =
      bowlingTeam.playerList.some(
        (player) =>
          player.id ===
          Number(bowlerId)
      );

    if (!bowlerValid) {
      toast.error(
        "Bowler must belong to the bowling team."
      );
      return;
    }

    /*
     * =====================================================
     * SAVE
     * =====================================================
     */

    try {
      setSaving(true);

      const response =
        await fetch(
          `/api/matches/${match.id}/live/cricket/players`,
          {
            method: "PATCH",

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
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to update players."
        );
      }

      toast.success(
        "Players updated successfully."
      );

      /*
       * Refresh server data.
       *
       * Local selections will remain
       * because we don't reset them
       * on every refresh.
       */

      await onPlayersUpdated(false);
    } catch (error) {
      console.error(
        "SAVE PLAYERS ERROR:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update players."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * =====================================================
   * CLEAR LOCAL PLAYERS
   * =====================================================
   */

  function clearPlayers() {
    setStrikerId("");
    setNonStrikerId("");
    setBowlerId("");
  }

  /*
   * =====================================================
   * UI
   * =====================================================
   */

  return (
    <div className="rounded-2xl border bg-white p-3 shadow-sm">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-3 flex items-center justify-between">

        <div className="min-w-0">

          <h2 className="text-sm font-bold text-gray-900">
            🏏 Players
          </h2>

          <p className="truncate text-[10px] text-gray-500">
            Innings {innings} ·{" "}
            {battingTeam.name} batting ·{" "}
            {bowlingTeam.name} bowling
          </p>

        </div>

        <button
          type="button"
          onClick={clearPlayers}
          className="rounded-lg px-2 py-1 text-[10px] font-semibold text-gray-500 hover:bg-gray-100"
        >
          Clear
        </button>

      </div>

      {/* =================================================
          PLAYER SELECTORS
      ================================================= */}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">

        {/* =================================================
            STRIKER
        ================================================= */}

        <div className="rounded-xl border border-green-200 bg-green-50 p-2">

          <label className="block text-[11px] font-bold text-green-700">
            🏏 Striker
          </label>

          <select
            value={strikerId}
            onChange={(event) => {
              const value =
                event.target.value;

              setStrikerId(
                value
                  ? Number(value)
                  : ""
              );
            }}
            className="mt-1 w-full rounded-lg border border-green-200 bg-white px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">
              Select striker
            </option>

            {battingTeam.playerList.map(
              (player) => (
                <option
                  key={player.id}
                  value={player.id}
                  disabled={
                    Number(
                      nonStrikerId
                    ) ===
                    player.id
                  }
                >
                  {player.name} · #
                  {player.jerseyNumber}
                </option>
              )
            )}

          </select>

        </div>

        {/* =================================================
            NON-STRIKER
        ================================================= */}

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-2">

          <label className="block text-[11px] font-bold text-blue-700">
            🏏 Non-Striker
          </label>

          <select
            value={nonStrikerId}
            onChange={(event) => {
              const value =
                event.target.value;

              setNonStrikerId(
                value
                  ? Number(value)
                  : ""
              );
            }}
            className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">
              Select non-striker
            </option>

            {battingTeam.playerList.map(
              (player) => (
                <option
                  key={player.id}
                  value={player.id}
                  disabled={
                    Number(
                      strikerId
                    ) ===
                    player.id
                  }
                >
                  {player.name} · #
                  {player.jerseyNumber}
                </option>
              )
            )}

          </select>

        </div>

        {/* =================================================
            BOWLER
        ================================================= */}

        <div className="rounded-xl border border-orange-200 bg-orange-50 p-2">

          <label className="block text-[11px] font-bold text-orange-700">
            🎯 Bowler
          </label>

          <select
            value={bowlerId}
            onChange={(event) => {
              const value =
                event.target.value;

              setBowlerId(
                value
                  ? Number(value)
                  : ""
              );
            }}
            className="mt-1 w-full rounded-lg border border-orange-200 bg-white px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">
              Select bowler
            </option>

            {bowlingTeam.playerList.map(
              (player) => (
                <option
                  key={player.id}
                  value={player.id}
                >
                  {player.name} · #
                  {player.jerseyNumber}
                </option>
              )
            )}

          </select>

        </div>

      </div>

      {/* =================================================
          SAVE BUTTON
      ================================================= */}

      <button
        type="button"
        onClick={savePlayers}
        disabled={
          saving ||
          !strikerId ||
          !nonStrikerId ||
          !bowlerId
        }
        className="mt-2 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving
          ? "Saving players..."
          : "Save Players"}
      </button>

      {/* =================================================
          CURRENT PLAYERS
      ================================================= */}

      <div className="mt-2 grid grid-cols-3 gap-2">

        <CurrentMiniPlayer
          label="Striker"
          player={
            selectedStriker
          }
          icon="🏏"
        />

        <CurrentMiniPlayer
          label="Non-Striker"
          player={
            selectedNonStriker
          }
          icon="🏏"
        />

        <CurrentMiniPlayer
          label="Bowler"
          player={
            selectedBowler
          }
          icon="🎯"
        />

      </div>

    </div>
  );
}

/* =========================================================
   PLAYER SELECT
========================================================= */

function PlayerSelect({
  label,
  value,
  players,
  excludeId,
  onChange,
  className,
}: {
  label: string;
  value: number | "";
  players: CricketPlayer[];
  excludeId?: number | "";
  onChange: (
    value: number | ""
  ) => void;
  className: string;
}) {
  return (
    <div
      className={`rounded-lg border p-1.5 ${className}`}
    >
      <label className="block truncate text-[10px] font-bold text-gray-700">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
              ? Number(e.target.value)
              : ""
          )
        }
        className="mt-1 w-full rounded-md border bg-white px-1.5 py-1.5 text-[10px] outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">
          Select
        </option>

        {players.map((player) => (
          <option
            key={player.id}
            value={player.id}
            disabled={
              excludeId === player.id
            }
          >
            {player.name} #
            {player.jerseyNumber}
          </option>
        ))}
      </select>
    </div>
  );
}

/* =========================================================
   CURRENT PLAYER
========================================================= */

function CurrentMiniPlayer({
  label,
  player,
  icon,
}: {
  label: string;
  player?: CricketPlayer | null;
  icon: string;
}) {
  return (
    <div className="rounded-lg border bg-slate-50 px-2 py-1.5">
      <p className="text-[9px] font-bold text-gray-500">
        {icon} {label}
      </p>

      {player ? (
        <>
          <p className="truncate text-[11px] font-bold text-gray-900">
            {player.name}
          </p>

          <p className="text-[9px] text-gray-400">
            #{player.jerseyNumber}
          </p>
        </>
      ) : (
        <p className="text-[9px] text-gray-400">
          Not selected
        </p>
      )}
    </div>
  );
}

/* =========================================================
   CRICKET CONTROLS
========================================================= */

function CricketControls({
  match,
  updating,
  addEvent,
}: {
  match: Match;
  updating: boolean;
  addEvent: (
    teamId: number,
    eventType: string,
    value: number
  ) => void;
}) {
  const innings =
    match.score?.innings ?? 1;

  const battingTeam =
    innings === 1
      ? match.team1
      : match.team2;

  const striker =
    match.cricket?.striker ?? null;

  const nonStriker =
    match.cricket?.nonStriker ?? null;

  const bowler =
    match.cricket?.bowler ?? null;

  const hasPlayers =
    !!striker &&
    !!nonStriker &&
    !!bowler;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">

      {/* =================================================
          CURRENT PLAYERS
      ================================================= */}

      <div className="grid grid-cols-3 gap-2">

        <CurrentMiniPlayer
          label="Striker"
          player={striker}
          icon="🏏"
        />

        <CurrentMiniPlayer
          label="Non-Striker"
          player={nonStriker}
          icon="🏏"
        />

        <CurrentMiniPlayer
          label="Bowler"
          player={bowler}
          icon="🎯"
        />

      </div>

      {/* =================================================
          SCORING
      ================================================= */}

      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border bg-white p-3 shadow-sm">

        <div className="mb-2 flex items-center justify-between">

          <div>
            <h2 className="text-sm font-bold">
              Cricket Scoring
            </h2>

            <p className="text-[10px] text-gray-500">
              {battingTeam.name}
            </p>
          </div>

          {!hasPlayers && (
            <span className="rounded-lg bg-orange-100 px-2 py-1 text-[9px] font-bold text-orange-700">
              Select players
            </span>
          )}

        </div>

        {/* =================================================
            RUNS
        ================================================= */}

        <div className="grid grid-cols-6 gap-1.5">

          {[0, 1, 2, 3, 4, 6].map(
            (value) => (
              <button
                key={value}
                type="button"
                disabled={
                  updating ||
                  !hasPlayers
                }
                onClick={() =>
                  addEvent(
                    battingTeam.id,
                    "RUN",
                    value
                  )
                }
                className="rounded-lg bg-blue-600 py-3 text-base font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {value}
              </button>
            )
          )}

        </div>

        {/* =================================================
            SPECIAL EVENTS
        ================================================= */}

        <div className="mt-2 grid grid-cols-5 gap-1.5">

          <ScoreButton
            label="Wicket"
            disabled={
              updating ||
              !hasPlayers
            }
            onClick={() =>
              addEvent(
                battingTeam.id,
                "WICKET",
                0
              )
            }
          />

          <ScoreButton
            label="Wide"
            disabled={
              updating ||
              !hasPlayers
            }
            onClick={() =>
              addEvent(
                battingTeam.id,
                "WIDE",
                1
              )
            }
          />

          <ScoreButton
            label="No Ball"
            disabled={
              updating ||
              !hasPlayers
            }
            onClick={() =>
              addEvent(
                battingTeam.id,
                "NO_BALL",
                1
              )
            }
          />

          <ScoreButton
            label="Bye"
            disabled={
              updating ||
              !hasPlayers
            }
            onClick={() =>
              addEvent(
                battingTeam.id,
                "BYE",
                1
              )
            }
          />

          <ScoreButton
            label="Leg Bye"
            disabled={
              updating ||
              !hasPlayers
            }
            onClick={() =>
              addEvent(
                battingTeam.id,
                "LEG_BYE",
                1
              )
            }
          />

        </div>

      </div>
    </div>
  );
}

/* =========================================================
   SCORE BUTTON
========================================================= */

function ScoreButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border bg-slate-50 px-2 py-2.5 text-[10px] font-bold text-gray-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
    </button>
  );
}

/* =========================================================
   FOOTBALL
========================================================= */

function FootballControls({
  match,
  updating,
  addEvent,
}: {
  match: Match;
  updating: boolean;
  addEvent: (
    teamId: number,
    eventType: string,
    value: number
  ) => Promise<void>;
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <button
          disabled={updating}
          onClick={() =>
            addEvent(
              match.team1.id,
              "GOAL",
              1
            )
          }
          className="rounded-xl bg-blue-600 p-4 text-sm font-bold text-white disabled:opacity-50"
        >
          ⚽ Goal

          <span className="mt-1 block text-[10px] font-normal">
            {match.team1.name}
          </span>
        </button>

        <button
          disabled={updating}
          onClick={() =>
            addEvent(
              match.team2.id,
              "GOAL",
              1
            )
          }
          className="rounded-xl bg-green-600 p-4 text-sm font-bold text-white disabled:opacity-50"
        >
          ⚽ Goal

          <span className="mt-1 block text-[10px] font-normal">
            {match.team2.name}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <ScoreButton
          label="🟨 Yellow"
          disabled={updating}
          onClick={() =>
            addEvent(
              match.team1.id,
              "YELLOW_CARD",
              0
            )
          }
        />

        <ScoreButton
          label="🟥 Red"
          disabled={updating}
          onClick={() =>
            addEvent(
              match.team1.id,
              "RED_CARD",
              0
            )
          }
        />
      </div>
    </div>
  );
}

/* =========================================================
   THROWBALL
========================================================= */

function ThrowballControls({
  match,
  updating,
  addEvent,
}: {
  match: Match;
  updating: boolean;
  addEvent: (
    teamId: number,
    eventType: string,
    value: number
  ) => Promise<void>;
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <button
          disabled={updating}
          onClick={() =>
            addEvent(
              match.team1.id,
              "POINT",
              1
            )
          }
          className="rounded-xl bg-blue-600 p-5 text-sm font-bold text-white disabled:opacity-50"
        >
          +1

          <span className="mt-1 block text-[10px] font-normal">
            {match.team1.name}
          </span>
        </button>

        <button
          disabled={updating}
          onClick={() =>
            addEvent(
              match.team2.id,
              "POINT",
              1
            )
          }
          className="rounded-xl bg-green-600 p-5 text-sm font-bold text-white disabled:opacity-50"
        >
          +1

          <span className="mt-1 block text-[10px] font-normal">
            {match.team2.name}
          </span>
        </button>
      </div>

      <ScoreButton
        label="⏱ Timeout"
        disabled={updating}
        onClick={() =>
          addEvent(
            match.team1.id,
            "TIMEOUT",
            0
          )
        }
      />
    </div>
  );
}

/* =========================================================
   HANDBALL
========================================================= */

function HandballControls({
  match,
  updating,
  addEvent,
}: {
  match: Match;
  updating: boolean;
  addEvent: (
    teamId: number,
    eventType: string,
    value: number
  ) => Promise<void>;
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <button
          disabled={updating}
          onClick={() =>
            addEvent(
              match.team1.id,
              "GOAL",
              1
            )
          }
          className="rounded-xl bg-blue-600 p-5 text-sm font-bold text-white disabled:opacity-50"
        >
          🤾 Goal

          <span className="mt-1 block text-[10px] font-normal">
            {match.team1.name}
          </span>
        </button>

        <button
          disabled={updating}
          onClick={() =>
            addEvent(
              match.team2.id,
              "GOAL",
              1
            )
          }
          className="rounded-xl bg-green-600 p-5 text-sm font-bold text-white disabled:opacity-50"
        >
          🤾 Goal

          <span className="mt-1 block text-[10px] font-normal">
            {match.team2.name}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <ScoreButton
          label="🟨 Yellow"
          disabled={updating}
          onClick={() =>
            addEvent(
              match.team1.id,
              "YELLOW_CARD",
              0
            )
          }
        />

        <ScoreButton
          label="🟥 Red"
          disabled={updating}
          onClick={() =>
            addEvent(
              match.team1.id,
              "RED_CARD",
              0
            )
          }
        />

        <ScoreButton
          label="⏱ 2 Min"
          disabled={updating}
          onClick={() =>
            addEvent(
              match.team1.id,
              "SUSPENSION",
              0
            )
          }
        />
      </div>
    </div>
  );
}

/* =========================================================
   SCORECARD
========================================================= */

function CricketScorecard({
  scorecard,
  match,
}: {
  scorecard: CricketScorecardData | null;
  match: Match;
}) {
  if (!scorecard) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border bg-white text-sm text-gray-400">
        Loading scorecard...
      </div>
    );
  }

  const innings =
    match.score?.innings ?? 1;

  const battingPlayers =
    scorecard.batting.filter(
      (player) =>
        player.innings === innings
    );

  const bowlingPlayers =
    scorecard.bowling.filter(
      (player) =>
        player.innings === innings
    );

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-2 lg:grid-cols-2">
      {/* BATTING */}

      <div className="min-h-0 overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b px-3 py-2">
          <h2 className="text-xs font-bold">
            🏏 Batting
          </h2>

          <p className="text-[9px] text-gray-500">
            Innings {innings}
          </p>
        </div>

        <div className="h-[calc(100%-48px)] overflow-auto">
          <table className="w-full text-[10px]">
            <thead className="sticky top-0 bg-slate-50">
              <tr className="border-b text-gray-500">
                <th className="px-2 py-2 text-left">
                  Player
                </th>

                <th className="px-1 py-2">
                  R
                </th>

                <th className="px-1 py-2">
                  B
                </th>

                <th className="px-1 py-2">
                  4
                </th>

                <th className="px-1 py-2">
                  6
                </th>

                <th className="px-1 py-2">
                  SR
                </th>
              </tr>
            </thead>

            <tbody>
              {battingPlayers.map(
                (player) => {
                  const sr =
                    player.balls > 0
                      ? (
                          (player.runs /
                            player.balls) *
                          100
                        ).toFixed(1)
                      : "0.0";

                  return (
                    <tr
                      key={player.id}
                      className="border-b"
                    >
                      <td className="px-2 py-2">
                        <p className="font-semibold">
                          {
                            player.player
                              .name
                          }
                        </p>

                        <p className="text-[8px] text-gray-400">
                          #
                          {
                            player.player
                              .jerseyNumber
                          }
                        </p>
                      </td>

                      <td className="text-center font-bold">
                        {player.runs}
                      </td>

                      <td className="text-center">
                        {player.balls}
                      </td>

                      <td className="text-center">
                        {player.fours}
                      </td>

                      <td className="text-center">
                        {player.sixes}
                      </td>

                      <td className="text-center">
                        {sr}
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BOWLING */}

      <div className="min-h-0 overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b px-3 py-2">
          <h2 className="text-xs font-bold">
            🎯 Bowling
          </h2>

          <p className="text-[9px] text-gray-500">
            Innings {innings}
          </p>
        </div>

        <div className="h-[calc(100%-48px)] overflow-auto">
          <table className="w-full text-[10px]">
            <thead className="sticky top-0 bg-slate-50">
              <tr className="border-b text-gray-500">
                <th className="px-2 py-2 text-left">
                  Bowler
                </th>

                <th className="px-1 py-2">
                  O
                </th>

                <th className="px-1 py-2">
                  R
                </th>

                <th className="px-1 py-2">
                  W
                </th>

                <th className="px-1 py-2">
                  WD
                </th>

                <th className="px-1 py-2">
                  NB
                </th>
              </tr>
            </thead>

            <tbody>
              {bowlingPlayers.map(
                (player) => (
                  <tr
                    key={player.id}
                    className="border-b"
                  >
                    <td className="px-2 py-2">
                      <p className="font-semibold">
                        {
                          player.player
                            .name
                        }
                      </p>

                      <p className="text-[8px] text-gray-400">
                        #
                        {
                          player.player
                            .jerseyNumber
                        }
                      </p>
                    </td>

                    <td className="text-center">
                      {player.overs}.
                      {player.balls}
                    </td>

                    <td className="text-center">
                      {player.runs}
                    </td>

                    <td className="text-center font-bold text-red-600">
                      {player.wickets}
                    </td>

                    <td className="text-center">
                      {player.wides}
                    </td>

                    <td className="text-center">
                      {player.noBalls}
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

/* =========================================================
   EVENTS
========================================================= */

function RecentEvents({
  events,
}: {
  events: MatchEvent[];
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="shrink-0 border-b px-3 py-2">
        <h2 className="text-xs font-bold">
          Recent Events
        </h2>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
          No events recorded.
        </div>
      ) : (
        <div className="min-h-0 flex-1 divide-y overflow-auto">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50">
                  <Activity
                    size={13}
                    className="text-blue-600"
                  />
                </div>

                <div>
                  <p className="text-[10px] font-bold">
                    {event.eventType}
                  </p>

                  <p className="text-[8px] text-gray-400">
                    {event.clock ||
                      `Period ${event.period}`}
                  </p>
                </div>
              </div>

              <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                {event.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}