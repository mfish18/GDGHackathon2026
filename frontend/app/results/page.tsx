"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  loadResults,
  clearResults,
  loadUserProfile,
  loadTravelProfile,
  clearTravelProfile,
  UserProfile,
  TravelProfile,
} from "@/lib/store";
import { useAuth } from "@/lib/authContext";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut" },
  }),
};

const VIBE_LABELS: Record<keyof UserProfile, { low: string; high: string; label: string }> = {
  energy:         { label: "Energy",    low: "Calm",   high: "Chaotic" },
  nature:         { label: "Nature",    low: "Urban",  high: "Wild"    },
  nightlife:      { label: "Nightlife", low: "Quiet",  high: "Lively"  },
  luxury:         { label: "Luxury",    low: "Budget", high: "Luxury"  },
  social_density: { label: "Crowds",    low: "Solo",   high: "Social"  },
};

const MAX_SCORE = 120;

function normalizeTo100(value: number) {
  return Math.round(((value + MAX_SCORE) / (MAX_SCORE * 2)) * 100);
}

function Animate({ i, children, className }: { i: number; children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} custom={i} initial="hidden" animate="visible" variants={fadeUp}>
      {children}
    </motion.div>
  );
}

type PageState = {
  userProfile: UserProfile | null;
  travelProfile: TravelProfile | null;
};

function initPageState(): PageState | null {
  if (typeof window === "undefined") return null;
  const data = loadResults();
  if (!data) return null;
  return {
    userProfile: loadUserProfile(),
    travelProfile: loadTravelProfile(),
  };
}

export default function ResultsPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [state] = useState<PageState | null>(initPageState);

  useEffect(() => {
    if (!state) router.push("/");
  }, [state, router]);

  if (!state) return null;
  const { userProfile, travelProfile } = state;

  return (
    <main className="page">

      {/* Header */}
      <header className="results-header">
        <div>
          <p className="results-header__title">Travel DNA</p>
          {user?.displayName && (
            <p className="results-header__user">{user.displayName}</p>
          )}
        </div>
        {user && (
          <button
            className="results-header__signout"
            onClick={async () => {
              await signOut();
              router.push("/auth");
            }}
          >
            Sign out
          </button>
        )}
      </header>

      {/* Travel Personality */}
      <section className="results-section">
        <Animate i={0}><p className="results-label">Travel Personality</p></Animate>
        {travelProfile ? (
          <>
            <Animate i={1}>
              <h1 className="results-title mt-1">{travelProfile.caption}</h1>
            </Animate>
            <Animate i={2}>
              <p className="results-summary mt-4">{travelProfile.travel_lifestyle}</p>
            </Animate>
          </>
        ) : (
          <p className="results-summary mt-2 text-muted">Could not load travel personality.</p>
        )}
      </section>

      {/* Top Destinations */}
      <section className="results-section">
        <Animate i={3}><p className="results-label">Top Destinations</p></Animate>
        {travelProfile?.destinations?.length ? (
          <div className="destination-list mt-2">
            {travelProfile.destinations.map((dest, i) => (
              <Animate key={dest.name} i={4 + i}>
                <div className="destination-card">
                  <div className="destination-card__header">
                    <span className="destination-card__city">{dest.name}</span>
                  </div>
                  <p className="destination-card__reason">{dest.reason}</p>
                </div>
              </Animate>
            ))}
          </div>
        ) : (
          <p className="results-summary mt-2 text-muted">Could not load destinations.</p>
        )}
      </section>

      {/* Vibe Breakdown */}
      {userProfile && (
        <section className="results-section">
          <Animate i={7}><p className="results-label">Vibe Breakdown</p></Animate>
          <div className="vibe-list">
            {(Object.keys(VIBE_LABELS) as (keyof UserProfile)[]).map((key, i) => {
              const { label, low, high } = VIBE_LABELS[key];
              const pct = normalizeTo100(userProfile[key]);
              return (
                <Animate key={key} i={8 + i}>
                  <div className="vibe-row">
                    <div className="vibe-row__header">
                      <span className="vibe-row__label">{label}</span>
                      <span className="vibe-row__ends">
                        <span className={`vibe-row__low${userProfile[key] < 0 ? " vibe-row__end--active" : ""}`}>{low}</span>
                        <span className={`vibe-row__high${userProfile[key] > 0 ? " vibe-row__end--active" : ""}`}>{high}</span>
                      </span>
                    </div>
                    <div className="vibe-track">
                      <motion.div
                        className="vibe-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: (8 + i) * 0.12 + 0.3, duration: 0.7, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </Animate>
              );
            })}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="results-section--cta">
        <Animate i={14}>
          <button
            className="btn-retake"
            onClick={() => router.push("/")}
          >
            Back to trips
          </button>
        </Animate>
        <Animate i={15}>
          <button
            className="btn-new-trip"
            onClick={() => {
              clearResults();
              clearTravelProfile();
              router.push("/swipe");
            }}
          >
            New trip
          </button>
        </Animate>
      </section>

    </main>
  );
}
