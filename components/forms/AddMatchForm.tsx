"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

interface Team {
  id: number;
  name: string;
}

interface Game {
  id: number;
  name: string;
}

interface Tournament {
  id: number;
  name: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onMatchAdded: () => void;
}

export default function AddMatchForm({
  open,
  onClose,
  onMatchAdded,
}: Props) {
  const [tournaments, setTournaments] =
    useState<Tournament[]>([]);

  const [games, setGames] =
    useState<Game[]>([]);

  const [teams, setTeams] =
    useState<Team[]>([]);

  const [tournamentId, setTournamentId] =
    useState("");

  const [gameId, setGameId] =
    useState("");

  const [team1Id, setTeam1Id] =
    useState("");

  const [team2Id, setTeam2Id] =
    useState("");

  const [matchNumber, setMatchNumber] =
    useState("");

  // =====================================================
  // MATCH STAGE
  // =====================================================

  const [stage, setStage] =
    useState("LEAGUE");

  // =====================================================
  // STATUS
  // =====================================================

  const [status, setStatus] =
    useState("UPCOMING");

  // =====================================================
  // OVERS
  // =====================================================

  const [overs, setOvers] =
    useState("2");

  const [loading, setLoading] =
    useState(false);

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    if (!open) return;

    loadData();
  }, [open]);

  async function loadData() {
    try {
      const [
        tournamentsRes,
        gamesRes,
        teamsRes,
      ] = await Promise.all([
        fetch("/api/tournaments"),
        fetch("/api/games"),
        fetch("/api/teams"),
      ]);

      if (
        !tournamentsRes.ok ||
        !gamesRes.ok ||
        !teamsRes.ok
      ) {
        throw new Error(
          "Failed to load match data"
        );
      }

      const tournamentsData =
        await tournamentsRes.json();

      const gamesData =
        await gamesRes.json();

      const teamsData =
        await teamsRes.json();

      setTournaments(tournamentsData);
      setGames(gamesData);
      setTeams(teamsData);
    } catch (error) {
      console.error(
        "LOAD MATCH DATA ERROR:",
        error
      );

      toast.error(
        "Unable to load tournaments, games and teams."
      );
    }
  }

  // =====================================================
  // RESET
  // =====================================================

  function resetForm() {
    setTournamentId("");
    setGameId("");
    setTeam1Id("");
    setTeam2Id("");
    setMatchNumber("");

    // Reset stage
    setStage("LEAGUE");

    // Reset status
    setStatus("UPCOMING");

    // Reset overs
    setOvers("2");
  }

  // =====================================================
  // SUBMIT
  // =====================================================

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    // ---------------------------------------------------
    // REQUIRED FIELDS
    // ---------------------------------------------------

    if (
      !tournamentId ||
      !gameId ||
      !team1Id ||
      !team2Id ||
      !stage
    ) {
      toast.error(
        "Please fill in all required fields."
      );

      return;
    }

    // ---------------------------------------------------
    // SAME TEAM CHECK
    // ---------------------------------------------------

    if (team1Id === team2Id) {
      toast.error(
        "Team 1 and Team 2 must be different."
      );

      return;
    }

    // ---------------------------------------------------
    // MATCH NUMBER VALIDATION
    // ---------------------------------------------------

    if (
      matchNumber &&
      Number(matchNumber) < 1
    ) {
      toast.error(
        "Match number must be greater than 0."
      );

      return;
    }

    // ---------------------------------------------------
    // CRICKET OVERS VALIDATION
    // ---------------------------------------------------

    const selectedGame =
      games.find(
        (game) =>
          String(game.id) === gameId
      );

    if (
      selectedGame?.name === "Cricket" &&
      !["2", "3", "4", "5"].includes(overs)
    ) {
      toast.error(
        "Cricket overs must be between 2 and 5."
      );

      return;
    }

    setLoading(true);

    try {
      // -------------------------------------------------
      // CREATE MATCH
      // -------------------------------------------------

      const res = await fetch(
        "/api/matches",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            tournamentId:
              Number(tournamentId),

            gameId:
              Number(gameId),

            team1Id:
              Number(team1Id),

            team2Id:
              Number(team2Id),

            matchNumber:
              matchNumber
                ? Number(matchNumber)
                : null,

            // -------------------------------------------
            // MATCH STAGE
            // -------------------------------------------

            stage,

            // -------------------------------------------
            // STATUS
            // -------------------------------------------

            status,

            // -------------------------------------------
            // OVERS
            // -------------------------------------------

            overs:
              selectedGame?.name === "Cricket"
                ? Number(overs)
                : 2,
          }),
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Failed to create match."
        );
      }

      toast.success(
        "Match created successfully!"
      );

      resetForm();

      onMatchAdded();

      onClose();
    } catch (error) {
      console.error(
        "CREATE MATCH ERROR:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create match."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // SELECTED GAME
  // =====================================================

  const selectedGame =
    games.find(
      (game) =>
        String(game.id) === gameId
    );

  const isCricket =
    selectedGame?.name === "Cricket";

  // =====================================================
  // CLOSED
  // =====================================================

  if (!open) return null;

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex items-center justify-between border-b px-6 py-5">

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Add Match
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Create a new tournament match
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>

        </div>

        {/* =================================================
            FORM
        ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >

          {/* =================================================
              TOURNAMENT
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Tournament
            </label>

            <select
              value={tournamentId}
              onChange={(e) =>
                setTournamentId(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">
                Select Tournament
              </option>

              {tournaments.map(
                (tournament) => (
                  <option
                    key={tournament.id}
                    value={tournament.id}
                  >
                    {tournament.name}
                  </option>
                )
              )}
            </select>
          </div>

          {/* =================================================
              GAME
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Game
            </label>

            <select
              value={gameId}
              onChange={(e) => {
                setGameId(
                  e.target.value
                );

                // Reset cricket overs
                setOvers("2");
              }}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">
                Select Game
              </option>

              {games.map((game) => (
                <option
                  key={game.id}
                  value={game.id}
                >
                  {game.name}
                </option>
              ))}
            </select>
          </div>

          {/* =================================================
              MATCH STAGE
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Match Stage
            </label>

            <select
              value={stage}
              onChange={(e) =>
                setStage(e.target.value)
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="LEAGUE">
                League
              </option>

           
              <option value="FINAL">
                Final
              </option>
            </select>
          </div>

          {/* =================================================
              TEAM 1
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Team 1
            </label>

            <select
              value={team1Id}
              onChange={(e) =>
                setTeam1Id(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">
                Select Team 1
              </option>

              {teams.map((team) => (
                <option
                  key={team.id}
                  value={team.id}
                  disabled={
                    String(team.id) ===
                    team2Id
                  }
                >
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* =================================================
              TEAM 2
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Team 2
            </label>

            <select
              value={team2Id}
              onChange={(e) =>
                setTeam2Id(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">
                Select Team 2
              </option>

              {teams.map((team) => (
                <option
                  key={team.id}
                  value={team.id}
                  disabled={
                    String(team.id) ===
                    team1Id
                  }
                >
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* =================================================
              MATCH NUMBER
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Match Number
            </label>

            <input
              type="number"
              min="1"
              value={matchNumber}
              onChange={(e) =>
                setMatchNumber(
                  e.target.value
                )
              }
              placeholder="Example: 1"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* =================================================
              CRICKET OVERS
          ================================================= */}

          {isCricket && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Overs
              </label>

              <select
                value={overs}
                onChange={(e) =>
                  setOvers(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="2">
                  2 Overs
                </option>

                <option value="3">
                  3 Overs
                </option>

                <option value="4">
                  4 Overs
                </option>

                <option value="5">
                  5 Overs
                </option>
              </select>
            </div>
          )}

          {/* =================================================
              STATUS
          ================================================= */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Status
            </label>

            <select
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="UPCOMING">
                Upcoming
              </option>

              <option value="LIVE">
                Live
              </option>

              <option value="COMPLETED">
                Completed
              </option>
            </select>
          </div>

          {/* =================================================
              BUTTONS
          ================================================= */}

          <div className="flex justify-end gap-3 border-t pt-5">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Creating..."
                : "Create Match"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}