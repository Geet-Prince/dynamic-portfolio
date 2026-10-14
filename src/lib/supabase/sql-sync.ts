import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminSupabase } from "./admin";
import { fetchLiveBundle } from "../data-fetcher";
import {
  seedCredentials,
  seedFaqs,
  seedProfile,
  seedProjects,
  seedSkills,
  seedTheme,
} from "../seed-data";
import { TARGET_QUERIES } from "../seo-bot";

// ---------------------------------------------------------------------------
// Server-only Supabase SQL sync + read-after-write verification.
//
// Powers the /admin "Save & publish" pipeline and the /api/admin/* endpoints.
// Three idempotent modes:
//   • ensure    — conservative: fill EMPTY tables only (never clobbers edits).
//   • seed      — canonical repair: forces Prince Raj's seed rows (fixes the
//                 Verse project, back-fills missing credentials/FAQs/keywords),
//                 while preserving custom rows. Profile/theme are only filled
//                 when empty so admin edits survive.
//   • reconcile — mirror the CURRENT live bundle (Supabase-first) back into
//                 SQL, so anything that silently fell back to the local store
//                 is flushed to PostgreSQL.
// NEVER imported by client components.
// ---------------------------------------------------------------------------

export type AdminSection =
  | "profile"
  | "projects"
  | "skills"
  | "experience"
  | "faqs"
  | "design"
  | "seo-bot"
  | "messages";

export const SECTION_TABLE: Record<AdminSection, string> = {
  profile: "profile_config",
  projects: "projects",
  skills: "skills",
  experience: "credentials",
  faqs: "aeo_faqs",
  design: "site_theme_config",
  "seo-bot": "seo_tracked_keywords",
  messages: "contact_messages",
};

export const SECTION_LABEL: Record<AdminSection, string> = {
  profile: "profile",
  projects: "projects",
  skills: "skills",
  experience: "experience",
  faqs: "FAQs",
  design: "design",
  "seo-bot": "SEO bot",
  messages: "messages",
};

export type SyncMode = "ensure" | "seed" | "reconcile";

export interface SyncOutcome {
  ok: boolean;
  section: AdminSection;
  table: string;
  /** Rows written/updated during this sync. */
  written: number;
  /** Rows present in the table afterwards (read-after-write count). */
  rows: number;
  ms: number;
  /** True when no service-role key / Supabase is unconfigured (local-only). */
  simulated: boolean;
  note?: string;
  error?: string;
}

type Row = Record<string, unknown>;

type AdminClient = NonNullable<ReturnType<typeof createAdminSupabase>>;

