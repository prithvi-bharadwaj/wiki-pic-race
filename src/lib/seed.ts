// Hermetic fixture for the deterministic demo/test race (`?seed=test`). No network — the
// e2e acceptance check drives this so it is fast, offline, and stable. Theme: the SRK example
// from the GDD — Shah Rukh Khan -> Chak De! India (his hockey film) -> Field hockey.

import type { Tile } from "./board";

export function seedImg(label: string, hue = 210): string {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'>` +
    `<rect width='100%' height='100%' fill='hsl(${hue},65%,52%)'/>` +
    `<text x='50%' y='52%' font-family='sans-serif' font-size='13' fill='white' ` +
    `text-anchor='middle' dominant-baseline='middle'>${label.slice(0, 16)}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

type Spec = readonly [title: string, type: string];

function makeTiles(specs: readonly Spec[]): Tile[] {
  return specs.map(([title, type], i) => ({
    title,
    type,
    image: seedImg(title, (i * 53 + 17) % 360),
    imageKey: title,
    bridge: false,
  }));
}

export type SeedPage = { type: string; tiles: Tile[] };

const PAGES: Record<string, SeedPage> = {
  "Shah Rukh Khan": {
    type: "person",
    tiles: makeTiles([
      ["Chak De! India", "film"],
      ["Dilwale Dulhania Le Jayenge", "film"],
      ["My Name Is Khan", "film"],
      ["Don", "film"],
      ["Kajol", "person"],
      ["Aamir Khan", "person"],
      ["Gauri Khan", "person"],
      ["Mumbai", "place"],
      ["Delhi", "place"],
      ["Kolkata", "place"],
      ["Cricket", "sport"],
      ["Kabaddi", "sport"],
      ["Kolkata Knight Riders", "org"],
      ["Red Chillies Entertainment", "org"],
    ]),
  },
  "Chak De! India": {
    type: "film",
    tiles: makeTiles([
      ["Field hockey", "sport"],
      ["Hockey", "sport"],
      ["India national field hockey team", "org"],
      ["Shah Rukh Khan", "person"],
      ["Shimit Amin", "person"],
      ["Vidya Malvade", "person"],
      ["Delhi", "place"],
      ["Haryana", "place"],
      ["Australia", "place"],
      ["Lagaan", "film"],
      ["Bend It Like Beckham", "film"],
      ["Yash Raj Films", "org"],
      ["2002 Commonwealth Games", "event"],
      ["Cricket", "sport"],
    ]),
  },
  "Field hockey": {
    type: "sport",
    tiles: makeTiles([
      ["Hockey", "sport"],
      ["Olympic sports", "sport"],
      ["India", "place"],
      ["Netherlands", "place"],
      ["Ball", "other"],
      ["Stick", "other"],
      ["Goalkeeper", "person"],
      ["Pakistan", "place"],
      ["Australia", "place"],
      ["Dribbling", "other"],
      ["Penalty corner", "other"],
      ["Astroturf", "other"],
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
  target: "Field hockey",
  path: ["Shah Rukh Khan", "Chak De! India", "Field hockey"],
  pages: PAGES,
};

export function seedNeighbors(title: string): string[] {
  const page = PAGES[title];
  return page ? page.tiles.map((t) => t.title) : [];
}
