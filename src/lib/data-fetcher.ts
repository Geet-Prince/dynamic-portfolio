import { cookies } from "next/headers";
import { cache } from "react";
import {
  createServerSupabase,
  createServiceSupabase,
  isSupabaseConfigured,
} from "./supabase/server";
import { seedProfile } from "./seed-data";
import { getLocalStore, sortByOrder } from "./local-store";
import { normalizeTheme } from "./themes";
import { TARGET_QUERIES, getBotConfig } from "./seo-bot";
import type {
  ContactMessage,
  CrawlerVisit,
  SerpLog,
  SiteData,
  ThemeConfig,
  TrackedKeyword,
} from "./types";

const PREVIEW_COOKIE = "portfolio-preview";

interface PreviewOverrides {
  profile?: Partial<typeof seedProfile>;
  theme?: Partial<ThemeConfig>;
}

async function getPreviewOverrides(): Promise<PreviewOverrides | null> {
  try {
    const store = await cookies();
    const raw = store.get(PREVIEW_COOKIE)?.value;
    if (!raw) return null;
    return JSON.parse(Buffer.from(raw, "base64").toString("utf-8")) as PreviewOverrides;
  } catch {
    return null;
  }
}

export async function getThemeConfig(): Promise<ThemeConfig> {
  const data = await getSiteData();
  return data.theme;
}

/**
 * Race a promise against a timeout so a slow network can never hang page
 * load — on timeout the caller falls back to the instant local store.
 * Default 8000ms: Supabase cold starts routinely exceed 1–2s, so shorter
 * timeouts silently discard perfectly good live rows.
 */
