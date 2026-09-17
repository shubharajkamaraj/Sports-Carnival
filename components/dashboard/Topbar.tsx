"use client";

import {
  Bell,
  Search,
  CircleUserRound,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function Topbar() {
  const router = useRouter();

  async function handleLogout() {
    try {
      const res = await fetch("/api/admin/logout", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Logout failed"
        );
      }

      toast.success("Logged out successfully");

      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      console.error("LOGOUT ERROR:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to logout"
      );
    }
  }

  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-4">
      {/* Left Side */}
      <div>
        <h2 className="text-2xl font-bold">
          Organizer Dashboard
        </h2>

        <p className="text-sm text-gray-500">
          Welcome back, Organizer 👋
        </p>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-5">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search
            size={18}
            className="absolute left-3 top-3 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search..."
            className="w-72 rounded-xl border py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Notification */}
        <Bell
          size={20}
          className="cursor-pointer text-gray-600"
        />

        {/* Profile */}
        <CircleUserRound
          size={34}
          className="cursor-pointer text-blue-600"
        />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 font-medium text-red-600 transition hover:bg-red-100"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </header>
  );
}