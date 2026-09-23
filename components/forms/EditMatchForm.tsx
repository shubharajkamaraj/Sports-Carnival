
"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

// =====================================================
// TYPES
// =====================================================

interface Tournament {
  id: number;
  name: string;
}

interface Team {
  id: number;
  name: string;
}

interface Game {
  id: number;
  name: string;

  sportType:
    | "CRICKET"
    | "FOOTBALL"
    | "THROWBALL"
    | "HANDBALL"
    | null;
}

// =====================================================
// MATCH STAGE
// =====================================================

type MatchStage =
  | "LEAGUE"
  | "THIRD_PLACE"
  | "FINAL";

// =====================================================
// MATCH
// =====================================================

interface Match {
  id: number;

  tournamentId: number;
  gameId: number;

  team1Id: number;
  team2Id: number;

  matchNumber: number | null;

  stage: MatchStage;

  status:
    | "UPCOMING"
    | "LIVE"
    | "COMPLETED"
    | "CANCELLED";

  result:
    | "TEAM1_WIN"
    | "TEAM2_WIN"
    | "DRAW"
    | "TIE"
    | "NO_RESULT"
    | null;

  winnerTeamId: number | null;

  // IMPORTANT
  // Required by MatchTable and Prisma Match
  overs: number;

  team1Score: number;
  team2Score: number;

  tournament: Tournament;
  game: Game;

  team1: Team;
  team2: Team;
}

// =====================================================
// PROPS
// =====================================================

interface Props {
  open: boolean;

  onClose: () => void;

  match: Match | null;

  onUpdated: () => void;
}

// =====================================================
// COMPONENT
// =====================================================

