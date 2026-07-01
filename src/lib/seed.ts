// Hermetic fixture for the deterministic e2e race (`?seed=test`). People only —
// Shah Rukh Khan -> Kajol -> Amitabh Bachchan. Placeholder portraits are initials avatars;
// `desc` gives each face a peekable identity (the live game uses real portraits + Wikidata text).

import type { Tile } from "./board";
import { initialsAvatar } from "./avatar";

export type SeedPage = { type: string; tiles: Tile[] };

function makeTiles(people: readonly { t: string; d: string }[]): Tile[] {
  return people.map(({ t, d }, i) => ({
    title: t,
    type: "person",
    desc: d,
    image: initialsAvatar(t, (i * 47 + 11) % 360),
    imageKey: t,
    bridge: false,
  }));
}

const PAGES: Record<string, SeedPage> = {
  "Shah Rukh Khan": {
    type: "person",
    tiles: makeTiles([
      { t: "Kajol", d: "Frequent co-star" },
      { t: "Aamir Khan", d: "Actor, contemporary" },
      { t: "Salman Khan", d: "Actor, contemporary" },
      { t: "Gauri Khan", d: "His wife, producer" },
      { t: "Karan Johar", d: "Director he works with" },
      { t: "Juhi Chawla", d: "Co-star, business partner" },
      { t: "Rani Mukerji", d: "Frequent co-star" },
      { t: "Deepika Padukone", d: "Co-star" },
      { t: "Priyanka Chopra", d: "Co-star" },
      { t: "Kareena Kapoor", d: "Co-star" },
      { t: "Akshay Kumar", d: "Actor, contemporary" },
      { t: "Hrithik Roshan", d: "Actor, contemporary" },
      { t: "Madhuri Dixit", d: "Co-star" },
      { t: "Anushka Sharma", d: "Co-star" },
    ]),
  },
  Kajol: {
    type: "person",
    tiles: makeTiles([
      { t: "Amitabh Bachchan", d: "Co-star, screen legend" },
      { t: "Ajay Devgn", d: "Her husband, actor" },
      { t: "Tanuja", d: "Her mother, actress" },
      { t: "Rani Mukerji", d: "Her cousin, actress" },
      { t: "Kareena Kapoor", d: "Actress, contemporary" },
      { t: "Aamir Khan", d: "Co-star" },
      { t: "Karan Johar", d: "Director she works with" },
      { t: "Saif Ali Khan", d: "Actor, contemporary" },
      { t: "Jaya Bachchan", d: "Actress" },
      { t: "Abhishek Bachchan", d: "Actor" },
      { t: "Aishwarya Rai", d: "Actress, contemporary" },
      { t: "Shah Rukh Khan", d: "Frequent co-star" },
      { t: "Twinkle Khanna", d: "Actress, author" },
      { t: "Sridevi", d: "Screen legend" },
    ]),
  },
  "Amitabh Bachchan": {
    type: "person",
    tiles: makeTiles([
      { t: "Jaya Bachchan", d: "His wife, actress" },
      { t: "Abhishek Bachchan", d: "His son, actor" },
      { t: "Aishwarya Rai", d: "His daughter-in-law" },
      { t: "Rekha", d: "Frequent co-star" },
      { t: "Dharmendra", d: "Co-star, contemporary" },
      { t: "Hema Malini", d: "Frequent co-star" },
      { t: "Rishi Kapoor", d: "Actor, contemporary" },
      { t: "Shashi Kapoor", d: "Frequent co-star" },
      { t: "Dilip Kumar", d: "Screen legend" },
      { t: "Vinod Khanna", d: "Co-star" },
      { t: "Shah Rukh Khan", d: "Co-star, successor" },
      { t: "Aamir Khan", d: "Actor" },
      { t: "Salman Khan", d: "Actor" },
      { t: "Govinda", d: "Actor, contemporary" },
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
