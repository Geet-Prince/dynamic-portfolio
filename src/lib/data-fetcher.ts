import { cookies } from "next/headers";
import { cache } from "react";
import { unstable_cache } from "next/cache";
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
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
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
 * batch. No cookies() in here — that keeps it eligible for unstable_cache.
 * Callers must treat the result as read-only (it is shared across requests).
 */
async function fetchPortfolioBundle(): Promise<SiteData> {
  const local = await getLocalStore();

  // Base layer: persistent local store (seeds on first run, admin edits after).
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
    const supabase = await createServerSupabase();
    const [profileRes, projectsRes, skillsRes, credsRes, themeRes, faqsRes] =
      await withTimeout(
        Promise.all([
          supabase.from("profile_config").select("*").limit(1).single(),
          supabase.from("projects").select("*").order("display_order", { ascending: true }),
          supabase.from("skills").select("*").order("display_order", { ascending: true }),
          supabase.from("credentials").select("*").order("display_order", { ascending: true }),
          supabase.from("site_theme_config").select("*").limit(1).single(),
          supabase.from("aeo_faqs").select("*").order("display_order", { ascending: true }),
        ]),
        1500
      );

    // Profile is the anchor: if it fails, the whole Supabase read is suspect.
    if (profileRes.error || !profileRes.data) return fallback;

    // Every other collection degrades independently to the local store
    // (covers tables that don't exist yet / RLS hiccups).
    if (!themeRes.error && themeRes.data) {
      fallback.theme = normalizeTheme({
        ...fallback.theme,
        ...(themeRes.data as Partial<ThemeConfig>),
      });
    }

    return {
      profile: { ...fallback.profile, ...(profileRes.data as object) },
      projects:
        !projectsRes.error && projectsRes.data?.length
          ? projectsRes.data
          : fallback.projects,
      skills:
        !skillsRes.error && skillsRes.data?.length ? skillsRes.data : fallback.skills,
      credentials:
        !credsRes.error && credsRes.data?.length
          ? credsRes.data
          : fallback.credentials,
      theme: fallback.theme,
      faqs:
        !faqsRes.error && faqsRes.data?.length ? faqsRes.data : fallback.faqs,
    } as SiteData;
  } catch {
    return fallback;
  }
}

// RAM-cached at the edge (revalidate 3600s) + deduped per request via cache().
// Admin mutations bust it instantly with revalidateTag('portfolio-data').
const cachedBundle = unstable_cache(fetchPortfolioBundle, ["portfolio-bundle"], {
  revalidate: 3600,
  tags: ["portfolio-data"],
});

export const getPortfolioBundle = cache(() => cachedBundle());

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
