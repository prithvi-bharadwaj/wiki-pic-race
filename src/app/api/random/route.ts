import { getPeopleLinks, randomPerson, resolveImage } from "@/lib/wiki";
import { walkPath } from "@/lib/path";

// Start from a well-known person, then walk person -> person a few hops to a reachable target
// (so the race is winnable and stays entirely within people).
export async function GET() {
  try {
    const start = randomPerson();
    const path = await walkPath(start, getPeopleLinks, 3, (opts) => opts[Math.floor(Math.random() * opts.length)]);
    const target = path[path.length - 1];
    if (!target || target === start) {
      return Response.json({ error: "could not find a reachable person" }, { status: 502 });
    }
    const targetImage = await resolveImage(target);
    return Response.json({ start, target, targetImage, par: path.length - 1 });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 502 });
  }
}
