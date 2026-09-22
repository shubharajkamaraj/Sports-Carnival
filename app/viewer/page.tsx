"use client";

import { useEffect, useState } from "react";
import ViewerIntro from "@/components/viewer/ViewerIntro";
import ViewerHome from "@/components/viewer/ViewerHome";

const VIEWER_INTRO_KEY = "team-gc-viewer-intro-seen";

export default function ViewerPage() {
  // null = checking localStorage
  // true = show intro
  // false = show home
  const [showIntro, setShowIntro] = useState<boolean | null>(null);

  useEffect(() => {
    const introSeen = localStorage.getItem(VIEWER_INTRO_KEY);

    if (introSeen === "true") {
      setShowIntro(false);
    } else {
      setShowIntro(true);
    }
  }, []);

  const handleIntroComplete = () => {
    localStorage.setItem(VIEWER_INTRO_KEY, "true");
    setShowIntro(false);
  };

  // Prevent Viewer Home / Intro from flashing
  // while localStorage is being checked.
  if (showIntro === null) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_50%_40%,#263a70_0%,#111936_35%,#070b19_70%,#03050c_100%)]" />
    );
  }

  return (
    <main className="viewer-page">
      {showIntro ? (
        <ViewerIntro onComplete={handleIntroComplete} />
      ) : (
        <ViewerHome />
      )}
    </main>
  );
}