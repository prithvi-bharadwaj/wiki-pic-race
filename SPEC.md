# Wiki Pic Race — v0 Spec ("workable")

Self-contained target for the build loop. Full design: @GDD.md. This file defines *done* for v0 and ends in an end-to-end check.

## Goal feature
A single player plays **one complete race**: from a start Wikipedia article to a target article, navigating **only by clicking image tiles** (each tile = a linked article's image), with a hop counter + timer, ending on a win screen. Boards must be **visually diverse** (not 24 of the same face) and must not be full of **blank tiles**.

## In scope (v0)
- Modes: **Speedrun** (timed) + **Practice** (no timer, give-up).
- Board = linked articles rendered as images (GDD §3), built via the diversity pipeline (GDD §3a): destination image with **REST → pageimages → placeholder** fallback; **type-bucket + round-robin** selection; **reserve bridge slots**; near-dup cull.
- Titles hidden, peek on hover.
- **Server-validated moves** (`target ∈ links(current)`).
- In-memory cache of page nodes.

## Out of scope (v0 — do NOT build)
Daily / leaderboard / Redis, share/OG card, accounts, similarity/embeddings mode, head-to-head multiplayer. (v1/v2 — GDD §10.)

## Files / interfaces
- `src/lib/types.ts` — `Tile`, `PageNode`, `RaceState` (Zod).
- `src/lib/wiki.ts` — MediaWiki/REST client: `getLinks(title)`, `resolveImage(title)`, `getBoard(title)`.
- `src/lib/board.ts` — **pure** board construction: `buildBoard(candidates, pageType): Tile[]` (bucket, round-robin, reserve bridges, dedup). **UNIT TESTED.**
- `src/lib/path.ts` — `bfsPath(start, target, maxHops)` for par + deterministic test seeds. **UNIT TESTED.**
- `src/app/api/board/route.ts` — `GET ?title=` → `Tile[]`.
- `src/app/api/move/route.ts` — `POST {from,to}` → validates the move.
- `src/app/page.tsx` (home / mode select), `src/app/race/page.tsx` (race + win).

## Acceptance — the verifier (`pnpm verify` = build + unit + e2e)
A headless run passes ALL of:
1. `/` boots, **zero console errors**.
2. Start race → start + target shown (target = **image + name**).
3. Board renders **≥12 image tiles**; **≥8 distinct images** and **≥3 type buckets** (diversity).
4. **0 blank tiles** for the seeded race (REST fallback covers non-free posters/crests).
5. Click a tile → navigates, **hop counter +1**, new board renders.
6. `POST /api/move` with an illegal `to` is **rejected (400)**.
7. Seeded race `/race?seed=test` (fixed start/target with a known BFS path) → following the path **reaches target → win screen shows hops + time**.
8. `pnpm build` exits 0; `pnpm test` passes (unit: board bucketing, dedup, image-fallback order, `bfsPath`).

**When `pnpm verify` is fully green → v0 is "workable".**
