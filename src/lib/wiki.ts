// Live MediaWiki / REST client for people-only races. Server-side only (sets a User-Agent).
// The game hops person -> person: getBoard keeps only person-typed links, and the random walk
// uses getPeopleLinks so every step is a person. Images resolve REST-first (cutout portraits).

import { buildBoard, type Candidate, type Tile } from "./board";
import { pickImage } from "./image";

const API = "https://en.wikipedia.org/w/api.php";
const REST = "https://en.wikipedia.org/api/rest_v1/page/summary/";
const UA = "WikiPicRace/0.1 (https://github.com/prithvi-bharadwaj/wiki-pic-race)";

export type Board = { type: string; tiles: Tile[] };

const boardCache = new Map<string, Board>();
const imgCache = new Map<string, string | null>();

const PERSON = /\bborn\b|\b(actor|actress|singer|songwriter|rapper|musician|composer|conductor|director|producer|filmmaker|screenwriter|writer|author|poet|novelist|playwright|journalist|presenter|host|comedian|model|dancer|painter|artist|sculptor|photographer|architect|politician|president|senator|governor|minister|diplomat|lawyer|judge|activist|businessman|businesswoman|entrepreneur|investor|executive|economist|scientist|physicist|chemist|biologist|mathematician|engineer|inventor|philosopher|historian|professor|footballer|cricketer|basketball|tennis|boxer|wrestler|golfer|swimmer|cyclist|athlete|sprinter|driver|player|coach|chef|astronaut|monarch|king|queen|emperor|prince|princess|pope|saint)\b/;

export function classifyType(desc: string | undefined): string {
  const s = (desc ?? "").toLowerCase();
  if (PERSON.test(s)) return "person";
  if (s.includes("film")) return "film";
  if (/(city|capital|state|country|district|town|village|river|island|region)/.test(s)) return "place";
  if (/(sport|club|team|league|stadium|tournament)/.test(s)) return "sport";
  if (/(song|album|soundtrack)/.test(s)) return "music";
  if (/(company|organization|organisation|university|channel|network|studio|institute)/.test(s)) return "org";
  return "other";
}

type ApiPage = { title: string; index?: number; description?: string; thumbnail?: { source: string } };
type ApiResp = { query?: { pages?: Record<string, ApiPage>; random?: { title: string }[] } };

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { "User-Agent": UA, "Api-User-Agent": UA } });
  if (!res.ok) throw new Error(`wiki ${res.status}`);
  return res.json();
}

// REST summary thumbnail for a single title (includes non-free images). Cached.
export async function resolveImage(title: string): Promise<string | null> {
  if (imgCache.has(title)) return imgCache.get(title) ?? null;
  try {
    const data = (await fetchJson(REST + encodeURIComponent(title.replace(/ /g, "_")))) as {
      thumbnail?: { source: string };
    };
    const url = data.thumbnail?.source ?? null;
    imgCache.set(title, url);
    return url;
  } catch {
    imgCache.set(title, null);
    return null;
  }
}

// Titles of the people linked from a page (for the person->person walk + move validation).
export async function getPeopleLinks(title: string): Promise<string[]> {
  const url = `${API}?action=query&format=json&generator=links&gpllimit=500&gplnamespace=0&prop=description&titles=${encodeURIComponent(title)}`;
  const data = (await fetchJson(url)) as ApiResp;
  return Object.values(data.query?.pages ?? {})
    .filter((p) => classifyType(p.description) === "person")
    .map((p) => p.title);
}

export async function getBoard(title: string): Promise<Board> {
  const cached = boardCache.get(title);
  if (cached) return cached;

  const url = `${API}?action=query&format=json&generator=links&gpllimit=500&gplnamespace=0&prop=pageimages|description&piprop=thumbnail&pithumbsize=240&titles=${encodeURIComponent(title)}`;
  const data = (await fetchJson(url)) as ApiResp;
  const pages = Object.values(data.query?.pages ?? {}).sort((a, b) => (a.index ?? 1e9) - (b.index ?? 1e9));

  // people only
  const candidates: Candidate[] = pages
    .filter((p) => classifyType(p.description) === "person")
    .map((p, i) => ({
      title: p.title,
      image: p.thumbnail?.source ?? null,
      imageKey: p.thumbnail?.source ?? p.title,
      type: "person",
      weight: p.index ?? i,
    }));

  const board = buildBoard(candidates, { size: 16, bridgeSlots: 0 });

  // resolve each chosen sticker's portrait (REST -> pageimage -> placeholder); only spend REST on blanks
  const tiles = await Promise.all(
    board.map(async (t) => {
      if (t.image) return t;
      const picked = pickImage({ restThumb: await resolveImage(t.title), pageImageThumb: null });
      return picked.url ? { ...t, image: picked.url, imageKey: picked.url } : t;
    }),
  );

  const result: Board = { type: "person", tiles };
  boardCache.set(title, result);
  return result;
}

// A pool of well-known people (rich person-links + good portraits) to seed random races from.
const RANDOM_PEOPLE = [
  "Shah Rukh Khan", "Amitabh Bachchan", "Aamir Khan", "Priyanka Chopra", "Leonardo DiCaprio",
  "Tom Cruise", "Meryl Streep", "Barack Obama", "Taylor Swift", "Cristiano Ronaldo",
  "Lionel Messi", "Oprah Winfrey", "Albert Einstein", "Madonna", "Beyoncé",
  "Brad Pitt", "Angelina Jolie", "Robert De Niro", "Scarlett Johansson", "Tom Hanks",
];

export function randomPerson(): string {
  return RANDOM_PEOPLE[Math.floor(Math.random() * RANDOM_PEOPLE.length)];
}
