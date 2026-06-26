import { getLinks, getRandom, resolveImage } from "@/lib/wiki";
import { walkPath } from "@/lib/path";

// Pick a random start, then walk the link graph a few hops to a target that is reachable
// by construction (so the race is winnable, unlike two unrelated random articles).
export async function GET() {
  try {
    const [start] = await getRandom(1);
    const path = await walkPath(start, getLinks, 3, (opts) => opts[Math.floor(Math.random() * opts.length)]);
    const target = path[path.length - 1];
    if (!target || target === start) {
      return Response.json({ error: "could not find a reachable target" }, { status: 502 });
    }
    const targetImage = await resolveImage(target);
    return Response.json({ start, target, targetImage, par: path.length - 1 });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 502 });
  }
}