async function countRows(sb: AdminClient, table: string): Promise<number> {
  const { count, error } = await sb
    .from(table)
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

async function upsertRows(sb: AdminClient, table: string, rows: Row[]): Promise<number> {
  if (rows.length === 0) return 0;
  const { error } = await sb.from(table).upsert(rows, { onConflict: "id" });
  if (error) throw error;
  return rows.length;
}

async function fetchIds(
  sb: AdminClient,
  table: string,
  columns: string
): Promise<Array<Record<string, string>>> {
  const { data, error } = await sb.from(table).select(columns);
  if (error) throw error;
  return (data ?? []) as unknown as Array<Record<string, string>>;
}

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Tracked keywords: add the 5 defaults without touching admin customs. */
async function ensureTrackedKeywords(sb: AdminClient): Promise<number> {
  try {
    const existing = await fetchIds(sb, "seo_tracked_keywords", "keyword");
    const present = new Set(existing.map((r) => norm(r.keyword ?? "")));
    const missing = TARGET_QUERIES.filter((q) => !present.has(norm(q)));
    if (missing.length === 0) return 0;
    const { error } = await sb
      .from("seo_tracked_keywords")
      .upsert(missing.map((keyword) => ({ keyword })), { onConflict: "keyword" });
    if (error) throw error;
    return missing.length;
  } catch {
    // Table may not be migrated yet — never block the core sync on it.
    return 0;
  }
}

/** Bot-config vault: guarantee a single row exists (secrets stay blank). */
async function ensureBotConfig(sb: AdminClient): Promise<number> {
  try {
    if ((await countRows(sb, "bot_config")) > 0) return 0;
    const { error } = await sb.from("bot_config").insert({
      cron_secret: "",
      indexnow_key: "",
      target_keywords: [],
      auto_ping_indexnow: true,
    });
    if (error) throw error;
    return 1;
  } catch {
    // bot_config may not be migrated yet — degrade gracefully.
    return 0;
  }
}

/** Conservative pass: fill only EMPTY tables (mirrors ensureSupabaseSeeded). */
async function ensureExtras(sb: AdminClient): Promise<number> {
  let written = 0;
  const singles: Array<[string, Row]> = [
    ["profile_config", seedProfile as unknown as Row],
    ["site_theme_config", seedTheme as unknown as Row],
  ];
  for (const [table, row] of singles) {
    if ((await countRows(sb, table)) === 0) written += await upsertRows(sb, table, [row]);
  }
  const lists: Array<[string, Row[]]> = [
    ["projects", seedProjects as unknown as Row[]],
    ["credentials", seedCredentials as unknown as Row[]],
    ["aeo_faqs", seedFaqs as unknown as Row[]],
  ];
  for (const [table, rows] of lists) {
    if ((await countRows(sb, table)) === 0) written += await upsertRows(sb, table, rows);
  }
  // Skills merge by name (insert missing seeds, keep customs).
  const existingSkills = await fetchIds(sb, "skills", "id,name");
  const skillNames = new Set(existingSkills.map((r) => norm(r.name ?? "")));
  const missingSkills = seedSkills.filter((s) => !skillNames.has(norm(s.name)));
  written += await upsertRows(sb, "skills", missingSkills as unknown as Row[]);
  written += await ensureTrackedKeywords(sb);
  written += await ensureBotConfig(sb);
  return written;
}

/** Canonical repair: force seed rows for known entities, preserve customs. */
async function seedRepair(sb: AdminClient): Promise<number> {
  let written = await ensureExtras(sb);

  // Projects — force the canonical seed content by slug (fixes Verse & Retro).
  const existingProjects = await fetchIds(sb, "projects", "id,slug");
  const idBySlug = new Map(existingProjects.map((r) => [r.slug, r.id]));
  const projectRows = seedProjects.map((p) => {
    const existingId = idBySlug.get(p.slug);
    return existingId ? ({ ...p, id: existingId } as Row) : (p as unknown as Row);
  });
  written += await upsertRows(sb, "projects", projectRows);

  // FAQs — refresh canonical answers for the seed questions.
  const existingFaqs = await fetchIds(sb, "aeo_faqs", "id,question");
  const idByQuestion = new Map(existingFaqs.map((r) => [norm(r.question ?? ""), r.id]));
  const faqRows = seedFaqs.map((f) => {
    const existingId = idByQuestion.get(norm(f.question));
    return existingId ? ({ ...f, id: existingId } as Row) : (f as unknown as Row);
  });
  written += await upsertRows(sb, "aeo_faqs", faqRows);

  // Credentials — insert any missing seed credentials (by title).
  const existingCreds = await fetchIds(sb, "credentials", "id,title");
  const credTitles = new Set(existingCreds.map((r) => norm(r.title ?? "")));
  const missingCreds = seedCredentials.filter((c) => !credTitles.has(norm(c.title)));
  written += await upsertRows(sb, "credentials", missingCreds as unknown as Row[]);

  return written;
}

/** Mirror the current live bundle (Supabase-first) back into SQL. */
async function reconcile(sb: AdminClient, section: AdminSection): Promise<number> {
  const data = await fetchLiveBundle();
  const map: Record<string, () => Row[]> = {
    profile: () => [data.profile as unknown as Row],
    design: () => [data.theme as unknown as Row],
    projects: () => data.projects as unknown as Row[],
    skills: () => data.skills as unknown as Row[],
    experience: () => data.credentials as unknown as Row[],
    faqs: () => data.faqs as unknown as Row[],
  };
  const build = map[section];
  if (!build) return 0;
  return upsertRows(sb, SECTION_TABLE[section], build());
}

/** Run one section sync in the requested mode. Never throws. */
export async function syncSection(
  section: AdminSection,
  mode: SyncMode = "reconcile"
): Promise<SyncOutcome> {
  const table = SECTION_TABLE[section];
  const started = Date.now();
  const sb = createAdminSupabase();
  if (!sb) {
    return {
      ok: true,
      section,
      table,
      written: 0,
      rows: 0,
      ms: Date.now() - started,
      simulated: true,
      note: "Supabase service key not configured — running in local persistence mode.",
    };
  }
  try {
    let written = 0;
    if (mode === "ensure") written = await ensureExtras(sb);
    else if (mode === "seed") written = await seedRepair(sb);
    else if (mode === "reconcile") written = await reconcile(sb, section);
    const rows = await countRows(sb, table);
    return {
      ok: true,
      section,
      table,
      written,
      rows,
      ms: Date.now() - started,
      simulated: false,
    };
  } catch (e) {
    return {
      ok: false,
      section,
      table,
      written: 0,
      rows: 0,
      ms: Date.now() - started,
      simulated: false,
      error: e instanceof Error ? e.message : "SQL sync failed.",
    };
  }
}

export interface VerifyOutcome {
  ok: boolean;
  table: string;
  rows: number;
  ms: number;
  matched: boolean;
  expected: string | null;
  simulated: boolean;
  error?: string;
}

/**
 * Read-after-write audit: SELECT the section's table back with cache disabled
 * and confirm the expected token is present (SQL-side proof for the UI).
 */
export async function verifySection(
  section: AdminSection,
  expected: string | null
): Promise<VerifyOutcome> {
  const table = SECTION_TABLE[section];
  const started = Date.now();
  const sb = createAdminSupabase({ noStore: true });
  if (!sb) {
    return {
      ok: true,
      table,
      rows: 0,
      ms: Date.now() - started,
      matched: true,
      expected,
      simulated: true,
    };
  }
  try {
    const { data, error } = await sb.from(table).select("*");
    if (error) throw error;
    const rows = (data ?? []) as unknown[];
    const matched = expected
      ? JSON.stringify(rows).toLowerCase().includes(expected.toLowerCase())
      : true;
    return {
      ok: true,
      table,
      rows: rows.length,
      ms: Date.now() - started,
      matched,
      expected,
      simulated: false,
    };
  } catch (e) {
    return {
      ok: false,
      table,
      rows: 0,
      ms: Date.now() - started,
      matched: false,
      expected,
      simulated: false,
      error: e instanceof Error ? e.message : "SQL verify failed.",
    };
  }
}

export interface TableCount {
  table: string;
  label: string;
  count: number | null;
}

const COUNT_TABLES: Array<[string, string]> = [
  ["profile_config", "profile"],
  ["projects", "projects"],
  ["skills", "skills"],
  ["credentials", "credentials"],
  ["aeo_faqs", "faqs"],
  ["site_theme_config", "theme"],
  ["seo_tracked_keywords", "keywords"],
  ["bot_config", "bot"],
];

/** Live row counts for the /admin "Supabase SQL Status" strip. */
export async function getTableCounts(): Promise<TableCount[]> {
  const sb = createAdminSupabase();
  if (!sb) return COUNT_TABLES.map(([table, label]) => ({ table, label, count: null }));
  const out: TableCount[] = [];
  for (const [table, label] of COUNT_TABLES) {
    try {
      out.push({ table, label, count: await countRows(sb, table) });
    } catch {
      out.push({ table, label, count: null });
    }
  }
  return out;
}
