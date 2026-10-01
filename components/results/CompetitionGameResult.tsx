"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Medal,
  Plus,
  Save,
  Trash2,
  Trophy,
  Users,
  X,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

type Props = {
  game: Game;
  onBack?: () => void;
};

type Player = {
  id: number;
  name: string;
  jerseyNo: number | null;
};

type ParticipatingTeam = {
  id: number;
  name: string;
  players: Player[];
};

type Game = {
  id: number;
  name: string;
  sportType?: string | null;
};

type RoundPlayer = {
  playerId: number;
  teamId: number;
  position: number | null;
  qualified: boolean;
};

type PreliminaryRound = {
  id: string;
  roundNumber: number;
  players: RoundPlayer[];
  saved: boolean;
};

type Position = 1 | 2 | 3 | 4;

type FinalPlayer = {
  playerId: number;
  teamId: number;
  position: Position;
};

type SavedResult = {
  id: number;
  gameId: number;
  teamId: number;
  playerId: number | null;
  round: number;
  position: number;
  points: number;
  team?: {
    id: number;
    name: string;
  } | null;
  player?: {
    id: number;
    name: string;
    jerseyNo: number | null;
  } | null;
};

const FINAL_POINTS: Record<Position, number> = {
  1: 50,
  2: 30,
  3: 10,
  4: 0,
};

const PLACE_INFO: Record<
  Position,
  {
    label: string;
    medal: string;
    points: number;
  }
> = {
  1: {
    label: "1st Place",
    medal: "🥇",
    points: 50,
  },
  2: {
    label: "2nd Place",
    medal: "🥈",
    points: 30,
  },
  3: {
    label: "3rd Place",
    medal: "🥉",
    points: 10,
  },
  4: {
    label: "4th Place",
    medal: "🏅",
    points: 0,
  },
};

function getStorageKey(gameId: number) {
  return `competition-flexible-rounds-${gameId}`;
}

function createRound(roundNumber: number): PreliminaryRound {
  return {
    id: `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`,
    roundNumber,
    players: [],
    saved: false,
  };
}

