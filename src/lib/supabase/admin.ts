import { createClient as createJsClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase clients for trusted server code (RSC data fetching,
 * Server Actions, route handlers, cron jobs). NEVER import from client
 * components — the service-role key bypasses ALL Row Level Security.
 */

function resolveUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    ""
  );
}

/** True when a usable URL + anon key pair exists (anon reads honor RLS). */
export function isSupabaseConfigured(): boolean {
  return Boolean(resolveUrl() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** True when the service-role key exists (full bypass, server-only). */
export function isServiceConfigured(): boolean {
  return Boolean(resolveUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Service-role client — the #1 source of truth for server-side reads and
 * all admin writes. Bypasses RLS so cookie/auth mismatches can never cause
 * a silent fallback to seed data.
 * Returns null when the service key is missing (caller must fall back).
 *
 * `noStore` forces every underlying fetch to `cache: 'no-store'`, which is
 * required by the read-after-write verification endpoints — a cached SELECT
 * could otherwise report stale rows and hide a failed publish.
 */
export function createAdminSupabase(
  opts: { noStore?: boolean } = {}
): SupabaseClient | null {
  const url = resolveUrl();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !serviceKey) return null;
  const options: Parameters<typeof createJsClient>[2] = {
    auth: { persistSession: false },
  };
  if (opts.noStore) {
    options.global = {
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, { ...init, cache: "no-store" }),
    };
  }
  return createJsClient(url, serviceKey, options);
}
