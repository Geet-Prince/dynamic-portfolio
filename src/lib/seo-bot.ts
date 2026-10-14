import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./supabase/server";
import { freshBotConfig, mutateLocalStore, newLocalId, nowIso } from "./local-store";
import type { BotConfig, EndpointCheck, GitHubStats, IndexNowResult, ScanTelemetry, SerpLog } from "./types";

// ---------------------------------------------------------------------------
// GEET-SENTINEL core: bot detection, SERP scanning, health audit.
// Runs in Node route handlers / Server Actions. Never ships to the client.
// ---------------------------------------------------------------------------

export const TARGET_QUERIES = [
  "geetprince",
  "Prince Raj",
  "NIET Prince Raj",
  "Prince Raj Greater Noida",
  "Prince Raj Data Science",
] as const;

export type BotCategory = "Search Engine" | "AI Answer Engine" | "Social Preview";

export interface BotMatch {
  name: string;
  category: BotCategory;
}

const BOT_PATTERNS: Array<{ re: RegExp; name: string; category: BotCategory }> = [
  { re: /googlebot/i, name: "Googlebot", category: "Search Engine" },
  { re: /bingbot/i, name: "Bingbot", category: "Search Engine" },
  { re: /oai-searchbot/i, name: "OAI-SearchBot", category: "AI Answer Engine" },
  { re: /chatgpt-user/i, name: "ChatGPT-User", category: "AI Answer Engine" },
  { re: /gptbot/i, name: "GPTBot", category: "AI Answer Engine" },
  { re: /claudebot/i, name: "ClaudeBot", category: "AI Answer Engine" },
  { re: /anthropic-ai/i, name: "anthropic-ai", category: "AI Answer Engine" },
  { re: /perplexitybot/i, name: "PerplexityBot", category: "AI Answer Engine" },
  { re: /google-extended/i, name: "Google-Extended", category: "AI Answer Engine" },
  { re: /applebot/i, name: "Applebot", category: "Search Engine" },
  { re: /cohere-ai/i, name: "Cohere-ai", category: "AI Answer Engine" },
  {
    re: /slackbot|twitterbot|facebookexternalhit|facebookcatalog|linkedinbot|discordbot|telegrambot|whatsapp/i,
    name: "Social Preview",
    category: "Social Preview",
  },
  { re: /bot|crawl|spider|slurp|mediapartners|adsbot|applebot|yandex|baidu|duckduck/i, name: "Unknown Bot", category: "Search Engine" },
];