export default function CompetitionGameResult({
  game,
  onBack,
}: Props) {
  /*
   * =========================================================
   * STATE
   * =========================================================
   */

  const [teams, setTeams] = useState<ParticipatingTeam[]>(
    []
  );

  const [rounds, setRounds] = useState<
    PreliminaryRound[]
  >([]);

  const [finalPlayers, setFinalPlayers] = useState<
    FinalPlayer[]
  >([]);

  const [savedResults, setSavedResults] = useState<
    SavedResult[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [savingRound, setSavingRound] =
    useState<string | null>(null);

  const [savingFinal, setSavingFinal] =
    useState(false);

  const [clearingResults, setClearingResults] =
    useState(false);

  const [error, setError] = useState<string | null>(
    null
  );

  const [message, setMessage] =
    useState<string | null>(null);

  /*
   * ---------------------------------------------------------
   * FINAL TEAM / PLAYER SELECTION
   * ---------------------------------------------------------
   */

  const [selectedTeamId, setSelectedTeamId] =
    useState<number | "">("");

  const [selectedPlayerId, setSelectedPlayerId] =
    useState<number | "">("");

  /*
   * ---------------------------------------------------------
   * PRELIMINARY ROUND TEAM / PLAYER SELECTION
   * ---------------------------------------------------------
   */

  const [roundSelections, setRoundSelections] =
    useState<
      Record<
        string,
        {
          teamId: number | "";
          playerId: number | "";
        }
      >
    >({});

  /*
   * ---------------------------------------------------------
   * IMPORTANT:
   * Prevent localStorage from being overwritten before
   * existing data has been loaded.
   * ---------------------------------------------------------
   */

  const [roundsHydrated, setRoundsHydrated] =
    useState(false);

  /*
   * =========================================================
   * LOAD DATA
   * =========================================================
   */

  useEffect(() => {
    loadData();
  }, [game.id]);

  /*
   * =========================================================
   * LOAD LOCAL PRELIMINARY ROUNDS
   * =========================================================
   */

  useEffect(() => {
    if (typeof window === "undefined") return;

    const key = getStorageKey(game.id);

    try {
      const stored = localStorage.getItem(key);

      if (!stored) {
        setRounds([]);
        setRoundsHydrated(true);
        return;
      }

      const parsed = JSON.parse(stored);

      if (Array.isArray(parsed)) {
        setRounds(parsed);
      } else {
        setRounds([]);
      }
    } catch (err) {
      console.error(
        "Failed to load preliminary rounds:",
        err
      );

      setRounds([]);
    } finally {
      setRoundsHydrated(true);
    }
  }, [game.id]);

  /*
   * =========================================================
   * PERSIST PRELIMINARY ROUNDS
   * =========================================================
   */

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !roundsHydrated
    ) {
      return;
    }

    localStorage.setItem(
      getStorageKey(game.id),
      JSON.stringify(rounds)
    );
  }, [game.id, rounds, roundsHydrated]);

  /*
   * =========================================================
   * LOAD API DATA
   * =========================================================
   */

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      /*
       * -----------------------------------------------------
       * LOAD PARTICIPATION
       * -----------------------------------------------------
       */

      const participationResponse =
        await fetch(
          `/api/competition-games/${game.id}/participation`,
          {
            cache: "no-store",
          }
        );

      const participationData =
        await participationResponse.json();

      console.log(
        "PARTICIPATION API:",
        participationData
      );

      if (
        !participationResponse.ok ||
        !participationData.success
      ) {
        throw new Error(
          participationData.error ||
            participationData.message ||
            "Failed to load teams."
        );
      }

      /*
       * IMPORTANT FIX
       *
       * Your API currently returns:
       *
       * participatingTeams: []
       *
       * but:
       *
       * teams: [4 teams]
       *
       * Therefore use participatingTeams when available,
       * otherwise fall back to teams.
       */

      const loadedTeams =
        Array.isArray(
          participationData.participatingTeams
        ) &&
        participationData.participatingTeams.length > 0
          ? participationData.participatingTeams
          : Array.isArray(
                participationData.teams
              )
            ? participationData.teams
            : [];

      const normalizedTeams: ParticipatingTeam[] =
        loadedTeams.map((team: any) => ({
          id: Number(team.id),

          name: String(
            team.name ?? `Team ${team.id}`
          ),

          players: Array.isArray(team.players)
            ? team.players.map(
                (player: any) => ({
                  id: Number(player.id),

                  name: String(
                    player.name ??
                      `Player ${player.id}`
                  ),

                  jerseyNo:
                    player.jerseyNo == null
                      ? null
                      : Number(
                          player.jerseyNo
                        ),
                })
              )
            : [],
        }));

      setTeams(normalizedTeams);

      /*
       * -----------------------------------------------------
       * LOAD SAVED RESULTS
       * -----------------------------------------------------
       */

      try {
        const resultsResponse =
          await fetch(
            `/api/competition-games/${game.id}/results`,
            {
              cache: "no-store",
            }
          );

        const resultsData =
          await resultsResponse.json();

        console.log(
          "RESULTS API:",
          resultsData
        );

        if (
          resultsResponse.ok &&
          resultsData.success &&
          Array.isArray(resultsData.results)
        ) {
          setSavedResults(
            resultsData.results
          );
        } else {
          setSavedResults([]);
        }
      } catch (resultsError) {
        console.error(
          "Failed to load results:",
          resultsError
        );

        setSavedResults([]);
      }
    } catch (err) {
      console.error(
        "Competition result load error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load competition data."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * =========================================================
   * VALID SAVED FINAL
   *
   * Old rows like:
   *
   * playerId: null
   * points: 100
   *
   * are NOT considered a valid saved Final.
   * =========================================================
   */

  const hasValidSavedFinal = useMemo(() => {
    if (savedResults.length !== 4) {
      return false;
    }

    const positions = savedResults.map(
      (result) => result.position
    );

    const validPositions =
      positions.length === 4 &&
      new Set(positions).size === 4 &&
      [1, 2, 3, 4].every((position) =>
        positions.includes(position)
      );

    if (!validPositions) {
      return false;
    }

    const allPlayersValid =
      savedResults.every(
        (result) =>
          result.playerId !== null &&
          result.teamId > 0
      );

    if (!allPlayersValid) {
      return false;
    }

    return true;
  }, [savedResults]);

  /*
   * Old/broken database rows.
   */

  const hasInvalidOldResults =
    savedResults.length > 0 &&
    !hasValidSavedFinal;

  /*
   * =========================================================
   * TEAM HELPERS
   * =========================================================
   */

  function getTeam(teamId: number) {
    return teams.find(
      (team) => team.id === teamId
    );
  }

  function getTeamName(teamId: number) {
    return (
      getTeam(teamId)?.name ??
      "Unknown Team"
    );
  }

  function getPlayer(playerId: number) {
    for (const team of teams) {
      const player = team.players.find(
        (item) => item.id === playerId
      );

      if (player) {
        return player;
      }
    }

    return null;
  }

  function getPlayersForTeam(
    teamId: number | ""
  ) {
    if (teamId === "") {
      return [];
    }

    return (
      getTeam(Number(teamId))?.players ??
      []
    );
  }

  /*
   * =========================================================
   * LOCAL STORAGE HELPERS
   * =========================================================
   */

  function persistRounds(
    nextRounds: PreliminaryRound[]
  ) {
    setRounds(nextRounds);

    if (
      typeof window !== "undefined"
    ) {
      localStorage.setItem(
        getStorageKey(game.id),
        JSON.stringify(nextRounds)
      );
    }
  }

  /*
   * =========================================================
   * PRELIMINARY ROUND HELPERS
   * =========================================================
   */

  function getRoundSelection(
    roundId: string
  ) {
    return (
      roundSelections[roundId] ?? {
        teamId: "",
        playerId: "",
      }
    );
  }

  function getPlayersUsedBeforeRound(
    roundIndex: number
  ) {
    const used = new Set<number>();

    for (
      let index = 0;
      index < roundIndex;
      index++
    ) {
      for (const player of rounds[index]
        .players) {
        used.add(player.playerId);
      }
    }

    return used;
  }

  /*
   * =========================================================
   * CHANGE PRELIMINARY TEAM
   * =========================================================
   */

  function changeRoundTeam(
    roundId: string,
    teamId: number | ""
  ) {
    setRoundSelections(
      (previous) => ({
        ...previous,

        [roundId]: {
          teamId,
          playerId: "",
        },
      })
    );
  }

  /*
   * =========================================================
   * CHANGE PRELIMINARY PLAYER
   * =========================================================
   */

  function changeRoundPlayer(
    roundId: string,
    playerId: number | ""
  ) {
    const current =
      getRoundSelection(roundId);

    setRoundSelections(
      (previous) => ({
        ...previous,

        [roundId]: {
          teamId: current.teamId,
          playerId,
        },
      })
    );
  }

  /*
   * =========================================================
   * ADD PLAYER TO PRELIMINARY ROUND
   * =========================================================
   */

  function addPlayerToRound(
    roundIndex: number
  ) {
    const round = rounds[roundIndex];

    if (!round) return;

    const selection =
      getRoundSelection(round.id);

    if (
      selection.teamId === "" ||
      selection.playerId === ""
    ) {
      setError(
        "Please select both a team and a player."
      );
      return;
    }

    if (round.players.length >= 4) {
      setError(
        "Each preliminary round can contain exactly 4 players."
      );
      return;
    }

    const teamId = Number(
      selection.teamId
    );

    const playerId = Number(
      selection.playerId
    );

    /*
     * Player cannot be reused from an earlier round.
     */

    const usedBefore =
      getPlayersUsedBeforeRound(
        roundIndex
      );

    if (usedBefore.has(playerId)) {
      setError(
        "This player was already used in an earlier preliminary round."
      );
      return;
    }

    /*
     * Player cannot appear twice in same round.
     */

    if (
      round.players.some(
        (item) =>
          item.playerId === playerId
      )
    ) {
      setError(
        "This player is already added to this round."
      );
      return;
    }

    /*
     * Verify player belongs to selected team.
     */

    const team = getTeam(teamId);

    const player =
      team?.players.find(
        (item) =>
          item.id === playerId
      );

    if (!team || !player) {
      setError(
        "Selected player does not belong to the selected team."
      );
      return;
    }

    const nextRounds = [...rounds];

    nextRounds[roundIndex] = {
      ...round,

      saved: false,

      players: [
        ...round.players,

        {
          playerId,
          teamId,
          position: null,
          qualified: false,
        },
      ],
    };

    persistRounds(nextRounds);

    setRoundSelections(
      (previous) => ({
        ...previous,

        [round.id]: {
          teamId: "",
          playerId: "",
        },
      })
    );

    setError(null);

    setMessage(
      `${player.name} added to Round ${round.roundNumber}.`
    );
  }

  /*
   * =========================================================
   * REMOVE PRELIMINARY PLAYER
   * =========================================================
   */

  function removePlayerFromRound(
    roundIndex: number,
    playerId: number
  ) {
    const round = rounds[roundIndex];

    if (!round) return;

    const nextRounds = [...rounds];

    nextRounds[roundIndex] = {
      ...round,

      saved: false,

      players:
        round.players.filter(
          (player) =>
            player.playerId !==
            playerId
        ),
    };

    persistRounds(nextRounds);

    setError(null);
  }

  /*
   * =========================================================
   * PRELIMINARY POSITION
   *
   * TIES ARE ALLOWED.
   * =========================================================
   */

  function updateRoundPosition(
    roundIndex: number,
    playerId: number,
    position: number | null
  ) {
    const round = rounds[roundIndex];

    if (!round) return;

    const nextRounds = [...rounds];

    nextRounds[roundIndex] = {
      ...round,

      saved: false,

      players:
        round.players.map(
          (player) =>
            player.playerId ===
            playerId
              ? {
                  ...player,
                  position,
                }
              : player
        ),
    };

    persistRounds(nextRounds);
  }

  /*
   * =========================================================
   * QUALIFY PLAYER
   * =========================================================
   */

  function toggleQualified(
    roundIndex: number,
    playerId: number
  ) {
    const round = rounds[roundIndex];

    if (!round) return;

    const nextRounds = [...rounds];

    nextRounds[roundIndex] = {
      ...round,

      saved: false,

      players:
        round.players.map(
          (player) =>
            player.playerId ===
            playerId
              ? {
                  ...player,
                  qualified:
                    !player.qualified,
                }
              : player
        ),
    };

    persistRounds(nextRounds);

    setError(null);
  }

  /*
   * =========================================================
   * SAVE PRELIMINARY ROUND
   *
   * LOCALSTORAGE ONLY.
   * =========================================================
   */

  function savePreliminaryRound(
    roundIndex: number
  ) {
    const round = rounds[roundIndex];

    if (!round) return;

    if (round.players.length !== 4) {
      setError(
        `Round ${round.roundNumber} must contain exactly 4 players.`
      );
      return;
    }

    const nextRounds = [...rounds];

    nextRounds[roundIndex] = {
      ...round,
      saved: true,
    };

    persistRounds(nextRounds);

    setSavingRound(round.id);

    window.setTimeout(() => {
      setSavingRound(null);
    }, 400);

    setError(null);

    setMessage(
      `Round ${round.roundNumber} saved locally.`
    );
  }

  /*
   * =========================================================
   * ADD PRELIMINARY ROUND
   * =========================================================
   */

  function addPreliminaryRound() {
    if (teams.length !== 4) {
      setError(
        "Exactly 4 participating teams are required."
      );
      return;
    }

    const nextRoundNumber =
      rounds.length === 0
        ? 1
        : Math.max(
            ...rounds.map(
              (round) =>
                round.roundNumber
            )
          ) + 1;

    const newRound =
      createRound(nextRoundNumber);

    const nextRounds = [
      ...rounds,
      newRound,
    ];

    persistRounds(nextRounds);

    setError(null);

    setMessage(
      `Round ${nextRoundNumber} created.`
    );
  }

  /*
   * =========================================================
   * DELETE PRELIMINARY ROUND
   * =========================================================
   */

  function deletePreliminaryRound(
    roundIndex: number
  ) {
    const round = rounds[roundIndex];

    if (!round) return;

    const confirmed =
      window.confirm(
        `Delete Preliminary Round ${round.roundNumber}?`
      );

    if (!confirmed) return;

    const nextRounds = rounds
      .filter(
        (_, index) =>
          index !== roundIndex
      )
      .map(
        (item, index) => ({
          ...item,
          roundNumber: index + 1,
        })
      );

    persistRounds(nextRounds);

    setError(null);

    setMessage(
      "Preliminary round removed."
    );
  }

  /*
   * =========================================================
   * QUALIFIED PLAYERS
   * =========================================================
   */

  const qualifiedPlayers =
    useMemo(() => {
      const result: {
        playerId: number;
        teamId: number;
      }[] = [];

      for (const round of rounds) {
        for (const player of round.players) {
          if (!player.qualified) {
            continue;
          }

          const alreadyExists =
            result.some(
              (item) =>
                item.playerId ===
                player.playerId
            );

          if (!alreadyExists) {
            result.push({
              playerId:
                player.playerId,

              teamId:
                player.teamId,
            });
          }
        }
      }

      return result;
    }, [rounds]);

  /*
   * =========================================================
   * FINAL ELIGIBLE PLAYERS
   * =========================================================
   *
   * No preliminary rounds:
   *     every participating player.
   *
   * Preliminary rounds:
   *     only qualified players.
   * =========================================================
   */

  const finalEligiblePlayers =
    useMemo(() => {
      if (rounds.length === 0) {
        return teams.flatMap(
          (team) =>
            team.players.map(
              (player) => ({
                playerId:
                  player.id,

                teamId:
                  team.id,
              })
            )
        );
      }

      return qualifiedPlayers;
    }, [
      rounds.length,
      teams,
      qualifiedPlayers,
    ]);

  /*
   * =========================================================
   * FINAL PLAYER OPTIONS FOR SELECTED TEAM
   * =========================================================
   */

  const finalPlayersForSelectedTeam =
    useMemo(() => {
      if (
        selectedTeamId === ""
      ) {
        return [];
      }

      const team =
        getTeam(
          Number(selectedTeamId)
        );

      if (!team) {
        return [];
      }

      const eligibleIds =
        new Set(
          finalEligiblePlayers.map(
            (item) =>
              item.playerId
          )
        );

      return team.players.filter(
        (player) =>
          eligibleIds.has(
            player.id
          ) &&
          !finalPlayers.some(
            (selected) =>
              selected.playerId ===
              player.id
          )
      );
    }, [
      selectedTeamId,
      teams,
      finalEligiblePlayers,
      finalPlayers,
    ]);

  /*
   * =========================================================
   * CHANGE FINAL TEAM
   * =========================================================
   */

  function changeFinalTeam(
    teamId: number | ""
  ) {
    setSelectedTeamId(teamId);
    setSelectedPlayerId("");
  }

  /*
   * =========================================================
   * ADD FINAL PLAYER
   * =========================================================
   */

  function addFinalPlayer() {
    if (
      selectedTeamId === "" ||
      selectedPlayerId === ""
    ) {
      setError(
        "Please select both a team and a player."
      );
      return;
    }

    if (finalPlayers.length >= 4) {
      setError(
        "The Final can contain exactly 4 players."
      );
      return;
    }

    const teamId =
      Number(selectedTeamId);

    const playerId =
      Number(selectedPlayerId);

    const eligible =
      finalEligiblePlayers.some(
        (item) =>
          item.playerId ===
            playerId &&
          item.teamId ===
            teamId
      );

    if (!eligible) {
      setError(
        "This player is not eligible for the Final."
      );
      return;
    }

    if (
      finalPlayers.some(
        (player) =>
          player.playerId ===
          playerId
      )
    ) {
      setError(
        "This player is already selected."
      );
      return;
    }

    const usedPositions =
      new Set(
        finalPlayers.map(
          (player) =>
            player.position
        )
      );

    const nextPosition =
      (
        [1, 2, 3, 4] as Position[]
      ).find(
        (position) =>
          !usedPositions.has(
            position
          )
      ) ?? 4;

    setFinalPlayers(
      (previous) => [
        ...previous,
        {
          playerId,
          teamId,
          position:
            nextPosition,
        },
      ]
    );

    setSelectedTeamId("");
    setSelectedPlayerId("");

    setError(null);

    setMessage(
      "Player added to Final."
    );
  }

  /*
   * =========================================================
   * REMOVE FINAL PLAYER
   * =========================================================
   */

  function removeFinalPlayer(
    playerId: number
  ) {
    setFinalPlayers(
      (previous) =>
        previous
          .filter(
            (player) =>
              player.playerId !==
              playerId
          )
          .map(
            (player, index) => ({
              ...player,

              position:
                (index + 1) as Position,
            })
          )
    );

    setError(null);
  }

  /*
   * =========================================================
   * CHANGE FINAL POSITION
   *
   * Swaps positions when occupied.
   * =========================================================
   */

  function changeFinalPosition(
    playerId: number,
    position: Position
  ) {
    setFinalPlayers(
      (previous) => {
        const current =
          previous.find(
            (player) =>
              player.playerId ===
              playerId
          );

        if (!current) {
          return previous;
        }

        const other =
          previous.find(
            (player) =>
              player.position ===
                position &&
              player.playerId !==
                playerId
          );

        if (!other) {
          return previous.map(
            (player) =>
              player.playerId ===
              playerId
                ? {
                    ...player,
                    position,
                  }
                : player
          );
        }

        return previous.map(
          (player) => {
            if (
              player.playerId ===
              playerId
            ) {
              return {
                ...player,
                position,
              };
            }

            if (
              player.playerId ===
              other.playerId
            ) {
              return {
                ...player,

                position:
                  current.position,
              };
            }

            return player;
          }
        );
      }
    );
  }

  /*
   * =========================================================
   * VALIDATE FINAL
   * =========================================================
   */

  function validateFinal() {
    if (finalPlayers.length !== 4) {
      return "Final must contain exactly 4 players.";
    }

    const uniquePlayers =
      new Set(
        finalPlayers.map(
          (player) =>
            player.playerId
        )
      );

    if (uniquePlayers.size !== 4) {
      return "The same player cannot appear twice in the Final.";
    }

    const positions =
      finalPlayers.map(
        (player) =>
          player.position
      );

    const uniquePositions =
      new Set(positions);

    if (
      uniquePositions.size !== 4 ||
      !(
        [1, 2, 3, 4] as Position[]
      ).every(
        (position) =>
          uniquePositions.has(
            position
          )
      )
    ) {
      return "Final positions must be 1st, 2nd, 3rd and 4th.";
    }

    /*
     * If preliminary rounds exist,
     * every finalist must be qualified.
     */

    if (rounds.length > 0) {
      for (const finalist of finalPlayers) {
        const qualified =
          qualifiedPlayers.some(
            (player) =>
              player.playerId ===
                finalist.playerId &&
              player.teamId ===
                finalist.teamId
          );

        if (!qualified) {
          return "Every Final player must be qualified from a preliminary round.";
        }
      }
    }

    return null;
  }

  /*
   * =========================================================
   * SAVE FINAL
   * =========================================================
   */

  async function saveFinal() {
    const validationError =
      validateFinal();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (hasValidSavedFinal) {
      setError(
        "Final results are already saved for this game."
      );
      return;
    }

    try {
      setSavingFinal(true);
      setError(null);
      setMessage(null);

      const response =
        await fetch(
          `/api/competition-games/${game.id}/results`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              results:
                finalPlayers
                  .slice()
                  .sort(
                    (a, b) =>
                      a.position -
                      b.position
                  )
                  .map(
                    (player) => ({
                      position:
                        player.position,

                      teamId:
                        player.teamId,

                      playerId:
                        player.playerId,
                    })
                  ),
            }),
          }
        );

      const data =
        await response.json();

      console.log(
        "SAVE FINAL RESPONSE:",
        data
      );

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to save Final results."
        );
      }

      /*
       * Reload results.
       */

      const resultsResponse =
        await fetch(
          `/api/competition-games/${game.id}/results`,
          {
            cache: "no-store",
          }
        );

      const resultsData =
        await resultsResponse.json();

      if (
        resultsResponse.ok &&
        resultsData.success &&
        Array.isArray(
          resultsData.results
        )
      ) {
        setSavedResults(
          resultsData.results
        );
      }

      setFinalPlayers([]);

      setSelectedTeamId("");
      setSelectedPlayerId("");

      setMessage(
        "Final results saved successfully."
      );
    } catch (err) {
      console.error(
        "SAVE FINAL ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save Final results."
      );
    } finally {
      setSavingFinal(false);
    }
  }

  /*
   * =========================================================
   * CLEAR OLD INVALID RESULTS
   * =========================================================
   */

  async function clearInvalidResults() {
    const confirmed =
      window.confirm(
        "Delete the old/incomplete saved results for this game? This will not delete teams, players, or preliminary rounds."
      );

    if (!confirmed) {
      return;
    }

    try {
      setClearingResults(true);
      setError(null);
      setMessage(null);

      const response =
        await fetch(
          `/api/competition-games/${game.id}/results`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Failed to clear old results."
        );
      }

      setSavedResults([]);
      setFinalPlayers([]);

      setSelectedTeamId("");
      setSelectedPlayerId("");

      setMessage(
        "Old results cleared. You can now enter the Final."
      );
    } catch (err) {
      console.error(
        "CLEAR RESULTS ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to clear old results."
      );
    } finally {
      setClearingResults(false);
    }
  }

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-transparent p-4 sm:p-6">
        <div className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-white/10 p-10 text-center text-white backdrop-blur-xl">
          Loading competition game...
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * PAGE
   * =========================================================
   */

  return (
    <div className="min-h-screen w-full bg-transparent px-3 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto w-full max-w-6xl space-y-5">

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex min-w-0 items-start gap-3">

            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
              >
                <ArrowLeft size={19} />
              </button>
            )}

            <div className="min-w-0">

              <div className="flex flex-wrap items-center gap-2">

                <Trophy
                  size={21}
                  className="text-yellow-300"
                />

                <h1 className="truncate text-xl font-bold text-white sm:text-2xl">
                  {game.name}
                </h1>

              </div>

              <p className="mt-1 text-sm text-slate-300">
                Select teams and players for
                preliminary rounds and Final.
              </p>

            </div>

          </div>

          <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-200">
            <span className="font-bold">
              {teams.length}
            </span>{" "}
            Participating Teams
          </div>

        </div>

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">

            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                setError(null)
              }
              className="shrink-0 text-red-300 hover:text-white"
            >
              <X size={18} />
            </button>

          </div>
        )}

        {/* ===================================================
            SUCCESS
        =================================================== */}

        {message && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">

            <Check size={17} />

            {message}

          </div>
        )}

        {/* ===================================================
            OLD INVALID RESULTS WARNING
        =================================================== */}

        {hasInvalidOldResults && (
          <div className="rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4 sm:p-5">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-start gap-3">

                <AlertTriangle
                  size={22}
                  className="mt-0.5 shrink-0 text-orange-300"
                />

                <div>

                  <p className="font-bold text-orange-200">
                    Old incomplete Final results found
                  </p>

                  <p className="mt-1 text-sm text-orange-100/70">
                    The database contains old result
                    rows without players or with the
                    previous points system. They are
                    not being treated as a valid Final.
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={
                  clearInvalidResults
                }
                disabled={
                  clearingResults
                }
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw
                  size={16}
                />

                {clearingResults
                  ? "Clearing..."
                  : "Clear Old Results"}
              </button>

            </div>

          </div>
        )}

        {/* ===================================================
            PARTICIPATING TEAMS
        =================================================== */}

        <section className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-xl backdrop-blur-xl sm:p-6">

          <div className="mb-5 flex items-center justify-between gap-3">

            <div>

              <h2 className="text-lg font-bold text-white sm:text-xl">
                Participating Teams
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                These are the 4 teams selected
                for this game.
              </p>

            </div>

            <Users
              size={22}
              className="text-blue-300"
            />

          </div>

          {teams.length === 0 ? (
            <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-5 text-center text-sm text-red-200">
              No teams found.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

              {teams.map((team) => (
                <div
                  key={team.id}
                  className="rounded-xl border border-white/10 bg-black/10 p-4"
                >

                  <p className="font-bold text-white">
                    {team.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {team.players.length} players
                  </p>

                </div>
              ))}

            </div>
          )}

        </section>

        {/* ===================================================
            PRELIMINARY ROUNDS
        =================================================== */}

        <section className="space-y-4">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-lg font-bold text-white sm:text-xl">
                Preliminary Rounds
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Optional. Each round has exactly
                4 players. Preliminary data is
                stored only in this browser.
              </p>

            </div>

            <button
              type="button"
              disabled={
                teams.length !== 4 ||
                hasValidSavedFinal
              }
              onClick={
                addPreliminaryRound
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={18} />

              Add Preliminary Round
            </button>

          </div>

          {rounds.length === 0 ? (

            <div className="rounded-2xl border border-dashed border-blue-400/20 bg-blue-500/[0.05] p-6 text-center">

              <p className="font-semibold text-white">
                Direct Final
              </p>

              <p className="mt-1 text-sm text-slate-400">
                No preliminary rounds have
                been created. You can directly
                select any participating player
                for the Final.
              </p>

            </div>

          ) : (

            <div className="space-y-5">

              {rounds.map(
                (round, roundIndex) => {

                  const selection =
                    getRoundSelection(
                      round.id
                    );

                  const playersForSelectedTeam =
                    getPlayersForTeam(
                      selection.teamId
                    );

                  const usedBefore =
                    getPlayersUsedBeforeRound(
                      roundIndex
                    );

                  return (
                    <div
                      key={round.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-xl backdrop-blur-xl sm:p-6"
                    >

                      {/* ROUND HEADER */}

                      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                          <div className="flex flex-wrap items-center gap-2">

                            <span className="rounded-lg bg-blue-500/15 px-2.5 py-1 text-xs font-bold text-blue-300">
                              ROUND{" "}
                              {
                                round.roundNumber
                              }
                            </span>

                            {round.saved && (
                              <span className="rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                                Saved locally
                              </span>
                            )}

                          </div>

                          <p className="mt-2 text-sm text-slate-400">
                            {round.players.length}/4
                            players
                          </p>

                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            deletePreliminaryRound(
                              roundIndex
                            )
                          }
                          disabled={
                            hasValidSavedFinal
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 size={16} />
                          Delete Round
                        </button>

                      </div>

                      {/* =====================================
                          TEAM → PLAYER → ADD
                      ===================================== */}

                      <div className="grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-black/10 p-3 sm:grid-cols-[1fr_1fr_auto] sm:p-4">

                        {/* TEAM */}

                        <div>

                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Team
                          </label>

                          <div className="relative">

                            <select
                              value={
                                selection.teamId
                              }
                              onChange={(
                                event
                              ) =>
                                changeRoundTeam(
                                  round.id,
                                  event
                                    .target
                                    .value ===
                                    ""
                                    ? ""
                                    : Number(
                                        event
                                          .target
                                          .value
                                      )
                                )
                              }
                              disabled={
                                round.players.length >=
                                  4 ||
                                hasValidSavedFinal
                              }
                              className="w-full appearance-none rounded-xl border border-white/10 bg-slate-900 px-3 py-3 pr-10 text-sm text-white outline-none transition focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                            >

                              <option
                                value=""
                                className="bg-slate-900"
                              >
                                Select Team
                              </option>

                              {teams.map(
                                (team) => (
                                  <option
                                    key={
                                      team.id
                                    }
                                    value={
                                      team.id
                                    }
                                    className="bg-slate-900"
                                  >
                                    {
                                      team.name
                                    }
                                  </option>
                                )
                              )}

                            </select>

                            <ChevronDown
                              size={17}
                              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                          </div>

                        </div>

                        {/* PLAYER */}

                        <div>

                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Player
                          </label>

                          <div className="relative">

                            <select
                              value={
                                selection.playerId
                              }
                              onChange={(
                                event
                              ) =>
                                changeRoundPlayer(
                                  round.id,
                                  event
                                    .target
                                    .value ===
                                    ""
                                    ? ""
                                    : Number(
                                        event
                                          .target
                                          .value
                                      )
                                )
                              }
                              disabled={
                                selection.teamId ===
                                  "" ||
                                round.players.length >=
                                  4 ||
                                hasValidSavedFinal
                              }
                              className="w-full appearance-none rounded-xl border border-white/10 bg-slate-900 px-3 py-3 pr-10 text-sm text-white outline-none transition focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                            >

                              <option
                                value=""
                                className="bg-slate-900"
                              >
                                {selection.teamId ===
                                ""
                                  ? "Select team first"
                                  : "Select Player"}
                              </option>

                              {playersForSelectedTeam
                                .filter(
                                  (
                                    player
                                  ) =>
                                    !usedBefore.has(
                                      player.id
                                    ) &&
                                    !round.players.some(
                                      (
                                        selected
                                      ) =>
                                        selected.playerId ===
                                        player.id
                                    )
                                )
                                .map(
                                  (
                                    player
                                  ) => (
                                    <option
                                      key={
                                        player.id
                                      }
                                      value={
                                        player.id
                                      }
                                      className="bg-slate-900"
                                    >
                                      {
                                        player.name
                                      }

                                      {player.jerseyNo !=
                                      null
                                        ? ` (#${player.jerseyNo})`
                                        : ""}
                                    </option>
                                  )
                                )}

                            </select>

                            <ChevronDown
                              size={17}
                              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                          </div>

                        </div>

                        {/* ADD */}

                        <div className="flex items-end">

                          <button
                            type="button"
                            onClick={() =>
                              addPlayerToRound(
                                roundIndex
                              )
                            }
                            disabled={
                              round.players.length >=
                                4 ||
                              selection.teamId ===
                                "" ||
                              selection.playerId ===
                                "" ||
                              hasValidSavedFinal
                            }
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                          >
                            <Plus size={17} />
                            Add
                          </button>

                        </div>

                      </div>

                      {/* ROUND PLAYERS */}

                      <div className="mt-4 space-y-3">

                        {round.players.length ===
                        0 ? (

                          <div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-slate-500">
                            Select a team and
                            player above, then
                            click Add.
                          </div>

                        ) : (

                          round.players.map(
                            (
                              roundPlayer
                            ) => {

                              const player =
                                getPlayer(
                                  roundPlayer.playerId
                                );

                              return (
                                <div
                                  key={
                                    roundPlayer.playerId
                                  }
                                  className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/10 p-3 sm:flex-row sm:items-center sm:justify-between"
                                >

                                  <div className="min-w-0">

                                    <p className="font-semibold text-white">
                                      {
                                        player?.name ??
                                        "Unknown Player"
                                      }
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                      {
                                        getTeamName(
                                          roundPlayer.teamId
                                        )
                                      }

                                      {player?.jerseyNo !=
                                      null
                                        ? ` • #${player.jerseyNo}`
                                        : ""}
                                    </p>

                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">

                                    {/* POSITION */}

                                    <select
                                      value={
                                        roundPlayer.position ??
                                        ""
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        updateRoundPosition(
                                          roundIndex,
                                          roundPlayer.playerId,
                                          event
                                            .target
                                            .value ===
                                            ""
                                            ? null
                                            : Number(
                                                event
                                                  .target
                                                  .value
                                              )
                                        )
                                      }
                                      disabled={
                                        hasValidSavedFinal
                                      }
                                      className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none disabled:opacity-50"
                                    >

                                      <option
                                        value=""
                                        className="bg-slate-900"
                                      >
                                        Position
                                      </option>

                                      <option
                                        value="1"
                                        className="bg-slate-900"
                                      >
                                        1st
                                      </option>

                                      <option
                                        value="2"
                                        className="bg-slate-900"
                                      >
                                        2nd
                                      </option>

                                      <option
                                        value="3"
                                        className="bg-slate-900"
                                      >
                                        3rd
                                      </option>

                                      <option
                                        value="4"
                                        className="bg-slate-900"
                                      >
                                        4th
                                      </option>

                                    </select>

                                    {/* QUALIFY */}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        toggleQualified(
                                          roundIndex,
                                          roundPlayer.playerId
                                        )
                                      }
                                      disabled={
                                        hasValidSavedFinal
                                      }
                                      className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                                        roundPlayer.qualified
                                          ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30"
                                          : "bg-white/5 text-slate-400 hover:bg-white/10"
                                      } disabled:cursor-not-allowed disabled:opacity-40`}
                                    >
                                      {roundPlayer.qualified
                                        ? "Qualified"
                                        : "Qualify"}
                                    </button>

                                    {/* REMOVE */}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        removePlayerFromRound(
                                          roundIndex,
                                          roundPlayer.playerId
                                        )
                                      }
                                      disabled={
                                        hasValidSavedFinal
                                      }
                                      className="rounded-lg border border-red-400/20 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      <Trash2
                                        size={15}
                                      />
                                    </button>

                                  </div>

                                </div>
                              );
                            }
                          )

                        )}

                      </div>

                      {/* SAVE ROUND */}

                      <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">

                        <p className="text-xs text-slate-500">
                          Qualification is optional:
                          0–4 players can qualify.
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            savePreliminaryRound(
                              roundIndex
                            )
                          }
                          disabled={
                            round.players.length !==
                              4 ||
                            hasValidSavedFinal ||
                            savingRound ===
                              round.id
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                        >

                          <Save size={16} />

                          {savingRound ===
                          round.id
                            ? "Saving..."
                            : "Save Round"}

                        </button>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          )}

        </section>

        {/* ===================================================
            FINAL
        =================================================== */}

        <section className="rounded-2xl border border-yellow-400/10 bg-white/[0.06] p-4 shadow-xl backdrop-blur-xl sm:p-6">

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <Medal
                  size={21}
                  className="text-yellow-300"
                />

                <h2 className="text-lg font-bold text-white sm:text-xl">
                  Final
                </h2>

              </div>

              <p className="mt-1 text-sm text-slate-400">

                {rounds.length === 0
                  ? "Direct Final — select any participating player."
                  : "Select only qualified players from the preliminary rounds."}

              </p>

            </div>

            <div className="rounded-xl bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-200">
              {finalPlayers.length}/4 Selected
            </div>

          </div>

          {/* =================================================
              VALID SAVED FINAL
          ================================================= */}

          {hasValidSavedFinal ? (

            <div className="space-y-3">

              <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300">
                ✓ Final Results Saved
              </div>

              {savedResults
                .slice()
                .sort(
                  (a, b) =>
                    a.position -
                    b.position
                )
                .map((result) => {

                  const position =
                    result.position as Position;

                  const info =
                    PLACE_INFO[position];

                  return (
                    <div
                      key={result.id}
                      className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/10 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >

                      <div className="flex items-center gap-3">

                        <span className="text-2xl">
                          {info?.medal ??
                            "🏅"}
                        </span>

                        <div>

                          <p className="font-bold text-white">
                            {info?.label ??
                              `${result.position}th Place`}
                          </p>

                          <p className="mt-1 text-sm text-slate-300">
                            {result.player
                              ?.name ??
                              "Unknown Player"}
                          </p>

                          <p className="text-xs text-slate-500">
                            {result.team
                              ?.name ??
                              getTeamName(
                                result.teamId
                              )}
                          </p>

                        </div>

                      </div>

                      <div className="text-left sm:text-right">

                        <p className="text-lg font-bold text-yellow-300">
                          {result.points}
                        </p>

                        <p className="text-xs text-slate-500">
                          points
                        </p>

                      </div>

                    </div>
                  );
                })}

            </div>

          ) : (

            <>
              {/* =============================================
                  FINAL TEAM → PLAYER → ADD
              ============================================= */}

              <div className="grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-black/10 p-3 sm:grid-cols-[1fr_1fr_auto] sm:p-4">

                {/* TEAM */}

                <div>

                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Team
                  </label>

                  <div className="relative">

                    <select
                      value={
                        selectedTeamId
                      }
                      onChange={(event) =>
                        changeFinalTeam(
                          event.target
                            .value ===
                            ""
                            ? ""
                            : Number(
                                event.target
                                  .value
                              )
                        )
                      }
                      disabled={
                        finalPlayers.length >=
                          4 ||
                        hasValidSavedFinal
                      }
                      className="w-full appearance-none rounded-xl border border-white/10 bg-slate-900 px-3 py-3 pr-10 text-sm text-white outline-none transition focus:border-yellow-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                    >

                      <option
                        value=""
                        className="bg-slate-900"
                      >
                        Select Team
                      </option>

                      {teams
                        .filter(
                          (team) =>
                            finalEligiblePlayers.some(
                              (item) =>
                                item.teamId ===
                                team.id &&
                                !finalPlayers.some(
                                  (selected) =>
                                    selected.playerId ===
                                    item.playerId
                                )
                            )
                        )
                        .map((team) => (
                          <option
                            key={team.id}
                            value={team.id}
                            className="bg-slate-900"
                          >
                            {team.name}
                          </option>
                        ))}

                    </select>

                    <ChevronDown
                      size={17}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                  </div>

                </div>

                {/* PLAYER */}

                <div>

                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Player
                  </label>

                  <div className="relative">

                    <select
                      value={
                        selectedPlayerId
                      }
                      onChange={(event) =>
                        setSelectedPlayerId(
                          event.target
                            .value ===
                            ""
                            ? ""
                            : Number(
                                event.target
                                  .value
                              )
                        )
                      }
                      disabled={
                        selectedTeamId ===
                          "" ||
                        finalPlayers.length >=
                          4 ||
                        hasValidSavedFinal
                      }
                      className="w-full appearance-none rounded-xl border border-white/10 bg-slate-900 px-3 py-3 pr-10 text-sm text-white outline-none transition focus:border-yellow-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                    >

                      <option
                        value=""
                        className="bg-slate-900"
                      >
                        {selectedTeamId ===
                        ""
                          ? "Select team first"
                          : finalPlayersForSelectedTeam.length ===
                              0
                            ? "No eligible players"
                            : "Select Player"}
                      </option>

                      {finalPlayersForSelectedTeam.map(
                        (player) => (
                          <option
                            key={
                              player.id
                            }
                            value={
                              player.id
                            }
                            className="bg-slate-900"
                          >
                            {player.name}

                            {player.jerseyNo !=
                            null
                              ? ` (#${player.jerseyNo})`
                              : ""}
                          </option>
                        )
                      )}

                    </select>

                    <ChevronDown
                      size={17}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                  </div>

                </div>

                {/* ADD */}

                <div className="flex items-end">

                  <button
                    type="button"
                    onClick={
                      addFinalPlayer
                    }
                    disabled={
                      finalPlayers.length >=
                        4 ||
                      selectedTeamId ===
                        "" ||
                      selectedPlayerId ===
                        "" ||
                      hasValidSavedFinal
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                  >
                    <Plus size={17} />
                    Add
                  </button>

                </div>

              </div>

              {/* =============================================
                  FINAL PLAYERS
              ============================================= */}

              <div className="mt-4 space-y-3">

                {finalPlayers.length ===
                0 ? (

                  <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">
                    Select a team and player
                    above, then click Add.
                  </div>

                ) : (

                  finalPlayers
                    .slice()
                    .sort(
                      (a, b) =>
                        a.position -
                        b.position
                    )
                    .map(
                      (
                        finalPlayer
                      ) => {

                        const player =
                          getPlayer(
                            finalPlayer.playerId
                          );

                        const info =
                          PLACE_INFO[
                            finalPlayer.position
                          ];

                        return (
                          <div
                            key={
                              finalPlayer.playerId
                            }
                            className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/10 p-4 sm:flex-row sm:items-center sm:justify-between"
                          >

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-500/10 text-lg">
                                {
                                  info.medal
                                }
                              </div>

                              <div>

                                <p className="font-bold text-white">
                                  {player?.name ??
                                    "Unknown Player"}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  {
                                    getTeamName(
                                      finalPlayer.teamId
                                    )
                                  }

                                  {player?.jerseyNo !=
                                  null
                                    ? ` • #${player.jerseyNo}`
                                    : ""}
                                </p>

                              </div>

                            </div>

                            <div className="flex flex-wrap items-center gap-2">

                              {/* POSITION */}

                              <select
                                value={
                                  finalPlayer.position
                                }
                                onChange={(
                                  event
                                ) =>
                                  changeFinalPosition(
                                    finalPlayer.playerId,
                                    Number(
                                      event
                                        .target
                                        .value
                                    ) as Position
                                  )
                                }
                                disabled={
                                  hasValidSavedFinal
                                }
                                className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs font-semibold text-white outline-none disabled:opacity-50"
                              >

                                <option
                                  value="1"
                                  className="bg-slate-900"
                                >
                                  1st — 50
                                </option>

                                <option
                                  value="2"
                                  className="bg-slate-900"
                                >
                                  2nd — 30
                                </option>

                                <option
                                  value="3"
                                  className="bg-slate-900"
                                >
                                  3rd — 10
                                </option>

                                <option
                                  value="4"
                                  className="bg-slate-900"
                                >
                                  4th — 0
                                </option>

                              </select>

                              {/* POINTS */}

                              <span className="rounded-lg bg-yellow-500/10 px-3 py-2 text-xs font-bold text-yellow-300">
                                {
                                  FINAL_POINTS[
                                    finalPlayer.position
                                  ]
                                }{" "}
                                points
                              </span>

                              {/* REMOVE */}

                              <button
                                type="button"
                                onClick={() =>
                                  removeFinalPlayer(
                                    finalPlayer.playerId
                                  )
                                }
                                disabled={
                                  hasValidSavedFinal
                                }
                                className="rounded-lg border border-red-400/20 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Trash2
                                  size={15}
                                />
                              </button>

                            </div>

                          </div>
                        );
                      }
                    )

                )}

              </div>

              {/* =============================================
                  SAVE FINAL
              ============================================= */}

              <div className="mt-5 flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <p className="font-semibold text-white">
                    Final Points System
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">

                    {(
                      [
                        1,
                        2,
                        3,
                        4,
                      ] as Position[]
                    ).map(
                      (position) => (
                        <span
                          key={
                            position
                          }
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300"
                        >
                          {
                            PLACE_INFO[
                              position
                            ].medal
                          }{" "}
                          {
                            PLACE_INFO[
                              position
                            ].label
                          }{" "}
                          —{" "}
                          {
                            PLACE_INFO[
                              position
                            ].points
                          }{" "}
                          pts
                        </span>
                      )
                    )}

                  </div>

                </div>

                <button
                  type="button"
                  onClick={saveFinal}
                  disabled={
                    savingFinal ||
                    finalPlayers.length !==
                      4 ||
                    hasValidSavedFinal
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                >

                  <Save size={17} />

                  {savingFinal
                    ? "Saving Final..."
                    : "Save Final Results"}

                </button>

              </div>

            </>

          )}

        </section>

      </div>
    </div>
  );
}