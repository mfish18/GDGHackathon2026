"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { loadResults, clearResults } from "@/lib/store";
import { computeArchetype, ARCHETYPES, Archetype } from "@/lib/data";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut" },
  }),
};

function Animate({ i, children, className }: { i: number; children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} custom={i} initial="hidden" animate="visible" variants={fadeUp}>
      {children}
    </motion.div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const [archetype, setArchetype] = useState<Archetype | null>(null);
  const [archetypeKey, setArchetypeKey] = useState("");

  useEffect(() => {
    const data = loadResults();
    if (!data) { router.push("/"); return; }
    const key = computeArchetype(data.liked);
    setArchetypeKey(key);
    setArchetype(ARCHETYPES[key]);
  }, [router]);

  if (!archetype) return null;

  return (
    <main className="page">

      {/* Hero */}
      <section className="results-section">
        <Animate i={0}><p className="results-eyebrow">Your Travel DNA</p></Animate>
        <Animate i={1}><h1 className="results-title">{archetype.name}</h1></Animate>
        <Animate i={2}><p className="results-tagline">{archetype.tagline}</p></Animate>
        <Animate i={3}><p className="results-summary">{archetype.personalitySummary}</p></Animate>
      </section>

      {/* Archetype */}
      <section className="results-section">
        <Animate i={4}><p className="results-label">Archetype Profile</p></Animate>
        <Animate i={5} className="archetype-card">
          <div className="archetype-card__body">
            <div>
              <h2 className="archetype-card__name">{archetype.name}</h2>
              <p className="archetype-card__description">{archetype.description}</p>
            </div>
            <div className="archetype-card__badge">
              <span className="archetype-card__badge-text">
                {archetypeKey.slice(0, 2).toUpperCase()}
              </span>
            </div>
          </div>
        </Animate>
      </section>

      {/* Destinations */}
      <section className="results-section">
        <Animate i={6}><p className="results-label">Matched Destinations</p></Animate>
        <div className="destination-list">
          {archetype.destinations.map((dest, i) => (
            <Animate key={dest.city} i={7 + i} className="destination-card">
              <div className="destination-card__header">
                <h3 className="destination-card__city">{dest.city}</h3>
                <span className="destination-card__country">{dest.country}</span>
              </div>
              <p className="destination-card__reason">{dest.reason}</p>
            </Animate>
          ))}
        </div>
      </section>

      {/* Itinerary */}
      <section className="results-section">
        <Animate i={10}>
          <p className="results-label">Sample Itinerary — {archetype.destinations[0].city}</p>
        </Animate>
        <div className="itinerary-list">
          {archetype.itinerary.map((day, i) => (
            <Animate key={day.day} i={11 + i}>
              <div className="itinerary-day__header">
                <span className="itinerary-day__number">DAY {day.day}</span>
                <div className="itinerary-day__divider" />
                <span className="itinerary-day__title">{day.title}</span>
              </div>
              <ul className="itinerary-day__activities">
                {day.activities.map((activity, j) => (
                  <li key={j} className="itinerary-activity">
                    <span className="itinerary-activity__dot">
                      <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor">
                        <circle cx="3" cy="3" r="3" />
                      </svg>
                    </span>
                    <p className="itinerary-activity__text">{activity}</p>
                  </li>
                ))}
              </ul>
            </Animate>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="results-section--cta">
        <Animate i={15}><p className="cta-note">Results are saved to this session only.</p></Animate>
        <Animate i={16}>
          <button className="btn-retake" onClick={() => { clearResults(); router.push("/"); }}>
            Retake the scan
          </button>
        </Animate>
      </section>

    </main>
  );
}
