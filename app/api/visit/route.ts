import { countVisitor } from "@/lib/store";

const BOT = /bot|crawl|spider|slurp|preview|lighthouse|headless|vercel-screenshot/i;

/**
 * The public visitor count. The page sends an anonymous random id it keeps in
 * the browser, so each person is counted once; no personal data is stored.
 * Send `{ "id": null }` to read the count without being counted.
 */
export async function POST(request: Request) {
  let id: string | null = null;
  try {
    const body = (await request.json()) as { id?: unknown };
    if (typeof body.id === "string" && /^[a-zA-Z0-9-]{8,64}$/.test(body.id)) id = body.id;
  } catch {}
  if (BOT.test(request.headers.get("user-agent") ?? "")) id = null;

  try {
    const count = await countVisitor(id);
    return Response.json({ count }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error(error);
    return Response.json({ count: null }, { status: 503 });
  }
}