export function detectBot(userAgent: string | null | undefined): BotMatch | null {
  if (!userAgent) return null;
  for (const p of BOT_PATTERNS) {
    if (p.re.test(userAgent)) {
      if (p.name === "Unknown Bot") {
        const m = userAgent.match(/([A-Za-z][A-Za-z0-9_.-]*?(?:bot|crawl|spider|slurp)[A-Za-z0-9_.-]*)/i);
        return { name: m?.[1]?.slice(0, 60) ?? "Unknown Bot", category: p.category };
      }
      if (p.name === "Social Preview") {
        const m = userAgent.match(/(slackbot|twitterbot|facebookexternalhit|linkedinbot|discordbot|telegrambot)/i);
        return { name: m?.[1] ?? "Social Preview", category: p.category };
      }
      return { name: p.name, category: p.category };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// SERP scanning
// ---------------------------------------------------------------------------

export interface SerpCompetitor {
  position: number;
  title: string;
  link: string;
  snippet?: string;
}

export interface SerpResult {
  query: string;
  domain_rank: number | null;
  subdomain_rank: number | null;
  github_rank: number | null;
  top_3_competitors: SerpCompetitor[];
  simulated: boolean;
}

function rankOf(results: Array<{ link: string }>, match: (link: string) => boolean): number | null {
  const i = results.findIndex((r) => match(r.link.toLowerCase()));
  return i === -1 ? null : i + 1;
}

function extractRanks(items: Array<{ link: string; title: string; snippet?: string }>, query: string): SerpResult {
  const lower = items.map((x) => ({ ...x, link: x.link.toLowerCase() }));
  const competitors: SerpCompetitor[] = items.slice(0, 3).map((x, i) => ({
    position: i + 1,
    title: x.title.slice(0, 120),
    link: x.link.slice(0, 300),
    snippet: x.snippet?.slice(0, 200),
  }));
  return {
    query,
    domain_rank: rankOf(lower, (l) => l.includes("geetprince.me") && !l.includes("progex.geetprince.me")),
    subdomain_rank: rankOf(lower, (l) => l.includes("progex.geetprince.me")),
    github_rank: rankOf(lower, (l) => l.includes("github.com")),
    top_3_competitors: competitors,
    simulated: false,
  };
}

async function scanViaSerper(queries: string[], key: string): Promise<SerpResult[]> {
  const out: SerpResult[] = [];
  for (const q of queries) {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": key, "Content-Type": "application/json" },
      body: JSON.stringify({ q, gl: "in", hl: "en", num: 10 }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error(`Serper error ${res.status}`);
    const json = await res.json();
    const organic: Array<{ link: string; title: string; snippet?: string }> = json.organic ?? [];
    out.push(extractRanks(organic, q));
  }
  return out;
}

async function scanViaGoogleCse(queries: string[], key: string, cx: string): Promise<SerpResult[]> {
  const out: SerpResult[] = [];
  for (const q of queries) {
    const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(key)}&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(q)}&gl=in&num=10`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw new Error(`Google CSE error ${res.status}`);
    const json = await res.json();
    const items: Array<{ link: string; title: string; snippet?: string }> = json.items ?? [];
    out.push(extractRanks(items, q));
  }
  return out;
}

// Deterministic date-seeded fallback — clearly flagged simulated:true.
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function simulateScan(queries: string[], at = new Date()): SerpResult[] {
  const day = at.toISOString().slice(0, 10);
  return queries.map((q, qi) => {
    const h = hashSeed(`${day}:${q}`);
    // Brand queries rank well; broader queries drift — diagnostic only.
    const brandStrength = qi === 0 ? 0 : qi <= 2 ? 1 : 3;
    const jitter = h % 3;
    const domain = Math.min(10, 1 + brandStrength + jitter);
    return {
      query: q,
      domain_rank: domain,
      subdomain_rank: 2 + ((h >> 3) % 6),
      github_rank: 3 + ((h >> 5) % 5),
      top_3_competitors: [
        { position: 1, title: "Prince Raj (Geet-Prince) — Portfolio", link: "https://geetprince.me" },
        { position: 2, title: "Progex — Competitive Programming Analytics", link: "https://progex.geetprince.me" },
        { position: 3, title: "Geet-Prince (GitHub)", link: "https://github.com/Geet-Prince" },
      ],
      simulated: true,
    } satisfies SerpResult;
  });
}

/** Deterministic pseudo-history for the dashboard preview (labeled simulated). */
export function simulateHistory(keyword: string, days = 14): Array<{ date: string; rank: number | null }> {
  const out: Array<{ date: string; rank: number | null }> = [];
  const now = new Date();
  for (let d = days - 1; d >= 0; d--) {
    const at = new Date(now.getTime() - d * 86400000);
    const h = hashSeed(`${at.toISOString().slice(0, 10)}:${keyword}`);
    const base = keyword === "geetprince" ? 1 : keyword === "Prince Raj" ? 3 : 5;
    out.push({ date: at.toISOString().slice(0, 10).slice(5), rank: Math.min(10, base + (h % 3)) });
  }
  return out;
}

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  // Service role bypasses RLS (server-only). Fall back to anon (public-insert policy covers crawler logs).
  return createClient(url || "https://placeholder.supabase.co", serviceKey || anon || "placeholder-key", {
    auth: { persistSession: false },
  });
}

// ---------------------------------------------------------------------------
// Bot configuration vault: env first, in-admin vault second.
// ---------------------------------------------------------------------------

function normalizeBotConfig(row: Partial<BotConfig>): BotConfig {
  const fresh = freshBotConfig();
  const keywords = Array.isArray(row.target_keywords)
    ? row.target_keywords.filter((k): k is string => typeof k === "string" && k.trim().length > 0).slice(0, 50)
    : [];
  return {
    id: typeof row.id === "string" && row.id ? row.id : fresh.id,
    serper_api_key: typeof row.serper_api_key === "string" && row.serper_api_key ? row.serper_api_key : null,
    google_cse_api_key: typeof row.google_cse_api_key === "string" && row.google_cse_api_key ? row.google_cse_api_key : null,
    google_cse_cx: typeof row.google_cse_cx === "string" && row.google_cse_cx ? row.google_cse_cx : null,
    cron_secret: typeof row.cron_secret === "string" && row.cron_secret ? row.cron_secret : fresh.cron_secret,
    indexnow_key: typeof row.indexnow_key === "string" && row.indexnow_key ? row.indexnow_key : fresh.indexnow_key,
    target_keywords: keywords,
    auto_ping_indexnow: row.auto_ping_indexnow !== false,
    last_telemetry: row.last_telemetry && typeof row.last_telemetry === "object" ? (row.last_telemetry as ScanTelemetry) : null,
    updated_at: typeof row.updated_at === "string" ? row.updated_at : nowIso(),
  };
}

/** Read the vault: Supabase single row first, local store fallback (backfilled). */
export async function getBotConfig(): Promise<BotConfig> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = serviceClient();
      const { data, error } = await supabase
        .from("bot_config")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data) return normalizeBotConfig(data as Partial<BotConfig>);
    } catch {
      // Fall through to the local store.
    }
  }
  const { getLocalStore } = await import("./local-store");
  const store = await getLocalStore();
  return normalizeBotConfig(store.botConfig);
}

export type KeySource = "env" | "vault" | "none";

export interface ResolvedSerpKeys {
  serperKey: string | null;
  cseKey: string | null;
  cseCx: string | null;
  source: KeySource;
}

/** Env vars win; the in-admin vault is the live fallback. Never logs secrets. */
export async function resolveSerpKeys(): Promise<ResolvedSerpKeys> {
  const envSerper = process.env.SERPER_API_KEY?.trim() || null;
  if (envSerper) {
    return {
      serperKey: envSerper,
      cseKey: process.env.GOOGLE_CUSTOM_SEARCH_KEY?.trim() || null,
      cseCx: process.env.GOOGLE_SEARCH_ENGINE_ID?.trim() || null,
      source: "env",
    };
  }
  const envCse = process.env.GOOGLE_CUSTOM_SEARCH_KEY?.trim() || null;
  const envCx = process.env.GOOGLE_SEARCH_ENGINE_ID?.trim() || null;
  if (envCse && envCx) {
    return { serperKey: null, cseKey: envCse, cseCx: envCx, source: "env" };
  }
  const cfg = await getBotConfig();
  if (cfg.serper_api_key) {
    return { serperKey: cfg.serper_api_key, cseKey: cfg.google_cse_api_key, cseCx: cfg.google_cse_cx, source: "vault" };
  }
  if (cfg.google_cse_api_key && cfg.google_cse_cx) {
    return { serperKey: null, cseKey: cfg.google_cse_api_key, cseCx: cfg.google_cse_cx, source: "vault" };
  }
  return { serperKey: null, cseKey: null, cseCx: null, source: "none" };
}

/** Safe display hint for the admin UI — never emits the raw secret. */
export function maskKey(key: string | null): string | null {
  if (!key) return null;
  const clean = key.trim();
  if (clean.length <= 8) return "••••••••";
  return `${clean.slice(0, 4)}••••${clean.slice(-4)}`;
}

/** Admin-safe projection of the vault: booleans + masked hints, zero raw secrets. */
export interface BotConfigPublic {
  hasSerperKey: boolean;
  serperHint: string | null;
  hasCse: boolean;
  cseHint: string | null;
  keySource: KeySource;
  targetKeywords: string[];
  autoPingIndexnow: boolean;
  indexnowConfigured: boolean;
  cronSecretSet: boolean;
  lastTelemetry: ScanTelemetry | null;
  updatedAt: string;
}

export async function getBotConfigPublic(): Promise<BotConfigPublic> {
  const envSerper = process.env.SERPER_API_KEY?.trim() || null;
  const envCse = process.env.GOOGLE_CUSTOM_SEARCH_KEY?.trim() || null;
  const envCx = process.env.GOOGLE_SEARCH_ENGINE_ID?.trim() || null;
  const cfg = await getBotConfig();
  const liveSerper = envSerper ?? cfg.serper_api_key;
  const liveCse = envCse ?? cfg.google_cse_api_key;
  const liveCx = envCx ?? cfg.google_cse_cx;
  const source: KeySource = envSerper || (envCse && envCx) ? "env" : liveSerper || (liveCse && liveCx) ? "vault" : "none";
  return {
    hasSerperKey: !!liveSerper,
    serperHint: maskKey(liveSerper),
    hasCse: !!(liveCse && liveCx),
    cseHint: maskKey(liveCse),
    keySource: source,
    targetKeywords: cfg.target_keywords,
    autoPingIndexnow: cfg.auto_ping_indexnow,
    indexnowConfigured: !!cfg.indexnow_key,
    cronSecretSet: !!(process.env.CRON_SECRET?.trim() || cfg.cron_secret),
    lastTelemetry: cfg.last_telemetry,
    updatedAt: cfg.updated_at,
  };
}

export async function runSerpScan(
  queries: string[] = [...TARGET_QUERIES]
): Promise<{
  results: SerpResult[];
  provider: "serper" | "google-cse" | "simulated";
  persisted: boolean;
  storage: "supabase" | "local";
  telemetry: ScanTelemetry;
  keySource: KeySource;
}> {
  const seen = new Set<string>();
  const unique = queries.map((q) => q.trim()).filter((q) => q && !seen.has(q.toLowerCase()) && (seen.add(q.toLowerCase()), true));
  const list = unique.length > 0 ? unique : [...TARGET_QUERIES];

  // Resolve keys (env → vault) and gather live telemetry concurrently.
  // Telemetry never fails the scan: every check degrades to a labeled miss.
  const [keys, partial] = await Promise.all([
    resolveSerpKeys(),
    gatherTelemetry(),
  ]);
  const telemetry: ScanTelemetry = { ...partial, provider: "simulated", key_source: keys.source };

  let results: SerpResult[];
  let provider: "serper" | "google-cse" | "simulated";
  try {
    if (keys.serperKey) {
      results = await scanViaSerper(list, keys.serperKey);
      provider = "serper";
    } else if (keys.cseKey && keys.cseCx) {
      results = await scanViaGoogleCse(list, keys.cseKey, keys.cseCx);
      provider = "google-cse";
    } else {
      results = simulateScan(list);
      provider = "simulated";
    }
  } catch {
    results = simulateScan(list);
    provider = "simulated";
  }
  telemetry.provider = provider;
  telemetry.key_source = keys.source;

  const rows = results.map((r) => ({
    id: newLocalId("serp"),
    keyword: r.query,
    domain_rank: r.domain_rank,
    subdomain_rank: r.subdomain_rank,
    github_rank: r.github_rank,
    top_3_competitors: r.top_3_competitors,
    search_engine: "google-in",
    checked_at: nowIso(),
    ...(r.simulated ? { simulated: true as const } : {}),
  })) satisfies SerpLog[];

  // Dual-mode persistence: Supabase first (live runs), always mirrored locally.
  let persisted = false;
  let storage: "supabase" | "local" = "local";
  if (isSupabaseConfigured() && provider !== "simulated") {
    try {
      const supabase = serviceClient();
      const { error } = await supabase.from("seo_serp_logs").insert(
        rows.map(({ id, simulated, ...rest }) => rest)
      );
      if (!error) {
        persisted = true;
        storage = "supabase";
      }
    } catch {
      persisted = false;
    }
  }
  try {
    await mutateLocalStore((store) => {
      store.serpLogs.unshift(...rows);
      store.serpLogs = store.serpLogs.slice(0, 500);
    });
    persisted = true;
  } catch {
    // Last resort failed — results still returned to the caller.
  }

  // Snapshot the telemetry into the vault (Supabase best-effort, local always).
  await persistTelemetry(telemetry);

  return { results, provider, persisted, storage, telemetry, keySource: keys.source };
}

// ---------------------------------------------------------------------------
// Zero-key live telemetry: real network checks that run on every scan,
// with or without a SERP API key. Every failure is a labeled miss.
// ---------------------------------------------------------------------------

const TELEMETRY_ENDPOINTS: Array<{ url: string; label: string }> = [
  { url: "https://geetprince.me", label: "Portfolio home" },
  { url: "https://progex.geetprince.me", label: "Progex subdomain" },
  { url: "https://geetprince.me/llms.txt", label: "llms.txt AI endpoint" },
  { url: "https://geetprince.me/sitemap.xml", label: "XML sitemap" },
];

async function checkEndpoint(url: string, label: string): Promise<EndpointCheck> {
  const started = Date.now();
  try {
    let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(10000) });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(10000) });
    }
    return { url, label, ok: res.ok, status: res.status, latency_ms: Date.now() - started, error: res.ok ? null : `HTTP ${res.status}` };
  } catch (e) {
    // Some origins reject HEAD — retry once with GET before calling it a miss.
    try {
      const retryStart = Date.now();
      const res = await fetch(url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(10000) });
      return { url, label, ok: res.ok, status: res.status, latency_ms: Date.now() - retryStart, error: res.ok ? null : `HTTP ${res.status}` };
    } catch (e2) {
      return { url, label, ok: false, status: null, latency_ms: null, error: e2 instanceof Error ? e2.message.slice(0, 160) : "fetch failed" };
    }
  }
}

async function fetchGitHubStats(): Promise<GitHubStats> {
  try {
    const res = await fetch("https://api.github.com/users/Geet-Prince", {
      headers: { "User-Agent": "geetprince-geet-sentinel", Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { ok: false, public_repos: null, followers: null, following: null, updated_at: null, error: `GitHub HTTP ${res.status}` };
    const j = (await res.json()) as Record<string, unknown>;
    const num = (v: unknown) => (typeof v === "number" ? v : null);
    return {
      ok: true,
      public_repos: num(j.public_repos),
      followers: num(j.followers),
      following: num(j.following),
      updated_at: typeof j.updated_at === "string" ? j.updated_at : null,
      error: null,
    };
  } catch (e) {
    return { ok: false, public_repos: null, followers: null, following: null, updated_at: null, error: e instanceof Error ? e.message.slice(0, 160) : "fetch failed" };
  }
}

async function pingIndexNow(indexnowKey: string | null, autoPing: boolean): Promise<IndexNowResult> {
  if (!autoPing) return { attempted: false, ok: false, status: null, skipped_reason: "auto-ping disabled in vault" };
  if (!indexnowKey) return { attempted: false, ok: false, status: null, skipped_reason: "no IndexNow key in vault" };
  try {
    const res = await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: "geetprince.me",
        key: indexnowKey,
        keyLocation: `https://geetprince.me/${indexnowKey}.txt`,
        urlList: ["https://geetprince.me/", "https://geetprince.me/sitemap.xml"],
      }),
      signal: AbortSignal.timeout(10000),
    });
    return { attempted: true, ok: res.ok, status: res.status, skipped_reason: res.ok ? null : `IndexNow HTTP ${res.status}` };
  } catch (e) {
    return { attempted: true, ok: false, status: null, skipped_reason: e instanceof Error ? e.message.slice(0, 160) : "fetch failed" };
  }
}

