"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  Trophy,
  Goal,
  Square,
  SquareX,
  Undo2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

// =====================================================
// TYPES
// =====================================================

interface HandballPlayer {
  id: number;
  name: string;
  jerseyNo: number | null;
  role: string | null;
  photo: string | null;
  teamId: number;
}

interface HandballTeam {
  id: number;
  name: string;
  captain: string | null;
  game: string;
  players: HandballPlayer[];
}

interface HandballScore {
  id: number;
  matchId: number;
  team1Id: number;
  team2Id: number;
  team1Score: number;
  team2Score: number;
}

type HandballEventType =
  | "GOAL"
  | "OWN_GOAL"
  | "PENALTY"
  | "YELLOW_CARD"
  | "RED_CARD";

type HandballPenaltyResult =
  | "GOAL"
  | "MISSED";

interface HandballEvent {
  id: number;
  matchId: number;
  playerId: number | null;
  teamId: number;
  eventType: HandballEventType;

  penaltyResult:
    | HandballPenaltyResult
    | null;

  minute: number | null;

  description: string | null;

  createdAt: string;

  player: HandballPlayer | null;

  team: {
    id: number;
    name: string;
  };
}

interface HandballMatch {
  id: number;

  status: string;

  result: string | null;

  winnerTeamId: number | null;

  game: {
    id: number;
    name: string;
    sportType: string;
  };

  team1: HandballTeam;

  team2: HandballTeam;

  handballScore:
    | HandballScore
    | null;

  team1Score: number;

  team2Score: number;

  handballEvents:
    HandballEvent[];
}

// =====================================================
// COMPONENT
// =====================================================

