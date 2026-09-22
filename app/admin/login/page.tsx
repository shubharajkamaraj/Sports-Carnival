"use client";

import { FormEvent, useState } from "react";
import { LockKeyhole, Trophy } from "lucide-react";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const organizerCode = code.trim();

    if (!organizerCode) {
      toast.error("Please enter the organizer code.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          code: organizerCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Invalid organizer code"
        );
      }

      // Login succeeded and API has set the cookie
      toast.success("Login successful!");

      // Give browser time to process Set-Cookie
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Full browser navigation
      window.location.href = "/admin/intro";
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Login failed"
      );

      setLoading(false);
    }
  }

  return (
    <main
      className="
        flex
        min-h-screen
        items-center
        justify-center
       bg-transparent
        px-4
        text-white
      "
    >
      <div
        className="
          w-full
          max-w-md
          rounded-2xl
          border
          border-white/10
          bg-white/10
          p-8
          shadow-2xl
          backdrop-blur-md
        "
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <div
            className="
              mx-auto
              flex
              h-16
              w-16
              items-center
              justify-center
              rounded-2xl
              bg-blue-600
              text-white
              shadow-lg
              shadow-blue-900/30
            "
          >
            <Trophy size={32} />
          </div>

          <h1 className="mt-5 text-3xl font-bold text-white">
            Organizer Login
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Enter the organizer code to continue.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >
          {/* Organizer Code */}
          <div>
            <label
              htmlFor="organizer-code"
              className="mb-2 block text-sm font-semibold text-slate-300"
            >
              Organizer Code
            </label>

            <div className="relative">
              <LockKeyhole
                size={20}
                className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <input
                id="organizer-code"
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter organizer code"
                autoComplete="current-password"
                disabled={loading}
                className="
                  w-full
                  rounded-xl
                  border
                  border-white/10
                  bg-white/10
                  py-3
                  pl-12
                  pr-4
                  text-white
                  outline-none
                  shadow-lg
                  backdrop-blur-md
                  transition
                  placeholder:text-slate-500
                  focus:border-blue-400
                  focus:ring-2
                  focus:ring-blue-400/30
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              />
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="
              w-full
              rounded-xl
              bg-blue-600
              py-3
              font-semibold
              text-white
              shadow-lg
              shadow-blue-900/30
              transition
              hover:bg-blue-500
              hover:shadow-xl
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {loading ? "Checking..." : "Enter Dashboard"}
          </button>
        </form>
      </div>
    </main>
  );
}