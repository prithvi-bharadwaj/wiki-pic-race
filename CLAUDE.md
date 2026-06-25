# Wiki Pic Race

Race across Wikipedia by **pictures, not words**. Design: @GDD.md · v0 spec + acceptance: @SPEC.md · build loop: @LOOP.md

## Commands
- `pnpm dev` — run locally
- `pnpm build` — production build (must pass)
- `pnpm test` — unit tests (Vitest)
- `pnpm test:e2e` — Playwright acceptance
- `pnpm verify` — build + test + e2e (the loop's gate; green = v0 workable)

## Conventions
- TS + Next.js App Router + Tailwind + Zod. Immutable data. Files <400 lines, functions <50.
- MediaWiki/REST only; no API keys. Always send a descriptive User-Agent; cache page nodes.
- Image resolution order: **REST summary → pageimages → typed placeholder**.
- Commit format `<type>: <desc>`; one acceptance criterion ≈ one commit.

## Loop
Work toward SPEC.md acceptance; gate with `pnpm verify`; follow LOOP.md. Do **not** build v1/v2 (Daily, leaderboard, embeddings, multiplayer).
