"use client";

import { useState, useEffect, useRef } from "react";
import type { User } from "firebase/auth";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import type { Trip } from "@/lib/store";

// Mock data — replace with Firestore fetch when backend is ready
const MOCK_TRIPS: Trip[] = [
  {
    id: "trip-1",
    name: "Summer 2025",
    user_score: { energy: 40, nature: 60, nightlife: -20, luxury: 30, social_density: 10 },
    title: "The Wandering Aesthete",
    lifestyle_caption: "You seek beauty in slow mornings and spontaneous detours through cobblestone streets.",
    trip1: "Lisbon",
    trip1reason: "The melancholy charm of fado and sun-soaked tiles speaks to your soul.",
    trip2: "Kyoto",
    trip2reason: "Ancient temples and seasonal rituals match your contemplative pace.",
    trip3: "Porto",
    trip3reason: "Riverside wine culture and golden hour architecture are made for you.",
    createdAt: "2025-06-15T10:00:00Z",
  },
  {
    id: "trip-2",
    name: "Spring Break",
    user_score: { energy: 80, nature: -30, nightlife: 90, luxury: 50, social_density: 70 },
    title: "The Urban Pulse",
    lifestyle_caption: "You thrive in the electric hum of cities that never sleep.",
    trip1: "Tokyo",
    trip1reason: "Neon-lit streets and 24/7 energy match your relentless curiosity.",
    trip2: "New York",
    trip2reason: "The city's density and diversity fuels your need for constant stimulation.",
    trip3: "Seoul",
    trip3reason: "K-culture, street food, and rooftop bars align with your social instincts.",
    createdAt: "2025-03-20T08:00:00Z",
  },
];

function AccountButton({ user, onSignOut }: { user: User; onSignOut: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const initial = (user.displayName || user.email || "?")[0].toUpperCase();

  async function handleSignOut() {
    setOpen(false);
    await onSignOut();
  }

  return (
    <div className="account-wrap" ref={ref}>
      <button className="account-btn" onClick={() => setOpen(o => !o)} aria-label="Account">
        {initial}
      </button>
      {open && (
        <div className="account-dropdown">
          {user.displayName && <p className="account-dropdown__name">{user.displayName}</p>}
          <p className="account-dropdown__email">{user.email}</p>
          <hr className="account-dropdown__divider" />
          <button className="account-dropdown__logout" onClick={handleSignOut}>Sign out</button>
        </div>
      )}
    </div>
  );
}

function TripCard({ trip, onClick, index }: { trip: Trip; onClick: () => void; index: number }) {
  const date = new Date(trip.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      className="trip-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: "easeOut" }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <div className="trip-card__header">
        <div>
          <p className="trip-card__name">{trip.name}</p>
          <p className="trip-card__date">{date}</p>
        </div>
        <svg className="trip-card__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>

      <p className="trip-card__title">{trip.title}</p>
      <p className="trip-card__caption">{trip.lifestyle_caption}</p>

      <div className="trip-card__destinations">
        {[trip.trip1, trip.trip2, trip.trip3].map((dest) => (
          <span key={dest} className="trip-card__dest-chip">{dest}</span>
        ))}
      </div>
    </motion.div>
  );
}

function NewTripCard({ onClick, index }: { onClick: () => void; index: number }) {
  return (
    <motion.button
      className="trip-card--new"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: "easeOut" }}
      onClick={onClick}
    >
      <div className="trip-card--new__icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
      <p className="trip-card--new__label">New Trip</p>
      <p className="trip-card--new__hint">Start a new visual preference scan</p>
    </motion.button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [trips] = useState<Trip[]>(MOCK_TRIPS);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth");
  }, [user, authLoading, router]);

  if (authLoading || !user) return null;

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-header__title">Travel DNA</h1>
          <p className="dashboard-header__subtitle">
            {user.displayName ? `Welcome back, ${user.displayName.split(" ")[0]}` : "Your trips"}
          </p>
        </div>
        <AccountButton user={user} onSignOut={signOut} />
      </header>

      <div className="dashboard-content">
        {trips.length > 0 && (
          <p className="dashboard-section-label">Past trips</p>
        )}

        {trips.length === 0 && (
          <motion.p
            className="dashboard-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            No trips yet. Start your first scan below.
          </motion.p>
        )}

        <div className="dashboard-trips">
          {trips.map((trip, i) => (
            <TripCard
              key={trip.id}
              trip={trip}
              index={i}
              onClick={() => router.push(`/results?tripId=${trip.id}`)}
            />
          ))}

          <NewTripCard
            index={trips.length}
            onClick={() => router.push("/swipe")}
          />
        </div>
      </div>
    </main>
  );
}
