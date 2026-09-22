"use client";

import { useState } from "react";
import ViewerIntro from "@/components/viewer/ViewerIntro";
import ViewerHome from "@/components/viewer/ViewerHome";

export default function ViewerPage() {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <main className="viewer-page">
      {showIntro ? (
        <ViewerIntro onComplete={() => setShowIntro(false)} />
      ) : (
        <ViewerHome />
      )}
    </main>
  );
}