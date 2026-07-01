// Hermetic fixture for the deterministic demo/test race (`?seed=test`). People only —
// Shah Rukh Khan -> Kajol -> Amitabh Bachchan. Placeholder portraits are circular initial
// "stickers"; the live game uses real Wikipedia portraits.

import type { Tile } from "./board";

export function seedImg(label: string, hue = 210): string {
  const initials = label
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>` +
    `<circle cx='100' cy='100' r='100' fill='hsl(${hue},58%,55%)'/>` +
    `<text x='100' y='118' font-family='sans-serif' font-size='64' font-weight='700' ` +
    `fill='white' text-anchor='middle'>${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export type SeedPage = { type: string; tiles: Tile[] };

function makeTiles(titles: readonly string[]): Tile[] {
  return titles.map((title, i) => ({
    title,
    type: "person",
    image: seedImg(title, (i * 47 + 11) % 360),
    imageKey: title,
    bridge: false,
  }));
}

const PAGES: Record<string, SeedPage> = {
  "Shah Rukh Khan": {
    type: "person",
    tiles: makeTiles([
      "Kajol", "Aamir Khan", "Salman Khan", "Gauri Khan", "Karan Johar", "Juhi Chawla",
      "Rani Mukerji", "Deepika Padukone", "Priyanka Chopra", "Kareena Kapoor", "Akshay Kumar",
      "Hrithik Roshan", "Madhuri Dixit", "Anushka Sharma",
    ]),
  },
  Kajol: {
    type: "person",
    tiles: makeTiles([
      "Amitabh Bachchan", "Ajay Devgn", "Tanuja", "Rani Mukerji", "Kareena Kapoor", "Aamir Khan",
      "Karan Johar", "Saif Ali Khan", "Jaya Bachchan", "Abhishek Bachchan", "Aishwarya Rai",
      "Shah Rukh Khan", "Twinkle Khanna", "Sridevi",
    ]),
  },
  "Amitabh Bachchan": {
    type: "person",
    tiles: makeTiles([
      "Jaya Bachchan", "Abhishek Bachchan", "Aishwarya Rai", "Rekha", "Dharmendra", "Hema Malini",
      "Rishi Kapoor", "Shashi Kapoor", "Dilip Kumar", "Vinod Khanna", "Shah Rukh Khan",
      "Aamir Khan", "Salman Khan", "Govinda",
    ]),
  },
};

export type Seed = {
  start: string;
  target: string;
  path: string[];
  pages: Record<string, SeedPage>;
};

export const SEED: Seed = {
  start: "Shah Rukh Khan",
  target: "Amitabh Bachchan",
  path: ["Shah Rukh Khan", "Kajol", "Amitabh Bachchan"],
  pages: PAGES,
};

export function seedNeighbors(title: string): string[] {
  const page = PAGES[title];
  return page ? page.tiles.map((t) => t.title) : [];
}
