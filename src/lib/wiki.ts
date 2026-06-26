// Live MediaWiki / REST client for real races. Server-side only (sets a User-Agent).
// One batched call gets links + thumbnails + descriptions; buildBoard handles diversity;
// pickImage resolves each chosen tile REST-first so non-free posters/crests still render (GDD §3a).

import { buildBoard, type Candidate, type Tile } from "./board";
import { pickImage } from "./image";

const API = "https://en.wikipedia.org/w/api.php";
const REST = "https://en.wikipedia.org/api/rest_v1/page/summary/";
const UA = "WikiPicRace/0.1 (https://github.com/prithvi-bharadwaj/wiki-pic-race)";

export type Board = { type: string; tiles: Tile[] };

const boardCache = new Map<string, Board>();
const imgCache = new Map<string, string | null>();

export function classifyType(desc: string | undefined): string {
  const s = (desc ?? "").toLowerCase();
  if (s.includes("film")) return "film";
  if (/(actor|actress|singer|director|cricketer|politician|player|musician|footballer|writer|author|host)/.test(s) || s.includes(" born ")) return "person";
  if (/(city|capital|state|country|district|town|village|river|island|region|county|mountain)/.test(s)) return "place";
  if (/(sport|club|team|football|hockey|league|stadium|cricket|tournament)/.test(s)) return "sport";
  if (s.includes("award")) return "award";
  if (/(song|album|soundtrack)/.test(s)) return "music";
  if (/(company|organization|organisation|university|channel|network|studio|institute|agency)/.test(s)) return "org";
  return "other";
}

type ApiPage = { title: string; index?: number; description?: string; thumbnail?: { source: string } };
type ApiResp = { query?: { pages?: Record<string, ApiPage>; random?: { title: string }[] } };

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { "User-Agent": UA, "Api-User-Agent": UA } });
  if (!res.ok) throw new Error(`wiki ${res.status}`);
  return res.json();
}

// REST summary thumbnail for a single title (includes non-free posters/crests). Cached.
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

export async function getLinks(title: string): Promise<string[]> {
  const url = `${API}?action=query&format=json&generator=links&gpllimit=500&gplnamespace=0&prop=info&titles=${encodeURIComponent(title)}`;
  const data = (await fetchJson(url)) as ApiResp;
  return Object.values(data.query?.pages ?? {}).map((p) => p.title);
}

export async function getBoard(title: string): Promise<Board> {
  const cached = boardCache.get(title);
  if (cached) return cached;

  const selfUrl = `${API}?action=query&format=json&prop=description&titles=${encodeURIComponent(title)}`;
  const selfData = (await fetchJson(selfUrl)) as ApiResp;
  const pageType = classifyType(Object.values(selfData.query?.pages ?? {})[0]?.description);

  const url = `${API}?action=query&format=json&generator=links&gpllimit=500&gplnamespace=0&prop=pageimages|description&piprop=thumbnail&pithumbsize=200&titles=${encodeURIComponent(title)}`;
  const data = (await fetchJson(url)) as ApiResp;
  // generator order (link prominence) lives in `index`; Object.values is pageid-keyed, so sort by it
  const pages = Object.values(data.query?.pages ?? {}).sort((a, b) => (a.index ?? 1e9) - (b.index ?? 1e9));

  const candidates: Candidate[] = pages.map((p, i) => ({
    title: p.title,
    image: p.thumbnail?.source ?? null,
    imageKey: p.thumbnail?.source ?? p.title,
    type: classifyType(p.description),
    weight: p.index ?? i,
  }));

  const board = buildBoard(candidates, { size: 24, bridgeSlots: 8, pageType });

  // Fill any chosen tile lacking a (free) pageimage via the REST summary, then placeholder.
  // pickImage encodes the resolution order; we only spend REST calls on the blanks.
  const tiles = await Promise.all(
    board.map(async (t) => {
      if (t.image) return t;
      const picked = pickImage({ restThumb: await resolveImage(t.title), pageImageThumb: null });
      return picked.url ? { ...t, image: picked.url, imageKey: picked.url } : t;
    }),
  );

  const result: Board = { type: pageType, tiles };
  boardCache.set(title, result);
  return result;
}

export async function getRandom(count: number): Promise<string[]> {
  const url = `${API}?action=query&format=json&list=random&rnnamespace=0&rnlimit=${count}`;
  const data = (await fetchJson(url)) as ApiResp;
  return (data.query?.random ?? []).map((r) => r.title);
}
