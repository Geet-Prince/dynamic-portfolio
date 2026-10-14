import { cookies } from "next/headers";
import { runSerpScan } from "@/lib/seo-bot";
import { getBotConfig } from "@/lib/seo-bot";
import { getTrackedKeywords } from "@/lib/data-fetcher";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function isAdminSession(): Promise<boolean> {
  try {
    // next/headers cookies() throws outside request scope — treat as logged out.
    return (await cookies()).get("admin_auth")?.value === "1";
  } catch {
    return false;
  }
}

/**
 * GEET-SENTINEL daily scan. Triggered by Vercel Cron (`0 18 * * *` UTC),
 * the GitHub Actions backup workflow, or an admin in `/admin/seo-bot`.
 *
 * Auth (any one passes):
 * 1. `Authorization: Bearer <CRON_SECRET>` (Vercel cron / GitHub Action)
 * 2. `?secret=` matching env CRON_SECRET / REVALIDATE_SECRET, or the
 *    auto-generated vault secret (visible only inside /admin)
 * 3. A logged-in admin session (`admin_auth` cookie)
 */
export async function GET(request: Request) {
  const envCron = process.env.CRON_SECRET?.trim() || null;
  const envRevalidate = process.env.REVALIDATE_SECRET?.trim() || null;

  const bearer = request.headers.get("authorization");
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret")?.trim() || null;

  const secretsConfigured = !!(envCron || envRevalidate);

  // Zero-config local dev: no env secrets at all → open, like before.
  let authed = !secretsConfigured;
  if (!authed) {
    authed =
      (!!envCron && bearer === `Bearer ${envCron}`) ||
      (!!envCron && !!querySecret && querySecret === envCron) ||
      (!!envRevalidate && !!querySecret && querySecret === envRevalidate);
  }
  if (!authed && querySecret) {
    // Vault secret (auto-generated, visible only inside /admin).
    try {
      const cfg = await getBotConfig();
      if (querySecret === cfg.cron_secret) authed = true;
    } catch {
      // Vault unreadable — keep current verdict.
    }
  }
  if (!authed && (await isAdminSession())) authed = true;

  if (!authed) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const queries = await getTrackedKeywords();
  const { results, provider, persisted, storage, telemetry, keySource } = await runSerpScan(queries);
  return Response.json({
    ok: true,
    at: new Date().toISOString(),
    provider,
    key_source: keySource,
    persisted,
    storage,
    engine: "google-in",
    queries: results.length,
    results,
    telemetry: {
      at: telemetry.at,
      endpoints: telemetry.endpoints,
      github: telemetry.github,
      indexnow: telemetry.indexnow,
    },
  });
}
