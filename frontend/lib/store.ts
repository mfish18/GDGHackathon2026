"use client";

import { TravelCard } from "./data";

const KEY = "travel_dna_results";
const PROFILE_KEY = "travel_dna_user_profile";

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

export type UserProfile = {
  energy: number;
  nature: number;
  nightlife: number;
  luxury: number;
  social_density: number;
};

export function saveUserProfile(profile: UserProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadUserProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
