import { z } from "zod";
import { detectBot, logCrawlerVisit } from "@/lib/seo-bot";

const bodySchema = z.object({
  path: z.string().max(300).default("/"),
  userAgent: z.string().max(500).optional().or(z.literal("")),
});

/**
 * GEET-SENTINEL ingest endpoint. Hit fire-and-forget by the middleware
 * crawler trap — always responds fast, never blocks crawlers or humans.
 */
export async function POST(request: Request) {
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsed = bodySchema.safeParse(body);
  const path = parsed.success ? parsed.data.path || "/" : "/";
  const ua = (
    (parsed.success && parsed.data.userAgent) ||
    request.headers.get("user-agent") ||
    ""
  ).slice(0, 500);

  const match = detectBot(ua || null);
  if (!match) {
    // Humans (or malformed beacons) never create rows.
    return Response.json({ ok: true, logged: false });
  }

  const logged = await logCrawlerVisit({
    bot_name: match.name,
    bot_category: match.category,
    path_visited: path,
    user_agent: ua || null,
  });
  return Response.json({ ok: true, logged, bot: match.name });
}