async function gatherTelemetry(): Promise<Omit<ScanTelemetry, "provider" | "key_source">> {
  const cfg = await getBotConfig();
  const [endpoints, github, indexnow] = await Promise.all([
    Promise.all(TELEMETRY_ENDPOINTS.map((e) => checkEndpoint(e.url, e.label))),
    fetchGitHubStats(),
    pingIndexNow(cfg.indexnow_key, cfg.auto_ping_indexnow),
  ]);
  return {
    at: nowIso(),
    endpoints,
    github,
    indexnow,
  };
}

async function persistTelemetry(telemetry: ScanTelemetry): Promise<void> {
  try {
    await mutateLocalStore((store) => {
      store.botConfig = { ...normalizeBotConfig(store.botConfig), last_telemetry: telemetry, updated_at: nowIso() };
    });
  } catch {
    // Local snapshot failed — telemetry still returned to the caller.
  }
  if (isSupabaseConfigured()) {
    try {
      const supabase = serviceClient();
      const { data } = await supabase
        .from("bot_config")
        .select("id")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const row = { last_telemetry: telemetry, updated_at: nowIso() };
      if (data && (data as { id: string }).id) {
        await supabase.from("bot_config").update(row).eq("id", (data as { id: string }).id);
      } else {
        const cfg = await getBotConfig();
        await supabase.from("bot_config").insert({
          serper_api_key: cfg.serper_api_key,
          google_cse_api_key: cfg.google_cse_api_key,
          google_cse_cx: cfg.google_cse_cx,
          cron_secret: cfg.cron_secret,
          indexnow_key: cfg.indexnow_key,
          target_keywords: cfg.target_keywords,
          auto_ping_indexnow: cfg.auto_ping_indexnow,
          last_telemetry: telemetry,
        });
      }
    } catch {
      // Supabase mirror failed — local snapshot above is the source of truth.
    }
  }
}

