"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import SwipeCard from "@/components/SwipeCard";
import { CARDS, TravelCard } from "@/lib/data";
import { saveResults } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const [cards, setCards] = useState<TravelCard[]>(CARDS);
  const [liked, setLiked] = useState<TravelCard[]>([]);
  const [skipped, setSkipped] = useState<TravelCard[]>([]);
  const [exiting, setExiting] = useState<{ id: string; dir: "like" | "skip" } | null>(null);

  const total = CARDS.length;
  const remaining = cards.length;
  const progress = ((total - remaining) / total) * 100;

  const handleSwipe = useCallback(
    (direction: "like" | "skip") => {
      const top = cards[cards.length - 1];
      if (!top) return;

      setExiting({ id: top.id, dir: direction });

      setTimeout(() => {
        const next = cards.slice(0, -1);
        if (direction === "like") setLiked((prev) => [...prev, top]);
        else setSkipped((prev) => [...prev, top]);
        setCards(next);
        setExiting(null);

        if (next.length === 0) {
          const newLiked = direction === "like" ? [...liked, top] : liked;
          const newSkipped = direction === "skip" ? [...skipped, top] : skipped;
          saveResults(newLiked, newSkipped);
          router.push("/loading");
        }
      }, 350);
    },
    [cards, liked, skipped, router]
  );

  return (
    <main className="swipe-page">
      <header className="swipe-header">
        <div>
          <h1 className="swipe-header__title">Travel DNA</h1>
          <p className="swipe-header__subtitle">Visual preference scan</p>
        </div>
        <span className="swipe-header__counter">{total - remaining} / {total}</span>
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
