"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_50%_40%,#263a70_0%,#111936_35%,#070b19_70%,#03050c_100%)] text-white">
      
      {/* Main Layout */}
      <div className="flex min-h-screen">
        
        {/* Sidebar */}
        <Sidebar
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />

        {/* Main Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          
          {/* Topbar */}
          <Topbar
            onMenuClick={() => setMobileOpen(true)}
          />

          {/* Page Content */}
          <main className="min-w-0 flex-1 bg-transparent p-4 sm:p-6">
            {children}
          </main>

        </div>
      </div>
    </div>
  );
}