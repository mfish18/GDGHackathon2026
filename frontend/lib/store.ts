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

const TRAVEL_PROFILE_KEY = "travel_dna_travel_profile";

export type TravelProfile = {
  travel_lifestyle: string;
  caption: string;
  destinations: { name: string; reason: string }[];
};

export function saveTravelProfile(profile: TravelProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TRAVEL_PROFILE_KEY, JSON.stringify(profile));
}

export function loadTravelProfile(): TravelProfile | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(TRAVEL_PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearTravelProfile() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TRAVEL_PROFILE_KEY);
}

export type Trip = {
  id: string;
  name: string;
  user_score: UserProfile;
  title: string;
  lifestyle_caption: string;
  trip1: string;
  trip1reason: string;
  trip2: string;
  trip2reason: string;
  trip3: string;
  trip3reason: string;
  createdAt: string;
};
