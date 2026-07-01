import { test, expect } from "@playwright/test";
import { SEED, seedNeighbors } from "../src/lib/seed";

test("home boots without uncaught errors (criterion 1)", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /wiki pic race/i })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("seeded race: target, diversity, no blanks, navigation, win (criteria 2-5,7)", async ({
  page,
}) => {
  await page.goto("/race?seed=test");

  // 2: target shown as image + name
  await expect(page.getByTestId("target-name")).toHaveText(SEED.target);
  await expect(page.getByTestId("target-image")).toBeVisible();

  const tiles = page.getByTestId("tile");
  await expect(tiles.first()).toBeVisible();

  // 3: >=12 tiles, all people (person-to-person by design), >=8 distinct portraits
  expect(await tiles.count()).toBeGreaterThanOrEqual(12);
  const types = new Set(
    await tiles.evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.type)),
  );
  expect([...types]).toEqual(["person"]);
  const imgs = new Set(
    await page
      .locator('[data-testid="tile"] img')
      .evaluateAll((els) => els.map((e) => (e as HTMLImageElement).getAttribute("src"))),
  );
  expect(imgs.size).toBeGreaterThanOrEqual(8);

  // 4: every tile renders a *loaded* image (portrait or initials avatar) — pictures never blank out
  const tileImgs = page.locator('[data-testid="tile"] img');
  expect(await tileImgs.count()).toBe(await tiles.count());
  await expect
    .poll(async () =>
      tileImgs.evaluateAll((els) =>
        els.every((e) => (e as HTMLImageElement).complete && (e as HTMLImageElement).naturalWidth > 0),
      ),
    )
    .toBe(true);

  // clarity: the current person is anchored, and hovering a face reveals who they are.
  // Use the last sticker — it has the highest z-index, so no sibling covers its hover target.
  await expect(page.getByTestId("current-name")).toHaveText(SEED.start);
  const lastTile = tiles.last();
  const lastTitle = (await lastTile.getAttribute("data-title")) ?? "";
  await lastTile.hover();
  const peek = page.locator(`[data-testid="tile-peek"][data-for="${lastTitle}"]`);
  await expect(peek).toContainText(lastTitle);
  await expect(peek).toHaveCSS("opacity", "1");

  // 5 + 7: follow the known path to the win screen, hop counter tracking each step
  await expect(page.getByTestId("hops")).toHaveText("0");
  for (let i = 1; i < SEED.path.length; i += 1) {
    await page.locator(`[data-testid="tile"][data-title="${SEED.path[i]}"]`).first().click();
    if (i < SEED.path.length - 1) {
      await expect(page.getByTestId("hops")).toHaveText(String(i));
    }
  }
  await expect(page.getByTestId("win")).toBeVisible();
  await expect(page.getByTestId("win")).toContainText(String(SEED.path.length - 1));
});

test("illegal move is rejected with 400 (criterion 6)", async ({ request }) => {
  const from = SEED.start;
  const to = "Atlantis_Not_A_Neighbor";
  expect(seedNeighbors(from)).not.toContain(to);
  const res = await request.post("/api/move", { data: { from, to, seed: "test" } });
  expect(res.status()).toBe(400);
});