export default function EditMatchForm({
  open,
  onClose,
  match,
  onUpdated,
}: Props) {
  // =====================================================
  // DATA
  // =====================================================

  const [tournaments, setTournaments] =
    useState<Tournament[]>([]);

  const [games, setGames] =
    useState<Game[]>([]);

  const [teams, setTeams] =
    useState<Team[]>([]);

  // =====================================================
  // FORM STATE
  // =====================================================

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

  const [stage, setStage] =
    useState<MatchStage>("LEAGUE");

  const [overs, setOvers] =
    useState("2");

  const [loading, setLoading] =
    useState(false);

  // =====================================================
  // LOAD MATCH INTO FORM
  // =====================================================

  useEffect(() => {
    if (!open || !match) {
      return;
    }

    setTournamentId(
      String(match.tournamentId)
    );

    setGameId(
      String(match.gameId)
    );

    setTeam1Id(
      String(match.team1Id)
    );

    setTeam2Id(
      String(match.team2Id)
    );

    setMatchNumber(
      match.matchNumber !== null &&
        match.matchNumber !== undefined
        ? String(match.matchNumber)
        : ""
    );

    setStage(
      match.stage ?? "LEAGUE"
    );

    setOvers(
      match.overs !== null &&
        match.overs !== undefined
        ? String(match.overs)
        : "2"
    );

    loadData();
  }, [open, match]);

  // =====================================================
  // LOAD TOURNAMENTS + GAMES + TEAMS
  // =====================================================

  async function loadData() {
    try {
      const [
        tournamentsRes,
        gamesRes,
        teamsRes,
      ] = await Promise.all([
        fetch("/api/tournaments", {
          cache: "no-store",
        }),

        fetch("/api/games", {
          cache: "no-store",
        }),

        fetch("/api/teams", {
          cache: "no-store",
        }),
      ]);

      // =================================================
      // READ RESPONSE TEXT
      // =================================================

      const tournamentsText =
        await tournamentsRes.text();

      const gamesText =
        await gamesRes.text();

      const teamsText =
        await teamsRes.text();

      // =================================================
      // RESPONSE VALIDATION
      // =================================================

      if (!tournamentsRes.ok) {
        throw new Error(
          tournamentsText ||
            "Failed to load tournaments."
        );
      }

      if (!gamesRes.ok) {
        throw new Error(
          gamesText ||
            "Failed to load games."
        );
      }

      if (!teamsRes.ok) {
        throw new Error(
          teamsText ||
            "Failed to load teams."
        );
      }

      // =================================================
      // PARSE TOURNAMENTS
      // =================================================

      let tournamentsData:
        Tournament[] = [];

      try {
        tournamentsData =
          tournamentsText
            ? JSON.parse(
                tournamentsText
              )
            : [];
      } catch {
        throw new Error(
          "Tournament API returned invalid JSON."
        );
      }

      // =================================================
      // PARSE GAMES
      // =================================================

      let gamesData:
        Game[] = [];

      try {
        gamesData =
          gamesText
            ? JSON.parse(
                gamesText
              )
            : [];
      } catch {
        throw new Error(
          "Games API returned invalid JSON."
        );
      }

      // =================================================
      // PARSE TEAMS
      // =================================================

      let teamsData:
        Team[] = [];

      try {
        teamsData =
          teamsText
            ? JSON.parse(
                teamsText
              )
            : [];
      } catch {
        throw new Error(
          "Teams API returned invalid JSON."
        );
      }

      // =================================================
      // SET DATA
      // =================================================

      setTournaments(
        Array.isArray(
          tournamentsData
        )
          ? tournamentsData
          : []
      );

      setGames(
        Array.isArray(gamesData)
          ? gamesData
          : []
      );

      setTeams(
        Array.isArray(teamsData)
          ? teamsData
          : []
      );
    } catch (error) {
      console.error(
        "LOAD EDIT MATCH DATA ERROR:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to load match data."
      );
    }
  }

  // =====================================================
  // SELECTED GAME
  // =====================================================

  const selectedGame =
    games.find(
      (game) =>
        game.id ===
        Number(gameId)
    );

  // =====================================================
  // UPDATE MATCH
  // =====================================================

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!match) {
      return;
    }

    // ===================================================
    // REQUIRED VALIDATION
    // ===================================================

    if (!tournamentId) {
      toast.error(
        "Please select a tournament."
      );
      return;
    }

    if (!gameId) {
      toast.error(
        "Please select a game."
      );
      return;
    }

    if (!team1Id) {
      toast.error(
        "Please select Team 1."
      );
      return;
    }

    if (!team2Id) {
      toast.error(
        "Please select Team 2."
      );
      return;
    }

    if (!stage) {
      toast.error(
        "Please select a match stage."
      );
      return;
    }

    // ===================================================
    // SAME TEAM VALIDATION
    // ===================================================

    if (team1Id === team2Id) {
      toast.error(
        "Team 1 and Team 2 must be different."
      );
      return;
    }

    // ===================================================
    // GAME VALIDATION
    // ===================================================

    if (!selectedGame) {
      toast.error(
        "Selected game was not found."
      );
      return;
    }

    // ===================================================
    // CONVERT IDS
    // ===================================================

    const tournamentIdNumber =
      Number(tournamentId);

    const gameIdNumber =
      Number(gameId);

    const team1IdNumber =
      Number(team1Id);

    const team2IdNumber =
      Number(team2Id);

    if (
      !Number.isInteger(
        tournamentIdNumber
      ) ||
      !Number.isInteger(
        gameIdNumber
      ) ||
      !Number.isInteger(
        team1IdNumber
      ) ||
      !Number.isInteger(
        team2IdNumber
      )
    ) {
      toast.error(
        "Invalid tournament, game or team."
      );
      return;
    }

    // ===================================================
    // MATCH NUMBER
    // ===================================================

    let matchNumberValue:
      number | null = null;

    if (
      matchNumber.trim() !== ""
    ) {
      const parsedMatchNumber =
        Number(matchNumber);

      if (
        !Number.isInteger(
          parsedMatchNumber
        ) ||
        parsedMatchNumber < 1
      ) {
        toast.error(
          "Match number must be a positive number."
        );
        return;
      }

      matchNumberValue =
        parsedMatchNumber;
    }

    // ===================================================
    // CRICKET OVERS
    // ===================================================

    let oversNumber = 2;

    if (
      selectedGame.sportType ===
      "CRICKET"
    ) {
      if (!overs) {
        toast.error(
          "Please select the number of overs."
        );
        return;
      }

      oversNumber =
        Number(overs);

      // Keep this consistent with
      // your current Add Match API.
      if (
        ![2, 3, 4, 5].includes(
          oversNumber
        )
      ) {
        toast.error(
          "Cricket overs must be between 2 and 5."
        );
        return;
      }
    }

    // ===================================================
    // UPDATE
    // ===================================================

    try {
      setLoading(true);

      const body = {
        tournamentId:
          tournamentIdNumber,

        gameId:
          gameIdNumber,

        team1Id:
          team1IdNumber,

        team2Id:
          team2IdNumber,

        matchNumber:
          matchNumberValue,

        stage,

        overs:
          oversNumber,
      };

      const res =
        await fetch(
          `/api/matches/${match.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              body
            ),
          }
        );

      // =================================================
      // SAFE RESPONSE
      // =================================================

      const responseText =
        await res.text();

      let data: {
        error?: string;
        message?: string;
      } = {};

      if (responseText) {
        try {
          data =
            JSON.parse(
              responseText
            );
        } catch {
          console.error(
            "API returned non-JSON response:",
            responseText
          );
        }
      }

      // =================================================
      // API ERROR
      // =================================================

      if (!res.ok) {
        throw new Error(
          data.error ||
            data.message ||
            responseText ||
            `Failed to update match (${res.status})`
        );
      }

      // =================================================
      // SUCCESS
      // =================================================

      toast.success(
        "Match updated successfully!"
      );

      onUpdated();

      onClose();
    } catch (error) {
      console.error(
        "UPDATE MATCH ERROR:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update match."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // STAGE LABEL
  // =====================================================

  function stageLabel(
    value: MatchStage
  ) {
    switch (value) {
      case "LEAGUE":
        return "League";

      case "THIRD_PLACE":
        return "3rd Place";

      case "FINAL":
        return "Final";

      default:
        return value;
    }
  }

  // =====================================================
  // CLOSE
  // =====================================================

  if (!open || !match) {
    return null;
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex items-center justify-between border-b p-6">

          <div>
            <h2 className="text-2xl font-bold text-black">
              Edit Match
            </h2>

            <p className="mt-1 text-sm text-black">
              Update match details
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 transition hover:bg-gray-100 disabled:opacity-50"
          >
            <X size={22} />
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

            <label className="mb-2 block text-sm font-medium text-black">
              Tournament
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <select
              value={tournamentId}
              onChange={(e) =>
                setTournamentId(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-black outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            >

              <option value="">
                Select Tournament
              </option>

              {tournaments.map(
                (tournament) => (
                  <option
                    key={
                      tournament.id
                    }
                    value={
                      tournament.id
                    }
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

            <label className="mb-2 block text-sm font-medium text-black">
              Game
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <select
              value={gameId}
              onChange={(e) =>
                setGameId(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-black outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
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
              TEAM 1
          ================================================= */}

          <div>

            <label className="mb-2 block text-sm font-medium text-black">
              Team 1
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <select
              value={team1Id}
              onChange={(e) =>
                setTeam1Id(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-black outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
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

            <label className="mb-2 block text-sm font-medium text-black">
              Team 2
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <select
              value={team2Id}
              onChange={(e) =>
                setTeam2Id(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-black outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
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

            <label className="mb-2 block text-sm font-medium text-black">

              Match Number

              <span className="ml-2 text-xs font-normal text-slate-400">
                Optional
              </span>

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
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-black outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

          </div>

          {/* =================================================
              STAGE
          ================================================= */}

          <div>

            <label className="mb-2 block text-sm font-medium text-black">
              Stage

              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <select
              value={stage}
              onChange={(e) =>
                setStage(
                  e.target.value as MatchStage
                )
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-black outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            >

              <option value="LEAGUE">
                {stageLabel(
                  "LEAGUE"
                )}
              </option>

              <option value="THIRD_PLACE">
                {stageLabel(
                  "THIRD_PLACE"
                )}
              </option>

              <option value="FINAL">
                {stageLabel(
                  "FINAL"
                )}
              </option>

            </select>

          </div>

          {/* =================================================
              CRICKET OVERS
          ================================================= */}

          {selectedGame?.sportType ===
            "CRICKET" && (

            <div>

              <label className="mb-2 block text-sm font-medium text-black">
                Overs

                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <select
                value={overs}
                onChange={(e) =>
                  setOvers(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-black outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              >

                <option value="">
                  Select Overs
                </option>

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
              BUTTONS
          ================================================= */}

          <div className="flex justify-end gap-3 pt-2">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-300 px-5 py-3 font-medium text-black transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Updating..."
                : "Update Match"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

