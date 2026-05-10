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

export const CARDS: TravelCard[] = [
  {
    id: "tokyo-street",
    label: "Neon-lit alleyways",
    location: "Tokyo, Japan",
    imageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
  },
  // {
  //   id: "norwegian-fjord",
  //   label: "Glacial silence",
  //   location: "Geiranger, Norway",
  //   imageUrl: "https://images.unsplash.com/photo-1520769669658-f07657f5a307?w=800&q=80",
  //   vibes: { energy: 1, nature: 10, nightlife: 0, culture: 3, solitude: 9 },
  // },
  // {
  //   id: "marrakech-souk",
  //   label: "Spice market chaos",
  //   location: "Marrakech, Morocco",
  //   imageUrl: "https://images.unsplash.com/photo-1489493585363-d69421e0edd3?w=800&q=80",
  //   vibes: { energy: 8, nature: 2, nightlife: 4, culture: 10, solitude: 1 },
  // },
  // {
  //   id: "amalfi-terrace",
  //   label: "Clifftop cafes",
  //   location: "Amalfi Coast, Italy",
  //   imageUrl: "https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?w=800&q=80",
  //   vibes: { energy: 4, nature: 6, nightlife: 3, culture: 8, solitude: 5 },
  // },
  // {
  //   id: "kyoto-temple",
  //   label: "Ancient moss gardens",
  //   location: "Kyoto, Japan",
  //   imageUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80",
  //   vibes: { energy: 2, nature: 7, nightlife: 1, culture: 10, solitude: 7 },
  // },
  // {
  //   id: "nyc-rooftop",
  //   label: "Skyline at midnight",
  //   location: "New York, USA",
  //   imageUrl: "https://images.unsplash.com/photo-1546436836-07a91091f160?w=800&q=80",
  //   vibes: { energy: 10, nature: 0, nightlife: 9, culture: 6, solitude: 1 },
  // },
  // {
  //   id: "patagonia-trek",
  //   label: "Wind-scoured peaks",
  //   location: "Patagonia, Argentina",
  //   imageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
  //   vibes: { energy: 5, nature: 10, nightlife: 0, culture: 2, solitude: 10 },
  // },
  // {
  //   id: "lisbon-tram",
  //   label: "Pastel tram rides",
  //   location: "Lisbon, Portugal",
  //   imageUrl: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=80",
  //   vibes: { energy: 5, nature: 3, nightlife: 6, culture: 8, solitude: 4 },
  // },
  // {
  //   id: "bali-rice",
  //   label: "Emerald terraces",
  //   location: "Ubud, Bali",
  //   imageUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
  //   vibes: { energy: 3, nature: 9, nightlife: 2, culture: 6, solitude: 6 },
  // },
  // {
  //   id: "berlin-club",
  //   label: "Industrial dance floors",
  //   location: "Berlin, Germany",
  //   imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  //   vibes: { energy: 8, nature: 1, nightlife: 10, culture: 5, solitude: 2 },
  // },
  // {
  //   id: "sahara-dunes",
  //   label: "Endless dunes",
  //   location: "Sahara, Morocco",
  //   imageUrl: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
  //   vibes: { energy: 2, nature: 8, nightlife: 0, culture: 4, solitude: 9 },
  // },
  // {
  //   id: "bangkok-street",
  //   label: "Street food chaos",
  //   location: "Bangkok, Thailand",
  //   imageUrl: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800&q=80",
  //   vibes: { energy: 9, nature: 1, nightlife: 7, culture: 8, solitude: 1 },
  // },
];

export type Archetype = {
  name: string;
  tagline: string;
  description: string;
  destinations: { city: string; country: string; reason: string }[];
  itinerary: { day: number; title: string; activities: string[] }[];
  personalitySummary: string;
};

