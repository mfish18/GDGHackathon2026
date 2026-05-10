"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/authContext";
import type { UserProfile } from "@/lib/store";
import { authedFetch } from "@/lib/authedFetch";
import { BONUS_QUERIES } from "@/lib/unsplashQueries";
import { RadarChart } from "@/components/RadarChart";
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
const BONUS_CACHE_KEY = "unsplash_bonus_cache";
const DEST_PHOTO_CACHE_PREFIX = "unsplash_dest_cache_";

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

type BonusCard = { id: string; label: string; imageUrl: string };
type BonusMode = "idle" | "loading" | "rating" | "submitting" | "done";

export default function ResultsPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);
  const didFetch = useRef(false);

  const [destPhotos, setDestPhotos] = useState<Record<string, string>>({});

  const [bonusMode, setBonusMode] = useState<BonusMode>("idle");
  const [bonusCards, setBonusCards] = useState<BonusCard[]>([]);
  const [bonusIndex, setBonusIndex] = useState(0);
  const [bonusRatings, setBonusRatings] = useState<{ imageUrl: string; liked: boolean }[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/auth"); return; }
    if (didFetch.current) return;
    didFetch.current = true;

    const id =
      new URLSearchParams(window.location.search).get("tripId") ||
      localStorage.getItem("current_trip_id");

    if (!id) { router.replace("/"); return; }
    setTripId(id);

    getDoc(doc(db, "users", user.uid, "trips", id))
      .then((snap) => {
        if (!snap.exists()) { router.replace("/"); return; }
        setTripData(snap.data() as TripData);
      })
      .catch(() => router.replace("/"));
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!tripData || !tripId) return;
    const cacheKey = `${DEST_PHOTO_CACHE_PREFIX}${tripId}`;
    (async () => {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try { setDestPhotos(JSON.parse(cached)); return; } catch {}
      }
      try {
        const names = [tripData.trip1_location, tripData.trip2_location, tripData.trip3_location];
        const entries = await Promise.all(
          names.map(async (name) => {
            const res = await fetch(
              `https://api.unsplash.com/photos/random?query=${encodeURIComponent(name)}&client_id=${process.env.NEXT_PUBLIC_UNSPLASH_KEY}`
            );
            const data = await res.json();
            return [name, data.urls?.small ?? ""] as [string, string];
          })
        );
        const photos = Object.fromEntries(entries.filter(([, url]) => url));
        localStorage.setItem(cacheKey, JSON.stringify(photos));
        setDestPhotos(photos);
      } catch {}
    })();
  }, [tripData, tripId]);

  async function startBonusRating() {
    setBonusMode("loading");
    const cached = localStorage.getItem(BONUS_CACHE_KEY);
    if (cached) {
      try {
        setBonusCards(JSON.parse(cached));
        setBonusIndex(0);
        setBonusRatings([]);
        setBonusMode("rating");
        return;
      } catch {}
    }
    try {
      const results = (
        await Promise.all(
          BONUS_QUERIES.map(async (query, idx) => {
            const res = await fetch(
              `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&client_id=${process.env.NEXT_PUBLIC_UNSPLASH_KEY}`
            );
            const data = await res.json();
            return {
              id: data.id ?? `bonus-${idx}`,
              label: query,
              imageUrl: data.urls?.regular ?? "",
            };
          })
        )
      ).filter((r) => r.imageUrl);
      localStorage.setItem(BONUS_CACHE_KEY, JSON.stringify(results));
      setBonusCards(results);
      setBonusIndex(0);
      setBonusRatings([]);
      setBonusMode("rating");
    } catch {
      setBonusMode("idle");
    }
  }

  async function handleBonusRate(liked: boolean) {
    const card = bonusCards[bonusIndex];
    const newRatings = [...bonusRatings, { imageUrl: card.imageUrl, liked }];

    if (bonusIndex + 1 < bonusCards.length) {
      setBonusRatings(newRatings);
      setBonusIndex((i) => i + 1);
      return;
    }

    setBonusMode("submitting");

    for (const { imageUrl, liked: l } of newRatings) {
      try {
        await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/score-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_url: imageUrl, feedback: l ? 1 : 0, trip_id: tripId }),
        });
      } catch {}
    }

    try {
      await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/travel-profile?trip_id=${tripId}`);
    } catch {}

    if (user && tripId) {
      try {
        const snap = await getDoc(doc(db, "users", user.uid, "trips", tripId));
        if (snap.exists()) {
          localStorage.removeItem(`${DEST_PHOTO_CACHE_PREFIX}${tripId}`);
          setDestPhotos({});
          setTripData(snap.data() as TripData);
        }
      } catch {}
    }

    setBonusMode("done");
  }

  if (!tripData) return null;

  const destinations = [
    { name: tripData.trip1_location, reason: tripData.trip1_reason },
    { name: tripData.trip2_location, reason: tripData.trip2_reason },
    { name: tripData.trip3_location, reason: tripData.trip3_reason },
  ];

  return (
    <main className="page">

      <header className="dashboard-header">
        <div>
          <Link href="/" className="dashboard-header__link">
            <p className="dashboard-header__title">Travel DNA</p>
          </Link>
          {user?.displayName && (
            <p className="dashboard-header__subtitle">{user.displayName}</p>
          )}
        </div>
        {user && (
          <button
            className="dashboard-header__signout"
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
          <h1 className="results-title mt-1 text-center">{tripData.lifestyle_caption}</h1>
        </Animate>
      </section>

      <section className="results-section">
        <Animate i={3}><p className="results-label">Top Destinations</p></Animate>
        <div className="destination-list mt-2">
          {destinations.map((dest, i) => (
            <Animate key={dest.name} i={4 + i}>
              <div className="destination-card">
                <div className="destination-card__body">
                  <div className="destination-card__header">
                    <span className="destination-card__city">{dest.name}</span>
                  </div>
                  <p className="destination-card__reason">{dest.reason}</p>
                </div>
                {destPhotos[dest.name] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={destPhotos[dest.name]}
                    alt={dest.name}
                    className="destination-card__photo"
                  />
                )}
              </div>
            </Animate>
          ))}
        </div>
      </section>

      <section className="results-section">
        <Animate i={7}><p className="results-label">Vibe Breakdown</p></Animate>
        <div className="vibe-section-row">
          <div className="radar-wrap">
            <RadarChart
              scores={(Object.keys(VIBE_LABELS) as (keyof UserProfile)[]).map((key) => ({
                label: VIBE_LABELS[key].label,
                value: normalizeTo100(tripData.user_score?.[key] ?? 0),
              }))}
            />
          </div>
          <div className="vibe-legend">
            {(Object.keys(VIBE_LABELS) as (keyof UserProfile)[]).map((key) => {
              const { label, low, high } = VIBE_LABELS[key];
              const score = tripData.user_score?.[key] ?? 0;
              return (
                <div key={key} className="vibe-legend-row">
                  <span className="vibe-legend__label">{label}</span>
                  <span className={`vibe-legend__end${score <= 0 ? " vibe-legend__end--active" : ""}`}>{low}</span>
                  <span className="vibe-legend__sep">→</span>
                  <span className={`vibe-legend__end${score > 0 ? " vibe-legend__end--active" : ""}`}>{high}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="results-section--cta">
        <Animate i={14}>
          <button className="btn-retake" onClick={() => router.push("/")}>
            Back to trips
          </button>
        </Animate>
        <Animate i={15}>
          <button
            className="btn-refine"
            onClick={startBonusRating}
            disabled={bonusMode === "loading" || bonusMode === "submitting"}
          >
            {bonusMode === "loading" ? "Loading images..." : "Rate 5 more images"}
          </button>
        </Animate>
        <Animate i={16}>
          <button className="btn-new-trip" onClick={() => router.push("/swipe")}>
            New trip
          </button>
        </Animate>
      </section>

      {(bonusMode === "rating" || bonusMode === "submitting" || bonusMode === "done") && (
        <div className="bonus-overlay">
          <div className="bonus-modal">

            {bonusMode === "rating" && bonusCards[bonusIndex] && (
              <>
                <div className="bonus-modal__header">
                  <p className="bonus-modal__title">Rate this vibe</p>
                  <div className="bonus-modal__meta">
                    <span className="bonus-modal__counter">{bonusIndex + 1} / {bonusCards.length}</span>
                    <button
                      className="bonus-modal__close"
                      onClick={() => setBonusMode("idle")}
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="bonus-modal__image-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bonusCards[bonusIndex].imageUrl}
                    alt={bonusCards[bonusIndex].label}
                    className="bonus-modal__image"
                  />
                  <div className="bonus-modal__image-caption">
                    {bonusCards[bonusIndex].label}
                  </div>
                </div>
                <div className="bonus-modal__actions">
                  <button className="btn-skip" onClick={() => handleBonusRate(false)} aria-label="Skip">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                  <button className="btn-like" onClick={() => handleBonusRate(true)} aria-label="Like">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                </div>
              </>
            )}

            {bonusMode === "submitting" && (
              <div className="bonus-modal__status">
                <motion.div
                  className="loading-spinner__ring"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                />
                <p className="bonus-modal__status-text">Updating your profile...</p>
              </div>
            )}

            {bonusMode === "done" && (
              <div className="bonus-modal__status">
                <p className="bonus-modal__done-title">Profile updated</p>
                <p className="bonus-modal__done-sub">Your results have been refined based on your ratings.</p>
                <button className="btn-new-trip bonus-modal__done-btn" onClick={() => setBonusMode("idle")}>
                  View results
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </main>
  );
}
