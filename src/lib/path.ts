// Shortest-path BFS over the article link graph. Used to compute par and to generate
// deterministic, solvable seeds for tests/dailies. `neighbors` is injected so it can run
// over a cached/mock graph (sync) or a precomputed adjacency map.

export type Neighbors = (node: string) => readonly string[];

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