export const ARCHETYPES: Record<string, Archetype> = {
  neon_explorer: {
    name: "Neon Explorer",
    tagline: "You chase electricity.",
    description: "You are drawn to cities that never sleep — places where energy compounds at midnight and every corner holds a new discovery. Stillness makes you restless.",
    personalitySummary: "Your swipes reveal a pattern: you gravitate toward density, movement, and the productive friction of crowded spaces. You are energized by the city's metabolism, by the negotiation of a busy street, by the particular loneliness-in-company that only a megacity offers. You travel not to escape, but to find a more intense version of living.",
    destinations: [
      { city: "Tokyo", country: "Japan", reason: "The world's most organized chaos. Every neighborhood is a different universe." },
      { city: "Hong Kong", country: "China", reason: "Vertical living, night markets, and a skyline that earns its reputation." },
      { city: "Mexico City", country: "Mexico", reason: "Cultural density at every altitude, from street tacos to world-class museums." },
    ],
    itinerary: [
      { day: 1, title: "Arrive and absorb", activities: ["Land in Shinjuku, drop bags, walk immediately", "Ramen at 11pm in a standing-only counter", "Explore the alley bars of Golden Gai"] },
      { day: 2, title: "Structured wandering", activities: ["Tsukiji outer market at 7am", "Harajuku to Shibuya on foot", "TeamLab digital art installation at dusk", "Shibuya crossing at midnight"] },
      { day: 3, title: "Go deeper", activities: ["Train to Shimokitazawa for vintage shops", "Jazz cafe in the afternoon", "Yakitori under the train tracks in Yurakucho"] },
    ],
  },
  silent_wanderer: {
    name: "Silent Wanderer",
    tagline: "You travel to disappear.",
    description: "You seek places where the human footprint fades and the landscape takes over. Silence is not absence for you — it is a kind of presence.",
    personalitySummary: "The images you chose share a quality: space. You are drawn to environments where the horizon is uncluttered and the only noise is wind or water. This is not escapism — it is a calibration. You return from these places more precise, more yourself.",
    destinations: [
      { city: "Tromsø", country: "Norway", reason: "Northern lights over the Arctic Ocean. The sky does the talking." },
      { city: "Torres del Paine", country: "Chile", reason: "Raw Patagonian wilderness. Four days without a signal." },
      { city: "Faroe Islands", country: "Denmark", reason: "Edge-of-the-world cliffs and almost no one else." },
    ],
    itinerary: [
      { day: 1, title: "Orientation", activities: ["Arrive in Tromsø, collect rental car", "Drive the coast road north", "Cook dinner in the cabin, watch for aurora"] },
      { day: 2, title: "Into the fjords", activities: ["Early hike to Fjellheisen summit", "Kayak a quiet fjord arm in the afternoon", "Sauna at dusk, cold plunge in the fjord"] },
      { day: 3, title: "Total immersion", activities: ["Full day backcountry skiing or snowshoe trek", "Reindeer farm visit with Sami guide", "Northern lights photography session at 2am"] },
    ],
  },
  culture_archaeologist: {
    name: "Culture Archaeologist",
    tagline: "You dig for what came before.",
    description: "History is not background for you — it is the destination. You want to touch the layers, to understand how a place became itself.",
    personalitySummary: "Your pattern reveals a deep attraction to context. You chose images that told stories: ancient architecture, layered markets, evidence of lives lived differently. You are the traveler who reads three books before arriving and leaves with fifteen questions.",
    destinations: [
      { city: "Rome", country: "Italy", reason: "Two thousand years of civilization stacked on top of itself." },
      { city: "Kyoto", country: "Japan", reason: "Preserved feudal Japan, still living and breathing." },
      { city: "Fez", country: "Morocco", reason: "The world's largest car-free urban area. The medina hasn't changed in centuries." },
    ],
    itinerary: [
      { day: 1, title: "The ancient core", activities: ["Forum Romanum at opening hour before crowds", "Underground Mithraic temple beneath a church", "Trastevere for dinner in a trattoria with no menu"] },
      { day: 2, title: "Layers of empire", activities: ["Baths of Caracalla", "Appian Way walk to the catacombs", "Testaccio market and neighbourhood"] },
      { day: 3, title: "Contemporary Rome", activities: ["MAXXI contemporary art museum", "Prati neighbourhood coffee ritual", "Rooftop aperitivo overlooking the Vatican"] },
    ],
  },
  midnight_social: {
    name: "Midnight Social",
    tagline: "You arrive when others leave.",
    description: "Your best travel memories start after 11pm. You collect cities through their nightlife: the bars that require knowing someone, the clubs that open at 4am.",
    personalitySummary: "Your swipes skewed toward energy and darkness: neon signs, crowded spaces, the suggestion of music. You are a connector. You travel for the people as much as the places, and you have a talent for finding the room where everything interesting is happening.",
    destinations: [
      { city: "Berlin", country: "Germany", reason: "The world capital of electronic music and intentional hedonism." },
      { city: "Ibiza", country: "Spain", reason: "The original. Still undefeated for sheer scale of the experience." },
      { city: "Buenos Aires", country: "Argentina", reason: "A city that biologically cannot sleep before 2am." },
    ],
    itinerary: [
      { day: 1, title: "Arrive late, sleep in", activities: ["Check into Mitte hotel, walk Hackescher Markt", "Dinner at 9pm in a converted factory space", "First bar at midnight, let the night find its shape"] },
      { day: 2, title: "Sleep is optional", activities: ["Berghain queue, patience required", "Emerge whenever, Vietnamese food in Dong Xuan", "Recover in a beer garden, plan the next night"] },
      { day: 3, title: "The lighter side", activities: ["East Side Gallery walk along the Wall", "Record shopping in Neukölln", "Tresor for one last night"] },
    ],
  },
};

export function computeArchetype(liked: TravelCard[]): string {
  if (liked.length === 0) return "neon_explorer";

  const totals: VibeScores = { energy: 0, nature: 0, nightlife: 0, culture: 0, solitude: 0 };
  for (const card of liked) {
    for (const key of Object.keys(totals) as (keyof VibeScores)[]) {
      totals[key] += card.vibes[key];
    }
  }

  const n = liked.length;
  const avg = {
    energy: totals.energy / n,
    nature: totals.nature / n,
    nightlife: totals.nightlife / n,
    culture: totals.culture / n,
    solitude: totals.solitude / n,
  };

  if (avg.nightlife > 6) return "midnight_social";
  if (avg.nature > 6 && avg.solitude > 6) return "silent_wanderer";
  if (avg.culture > 6 && avg.energy < 6) return "culture_archaeologist";
  return "neon_explorer";
}
