import { resolveImage } from "@/lib/wiki";

export async function GET(request: Request) {
  const title = new URL(request.url).searchParams.get("title");
  if (!title) return Response.json({ error: "missing title" }, { status: 400 });
  return Response.json({ url: await resolveImage(title) });
}
