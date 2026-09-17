import {
  Trophy,
  Volleyball,
  Goal,
  Users,
  Flag,
  PersonStanding,
} from "lucide-react";

const games = [
  {
    name: "Football",
    icon: Goal,
    color: "bg-blue-100 text-blue-600",
    description: "11 vs 11 outdoor football tournament.",
  },
  {
    name: "Cricket",
    icon: Trophy,
    color: "bg-green-100 text-green-600",
    description: "Knockout cricket championship.",
  },
  {
    name: "Handball",
    icon: PersonStanding,
    color: "bg-orange-100 text-orange-600",
    description: "Fast-paced indoor handball event.",
  },
  {
    name: "Throwball",
    icon: Volleyball,
    color: "bg-purple-100 text-purple-600",
    description: "Women's and mixed throwball matches.",
  },
  {
    name: "Tug of War",
    icon: Users,
    color: "bg-red-100 text-red-600",
    description: "Strength and teamwork competition.",
  },
  {
    name: "Relay Race",
    icon: Flag,
    color: "bg-yellow-100 text-yellow-600",
    description: "Exciting relay race challenge.",
  },
];

export default function FeaturedGames() {
  return (
    <section className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="mb-4 text-center text-4xl font-bold">
          Featured Games
        </h2>

        <p className="mb-12 text-center text-gray-600">
          Participate in exciting outdoor games and compete for glory.
        </p>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => {
            const Icon = game.icon;

            return (
              <div
                key={game.name}
                className="rounded-2xl bg-white p-8 shadow-md transition duration-300 hover:-translate-y-2 hover:shadow-xl"
              >
                <div
                  className={`mb-6 flex h-16 w-16 items-center justify-center rounded-full ${game.color}`}
                >
                  <Icon size={32} />
                </div>

                <h3 className="mb-3 text-2xl font-semibold">
                  {game.name}
                </h3>

                <p className="text-gray-600">
                  {game.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}