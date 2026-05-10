"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { saveTravelProfile } from "@/lib/store";
import { authedFetch } from "@/lib/authedFetch";

const STEPS = [
  "Parsing visual instincts",
  "Mapping preference topology",
  "Cross-referencing 4,000 destinations",
  "Identifying your archetype",
  "Generating itinerary",
];

const MIN_DURATION_MS = 3500;

export default function LoadingPage() {
  const router = useRouter();
  const didFetch = useRef(false);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;

    const start = Date.now();

    const tripId = localStorage.getItem("current_trip_id");
    const fetchProfile = (tripId
      ? authedFetch(`${process.env.NEXT_PUBLIC_API_URL}/travel-profile?trip_id=${tripId}`)
      : Promise.reject(new Error("No trip ID"))
    )
      .then((res) => res.json())
      .then((res) => {
        const data = res.data ?? res;
        saveTravelProfile({
          travel_lifestyle: data.travel_lifestyle ?? "",
          caption: data.caption ?? "",
          destinations: Array.isArray(data.destinations) ? data.destinations : [],
        });
      })
      .catch(() => {});

    const minWait = new Promise<void>((resolve) =>
      setTimeout(resolve, MIN_DURATION_MS)
    );

    Promise.all([fetchProfile, minWait]).then(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, MIN_DURATION_MS - elapsed);
      setTimeout(() => router.push("/results"), remaining);
    });
  }, [router]);

  return (
    <main className="page--centered">
      <motion.div
        className="loading-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="loading-title">
          Analyzing your
          <br />
          <span className="loading-title__accent">travel instincts.</span>
        </h1>

        <p className="loading-subtitle">This takes a moment.</p>

        <div className="loading-steps">
          {STEPS.map((step, i) => (
            <motion.div
              key={step}
              className="loading-step"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.55, duration: 0.4 }}
            >
              <motion.div
                className="loading-step__dot"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.55, type: "spring" }}
              />
              <motion.p
                className="loading-step__label"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.55 + 0.1 }}
              >
                {step}
              </motion.p>
            </motion.div>
          ))}
        </div>

        <div className="loading-spinner">
          <motion.div
            className="loading-spinner__ring"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </motion.div>
    </main>
  );
}
