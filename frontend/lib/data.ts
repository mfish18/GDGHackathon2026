export type VibeScores = {
  energy: number;      // 0–10: calm ↔ chaotic
  nature: number;      // 0–10: urban ↔ wild
  nightlife: number;   // 0–10: quiet ↔ party
  culture: number;     // 0–10: modern ↔ historic
  solitude: number;    // 0–10: social ↔ solitary
};

export type TravelCard = {
  id: string;
  label: string;
  location: string;
  imageUrl: string;
};

export type Archetype = {
  name: string;
  tagline: string;
  description: string;
  destinations: { city: string; country: string; reason: string }[];
  itinerary: { day: number; title: string; activities: string[] }[];
  personalitySummary: string;
};
