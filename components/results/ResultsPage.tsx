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
  }
];

export default function ResultsPage() {
  const [selectedCategory, setSelectedCategory] =
    useState<string | null>(null);

  const [selectedGame, setSelectedGame] =
    useState<CompetitionGame | null>(null);

  const [games, setGames] =
    useState<CompetitionGame[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGames();
  }, []);

  async function loadGames() {
    try {
      const response =
        await fetch("/api/competition-games");

      const data = await response.json();

      console.log(
        "COMPETITION GAMES API:",
        data
      );

      if (data.success) {
        setGames(data.games);
      } else {
        console.error(
          "Failed to load games:",
          data.error
        );
      }
    } catch (error) {
      console.error(
        "Failed to load competition games:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // SELECTED GAME
  // =====================================================

  if (selectedGame) {
    return (
      <CompetitionGameResult
        game={selectedGame}
        onBack={() =>
          setSelectedGame(null)
        }
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
          game.category ===
          selectedCategory
      );

    return (
      <CategoryGames
        category={selectedCategory}
        games={categoryGames}
        onBack={() =>
          setSelectedCategory(null)
        }
        onSelectGame={(game) =>
          setSelectedGame(game)
        }
      />
    );
  }

  // =====================================================
  // CATEGORY CARDS
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Results
          </h1>

          <p className="mt-1 text-slate-500">
            Select a category to manage game
            results.
          </p>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500">
            Loading...
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
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
                    className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
                  >
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                      {category.icon}
                    </div>

                    <h2 className="text-xl font-bold text-slate-900">
                      {category.name}
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                      {categoryGames.length}{" "}
                      games
                    </p>

                    <div className="mt-5 text-sm font-semibold text-blue-600">
                      View games →
                    </div>
                  </button>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}