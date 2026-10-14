import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  // Return a client even when env vars are missing so public pages can
  // still render via the seed-data fallback (calls will fail -> caught).
  return createBrowserClient(url || "https://placeholder.supabase.co", anon || "placeholder-anon-key");
}
