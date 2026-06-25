# Build loop — run until `pnpm verify` is green

Grounded in Anthropic's guidance (*Building Effective Agents*; *Claude Code best practices*). Core idea: **"Give Claude something that produces a pass or fail, and the loop closes on its own."** Target = @SPEC.md. Verifier = `pnpm verify`.

## The verifier (ground truth)
`pnpm verify` = `pnpm build && pnpm test && pnpm test:e2e`
- One pass/fail signal Claude reads each iteration — "ground truth from the environment at each step."
- e2e = Playwright driving SPEC §Acceptance (a full seeded race must reach the win screen).

## Loop body — Explore → Plan → Code → Verify → Commit
1. **Explore** — read SPEC.md + the latest `pnpm verify` failure. Pick the *smallest* unmet criterion.
2. **Plan** — minimal change against the named files in SPEC. (Skip if it's a one-sentence diff.)
3. **Code** — implement it; reuse patterns; immutable data; files <400 lines.
4. **Verify** — run `pnpm verify`; read the *actual* output. **Show evidence, never assert success.**
5. **Commit** — criterion green → `git commit` (`feat:`/`fix:`) + push. One criterion ≈ one commit.

## Guards (don't spin)
- **3-strike:** same criterion fails 3× → STOP. State what's known + leading hypothesis; ask before guessing further.
- **Scope freeze:** build only SPEC "in scope." Tempted beyond it → note for v1, don't build.
- **Root cause:** fix causes, not symptoms; never suppress an error just to pass the check.

## Exit
`pnpm verify` fully green → **adversarial review**: a fresh subagent reviews the diff vs SPEC (gaps affecting correctness/requirements only) → fix → re-verify → declare v0 workable.

## How to run it
- **In-session (default):** iterate the body until green. ("Ask Claude to run the check and iterate.")
- **Unattended:** a Stop hook running `pnpm verify` that blocks turn-end until it passes (8-block cap), or the `/loop` skill self-paced.
