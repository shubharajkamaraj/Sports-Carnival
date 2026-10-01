"use client";

import { useEffect, useState } from "react";
import CategoryGames from "./CategoryGames";
import CompetitionGameResult from "./CompetitionGameResult";
import type { CompetitionGame } from "./types";

const categories = [
  {
    id: "JUNIOR_KIDS",
    name: "Junior Kids",
    icon: "🧒",
  },
  {
    id: "SENIOR_KIDS",
    name: "Senior Kids",
    icon: "👦",
  },
  {
    id: "WOMENS",
    name: "Women's",
    icon: "👩",
  },
  {
    id: "OTHER",
    name: "Other",
    icon: "�",
  },
];

export default function ResultsPage() {
  const [selectedCategory, setSelectedCategory] =
    useState<string | null>(null);

  const [selectedGame, setSelectedGame] =
    useState<CompetitionGame | null>(null);

  const [games, setGames] =
    useState<CompetitionGame[]>([]);

  const [loading, setLoading] = useState(true);

  // =====================================================
  // LOAD COMPETITION GAMES
  // =====================================================

  useEffect(() => {
    loadGames();
  }, []);

  async function loadGames() {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/competition-games",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      console.log(
        "COMPETITION GAMES API:",
        data
      );

      if (!response.ok || !data.success) {
        console.error(
          "Failed to load games:",
          data.error || data.message
        );

        setGames([]);
        return;
      }

      setGames(data.games ?? []);
    } catch (error) {
      console.error(
        "Failed to load competition games:",
        error
      );

      setGames([]);
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // BACK FROM GAME
  // =====================================================

  function handleBackFromGame() {
    setSelectedGame(null);
  }

  // =====================================================
  // BACK FROM CATEGORY
  // =====================================================

  function handleBackFromCategory() {
    setSelectedCategory(null);
  }

  // =====================================================
  // SELECT GAME
  // =====================================================

  function handleSelectGame(
    game: CompetitionGame
  ) {
    setSelectedGame(game);
  }

  // =====================================================
  // SELECTED GAME
  // =====================================================

  if (selectedGame) {
    return (
      <CompetitionGameResult
        game={selectedGame}
        onBack={handleBackFromGame}
      />
    );
  }

  // =====================================================
  // SELECTED CATEGORY
  // =====================================================

  if (selectedCategory) {
    const categoryGames =
      games.filter(
        (game) =>
          game.category === selectedCategory
      );

    return (
      <CategoryGames
        category={selectedCategory}
        games={categoryGames}
        onBack={handleBackFromCategory}
        onSelectGame={handleSelectGame}
      />
    );
  }

  // =====================================================
  // CATEGORY PAGE
  // =====================================================

  return (
    <div className="min-h-screen w-full bg-transparent p-4 sm:p-6">
      <div className="mx-auto w-full max-w-6xl">
        {/* HEADER */}

        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Results
          </h1>

          <p className="mt-1 text-sm text-slate-300 sm:text-base">
            Select a category to manage game
            results.
          </p>
        </div>

        {/* LOADING */}

        {loading ? (
          <div className="rounded-xl border border-white/10 bg-white/10 p-6 text-center text-slate-300 shadow-lg backdrop-blur-md">
            Loading competition games...
          </div>
        ) : (
          <>
            {/* NO GAMES */}

            {games.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/10 p-8 text-center shadow-lg backdrop-blur-md">
                <p className="text-lg font-semibold text-white">
                  No competition games found
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  Create competition games first.
                </p>
              </div>
            ) : (
              /* CATEGORY CARDS */

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {categories.map(
                  (category) => {
                    const categoryGames =
                      games.filter(
                        (game) =>
                          game.category ===
                          category.id
                      );

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() =>
                          setSelectedCategory(
                            category.id
                          )
                        }
                        className="group w-full rounded-2xl border border-white/10 bg-white/10 p-5 text-left shadow-lg backdrop-blur-md transition duration-200 hover:-translate-y-1 hover:border-blue-400/40 hover:bg-white/[0.14] hover:shadow-xl active:scale-[0.98] sm:p-6"
                      >
                        {/* ICON */}

                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-2xl ring-1 ring-blue-400/20 sm:h-14 sm:w-14 sm:text-3xl">
                          {category.icon}
                        </div>

                        {/* NAME */}

                        <h2 className="text-lg font-bold text-white sm:text-xl">
                          {category.name}
                        </h2>

                        {/* GAME COUNT */}

                        <p className="mt-2 text-sm text-slate-400">
                          {categoryGames.length}{" "}
                          {categoryGames.length ===
                          1
                            ? "game"
                            : "games"}
                        </p>

                        {/* LINK */}

                        <div className="mt-5 text-sm font-semibold text-blue-300 transition group-hover:text-blue-200">
                          View games →
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}