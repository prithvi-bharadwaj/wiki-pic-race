// Graph algorithms over the article link graph.
// - bfsPath: shortest path (par + deterministic seeds).
// - walkPath: a bounded walk used to pick a *reachable* random target (so live races are winnable).
// `neighbors` is injected so it runs over a cached/mock graph (sync) or the live API (async).

export type Neighbors = (node: string) => readonly string[];
export type AsyncNeighbors = (node: string) => readonly string[] | Promise<readonly string[]>;

export function bfsPath(
  start: string,
  target: string,
  neighbors: Neighbors,
  maxHops = 6,
): string[] | null {
  if (start === target) return [start];

  const visited = new Set<string>([start]);
  let frontier: string[][] = [[start]];
  let hops = 0;

  while (frontier.length > 0 && hops < maxHops) {
    const next: string[][] = [];
    for (const path of frontier) {
      const node = path[path.length - 1];
      for (const nb of neighbors(node)) {
        if (visited.has(nb)) continue;
        const newPath = [...path, nb];
        if (nb === target) return newPath;
        visited.add(nb);
        next.push(newPath);
      }
    }
    frontier = next;
    hops += 1;
  }
  return null;
}

export async function walkPath(
  start: string,
  neighbors: AsyncNeighbors,
  hops: number,
  choose: (opts: string[]) => string = (opts) => opts[0],
): Promise<string[]> {
  const path = [start];
  const visited = new Set<string>([start]);
  let cur = start;
  for (let i = 0; i < hops; i += 1) {
    const opts = (await neighbors(cur)).filter((n) => !visited.has(n));
    if (opts.length === 0) break;
    const next = choose([...opts]);
    visited.add(next);
    path.push(next);
    cur = next;
  }
  return path;
}