export default function HandballMatchPage() {
  const params = useParams();

  const matchId = Number(params.id);

  // ===================================================
  // MATCH STATE
  // ===================================================

  const [match, setMatch] =
    useState<HandballMatch | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    matchActionLoading,
    setMatchActionLoading,
  ] = useState(false);

  const [
    eventActionLoading,
    setEventActionLoading,
  ] = useState(false);

  // ===================================================
  // EVENT FORM
  // ===================================================

  const [eventType, setEventType] =
    useState<HandballEventType>(
      "GOAL"
    );

  const [teamId, setTeamId] =
    useState("");

  const [playerId, setPlayerId] =
    useState("");

  const [penaltyResult, setPenaltyResult] =
    useState<
      HandballPenaltyResult | ""
    >("");

  const [minute, setMinute] =
    useState("");

  const [description, setDescription] =
    useState("");

  // ===================================================
  // LOAD MATCH
  // ===================================================

  async function loadMatch() {
    try {
      setLoading(true);

      const response =
        await fetch(
          `/api/matches/${matchId}/handball/live`,
          {
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load handball match."
        );
      }

      setMatch(
        data.match ?? null
      );
    } catch (error) {
      console.error(
        "LOAD HANDBALL MATCH ERROR:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load handball match."
      );
    } finally {
      setLoading(false);
    }
  }

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    if (
      !matchId ||
      Number.isNaN(matchId)
    ) {
      return;
    }

    loadMatch();
  }, [matchId]);

  // ===================================================
  // SELECTED TEAM
  // ===================================================

  const selectedTeam =
    match && teamId
      ? Number(teamId) ===
        match.team1.id
        ? match.team1
        : Number(teamId) ===
            match.team2.id
          ? match.team2
          : null
      : null;

  // ===================================================
  // PLAYER REQUIRED
  // ===================================================

  const playerRequired =
    eventType === "GOAL" ||
    eventType === "PENALTY" ||
    eventType ===
      "YELLOW_CARD" ||
    eventType === "RED_CARD";

  // ===================================================
  // EVENT TYPE CHANGE
  // ===================================================

  function handleEventTypeChange(
    value: HandballEventType
  ) {
    setEventType(value);

    setPlayerId("");

    setPenaltyResult("");
  }

  // ===================================================
  // TEAM CHANGE
  // ===================================================

  function handleTeamChange(
    value: string
  ) {
    setTeamId(value);

    setPlayerId("");
  }

  // ===================================================
  // ADD EVENT
  // ===================================================

  async function addEvent() {
    if (!match) {
      return;
    }

    if (
      match.status ===
        "COMPLETED" ||
      match.status ===
        "CANCELLED"
    ) {
      toast.error(
        "This match cannot accept new events."
      );

      return;
    }

    // -------------------------------------------------
    // TEAM
    // -------------------------------------------------

    if (!teamId) {
      toast.error(
        "Please select a team."
      );

      return;
    }

    // -------------------------------------------------
    // PLAYER
    // -------------------------------------------------

    if (
      playerRequired &&
      !playerId
    ) {
      toast.error(
        eventType === "PENALTY"
          ? "Please select the penalty shooter."
          : "Please select a player."
      );

      return;
    }

    // -------------------------------------------------
    // PENALTY RESULT
    // -------------------------------------------------

    if (
      eventType === "PENALTY" &&
      !penaltyResult
    ) {
      toast.error(
        "Please select whether the penalty was scored or missed."
      );

      return;
    }

    // -------------------------------------------------
    // MINUTE
    // -------------------------------------------------

    let minuteNumber:
      | number
      | null = null;

    if (
      minute.trim() !== ""
    ) {
      minuteNumber =
        Number(minute);

      if (
        !Number.isInteger(
          minuteNumber
        ) ||
        minuteNumber < 0 ||
        minuteNumber > 120
      ) {
        toast.error(
          "Please enter a valid minute between 0 and 120."
        );

        return;
      }
    }

    // -------------------------------------------------
    // SELECTED TEAM
    // -------------------------------------------------

    if (!selectedTeam) {
      toast.error(
        "Please select a valid team."
      );

      return;
    }

    // -------------------------------------------------
    // PLAYER BELONGS TO TEAM
    // -------------------------------------------------

    if (playerRequired) {
      const selectedPlayer =
        selectedTeam.players.find(
          (player) =>
            player.id ===
            Number(playerId)
        );

      if (!selectedPlayer) {
        toast.error(
          "Selected player does not belong to this team."
        );

        return;
      }
    }

    // -------------------------------------------------
    // SAVE
    // -------------------------------------------------

    try {
      setSaving(true);

      // IMPORTANT:
      //
      // Scored -> GOAL
      // Missed -> MISSED
      //
      // Never send SCORED.

      const finalPenaltyResult =
        eventType === "PENALTY"
          ? penaltyResult
          : null;

      const response =
        await fetch(
          `/api/matches/${matchId}/handball/event`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              eventType,

              teamId:
                Number(teamId),

              playerId:
                playerId
                  ? Number(playerId)
                  : null,

              penaltyResult:
                finalPenaltyResult,

              minute:
                minuteNumber,

              description:
                description.trim() ||
                null,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to add handball event."
        );
      }

      // ------------------------------------------------
      // SUCCESS
      // ------------------------------------------------

      if (
        eventType ===
        "PENALTY"
      ) {
        if (
          penaltyResult ===
          "GOAL"
        ) {
          toast.success(
            "Penalty scored successfully."
          );
        } else {
          toast.success(
            "Penalty miss recorded."
          );
        }
      } else if (
        eventType ===
        "GOAL"
      ) {
        toast.success(
          "Goal added successfully."
        );
      } else if (
        eventType ===
        "OWN_GOAL"
      ) {
        toast.success(
          "Own goal added successfully."
        );
      } else if (
        eventType ===
        "YELLOW_CARD"
      ) {
        toast.success(
          "Yellow card added successfully."
        );
      } else if (
        eventType ===
        "RED_CARD"
      ) {
        toast.success(
          "Red card added successfully."
        );
      }

      // ------------------------------------------------
      // RESET
      // ------------------------------------------------

      setPlayerId("");

      setPenaltyResult("");

      setMinute("");

      setDescription("");

      // ------------------------------------------------
      // REFRESH
      // ------------------------------------------------

      await loadMatch();
    } catch (error) {
      console.error(
        "ADD HANDBALL EVENT ERROR:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add handball event."
      );
    } finally {
      setSaving(false);
    }
  }

  // ===================================================
  // DELETE EVENT
  // ===================================================

  async function deleteHandballEvent(
    eventId: number
  ) {
    if (!match) {
      return;
    }

    if (
      match.status ===
        "COMPLETED" ||
      match.status ===
        "CANCELLED"
    ) {
      toast.error(
        "Cannot delete events after the match is completed."
      );

      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this event?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setEventActionLoading(
        true
      );

      const response =
        await fetch(
          `/api/matches/${matchId}/handball/event/${eventId}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to delete event."
        );
      }

      toast.success(
        "Event deleted successfully."
      );

      await loadMatch();
    } catch (error) {
      console.error(
        "DELETE HANDBALL EVENT ERROR:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete event."
      );
    } finally {
      setEventActionLoading(
        false
      );
    }
  }

  // ===================================================
  // UNDO LAST EVENT
  // ===================================================

  async function undoLastHandballEvent() {
    if (!match) {
      return;
    }

    if (
      match.status ===
        "COMPLETED" ||
      match.status ===
        "CANCELLED"
    ) {
      toast.error(
        "Cannot undo events after the match is completed."
      );

      return;
    }

    if (
      match.handballEvents.length ===
      0
    ) {
      toast.error(
        "There are no events to undo."
      );

      return;
    }

    const confirmed =
      window.confirm(
        "Undo the last handball event?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setEventActionLoading(
        true
      );

      const response =
        await fetch(
          `/api/matches/${matchId}/handball/undo`,
          {
            method: "POST",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to undo event."
        );
      }

      toast.success(
        "Last event undone successfully."
      );

      await loadMatch();
    } catch (error) {
      console.error(
        "UNDO HANDBALL EVENT ERROR:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to undo event."
      );
    } finally {
      setEventActionLoading(
        false
      );
    }
  }

  // ===================================================
  // EVENT LABEL
  // ===================================================

  function getEventLabel(
    event: HandballEvent
  ) {
    switch (
      event.eventType
    ) {
      case "GOAL":
        return "Goal";

      case "OWN_GOAL":
        return "Own Goal";

      case "PENALTY":
        if (
          event.penaltyResult ===
          "GOAL"
        ) {
          return "Penalty Scored";
        }

        if (
          event.penaltyResult ===
          "MISSED"
        ) {
          return "Penalty Missed";
        }

        return "Penalty";

      case "YELLOW_CARD":
        return "Yellow Card";

      case "RED_CARD":
        return "Red Card";

      default:
        return event.eventType;
    }
  }

  // ===================================================
  // EVENT ICON
  // ===================================================

  function getEventIcon(
    type: HandballEventType
  ) {
    switch (type) {
      case "GOAL":
        return (
          <Goal
            size={18}
            className="text-green-600"
          />
        );

      case "OWN_GOAL":
        return (
          <Goal
            size={18}
            className="text-orange-600"
          />
        );

      case "PENALTY":
        return (
          <Goal
            size={18}
            className="text-blue-600"
          />
        );

      case "YELLOW_CARD":
        return (
          <Square
            size={18}
            className="fill-yellow-400 text-yellow-500"
          />
        );

      case "RED_CARD":
        return (
          <SquareX
            size={18}
            className="text-red-600"
          />
        );

      default:
        return null;
    }
  }

  // ===================================================
  // START / END MATCH
  // ===================================================

  async function updateMatchStatus(
    action: "START" | "END"
  ) {
    if (!match) {
      return;
    }

    try {
      setMatchActionLoading(
        true
      );

      const response =
        await fetch(
          `/api/matches/${matchId}/handball/status`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              action,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Failed to ${
              action === "START"
                ? "start"
                : "end"
            } match.`
        );
      }

      toast.success(
        action === "START"
          ? "Match started successfully."
          : "Match ended successfully."
      );

      await loadMatch();
    } catch (error) {
      console.error(
        "UPDATE HANDBALL MATCH STATUS ERROR:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update match status."
      );
    } finally {
      setMatchActionLoading(
        false
      );
    }
  }

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">
          Loading handball match...
        </div>
      </div>
    );
  }

  // ===================================================
  // MATCH NOT FOUND
  // ===================================================

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 mb-4">
            Match not found.
          </p>

          <Link
            href="/admin/matches"
            className="text-blue-600 hover:underline"
          >
            Back to Matches
          </Link>
        </div>
      </div>
    );
  }

  // ===================================================
  // SCORE
  // ===================================================

  const team1Score =
    match.handballScore
      ?.team1Score ??
    match.team1Score ??
    0;

  const team2Score =
    match.handballScore
      ?.team2Score ??
    match.team2Score ??
    0;

  // ===================================================
  // STATUS
  // ===================================================

  const matchNotStarted =
    match.status !== "LIVE" &&
    match.status !== "COMPLETED";

  const matchLive =
    match.status === "LIVE";

  const matchCompleted =
    match.status === "COMPLETED";

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}

        <div className="flex items-center justify-between mb-6">

          <Link
            href="/admin/matches"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={18} />
            Back to Matches
          </Link>

          <button
            type="button"
            onClick={loadMatch}
            disabled={
              loading ||
              eventActionLoading
            }
            className="inline-flex items-center gap-2 px-4 py-2 text-black rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

        </div>

        {/* MATCH HEADER */}

        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">

          <div className="flex items-center justify-center gap-3 mb-6">

            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                matchCompleted
                  ? "bg-gray-100 text-gray-700"
                  : matchLive
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {match.status}
            </span>

            <span className="text-gray-500">
              {match.game.name}
            </span>

          </div>

          <div className="grid grid-cols-3 items-center gap-6">

            {/* TEAM 1 */}

            <div className="text-center">

              <h2 className="text-xl font-bold text-gray-900">
                {match.team1.name}
              </h2>

              <div className="text-6xl font-bold mt-3 text-black">
                {team1Score}
              </div>

            </div>

            {/* CENTER */}

            <div className="text-center">

              <div className="text-black font-semibold">
                VS
              </div>

              <div className="flex flex-wrap justify-center gap-3 mt-6">

                {matchNotStarted && (
                  <button
                    type="button"
                    onClick={() =>
                      updateMatchStatus(
                        "START"
                      )
                    }
                    disabled={
                      matchActionLoading
                    }
                    className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-black hover:bg-green-700 disabled:opacity-50"
                  >
                    {matchActionLoading
                      ? "Starting..."
                      : "▶ Start Match"}
                  </button>
                )}

                {matchLive && (
                  <button
                    type="button"
                    onClick={() =>
                      updateMatchStatus(
                        "END"
                      )
                    }
                    disabled={
                      matchActionLoading
                    }
                    className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-black hover:bg-red-700 disabled:opacity-50"
                  >
                    {matchActionLoading
                      ? "Ending..."
                      : "■ End Match"}
                  </button>
                )}

                {matchCompleted && (
                  <div className="rounded-xl bg-gray-100 px-6 py-3 font-semibold text-gray-700">
                    ✓ Match Completed
                  </div>
                )}

              </div>

            </div>

            {/* TEAM 2 */}

            <div className="text-center">

              <h2 className="text-xl font-bold text-gray-900">
                {match.team2.name}
              </h2>

              <div className="text-6xl font-bold mt-3 text-black">
                {team2Score}
              </div>

            </div>

          </div>
        </div>

        {/* MAIN GRID */}

        <div className="grid lg:grid-cols-2 gap-6">

          {/* ADD EVENT */}

          <div className="bg-white rounded-2xl shadow-sm border p-6">

            <div className="flex items-center gap-2 mb-6">

              <Plus size={20} />

              <h2 className="text-xl font-bold">
                Add Match Event
              </h2>

            </div>

            {matchCompleted && (
              <div className="mb-5 rounded-xl bg-gray-100 border border-gray-200 p-4">

                <p className="font-semibold text-gray-700">
                  Match completed
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  No more events can be added to this match.
                </p>

              </div>
            )}

            {/* EVENT TYPE */}

            <div className="mb-4">

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Type
              </label>

              <select
                value={eventType}
                onChange={(e) =>
                  handleEventTypeChange(
                    e.target.value as HandballEventType
                  )
                }
                disabled={
                  saving ||
                  matchCompleted
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black disabled:bg-gray-100 disabled:text-gray-500"
              >

                <option value="GOAL">
                  Goal
                </option>

                <option value="OWN_GOAL">
                  Own Goal
                </option>

                <option value="PENALTY">
                  Penalty
                </option>

                <option value="YELLOW_CARD">
                  Yellow Card
                </option>

                <option value="RED_CARD">
                  Red Card
                </option>

              </select>

            </div>

            {/* TEAM */}

            <div className="mb-4">

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team
              </label>

              <select
                value={teamId}
                onChange={(e) =>
                  handleTeamChange(
                    e.target.value
                  )
                }
                disabled={
                  saving ||
                  matchCompleted
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black disabled:bg-gray-100 disabled:text-gray-500"
              >

                <option value="">
                  Select team
                </option>

                <option
                  value={match.team1.id}
                >
                  {match.team1.name}
                </option>

                <option
                  value={match.team2.id}
                >
                  {match.team2.name}
                </option>

              </select>

            </div>

            {/* PLAYER */}

            <div className="mb-4">

              <label className="block text-sm font-medium text-gray-700 mb-2">

                {eventType ===
                "PENALTY"
                  ? "Penalty Shooter"
                  : "Player"}

              </label>

              <select
                value={playerId}
                onChange={(e) =>
                  setPlayerId(
                    e.target.value
                  )
                }
                disabled={
                  !selectedTeam ||
                  saving ||
                  matchCompleted
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black disabled:bg-gray-100 disabled:text-gray-500"
              >

                <option value="">
                  {selectedTeam
                    ? playerRequiredText(
                        eventType
                      )
                    : "Select team first"}
                </option>

                {selectedTeam?.players.map(
                  (player) => (
                    <option
                      key={player.id}
                      value={player.id}
                    >
                      {player.jerseyNo !=
                      null
                        ? `#${player.jerseyNo} `
                        : ""}
                      {player.name}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* PENALTY RESULT */}

            {eventType ===
              "PENALTY" && (
              <div className="mb-4">

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Penalty Result
                </label>

                <select
                  value={
                    penaltyResult
                  }
                  onChange={(e) =>
                    setPenaltyResult(
                      e.target.value as
                        | HandballPenaltyResult
                        | ""
                    )
                  }
                  disabled={
                    saving ||
                    matchCompleted
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black disabled:bg-gray-100 disabled:text-gray-500"
                >

                  <option value="">
                    Select result
                  </option>

                  <option value="GOAL">
                    Scored
                  </option>

                  <option value="MISSED">
                    Missed
                  </option>

                </select>

                <p className="mt-1 text-xs text-gray-400">
                  Scored = GOAL. Missed = MISSED.
                </p>

              </div>
            )}

            {/* MINUTE */}

            <div className="mb-4">

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Minute
              </label>

              <input
                type="number"
                min="0"
                max="120"
                value={minute}
                onChange={(e) =>
                  setMinute(
                    e.target.value
                  )
                }
                disabled={
                  saving ||
                  matchCompleted
                }
                placeholder="Example: 25"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black disabled:bg-gray-100 disabled:text-gray-500"
              />

            </div>

            {/* DESCRIPTION */}

            <div className="mb-5">

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>

              <input
                type="text"
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                disabled={
                  saving ||
                  matchCompleted
                }
                placeholder="Optional description"
                className="w-full border rounded-lg px-3 py-2 disabled:bg-gray-100 text-black"
              />

            </div>

            {/* ADD */}

            <button
              type="button"
              onClick={addEvent}
              disabled={
                saving ||
                matchCompleted
              }
              className="w-full bg-black text-white rounded-lg py-3 font-semibold disabled:opacity-50"
            >
              {saving
                ? "Adding..."
                : "Add Event"}
            </button>

          </div>

          {/* EVENT TIMELINE */}

          <div className="bg-white rounded-2xl shadow-sm border p-6">

            <div className="flex items-center justify-between mb-6">

              <div className="flex items-center gap-2">

                <Trophy size={20} />

                <h2 className="text-xl font-bold">
                  Match Events
                </h2>

              </div>

              <span className="text-sm text-gray-400">
                {
                  match.handballEvents
                    .length
                }{" "}
                events
              </span>

            </div>

            {match.handballEvents
              .length > 0 &&
              !matchCompleted && (
                <button
                  type="button"
                  onClick={
                    undoLastHandballEvent
                  }
                  disabled={
                    eventActionLoading
                  }
                  className="mb-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  <Undo2 size={16} />

                  {eventActionLoading
                    ? "Processing..."
                    : "Undo Last Event"}
                </button>
              )}

            {match.handballEvents
              .length === 0 ? (

              <div className="text-center py-10 text-gray-500">
                No events recorded yet.
              </div>

            ) : (

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">

                {match.handballEvents.map(
                  (event) => (

                    <div
                      key={event.id}
                      className="border rounded-xl p-4 hover:bg-gray-50 transition"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-50">
                            {getEventIcon(
                              event.eventType
                            )}
                          </div>

                          <div>

                            <div className="font-semibold text-gray-900">
                              {getEventLabel(
                                event
                              )}
                            </div>

                            <div className="text-sm text-gray-500">
                              {event.team.name}

                              {event.player
                                ? ` • ${event.player.name}`
                                : ""}
                            </div>

                          </div>

                        </div>

                        <div className="flex items-center gap-2">

                          {event.minute !==
                            null && (
                            <div className="text-sm font-semibold text-gray-700">
                              {
                                event.minute
                              }
                              '
                            </div>
                          )}

                          {!matchCompleted && (
                            <button
                              type="button"
                              onClick={() =>
                                deleteHandballEvent(
                                  event.id
                                )
                              }
                              disabled={
                                eventActionLoading
                              }
                              title="Delete event"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              <Trash2
                                size={16}
                              />
                            </button>
                          )}

                        </div>

                      </div>

                      {/* PENALTY DETAILS */}

                      {event.eventType ===
                        "PENALTY" && (
                        <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-sm">

                          <div className="font-medium text-blue-900">

                            {event.penaltyResult ===
                            "GOAL"
                              ? "Penalty Scored"
                              : event.penaltyResult ===
                                  "MISSED"
                                ? "Penalty Missed"
                                : "Penalty Result Not Recorded"}

                          </div>

                          {event.player && (
                            <div className="text-blue-700">
                              Shooter:{" "}
                              {
                                event.player
                                  .name
                              }
                            </div>
                          )}

                        </div>
                      )}

                      {event.description && (
                        <div className="text-sm text-gray-500 mt-2">
                          {
                            event.description
                          }
                        </div>
                      )}

                    </div>
                  )
                )}

              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}

// =====================================================
// PLAYER SELECT PLACEHOLDER
// =====================================================

function playerRequiredText(
  eventType: HandballEventType
) {
  switch (eventType) {
    case "GOAL":
      return "Select goal scorer";

    case "OWN_GOAL":
      return "Select player";

    case "PENALTY":
      return "Select penalty shooter";

    case "YELLOW_CARD":
      return "Select player";

    case "RED_CARD":
      return "Select player";

    default:
      return "Select player";
  }
}