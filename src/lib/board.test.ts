import { describe, it, expect } from "vitest";
import { buildBoard, type Candidate } from "./board";

// SRK-like lopsided distribution: films + people dominate, places/sports are scarce.
function srkLike(): Candidate[] {
  const cands: Candidate[] = [];
  let i = 0;
  const add = (type: string, n: number) => {
    for (let k = 0; k < n; k += 1) {
      cands.push({
        title: `${type}-${k}`,
        image: `https://img/${type}-${k}.jpg`,
        imageKey: `${type}-${k}`,
        type,
        weight: i,
      });
      i += 1;
    }
  };
  add("film", 30);
  add("person", 5);
  add("place", 3);
  add("sport", 2);
  add("org", 2);
  return cands;
}

describe("buildBoard", () => {
  it("fills the board to the requested size", () => {
    const b = buildBoard(srkLike(), { size: 24, bridgeSlots: 8, pageType: "person" });
    expect(b.length).toBe(24);
  });

  it("spreads across >=3 type buckets instead of a wall of films", () => {
    const b = buildBoard(srkLike(), { size: 24, bridgeSlots: 8, pageType: "person" });
    const types = new Set(b.map((t) => t.type));
    expect(types.size).toBeGreaterThanOrEqual(3);
    expect(b.filter((t) => t.type === "film").length).toBeLessThan(24);
  });

  it("surfaces scarce bridge types (place, sport) via reserved slots", () => {
    const b = buildBoard(srkLike(), { size: 24, bridgeSlots: 8, pageType: "person" });
    const types = new Set(b.map((t) => t.type));
    expect(types.has("place")).toBe(true);
    expect(types.has("sport")).toBe(true);
    expect(b.some((t) => t.bridge)).toBe(true);
  });

  it("de-dups near-identical images by imageKey", () => {
    const cands: Candidate[] = [
      { title: "A", image: "x", imageKey: "same", type: "film", weight: 0 },
      { title: "B", image: "x", imageKey: "same", type: "film", weight: 1 },
      { title: "C", image: "y", imageKey: "other", type: "place", weight: 2 },
    ];
    const b = buildBoard(cands, { size: 24, bridgeSlots: 0 });
    expect(b.length).toBe(2);
    expect(new Set(b.map((t) => t.imageKey)).size).toBe(2);
  });
});