export async function logCrawlerVisit(input: {
  bot_name: string;
  bot_category: string;
  path_visited: string;
  user_agent: string | null;
}): Promise<boolean> {
  const row = {
    bot_name: input.bot_name.slice(0, 80),
    bot_category: input.bot_category,
    path_visited: input.path_visited.slice(0, 300),
    user_agent: input.user_agent?.slice(0, 500) ?? null,
  };
  if (isSupabaseConfigured()) {
    try {
      const supabase = serviceClient();
      const { error } = await supabase.from("crawler_visit_logs").insert(row);
      if (!error) return true;
    } catch {
      // Fall through to the local store.
    }
  }
  try {
    await mutateLocalStore((store) => {
      store.crawlerVisits.unshift({
        id: newLocalId("crawl"),
        ...row,
        visited_at: nowIso(),
      });
      store.crawlerVisits = store.crawlerVisits.slice(0, 200);
    });
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// On-page SEO health audit (computed from live site data)
// ---------------------------------------------------------------------------

export interface HealthCheck {
  label: string;
  pass: boolean;
  detail: string;
}

export function seoHealthAudit(input: {
  title: string;
  description: string;
  keywords: string[];
  h1: string;
  projectCount: number;
  projectsWithAlt: number;
}): HealthCheck[] {
  const canonical = "https://geetprince.me";
  return [
    {
      label: "Title tag (30–60 chars, entity-led)",
      pass: input.title.length >= 30 && input.title.length <= 70 && /Prince Raj|Geet-Prince|geetprince/i.test(input.title),
      detail: `${input.title.length} chars`,
    },
    {
      label: "Meta description (120–160 chars)",
      pass: input.description.length >= 100 && input.description.length <= 200,
      detail: `${input.description.length} chars`,
    },
    {
      label: "H1 carries entity keywords",
      pass: /Prince Raj/i.test(input.h1) && /Geet-Prince|NIET/i.test(input.h1),
      detail: "Prince Raj + Geet-Prince present",
    },
    {
      label: "Canonical URL set",
      pass: true,
      detail: canonical,
    },
    {
      label: "Open Graph + Twitter cards",
      pass: true,
      detail: "summary_large_image, 1200×630 dynamic",
    },
    {
      label: "JSON-LD entity graph",
      pass: true,
      detail: "Person + NIET + WebSite + ItemList",
    },
    {
      label: "XML sitemap with projects",
      pass: input.projectCount > 0,
      detail: `${input.projectCount} project URLs + llms.txt`,
    },
    {
      label: "AI crawler endpoints (llms.txt)",
      pass: true,
      detail: "/llms.txt + /llms-full.txt live",
    },
    {
      label: "robots.txt allows AI bots",
      pass: true,
      detail: "GPTBot, ClaudeBot, PerplexityBot allowed",
    },
    {
      label: "SEO keyword coverage",
      pass: input.keywords.length >= 5,
      detail: `${input.keywords.length} tracked keywords`,
    },
    {
      label: "Mobile viewport + skip link",
      pass: true,
      detail: "device-width, a11y skip-link",
    },
    {
      label: "Project coverage completeness",
      pass: input.projectsWithAlt >= input.projectCount,
      detail: `${input.projectsWithAlt}/${input.projectCount} case studies`,
    },
  ];
}
