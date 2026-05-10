"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/authContext";
import type { UserProfile } from "@/lib/store";
import Link from "next/link";

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

type TripData = {
  user_score: UserProfile;
  title: string;
  lifestyle_caption: string;
  trip1_location: string;
  trip1_reason: string;
  trip2_location: string;
  trip2_reason: string;
  trip3_location: string;
  trip3_reason: string;
};

export default function ResultsPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [tripData, setTripData] = useState<TripData | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/auth"); return; }

    const tripId =
      new URLSearchParams(window.location.search).get("tripId") ||
      localStorage.getItem("current_trip_id");

    if (!tripId) { router.replace("/"); return; }

    getDoc(doc(db, "users", user.uid, "trips", tripId))
      .then((snap) => {
        if (!snap.exists()) { router.replace("/"); return; }
        setTripData(snap.data() as TripData);
      })
      .catch(() => router.replace("/"));
  }, [user, authLoading, router]);

  if (!tripData) return null;

  const destinations = [
    { name: tripData.trip1_location, reason: tripData.trip1_reason },
    { name: tripData.trip2_location, reason: tripData.trip2_reason },
    { name: tripData.trip3_location, reason: tripData.trip3_reason },
  ];

  return (
    <main className="page">

      <header className="results-header">
        <div>
          <Link href="/" className="dashboard-header__link">
            <p className="results-header__title">Travel DNA</p>
          </Link>
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

      <section className="results-section">
        <Animate i={0}><p className="results-label">Travel Personality</p></Animate>
        <Animate i={1}>
          <h1 className="results-title mt-1">{tripData.lifestyle_caption}</h1>
        </Animate>
      </section>

      <section className="results-section">
        <Animate i={3}><p className="results-label">Top Destinations</p></Animate>
        <div className="destination-list mt-2">
          {destinations.map((dest, i) => (
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
      </section>

      <section className="results-section">
        <Animate i={7}><p className="results-label">Vibe Breakdown</p></Animate>
        <div className="vibe-list">
          {(Object.keys(VIBE_LABELS) as (keyof UserProfile)[]).map((key, i) => {
            const { label, low, high } = VIBE_LABELS[key];
            const score = tripData.user_score?.[key] ?? 0;
            const pct = normalizeTo100(score);
            return (
              <Animate key={key} i={8 + i}>
                <div className="vibe-row">
                  <div className="vibe-row__header">
                    <span className="vibe-row__label">{label}</span>
                    <span className="vibe-row__ends">
                      <span className={`vibe-row__low${score < 0 ? " vibe-row__end--active" : ""}`}>{low}</span>
                      <span className={`vibe-row__high${score > 0 ? " vibe-row__end--active" : ""}`}>{high}</span>
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

      <section className="results-section--cta">
        <Animate i={14}>
          <button className="btn-retake" onClick={() => router.push("/")}>
            Back to trips
          </button>
        </Animate>
        <Animate i={15}>
          <button className="btn-new-trip" onClick={() => router.push("/swipe")}>
            New trip
          </button>
        </Animate>
      </section>

    </main>
  );
}
