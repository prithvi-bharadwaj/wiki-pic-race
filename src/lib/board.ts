// Board construction (GDD §3a). Turns a page's candidate links into a diverse tile set:
// de-dup near-identical images, bucket by type, round-robin for spread, and reserve "bridge"
// slots for links whose type differs from the current page (so clever cross-topic paths surface).

export type Candidate = {
  title: string;
  image: string | null; // resolved URL (null => placeholder tile)
  imageKey: string; // de-dup key (image filename, or title when imageless)
  type: string; // coarse bucket: film/person/place/sport/org/concept/...
  weight?: number; // prominence; lower = stronger (e.g. link order / -pageviews)
};

export type Tile = Candidate & { bridge: boolean };

export type BuildOpts = {
  size?: number; // total tiles (default 24)
  bridgeSlots?: number; // reserved cross-topic tiles (default 8)
  pageType?: string; // dominant type of the current page (enables bridge reservation)
};

const w = (c: Candidate): number => c.weight ?? Number.POSITIVE_INFINITY;

// Take up to `limit` candidates, one per type per pass, for an even spread across buckets.
function pushRoundRobin(
  cands: readonly Candidate[],
  limit: number,
  used: Set<string>,
  chosen: Tile[],
  bridge: boolean,
): void {
  const groups = new Map<string, Candidate[]>();
  for (const c of cands) {
    if (used.has(c.imageKey)) continue;
    const g = groups.get(c.type);
    if (g) g.push(c);
    else groups.set(c.type, [c]);
  }
  const order = [...groups.keys()];
  let added = 0;
  while (added < limit) {
    let progressed = false;
    for (const type of order) {
      const g = groups.get(type);
      if (!g || g.length === 0) continue;
      const c = g.shift() as Candidate;
      if (used.has(c.imageKey)) continue;
      used.add(c.imageKey);
      chosen.push({ ...c, bridge });
      added += 1;
      progressed = true;
      if (added >= limit) break;
    }
    if (!progressed) break; // candidates exhausted
  }
}

export function buildBoard(candidates: readonly Candidate[], opts: BuildOpts = {}): Tile[] {
  const size = opts.size ?? 24;
  const bridgeSlots = Math.min(opts.bridgeSlots ?? 8, size);

  // 1. de-dup by imageKey, keeping the strongest (lowest weight) per key
  const byKey = new Map<string, Candidate>();
  for (const c of candidates) {
    const prev = byKey.get(c.imageKey);
    if (!prev || w(c) < w(prev)) byKey.set(c.imageKey, c);
  }
  const sorted = [...byKey.values()].sort((a, b) => w(a) - w(b));

  const chosen: Tile[] = [];
  const used = new Set<string>();

  // 2. reserve bridge slots: links whose type differs from the page's dominant type
  if (opts.pageType !== undefined && bridgeSlots > 0) {
    const bridges = sorted.filter((c) => c.type !== opts.pageType);
    pushRoundRobin(bridges, bridgeSlots, used, chosen, true);
  }

  // 3. fill the rest with a type-spread round-robin over all candidates
  pushRoundRobin(sorted, size - chosen.length, used, chosen, false);

  return chosen.slice(0, size);
}
