import Link from "next/link";

export default function Hero() {
  return (
    <section
      className="relative flex min-h-[90vh] items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1920&q=80')",
      }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60"></div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl px-6 text-center text-white">
        <p className="mb-3 text-lg font-semibold uppercase tracking-widest text-yellow-400">
          Welcome to
        </p>

        <h1 className="mb-6 text-5xl font-extrabold md:text-7xl">
          Sports Carnival
        </h1>

        <p className="mb-8 text-lg text-gray-200 md:text-xl">
          Unite • Compete • Celebrate
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/register"
            className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-semibold text-white transition hover:bg-blue-700"
          >
            Register Now
          </Link>

          <Link
            href="/schedule"
            className="rounded-lg border border-white px-8 py-3 text-lg font-semibold transition hover:bg-white hover:text-black"
          >
            View Schedule
          </Link>
        </div>

        {/* Countdown */}
        <div className="mt-12 grid grid-cols-4 gap-4">
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
            <h2 className="text-4xl font-bold">15</h2>
            <p>Days</p>
          </div>

          <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
            <h2 className="text-4xl font-bold">08</h2>
            <p>Hours</p>
          </div>

          <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
            <h2 className="text-4xl font-bold">45</h2>
            <p>Minutes</p>
          </div>

          <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
            <h2 className="text-4xl font-bold">20</h2>
            <p>Seconds</p>
          </div>
        </div>
      </div>
    </section>
  );
}