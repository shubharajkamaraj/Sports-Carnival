"use client";

import { useEffect, useMemo, useState } from "react";
import type { CompetitionGame } from "./types";

type Player = {
  id: number;
  name: string;
  teamId: number;
};

type Team = {
  id: number;
  name: string;
  players: Player[];
};

type ResultRow = {
  position: 1 | 2 | 3;
  teamId: number | null;
  playerId: number | null;
};

type SavedResult = {
  id: number;
  position: number;
  points: number;

  team: {
    id: number;
    name: string;
  };

  player: {
    id: number;
    name: string;
  };
};

type Props = {
  game: CompetitionGame;
  onBack: () => void;
};

const PLACE_INFO = {
  1: {
    title: "1st Place",
    medal: "🥇",
    points: 50,
  },

  2: {
    title: "2nd Place",
    medal: "🥈",
    points: 30,
  },

  3: {
    title: "3rd Place",
    medal: "🥉",
    points: 10,
  },
};

const EMPTY_RESULTS: ResultRow[] = [
  {
    position: 1,
    teamId: null,
    playerId: null,
  },
  {
    position: 2,
    teamId: null,
    playerId: null,
  },
  {
    position: 3,
    teamId: null,
    playerId: null,
  },
];

export default function CompetitionGameResult({
  game,
  onBack,
}: Props) {
  // =====================================================
  // ALL TEAMS
  // =====================================================

  const [teams, setTeams] = useState<Team[]>([]);

  // =====================================================
  // 4 PARTICIPATING TEAMS
  // =====================================================

  const [participatingTeamIds, setParticipatingTeamIds] =
    useState<(number | null)[]>([
      null,
      null,
      null,
      null,
    ]);

  // =====================================================
  // RESULTS
  // =====================================================

  const [results, setResults] =
    useState<ResultRow[]>(EMPTY_RESULTS);

  const [savedResults, setSavedResults] =
    useState<SavedResult[]>([]);

  // =====================================================
  // UI STATE
  // =====================================================

  const [loading, setLoading] = useState(true);
  const [savingTeams, setSavingTeams] = useState(false);
  const [savingResults, setSavingResults] = useState(false);
  const [message, setMessage] = useState("");

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    loadData();
  }, [game.id]);

  async function loadData() {
    try {
      setLoading(true);
      setMessage("");

      const [participationResponse, resultsResponse] =
        await Promise.all([
          fetch(
            `/api/competition-games/${game.id}/participation`,
            {
              cache: "no-store",
            }
          ),

          fetch(
            `/api/competition-games/${game.id}/results`,
            {
              cache: "no-store",
            }
          ),
        ]);

      const participationData =
        await participationResponse.json();

      const resultsData =
        await resultsResponse.json();

      console.log(
        "PARTICIPATION DATA:",
        participationData
      );

      console.log(
        "RESULT DATA:",
        resultsData
      );

      // ===================================================
      // ALL TEAMS
      // ===================================================

      if (participationData.success) {
        const allTeams =
          participationData.teams ?? [];

        setTeams(allTeams);

        // =================================================
        // EXISTING PARTICIPATING TEAMS
        // =================================================

        const selected =
          participationData.participatingTeams ?? [];

        setParticipatingTeamIds([
          selected[0]?.id ?? null,
          selected[1]?.id ?? null,
          selected[2]?.id ?? null,
          selected[3]?.id ?? null,
        ]);
      }

      // ===================================================
      // EXISTING RESULTS
      // ===================================================

      if (resultsData.success) {
        const loaded: SavedResult[] =
          resultsData.results ?? [];

        setSavedResults(loaded);

        setResults([
          {
            position: 1,
            teamId:
              loaded.find(
                (item) => item.position === 1
              )?.team.id ?? null,

            playerId:
              loaded.find(
                (item) => item.position === 1
              )?.player.id ?? null,
          },

          {
            position: 2,
            teamId:
              loaded.find(
                (item) => item.position === 2
              )?.team.id ?? null,

            playerId:
              loaded.find(
                (item) => item.position === 2
              )?.player.id ?? null,
          },

          {
            position: 3,
            teamId:
              loaded.find(
                (item) => item.position === 3
              )?.team.id ?? null,

            playerId:
              loaded.find(
                (item) => item.position === 3
              )?.player.id ?? null,
          },
        ]);
      }
    } catch (error) {
      console.error(
        "LOAD COMPETITION GAME ERROR:",
        error
      );

      setMessage(
        "Failed to load competition game."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // PARTICIPATING TEAMS
  // =====================================================

  const participatingTeams = useMemo(() => {
    return participatingTeamIds
      .map((id) =>
        teams.find(
          (team) => team.id === id
        )
      )
      .filter(
        (team): team is Team =>
          Boolean(team)
      );
  }, [
    participatingTeamIds,
    teams,
  ]);

  // =====================================================
  // GET PLAYERS FOR SELECTED TEAM
  // =====================================================

  function getPlayersForTeam(
    teamId: number | null
  ): Player[] {
    if (!teamId) {
      return [];
    }

    const team = teams.find(
      (item) => item.id === teamId
    );

    return team?.players ?? [];
  }

  // =====================================================
  // SELECT PARTICIPATING TEAM
  // =====================================================

  function selectParticipatingTeam(
    index: number,
    teamId: number | null
  ) {
    setParticipatingTeamIds(
      (current) => {
        const next = [...current];

        next[index] = teamId;

        return next;
      }
    );
  }

  // =====================================================
  // SAVE PARTICIPATING TEAMS
  // =====================================================

  async function saveParticipatingTeams() {
    if (
      participatingTeamIds.some(
        (id) => id === null
      )
    ) {
      setMessage(
        "Please select all 4 participating teams."
      );

      return;
    }

    const ids =
      participatingTeamIds.filter(
        (id): id is number =>
          id !== null
      );

    if (new Set(ids).size !== 4) {
      setMessage(
        "The same team cannot be selected more than once."
      );

      return;
    }

    try {
      setSavingTeams(true);
      setMessage("");

      const response = await fetch(
        `/api/competition-games/${game.id}/participation`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            teamIds: ids,
          }),
        }
      );

      const data =
        await response.json();

      if (!data.success) {
        setMessage(
          data.error ??
            "Failed to save participating teams."
        );

        return;
      }

      // =================================================
      // RESET RESULTS
      // =================================================

      setResults(EMPTY_RESULTS);
      setSavedResults([]);

      setMessage(
        "Participating teams saved successfully."
      );

      // Reload so players are definitely available
      await loadData();
    } catch (error) {
      console.error(
        "SAVE PARTICIPATING TEAMS ERROR:",
        error
      );

      setMessage(
        "Failed to save participating teams."
      );
    } finally {
      setSavingTeams(false);
    }
  }

  // =====================================================
  // RESULT TEAM CHANGE
  // =====================================================

  function changeResultTeam(
    position: 1 | 2 | 3,
    teamId: number | null
  ) {
    setResults((current) =>
      current.map((result) =>
        result.position === position  
          ? {
              ...result,

              teamId,

              // IMPORTANT:
              // Reset player whenever team changes
              playerId: null,
            }
          : result
      )
    );
  }

  // =====================================================
  // RESULT PLAYER CHANGE
  // =====================================================

  function changeResultPlayer(
    position: 1 | 2 | 3,
    playerId: number | null
  ) {
    setResults((current) =>
      current.map((result) =>
        result.position === position
          ? {
              ...result,
              playerId,
            }
          : result
      )
    );
  }

  // =====================================================
  // SAVE RESULTS
  // =====================================================

  async function saveResults() {
    if (participatingTeams.length !== 4) {
      setMessage(
        "Please save 4 participating teams first."
      );

      return;
    }

    const incomplete = results.some(
      (result) =>
        result.teamId === null ||
        result.playerId === null
    );

    if (incomplete) {
      setMessage(
        "Please select a team and player for 1st, 2nd and 3rd place."
      );

      return;
    }

    // ===================================================
    // CHECK DUPLICATE WINNING TEAM
    // ===================================================

    const teamIds = results.map(
      (result) => result.teamId
    );

    if (new Set(teamIds).size !== 3) {
      setMessage(
        "A team cannot win more than one place."
      );

      return;
    }

    // ===================================================
    // CHECK PLAYER BELONGS TO SELECTED TEAM
    // ===================================================

    for (const result of results) {
      if (
        result.teamId === null ||
        result.playerId === null
      ) {
        continue;
      }

      const players =
        getPlayersForTeam(
          result.teamId
        );

      const playerExists =
        players.some(
          (player) =>
            player.id ===
            result.playerId
        );

      if (!playerExists) {
        setMessage(
          "Selected player does not belong to the selected team."
        );

        return;
      }
    }

    try {
      setSavingResults(true);
      setMessage("");

      const response = await fetch(
        `/api/competition-games/${game.id}/results`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            results:
              results.map(
                (result) => ({
                  position:
                    result.position,

                  teamId:
                    result.teamId,

                  playerId:
                    result.playerId,
                })
              ),
          }),
        }
      );

      const data =
        await response.json();

      if (!data.success) {
        setMessage(
          data.error ??
            "Failed to save results."
        );

        return;
      }

      setSavedResults(
        data.results ?? []
      );

      setMessage(
        "Results saved successfully."
      );
    } catch (error) {
      console.error(
        "SAVE RESULTS ERROR:",
        error
      );

      setMessage(
        "Failed to save results."
      );
    } finally {
      setSavingResults(false);
    }
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-8">
          Loading...
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="mb-6 flex items-start gap-4">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            ← Back
          </button>

          <div>
            <p className="text-sm font-semibold text-blue-600">
              {game.category}
            </p>

            <h1 className="text-3xl font-bold text-slate-900">
              {game.name}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Select 4 participating teams and enter
              the final results.
            </p>
          </div>
        </div>

        {/* ================================================= */}
        {/* MESSAGE */}
        {/* ================================================= */}

        {message && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
            {message}
          </div>
        )}

        {/* ================================================= */}
        {/* PARTICIPATING TEAMS */}
        {/* ================================================= */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Participating Teams
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Select exactly 4 teams participating in this
              game.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {participatingTeamIds.map(
              (selectedTeamId, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Team {index + 1}
                  </label>

                  <select
                    value={
                      selectedTeamId ?? ""
                    }
                    onChange={(event) =>
                      selectParticipatingTeam(
                        index,
                        event.target.value
                          ? Number(
                              event.target.value
                            )
                          : null
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-black text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">
                      Select team
                    </option>

                    {teams.map(
                      (team) => {
                        const alreadySelected =
                          participatingTeamIds.some(
                            (
                              id,
                              teamIndex
                            ) =>
                              id ===
                                team.id &&
                              teamIndex !==
                                index
                          );

                        return (
                          <option
                            key={team.id}
                            value={team.id}
                            disabled={
                              alreadySelected
                            }
                          >
                            {team.name}
                          </option>
                        );
                      }
                    )}
                  </select>
                </div>
              )
            )}
          </div>

          <button
            type="button"
            onClick={
              saveParticipatingTeams
            }
            disabled={savingTeams}
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingTeams
              ? "Saving..."
              : "Save Participating Teams"}
          </button>
        </div>

        {/* ================================================= */}
        {/* RESULTS */}
        {/* ================================================= */}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Results
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Select the winning team and the player who
              represented that team.
            </p>
          </div>

          <div className="space-y-5">

            {results.map((result) => {
              const info =
                PLACE_INFO[result.position];

              const players =
                getPlayersForTeam(
                  result.teamId
                );

              return (
                <div
                  key={result.position}
                  className="rounded-2xl border border-slate-200 p-5"
                >

                  {/* PLACE HEADER */}

                  <div className="mb-5 flex items-center justify-between">

                    <div className="flex items-center gap-3">

                      <span className="text-3xl">
                        {info.medal}
                      </span>

                      <div>
                        <h3 className="font-bold text-slate-900">
                          {info.title}
                        </h3>

                        <p className="text-sm text-slate-500">
                          Winner receives{" "}
                          {info.points} points
                        </p>
                      </div>

                    </div>

                    <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
                      +{info.points} points
                    </div>

                  </div>

                  {/* TEAM + PLAYER */}

                  <div className="grid gap-4 md:grid-cols-2">

                    {/* TEAM */}

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Team
                      </label>

                      <select
                        value={
                          result.teamId ?? ""
                        }
                        onChange={(event) =>
                          changeResultTeam(
                            result.position,
                            event.target.value
                              ? Number(
                                  event.target.value
                                )
                              : null
                          )
                        }
                        disabled={
                          participatingTeams.length !==
                          4
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none disabled:bg-slate-100 disabled:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >

                        <option value="">
                          Select team
                        </option>

                        {participatingTeams.map(
                          (team) => {

                            const usedByOtherPlace =
                              results.some(
                                (other) =>
                                  other.position !==
                                    result.position &&
                                  other.teamId ===
                                    team.id
                              );

                            return (
                              <option
                                key={team.id}
                                value={team.id}
                                disabled={
                                  usedByOtherPlace
                                }
                              >
                                {team.name}
                              </option>
                            );
                          }
                        )}

                      </select>
                    </div>

                    {/* PLAYER */}

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Player
                      </label>

                      <select
                        value={
                          result.playerId ?? ""
                        }
                        disabled={
                          !result.teamId
                        }
                        onChange={(event) =>
                          changeResultPlayer(
                            result.position,
                            event.target.value
                              ? Number(
                                  event.target.value
                                )
                              : null
                          )
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >

                        <option value="">
                          {!result.teamId
                            ? "Select team first"
                            : players.length ===
                              0
                            ? "No players found"
                            : "Select player"}
                        </option>

                        {players.map(
                          (player) => (
                            <option
                              key={player.id}
                              value={player.id}
                            >
                              {player.name}
                            </option>
                          )
                        )}

                      </select>

                      {/* DEBUG / INFORMATION */}

                      {result.teamId &&
                        players.length ===
                          0 && (
                          <p className="mt-2 text-xs text-red-500">
                            No players found for
                            this team.
                          </p>
                        )}
                    </div>

                  </div>
                </div>
              );
            })}

          </div>

          {/* SAVE RESULTS */}

          <button
            type="button"
            onClick={saveResults}
            disabled={
              savingResults ||
              participatingTeams.length !== 4
            }
            className="mt-6 w-full rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingResults
              ? "Saving Results..."
              : "Save Results"}
          </button>

        </div>

        {/* ================================================= */}
        {/* SAVED RESULTS */}
        {/* ================================================= */}

        {savedResults.length > 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="mb-5 text-xl font-bold text-slate-900">
              Saved Results
            </h2>

            <div className="space-y-3">

              {savedResults.map(
                (result) => {

                  const position =
                    result.position as
                      | 1
                      | 2
                      | 3;

                  return (
                    <div
                      key={result.id}
                      className="flex items-center justify-between rounded-xl bg-slate-50 p-4"
                    >

                      <div className="flex items-center gap-3">

                        <span className="text-2xl">
                          {
                            PLACE_INFO[
                              position
                            ].medal
                          }
                        </span>

                        <div>

                          <p className="font-bold text-slate-900">
                            {result.team.name}
                          </p>

                          <p className="text-sm text-slate-500">
                            {result.player.name}
                          </p>

                        </div>

                      </div>

                      <div className="font-bold text-blue-600">
                        +{result.points}
                      </div>

                    </div>
                  );
                }
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}