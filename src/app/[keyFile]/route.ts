import { notFound } from "next/navigation";
import { getBotConfig } from "@/lib/seo-bot";

export const dynamic = "force-dynamic";

/**
 * Serves the IndexNow verification key file at `/<key>.txt` (IndexNow
 * requires the key at the domain root). Any other single-segment path 404s —
 * static routes always win over this dynamic segment.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ keyFile: string }> }
) {
  const { keyFile } = await params;
  let key = "";
  try {
    key = (await getBotConfig()).indexnow_key;
  } catch {
    notFound();
  }
  if (!key || keyFile !== `${key}.txt`) notFound();
  return new Response(key, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" },
  });
}
