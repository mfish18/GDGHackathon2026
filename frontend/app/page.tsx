"use client";

import { useState, useEffect, useRef } from "react";
import type { User } from "firebase/auth";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { db } from "@/lib/firebase";
import { authedFetch } from "@/lib/authedFetch";
import type { Trip } from "@/lib/store";

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

function TripCard({ trip, onClick, onDelete, index }: { trip: Trip; onClick: () => void; onDelete: () => void; index: number }) {
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
        <div className="trip-card__actions">
          <button
            className="trip-card__delete"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            aria-label="Delete trip"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6M9 6V4h6v2" />
            </svg>
          </button>
          <svg className="trip-card__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
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
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const tripsRef = collection(db, "users", user.uid, "trips");
    getDocs(query(tripsRef, orderBy("created_at", "desc"))).then((snapshot) => {
      setTrips(snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          name: d.created_at?.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) ?? "",
          user_score: d.user_score,
          title: d.title ?? "",
          lifestyle_caption: d.lifestyle_caption ?? "",
          trip1: d.trip1_location ?? "",
          trip1reason: d.trip1_reason ?? "",
          trip2: d.trip2_location ?? "",
          trip2reason: d.trip2_reason ?? "",
          trip3: d.trip3_location ?? "",
          trip3reason: d.trip3_reason ?? "",
          createdAt: d.created_at?.toDate().toISOString() ?? new Date().toISOString(),
        };
      }));
    }).catch(console.error);
  }, [user]);

  async function handleDelete(tripId: string) {
    await authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/delete-trip/${tripId}`, { method: "DELETE" });
    setTrips(prev => prev.filter(t => t.id !== tripId));
  }

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
              onDelete={() => handleDelete(trip.id)}
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
