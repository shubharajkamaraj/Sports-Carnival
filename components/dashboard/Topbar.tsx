"use client";

import {
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
  <header
    className="
      fixed
      top-0
      right-0
      left-0
      z-50
      flex
      h-20
      items-center
      justify-between
      border-b
      border-white/10
      bg-[#0b1020]
      px-4
      py-3
      sm:px-6
      lg:left-[304px]
    "
  >
    {/* LEFT SIDE */}
    <div className="flex min-w-0 items-center gap-3">
      {/* Mobile Menu */}
      <button
        type="button"
        onClick={onMenuClick}
        className="
          rounded-lg
          p-2
          text-slate-300
          transition
          hover:bg-white/10
          hover:text-white
          lg:hidden
        "
        aria-label="Open menu"
      >
        <Menu size={26} />
      </button>
    </div>

    {/* RIGHT SIDE */}
    <div className="flex shrink-0 items-center gap-3 sm:gap-4">
      {/* Organizer */}
      <span className="text-sm font-semibold text-slate-300 sm:text-base">
        Organizer
      </span>

      {/* Logout */}
      <button
        type="button"
        onClick={handleLogout}
        className="
          flex
          items-center
          gap-2
          rounded-xl
          border
          border-red-400/20
          bg-red-500/10
          px-3
          py-2
          font-medium
          text-red-300
          transition
          hover:bg-red-500/20
          sm:px-4
        "
      >
        <LogOut size={18} />
        <span>Logout</span>
      </button>
    </div>
  </header>
);
}