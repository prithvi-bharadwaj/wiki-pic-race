import { seedNeighbors } from "@/lib/seed";
import { getPeopleLinks } from "@/lib/wiki";

type Body = { from?: string; to?: string; seed?: string };

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const { from, to, seed } = body;
  if (!from || !to) return Response.json({ ok: false, error: "from/to required" }, { status: 400 });

  const legal =
    seed === "test"
      ? seedNeighbors(from).includes(to)
      : (await getPeopleLinks(from)).includes(to);

  return Response.json({ ok: legal }, { status: legal ? 200 : 400 });
}
