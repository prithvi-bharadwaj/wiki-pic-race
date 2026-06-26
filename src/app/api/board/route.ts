import { getBoard } from "@/lib/wiki";

export async function GET(request: Request) {
  const title = new URL(request.url).searchParams.get("title");
  if (!title) return Response.json({ error: "missing title" }, { status: 400 });
  try {
    return Response.json(await getBoard(title));
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 502 });
  }
}
