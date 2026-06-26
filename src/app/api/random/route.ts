import { getRandom } from "@/lib/wiki";

export async function GET() {
  try {
    const [start, target] = await getRandom(2);
    return Response.json({ start, target });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 502 });
  }
}
