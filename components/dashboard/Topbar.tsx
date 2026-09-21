
"use client";

import {
  Bell,
  Search,
  CircleUserRound,
  LogOut,
  Menu,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type TopbarProps = {
  onMenuClick: () => void;
};

export default function Topbar({
  onMenuClick,
}: TopbarProps) {
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
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b bg-white px-4 py-3 sm:px-6">
      {/* Left Side */}
      <div className="flex min-w-0 items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={26} />
        </button>

        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold sm:text-2xl">
            Organizer Dashboard
          </h2>

          <p className="hidden text-sm text-gray-500 sm:block">
            Welcome back, Organizer 👋
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex shrink-0 items-center gap-3 sm:gap-5">
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
          size={30}
          className="cursor-pointer text-blue-600 sm:h-[34px] sm:w-[34px]"
        />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 font-medium text-red-600 transition hover:bg-red-100 sm:px-4"
        >
          <LogOut size={18} />

          <span className="hidden sm:inline">
            Logout
          </span>
        </button>
      </div>
    </header>
  );
}