function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Supabase bundle timeout after ${ms}ms`)), ms);
  });
  return Promise.race([
    promise.finally(() => {
      if (timer) clearTimeout(timer);
    }),
    timeout,
  ]);
}

/**
 * Single-pass parallel portfolio bundle: all six tables in ONE Promise.all
 * batch, read with the service-role client so RLS/cookie mismatches can
 * never silently discard live rows.
 *
 * Supabase PostgreSQL is the 100% single source of truth. When it is
 * configured we return the EXACT rows from the database — never merging,
 * re-adding or re-seeding anything from seed-data.ts. If every project (or
 * skill / credential / FAQ) has been deleted in /admin, the site correctly
 * renders zero of them; seed data is NEVER resurrected here. Seed data is
 * only restored through the explicit, confirmation-gated "Reset to Factory
 * Seed Data" action in /admin.
 *
 * The local JSON store is used ONLY as a fallback when Supabase is
 * unconfigured or a specific query errors — never as a merge layer.
 * No cookies() in here, so the bundle can be deduped per request via cache().
 */
async function fetchPortfolioBundle(): Promise<SiteData> {
  const local = await getLocalStore();

  // Fallback layer: local store, used only when Supabase is unavailable.
  const fallback: SiteData = {
    profile: { ...local.profile },
    projects: sortByOrder(local.projects),
    skills: sortByOrder(local.skills),
    credentials: sortByOrder(local.credentials),
    theme: normalizeTheme(local.theme),
    faqs: sortByOrder(local.faqs),
  };

  // 0ms short-circuit: unconfigured/placeholder env → local store only.
  if (!isSupabaseConfigured()) return fallback;

  try {
    const { createAdminSupabase } = await import("./supabase/admin");
    const supabase = createAdminSupabase() ?? (await createServerSupabase());
    const [profileRes, projectsRes, skillsRes, credsRes, themeRes, faqsRes] =
      await withTimeout(
        Promise.all([
          supabase.from("profile_config").select("*").limit(1).maybeSingle(),
          supabase.from("projects").select("*").order("display_order", { ascending: true }),
          supabase.from("skills").select("*").order("display_order", { ascending: true }),
          supabase.from("credentials").select("*").order("display_order", { ascending: true }),
          supabase.from("site_theme_config").select("*").limit(1).maybeSingle(),
          supabase.from("aeo_faqs").select("*").order("display_order", { ascending: true }),
        ])
      );

    for (const [label, res] of [
      ["profile_config", profileRes],
      ["site_theme_config", themeRes],
      ["projects", projectsRes],
      ["skills", skillsRes],
      ["credentials", credsRes],
      ["aeo_faqs", faqsRes],
    ] as const) {
      if (res.error) console.error(`[data-fetcher] ${label} read failed:`, res.error.message);
    }

    // Single-row tables: use the DB row when present, else the last-resort
    // local default (profile & theme have no delete UI — this only guards
    // against a not-yet-migrated/empty table so the page can still render).
    const theme =
      !themeRes.error && themeRes.data
        ? normalizeTheme({ ...fallback.theme, ...(themeRes.data as Partial<ThemeConfig>) })
        : fallback.theme;

    // Collection tables: EXACT rows, including empty arrays. A successful
    // query with zero rows means "the admin deleted them" → stay deleted.
    return {
      profile:
        !profileRes.error && profileRes.data
          ? { ...fallback.profile, ...(profileRes.data as object) }
          : fallback.profile,
      projects: !projectsRes.error ? ((projectsRes.data ?? []) as SiteData["projects"]) : fallback.projects,
      skills: !skillsRes.error ? ((skillsRes.data ?? []) as SiteData["skills"]) : fallback.skills,
      credentials: !credsRes.error
        ? ((credsRes.data ?? []) as SiteData["credentials"])
        : fallback.credentials,
      theme,
      faqs: !faqsRes.error ? ((faqsRes.data ?? []) as SiteData["faqs"]) : fallback.faqs,
    } as SiteData;
  } catch (e) {
    console.error(
      "[data-fetcher] Supabase bundle failed, using local fallback:",
      e instanceof Error ? e.message : e
    );
    return fallback;
  }
}

// Per-request dedupe only (React cache). NO unstable_cache / ISR layer: the
// public site reads Supabase directly so an /admin save is reflected on the
// very next request with zero cache mismatch. Admin mutations additionally
// call revalidatePath() to refresh the router cache.
export const getPortfolioBundle = cache(() => fetchPortfolioBundle());

/**
 * Live, uncached bundle for /admin pages: always hits Supabase directly so
 * the dashboard shows exactly what is in the database (no seeding).
 */
export async function fetchLiveBundle(): Promise<SiteData> {
  return fetchPortfolioBundle();
}

export async function getSiteData(): Promise<SiteData> {
  // Shared cached bundle first (fetched at most ONCE per request, usually 0×).
  const bundle = await getPortfolioBundle();

  // Top layer: ephemeral preview-cookie overrides (highest precedence).
  // cookies() stays OUTSIDE the shared cache — per-request only.
  const preview = await getPreviewOverrides();
  if (!preview?.profile && !preview?.theme) return { ...bundle };
  return {
    ...bundle,
    profile: preview?.profile ? { ...bundle.profile, ...preview.profile } : bundle.profile,
    theme: preview?.theme
      ? normalizeTheme({ ...bundle.theme, ...preview.theme })
      : bundle.theme,
  };
}

export async function getProjectBySlug(slug: string) {
  const data = await getSiteData();
  return data.projects.find((p) => p.slug === slug) ?? null;
}

/**
 * Live, uncached site data for /admin pages: bypasses unstable_cache so the
 * dashboard always renders exactly what's in Supabase right now.
 */
export async function getLiveSiteData(): Promise<SiteData> {
  const bundle = await fetchLiveBundle();
  const preview = await getPreviewOverrides();
  if (!preview?.profile && !preview?.theme) return { ...bundle };
  return {
    ...bundle,
    profile: preview?.profile ? { ...bundle.profile, ...preview.profile } : bundle.profile,
    theme: preview?.theme
      ? normalizeTheme({ ...bundle.theme, ...preview.theme })
      : bundle.theme,
  };
}

export async function getActiveFaqs() {
  const data = await getSiteData();
  return data.faqs.filter((f) => f.is_active);
}

/**
 * Privileged read client for admin-only tables (contact_messages,
 * seo_serp_logs, crawler_visit_logs) which have NO public SELECT policy.
 * Service role is server-only and never leaks to the client. Falls back to
 * the anon client when no service key is configured.
 */
async function privilegedClient() {
  return createServiceSupabase() ?? (await createServerSupabase());
}

// ---------- Messages (Supabase first, local store fallback) ----------

export async function getMessages(limit = 100): Promise<ContactMessage[]> {
  const local = await getLocalStore();
  const localDesc = [...local.messages]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, limit);
  if (!isSupabaseConfigured()) return localDesc;
  try {
    const supabase = await privilegedClient();
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return localDesc;
    return data as ContactMessage[];
  } catch {
    return localDesc;
  }
}

// ---------- GEET-SENTINEL log readers (Supabase first, local fallback) ----------

export async function getSerpLogs(limit = 200): Promise<SerpLog[]> {
  const local = await getLocalStore();
  const localDesc = [...local.serpLogs]
    .sort((a, b) => (a.checked_at < b.checked_at ? 1 : -1))
    .slice(0, limit);
  if (!isSupabaseConfigured()) return localDesc;
  try {
    const supabase = await privilegedClient();
    const { data, error } = await supabase
      .from("seo_serp_logs")
      .select("*")
      .order("checked_at", { ascending: false })
      .limit(limit);
    if (error || !data) return localDesc;
    return data as SerpLog[];
  } catch {
    return localDesc;
  }
}

export async function getCrawlerVisits(limit = 50): Promise<CrawlerVisit[]> {
  const local = await getLocalStore();
  const localDesc = [...local.crawlerVisits]
    .sort((a, b) => (a.visited_at < b.visited_at ? 1 : -1))
    .slice(0, limit);
  if (!isSupabaseConfigured()) return localDesc;
  try {
    const supabase = await privilegedClient();
    const { data, error } = await supabase
      .from("crawler_visit_logs")
      .select("*")
      .order("visited_at", { ascending: false })
      .limit(limit);
    if (error || !data) return localDesc;
    return data as CrawlerVisit[];
  } catch {
    return localDesc;
  }
}

// ---------- Tracked keywords: 5 defaults + admin-added customs ----------

export async function getCustomKeywords(): Promise<TrackedKeyword[]> {
  const local = await getLocalStore();
  if (!isSupabaseConfigured()) return local.trackedKeywords.filter((k) => k.is_active);
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("seo_tracked_keywords")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true });
    if (error || !data) return local.trackedKeywords.filter((k) => k.is_active);
    return data as TrackedKeyword[];
  } catch {
    return local.trackedKeywords.filter((k) => k.is_active);
  }
}

export async function getTrackedKeywords(): Promise<string[]> {
  const customs: string[] = [];
  const local = await getLocalStore();
  for (const k of local.trackedKeywords) {
    if (k.is_active && k.keyword.trim()) customs.push(k.keyword.trim());
  }
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabase();
      const { data, error } = await supabase
        .from("seo_tracked_keywords")
        .select("keyword")
        .eq("is_active", true);
      if (!error && data) {
        for (const row of data as Array<{ keyword: string }>) {
          if (row.keyword?.trim()) customs.push(row.keyword.trim());
        }
      }
    } catch {
      // Fall through with local customs.
    }
  }
  // Vault-edited base targets win over the hardcoded defaults when present.
  let base: readonly string[] = TARGET_QUERIES;
  try {
    const cfg = await getBotConfig();
    if (cfg.target_keywords.length > 0) base = cfg.target_keywords;
  } catch {
    // Vault unreadable — hardcoded defaults stand.
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const q of [...base, ...customs]) {
    const key = q.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(q);
    }
  }
  return out;
}
