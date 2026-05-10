"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { User } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import SwipeCard from "@/components/SwipeCard";
import { TravelCard } from "@/lib/data";
import { saveResults, saveUserProfile } from "@/lib/store";
import { UNSPLASH_QUERIES } from "@/lib/unsplashQueries";
import { useAuth } from "@/lib/authContext";
import { authedFetch } from "@/lib/authedFetch";


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

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [cards, setCards] = useState<TravelCard[]>([]);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth");
  }, [user, authLoading, router]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState<TravelCard[]>([]);
  const [skipped, setSkipped] = useState<TravelCard[]>([]);
  const [exiting, setExiting] = useState<{ id: string; dir: "like" | "skip" } | null>(null);

  const CACHE_KEY = "unsplash_cards_cache";

  const total = UNSPLASH_QUERIES.length;
  const remaining = cards.length;

  const progress =
    total > 0 ? ((total - remaining) / total) * 100 : 0;

  useEffect(() => {
    const loadCards = async () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);

        if (cached) {
          setCards(JSON.parse(cached));
          setLoading(false);
          return;
        }
        const results = await Promise.all(
          UNSPLASH_QUERIES.map(async (query: string, idx: number) => {
            const res = await fetch(
              `https://api.unsplash.com/photos/random?query=${encodeURIComponent(
                query
              )}&client_id=${process.env.NEXT_PUBLIC_UNSPLASH_KEY}`
            );

            const data = await res.json();

            return {
              id: data.id ?? `${query}-${idx}`,
              label: query,
              location: data.user?.location || "Unknown",
              imageUrl: data.urls.regular,
            };
          })
        );

        const shuffled = results.sort(() => Math.random() - 0.5);

        setCards(shuffled);
        localStorage.setItem(CACHE_KEY, JSON.stringify(shuffled));
      } catch (err) {
        console.error("Failed loading cards:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCards();
  }, []);

  const handleSwipe = useCallback(
    async (direction: "like" | "skip") => {
      const top = cards[cards.length - 1];
      if (!top) return;

      fetch("http://localhost:8000/score-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: top.imageUrl,
          feedback: direction === "like" ? 1 : 0,
        }),
      })
        .then((res) => res.json())
        .then((data) => { if (data.user_profile) saveUserProfile(data.user_profile); })
        .catch((err) => { console.error("Scoring API failed:", err); });

      setExiting({ id: top.id, dir: direction });

      setTimeout(() => {
        const next = cards.slice(0, -1);

        if (direction === "like") {
          setLiked((prev) => [...prev, top]);
        } else {
          setSkipped((prev) => [...prev, top]);
        }

        setCards(next);
        setExiting(null);

        if (next.length === 0) {
          const newLiked =
            direction === "like" ? [...liked, top] : liked;

          const newSkipped =
            direction === "skip" ? [...skipped, top] : skipped;

          saveResults(newLiked, newSkipped);
          router.push("/loading");
        }
      }, 350);
    },
    [cards, liked, skipped, router]
  );
  if (loading) {
    return (
      <main className="swipe-page">
        <div className="swipe-stack__empty">
          <p className="font-mono text-muted">Generating your travel DNA...</p>
        </div>
      </main>
    );
  }
  return (
    <main className="swipe-page">
      <header className="swipe-header">
        <div>
          <h1 className="swipe-header__title">Travel DNA</h1>
          <p className="swipe-header__subtitle">Visual preference scan</p>
        </div>
        <div className="swipe-header__right">
          <span className="swipe-header__counter">{total - remaining} / {total}</span>
          {user && <AccountButton user={user} onSignOut={signOut} />}
        </div>
      </header>

      <div className="swipe-progress">
        <div className="swipe-progress__track">
          <motion.div
            className="swipe-progress__fill"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="swipe-arena">
        <div className="swipe-stack">
          <AnimatePresence>
            {cards.map((card, i) => {
              const isTop = i === cards.length - 1;
              const isExiting = exiting?.id === card.id;

              return (
                <motion.div
                  key={card.id}
                  className="absolute inset-0"
                  initial={false}
                  animate={
                    isExiting
                      ? {
                        x: exiting.dir === "like" ? 400 : -400,
                        rotate: exiting.dir === "like" ? 20 : -20,
                        opacity: 0,
                      }
                      : {}
                  }
                  transition={{ duration: 0.35, ease: "easeIn" }}
                  style={{ zIndex: i }}
                >
                  <SwipeCard card={card} isTop={isTop && !isExiting} onSwipe={handleSwipe} />
                </motion.div>
              );
            })}
          </AnimatePresence>

          {cards.length === 0 && (
            <div className="swipe-stack__empty">
              <p className="font-mono text-muted">Processing...</p>
            </div>
          )}
        </div>

        <p className="swipe-hint">Swipe right to keep, left to pass</p>
      </div>

      <div className="swipe-actions">
        <button
          className="btn-skip"
          onClick={() => handleSwipe("skip")}
          disabled={cards.length === 0}
          aria-label="Skip"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <button
          className="btn-like"
          onClick={() => handleSwipe("like")}
          disabled={cards.length === 0}
          aria-label="Like"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </div>
    </main>
  );
}
