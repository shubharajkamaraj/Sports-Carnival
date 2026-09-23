"use client";

import { ArrowLeft, Trophy } from "lucide-react";

import type { CompetitionGame } from "./types";
type Props = {
  category: string;
  games: CompetitionGame[];
  onBack: () => void;
  onSelectGame: (
    game: CompetitionGame
  ) => void;
};

export default function CategoryGames({
  category,
  games,
  onBack,
  onSelectGame,
}: Props) {
  const categoryGames = games
    .filter((game) => game.category === category)
    .sort(
      (a, b) =>
        (a.gameOrder ?? 0) - (b.gameOrder ?? 0)
    );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="rounded-lg border px-3 py-2 hover:bg-gray-100"
        >
          <ArrowLeft size={18} />
        </button>

        <div>
          <h2 className="text-2xl font-bold">
            {category.replaceAll("_", " ")}
          </h2>

          <p className="text-sm text-gray-500">
            Select a game to enter teams and results
          </p>
        </div>
      </div>

      {/* Games */}
      {categoryGames.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center">
          <Trophy
            size={40}
            className="mx-auto mb-4 text-gray-400"
          />

          <h3 className="text-lg font-semibold">
            No games found
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            No games have been configured for this category.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {categoryGames.map((game) => (
            <button
              key={game.id}
              onClick={() => onSelectGame && onSelectGame(game)}
              className="group rounded-2xl border bg-white p-6 text-black text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400">
                    Game {game.gameOrder}
                  </p>

                  <h3 className="mt-2 text-xl font-bold">
                    {game.name}
                  </h3>
                </div>

                <div className="rounded-xl bg-gray-100 p-3 group-hover:bg-gray-200">
                  <Trophy size={24} />
                </div>
              </div>

              <p className="mt-4 text-sm text-gray-500">
                Select teams and enter 1st, 2nd and 3rd place results
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}