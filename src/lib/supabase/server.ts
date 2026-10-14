import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createJsClient, type SupabaseClient } from "@supabase/supabase-js";

export async function createServerSupabase() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return createServerClient(
    url || "https://placeholder.supabase.co",
    anon || "placeholder-anon-key",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — cookies are read-only there.
          }
        },
      },
    }
  );
}

const PLACEHOLDER_RE = /your-|xyzcompany|placeholder|example/i;

/**
 * Instant synchronous gate: missing, empty, placeholder, or non-Supabase URLs
 * short-circuit in 0ms — callers must skip network entirely and serve the
 * local store instead of waiting out connection timeouts.
 */
export function isSupabaseConfigured(): boolean {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !anon) return false;
  if (PLACEHOLDER_RE.test(url) || PLACEHOLDER_RE.test(anon)) return false;
  try {
    if (!/\.supabase\.co$/.test(new URL(url).hostname)) return false;
  } catch {
    return false;
  }
  return true;
}

export function isServiceConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Server-only write client using the service-role key (bypasses RLS).
 * Required because /admin uses cookie auth, not Supabase Auth sessions —
 * the anon key would be denied by the `authenticated` RLS policies on write.
 * Returns null when the service key is not configured.
 */
export function createServiceSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !serviceKey) return null;
  return createJsClient(url, serviceKey, { auth: { persistSession: false } });
}
