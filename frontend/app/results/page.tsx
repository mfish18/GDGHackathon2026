"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { loadResults, clearResults, loadUserProfile, UserProfile } from "@/lib/store";

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

type PageState = { userProfile: UserProfile | null };

function initPageState(): PageState | null {
  if (typeof window === "undefined") return null;
  const data = loadResults();
  if (!data) return null;
  return { userProfile: loadUserProfile() };
}

export default function ResultsPage() {
  const router = useRouter();
  const [state] = useState<PageState | null>(initPageState);

  useEffect(() => {
    if (!state) router.push("/");
  }, [state, router]);

  if (!state) return null;
  const { userProfile } = state;

  return (
    <main className="page">

      {/* Vibe Breakdown */}
      {userProfile && (
        <section className="results-section">
          <Animate i={0}><p className="results-label">Vibe Breakdown</p></Animate>
          <div className="vibe-list">
            {(Object.keys(VIBE_LABELS) as (keyof UserProfile)[]).map((key, i) => {
              const { label, low, high } = VIBE_LABELS[key];
              const pct = normalizeTo100(userProfile[key]);
              return (
                <Animate key={key} i={1 + i}>
                  <div className="vibe-row">
                    <div className="vibe-row__header">
                      <span className="vibe-row__label">{label}</span>
                      <span className="vibe-row__ends">
                        <span className="vibe-row__low">{low}</span>
                        <span className="vibe-row__high">{high}</span>
                      </span>
                    </div>
                    <div className="vibe-track">
                      <motion.div
                        className="vibe-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: (1 + i) * 0.12 + 0.3, duration: 0.7, ease: "easeOut" }}
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
        <Animate i={6}><p className="cta-note">Results are saved to this session only.</p></Animate>
        <Animate i={7}>
          <button className="btn-retake" onClick={() => { clearResults(); router.push("/"); }}>
            Retake the scan
          </button>
        </Animate>
      </section>

    </main>
  );
}
