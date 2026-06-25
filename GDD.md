# Wiki Pic Race — GDD

**One-liner:** A competitive Wikipedia race where you navigate by **pictures, not words** — get from a start article to a target article in the fewest hops, clicking only images.

**Differentiator (vs Neal's Wiki Spy):** Wiki Spy = single-player *find-the-object*. This = *race A→B* + *competition* (daily seed, leaderboard, shareable image-trail). Same medium, opposite genre. The moat is **race + speed + social**, which Wiki Spy has none of.

**Stack:** Next.js (App Router) · TS · Tailwind · shadcn/ui · Zod · Upstash Redis · Vercel. No SQL DB through v1.

## 1. Pillars
1. **Read pictures, not text.** Tiles are images; titles hidden, peek on hover. Skill = visual intuition.
2. **Race, don't browse.** Every run has start, target, hop counter, timer.
3. **Compete & share.** Shared daily seed → leaderboard → auto-generated share card of your image trail.
4. **Instant, no account.** Wikipedia is the backend.

## 2. Core loop
`Start article (image grid) → click a tile (= follow that link) → land on next article → repeat → reach target → win screen (hops, time, par, trail replay, share, rank)`

## 3. Navigation model (the heart)
- **Graph = Wikipedia hyperlink graph.** Node = article; each tile = a *linked* article rendered as its **lead thumbnail**. Clicking a tile follows that hyperlink.
- **Titles hidden by default**, peek on hover / tap; **Hard mode** = no peek.
- **Tiles:** 24 by default (thumbnailed links first); **"Show all" expansion always available** → no soft-locks.
- **Why link graph, not image-usage graph:** densely connected, solvable, one batched call per page, and it dodges the flag/icon hub problem. (Image-similarity graph = v2 mode, §8.)

## 3a. Board construction — image diversity (core craft)
Raw link distribution is lopsided (SRK's 500 links: 136 film, 122 person, 10 place, 3 sport, 13 org). Naive selection = 24 near-identical posters/faces. Three layers fix it:

**A. Representation — render the DESTINATION's iconic image, never the current page's photos.** (SRK board = Chak De poster, Delhi cityscape, KKR logo — not 24 headshots.) Resolve each tile's image in order:
1. REST `…/api/rest_v1/page/summary/<title>` → iconic lead image incl. posters/crests (verified: returns Chak De poster + Real Madrid crest where `pageimages` returns nothing).
2. `pageimages` (free-only) — use for a strictly-licensed build.
3. Typed placeholder (Wikidata instance-of → icon + title text) — guaranteed.
- Caveat: REST serves fair-use media → mild copyright gray area; fine for a hobby toy, swap to `pageimages`-only for clean licensing.

**B. Selection — engineer a type spread, don't take prominence.**
1. Pull candidate links + Wikidata type / short description (one call).
2. Bucket by type (film / person / place / sport / org / concept…).
3. Round-robin across buckets → 24 tiles spanning many types.
4. **Reserve ~8/24 "bridge" slots** for links whose type is far from the page's dominant type — surfaces SRK→Chak De→sport instead of burying it.
5. pHash-dedup near-identical images; "Show all" always available (solvability net).

**C. Balance knob (diversity vs solvability):** ~16 strong + ~8 bridge tiles. For **dailies, pin the BFS par next-hop** as a guaranteed tile each step so the solution is never hidden. (SRK→Real Madrid is ~5 hops via Field hockey, not 2 — BFS computes real par.) The principled "type far from page" = embedding distance → v2 Similarity layer; v1 gets ~80% from Wikidata types + reserve slots.

## 4. Modes
| Mode | What | Version |
|---|---|---|
| Speedrun | Random pair, beat the clock | v0 |
| Practice | Random pair, no pressure, give-up allowed | v0 |
| **Daily Challenge** | Shared seed, leaderboard | v1 |
| Head-to-head | Two players, same seed, realtime | v2 |
| Similarity Race | Edges = visual similarity (embeddings) | v2 |

## 5. Rules / scoring
- **Win:** current article == target. No lose state (optional hop cap / timer for pressure).
- **Score:** hops primary, time tiebreak → integer `hops*10000 + seconds` (lower = better, perfect for a Redis ZSET).
- **Par:** precomputed shortest path (BFS).
- **Legal move:** `target ∈ links(current)`, **server-validated** — blocks URL-typing / illegal jumps.

## 6. Screens
1. **Home** — mode select + 10-sec how-to.
2. **Race** — top bar: target (image + name), hop count, timer; body: image-tile grid for current article.
3. **Win** — your hops/time vs par, image-trail replay, share/OG card, leaderboard rank.
4. **Leaderboard** — daily, by score.

## 7. Architecture
- Server routes **proxy MediaWiki** (inject User-Agent, cache, run anti-cheat).
- **Cache:** in-memory LRU + Upstash Redis (page nodes, daily seed, leaderboard ZSETs).
- **Share:** Next.js `ImageResponse` dynamic OG card = the chain of thumbnails. (Primary viral surface.)

**Verified API calls (tested live):**
- Per-page board (links + thumbs + type signal, one call):
  `/w/api.php?action=query&generator=links&titles=<A>&prop=pageimages|description&piprop=thumbnail&pithumbsize=200&gpllimit=500&gplnamespace=0`
- Iconic image incl. non-free posters/crests (fallback): `/api/rest_v1/page/summary/<title>` → `.thumbnail.source`
- Article images: `prop=images`; image→articles (v2): `list=imageusage`.

**Data shapes:**
```
PageNode  { title, pageid, leadThumb, links:[{title,pageid,thumb}] }
Daily     { date, start, target, parHops }
Move      { sessionId, from, to }        // server-validated
ZSET      daily:<date>  score=hops*10000+sec  member=playerName
```

## 8. Solvability & content
- **Daily pairs:** curated offline via BFS over the link graph; store pairs with known par (≤5 hops, "interesting" gap). Seed pool ~100.
- **Random/Speedrun:** draw from a "good article" pool (has lead image + healthy link count); give-up reveals a hint path.
- **v2 Similarity:** precompute CLIP embeddings of lead images → vector index; edges = nearest neighbors. Fixes hub problem via tunable similarity threshold.

## 9. Risks → mitigations
| Risk | Mitigation |
|---|---|
| Blank tiles (non-free posters/crests excluded by `pageimages`) | REST summary fallback → typed placeholder (verified: Chak De, Real Madrid) |
| Lopsided link mix (films/people dominate) → samey board | bucket by Wikidata type, round-robin, reserve ~8/24 bridge slots, pHash dedup |
| Soft-lock (needed link beyond cap) | "Show all" expansion always present |
| Cold-cache latency | Redis cache + prefetch neighbors on hover |
| Rate limits / etiquette | User-Agent + aggressive cache (fine for hobby scale) |
| Mobile bandwidth | 200px thumbs, lazy-load |
| NSFW/odd lead image | small denylist; low risk |
| Accessibility (image-only) | peek-on-hover + "show titles" toggle |

## 10. Milestones
- **v0 (M) — plant the flag:** single-player race (link-graph), image tiles + peek, hops/time, win screen, illegal-move validation, in-memory cache, Speedrun + Practice.
- **v1 (M) — the moat:** Daily + Redis leaderboard, share/OG card, trail replay, popularity ranking, curated solvable pairs.
- **v2 (L) — hook + social:** Similarity mode (embeddings), head-to-head realtime, accounts/streaks.

## 11. Locked defaults (all reversible)
Name **Wiki Pic Race** · daily par **≤5 hops** · titles **hidden + peek** · **24** tiles (**16 strong + 8 bridge**) · image source **REST summary → pageimages → placeholder** · dailies **pin BFS par hop** · leaderboard **ships in v1** (v0 local-only).
