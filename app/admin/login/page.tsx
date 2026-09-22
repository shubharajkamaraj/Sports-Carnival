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
      window.location.href = "/admin/dashboard";
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
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">

        {/* Header */}
        <div className="mb-8 text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
            <Trophy size={32} />
          </div>

          <h1 className="mt-5 text-3xl font-bold text-slate-900">
            Organizer Login
          </h1>

          <p className="mt-2 text-sm text-slate-500">
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
              className="mb-2 block text-sm font-semibold text-slate-700"
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
                  border-slate-300
                  bg-white
                  py-3
                  pl-12
                  pr-4
                  text-slate-900
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                  disabled:cursor-not-allowed
                  disabled:bg-slate-100
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
              shadow-md
              transition
              hover:bg-blue-700
              hover:shadow-lg
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