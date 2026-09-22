"use client";

import { useEffect, useState } from "react";

interface ViewerIntroProps {
  onComplete: () => void;
}

export default function ViewerIntro({
  onComplete,
}: ViewerIntroProps) {
  const [count, setCount] = useState(3);
  const [showBegin, setShowBegin] = useState(false);

  // ==========================================
  // COUNTDOWN: 3 → 2 → 1 → 0
  // ==========================================
  useEffect(() => {
    if (count === 0) {
      setShowBegin(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setCount((prev) => prev - 1);
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [count]);

  // ==========================================
  // LET THE GAMES BEGIN → WAIT 10 SECONDS
  // ==========================================
  useEffect(() => {
    if (!showBegin) return;

    console.log(
      "LET THE GAMES BEGIN! - 10 second timer started"
    );

    const timer = window.setTimeout(() => {
      console.log(
        "10 seconds completed - opening Viewer Home"
      );

      onComplete();
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [showBegin, onComplete]);

  return (
    <div className="viewer-intro">

      {/* ==========================================
          ANIMATED BACKGROUND
      ========================================== */}
      <div className="background-glow glow-one" />
      <div className="background-glow glow-two" />

      {/* ==========================================
          PARTICLES
      ========================================== */}
      <div className="particles">
        {Array.from({ length: 35 }).map((_, index) => (
          <span
            key={index}
            className="particle"
            style={{
              left: `${(index * 37) % 100}%`,
              top: `${(index * 61) % 100}%`,
              animationDelay: `${(index * 0.17) % 4}s`,
              animationDuration: `${
                3 + ((index * 0.23) % 4)
              }s`,
            }}
          />
        ))}
      </div>

      {/* ==========================================
          MAIN CONTENT
      ========================================== */}
      <div className="intro-content">

        {/* ========================================
            LOGO
        ======================================== */}
        <div className="logo-wrapper">
          <div className="logo-ring ring-one" />
          <div className="logo-ring ring-two" />

          <div className="viewer-intro-logo-wrap">
            <img
              src="/team-logos/team-gc-logo.png"
              alt="Team GC Logo"
              className="viewer-intro-logo"
            />
          </div>
        </div>

        {/* ========================================
            WELCOME + COUNTDOWN
        ======================================== */}
        {!showBegin && (
          <>
            <p className="welcome-text">
              WELCOME TO
            </p>

            <h1 className="team-title">
              TEAM GC
            </h1>

            <h2 className="event-title">
              SPORTS CARNIVAL
            </h2>

            <div className="season">
              <span />
              SEASON 1
              <span />
            </div>

            {/* Countdown */}
            <div className="countdown-container">
              {count > 0 && (
                <div
                  key={count}
                  className="countdown-number"
                >
                  {count}
                </div>
              )}
            </div>
          </>
        )}

        {/* ========================================
            LET THE GAMES BEGIN
        ======================================== */}
        {showBegin && (
          <div className="begin-container">
            <div className="begin-line" />

            <h2 className="begin-text">
              LET THE GAMES BEGIN!
            </h2>

            <div className="begin-line" />
          </div>
        )}
      </div>

      {/* ==========================================
          BOTTOM DECORATION
      ========================================== */}
      <div className="bottom-text">
        <span>TEAM GC</span>
        <span>•</span>
        <span>SPORTS CARNIVAL</span>
        <span>•</span>
        <span>SEASON 1</span>
      </div>
    </div>
  );
}