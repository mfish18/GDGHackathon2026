"use client";

import { TravelCard } from "./data";

const KEY = "travel_dna_results";

export function saveResults(liked: TravelCard[], skipped: TravelCard[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify({ liked, skipped }));
}

export function loadResults(): { liked: TravelCard[]; skipped: TravelCard[] } | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearResults() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
