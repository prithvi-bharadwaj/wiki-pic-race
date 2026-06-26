import { describe, it, expect } from "vitest";
import { bfsPath, walkPath, type Neighbors } from "./path";

const graph: Record<string, string[]> = {
  a: ["b", "c"],
  b: ["d"],
  c: ["d", "e"],
  d: ["f"],
  e: [],
  f: [],
};
const nb: Neighbors = (n) => graph[n] ?? [];

describe("bfsPath", () => {
  it("returns [start] when start === target", () => {
    expect(bfsPath("a", "a", nb)).toEqual(["a"]);
  });

  it("finds a shortest path", () => {
    const p = bfsPath("a", "d", nb);
    expect(p).not.toBeNull();
    expect(p?.length).toBe(3); // a -> (b|c) -> d
    expect(p?.[0]).toBe("a");
    expect(p?.[p.length - 1]).toBe("d");
  });

  it("returns null when the target is unreachable", () => {
    expect(bfsPath("e", "a", nb)).toBeNull();
  });

  it("respects maxHops", () => {
    expect(bfsPath("a", "f", nb, 2)).toBeNull(); // a->b->d->f needs 3 hops
    expect(bfsPath("a", "f", nb, 3)).not.toBeNull();
  });
});

describe("walkPath", () => {
  it("walks a reachable path whose every step is a real edge", async () => {
    const p = await walkPath("a", nb, 3); // choose = first
    expect(p[0]).toBe("a");
    expect(p.length).toBe(4); // a -> b -> d -> f
    for (let i = 1; i < p.length; i += 1) {
      expect(graph[p[i - 1]]).toContain(p[i]);
    }
  });

  it("stops early at a dead end", async () => {
    expect(await walkPath("e", nb, 3)).toEqual(["e"]);
  });
});
