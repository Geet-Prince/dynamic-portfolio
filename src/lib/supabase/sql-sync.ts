import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminSupabase } from "./admin";
import { resetToFactorySeed } from "./seed-sync";

// ---------------------------------------------------------------------------
// Server-only Supabase SQL write + read-after-write verification.
//
// Supabase PostgreSQL is the 100% single source of truth. There are exactly
// two write modes, and NEITHER one ever silently re-adds seed-data.ts rows:
//
//   • replace — commit the EXACT current /admin screen state. Upserts every
//               item the admin can see AND deletes any row whose id is not in
//               that list, so deleting a project (5 → 4) leaves 4 rows in
//               PostgreSQL — the deleted row stays deleted.
//   • reset   — the ONLY seed-data.ts writer: a confirmation-gated factory
//               reset invoked solely by the "Reset to Factory Seed Data"
//               button, never by reads/publishes/deletes/auto-sync.
//
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

export type SyncMode = "replace" | "reset";

export interface SyncOutcome {
  ok: boolean;
  section: AdminSection;
  table: string;
  /** Rows inserted/updated during this sync. */
  written: number;
  /** Rows removed because they are no longer on screen. */
  deleted: number;
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
  columns = "id"
): Promise<Array<Record<string, string>>> {
  const { data, error } = await sb.from(table).select(columns);
  if (error) throw error;
  return (data ?? []) as unknown as Array<Record<string, string>>;
}

const SINGLE_ROW_SECTIONS = new Set<AdminSection>(["profile", "design"]);

/**
 * Commit the exact on-screen state for a section:
 *   1. upsert every item currently visible in /admin, and
 *   2. delete every existing row whose id is NOT in that list.
 * Reads never call this, and this never touches seed-data.ts.
 */
async function replaceSection(
  sb: AdminClient,
  section: AdminSection,
  items: Row[]
): Promise<{ written: number; deleted: number }> {
  const table = SECTION_TABLE[section];

  // The inbox is append-only (contact submissions); "publish" is a no-op.
  if (section === "messages") return { written: 0, deleted: 0 };

  // Single-row tables (profile / theme): keep exactly the one visible row.
  if (SINGLE_ROW_SECTIONS.has(section)) {
    const row = items[0];
    if (!row) return { written: 0, deleted: 0 };
    const written = await upsertRows(sb, table, [row]);
    return { written, deleted: 0 };
  }

  // Collection tables: upsert the visible rows, prune everything else by id.
  const existing = await fetchIds(sb, table, "id");
  const keep = new Set(items.map((i) => String(i.id)));
  const toDelete = existing.map((r) => r.id).filter((id) => id && !keep.has(id));
  if (toDelete.length > 0) {
    const { error } = await sb.from(table).delete().in("id", toDelete);
    if (error) throw error;
  }
  const written = await upsertRows(sb, table, items);
  return { written, deleted: toDelete.length };
}

/**
 * Run one section write. `replace` needs the on-screen `items`; `reset`
 * ignores them and restores seed-data.ts factory rows instead. Never throws.
 */
export async function syncSection(
  section: AdminSection,
  mode: SyncMode = "replace",
  items: Row[] = []
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
      deleted: 0,
      rows: 0,
      ms: Date.now() - started,
      simulated: true,
      note: "Supabase service key not configured — running in local persistence mode.",
    };
  }
  try {
    let written = 0;
    let deleted = 0;
    if (mode === "reset") {
      const { seeded, errors } = await resetToFactorySeed();
      written = seeded.length;
      if (errors.length > 0) {
        return {
          ok: false,
          section,
          table,
          written,
          deleted: 0,
          rows: 0,
          ms: Date.now() - started,
          simulated: false,
          error: errors.join("; "),
        };
      }
    } else {
      const r = await replaceSection(sb, section, items);
      written = r.written;
      deleted = r.deleted;
    }
    const rows = await countRows(sb, table);
    return {
      ok: true,
      section,
      table,
      written,
      deleted,
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
      deleted: 0,
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
  /** Actual row count currently in the table. */
  rows: number;
  /** Expected count (null = don't enforce). */
  expectedCount: number | null;
  /** True when rows === expectedCount (or expectedCount is null). */
  countOk: boolean;
  /** True when the expected token is present (or none was requested). */
  matched: boolean;
  expected: string | null;
  /** Forbidden tokens (e.g. deleted titles) that are still present. */
  forbiddenFound: string[];
  ms: number;
  simulated: boolean;
  error?: string;
}

export interface VerifyOptions {
  expected?: string | null;
  expectedCount?: number | null;
  /** Strings that must NOT appear anywhere in the table (deleted items). */
  mustNotContain?: string[];
}

/**
 * Read-after-write audit: SELECT the section's table back with cache disabled
 * and confirm the row count, the presence of the expected token, and the
 * absence of every forbidden (deleted) token.
 */
export async function verifySection(
  section: AdminSection,
  opts: VerifyOptions = {}
): Promise<VerifyOutcome> {
  const table = SECTION_TABLE[section];
  const expected = opts.expected ?? null;
  const expectedCount = opts.expectedCount ?? null;
  const mustNotContain = (opts.mustNotContain ?? []).filter((s) => s && s.trim().length > 0);
  const started = Date.now();
  const sb = createAdminSupabase({ noStore: true });
  if (!sb) {
    return {
      ok: true,
      table,
      rows: 0,
      expectedCount,
      countOk: true,
      matched: true,
      expected,
      forbiddenFound: [],
      ms: Date.now() - started,
      simulated: true,
    };
  }
  try {
    const { data, error } = await sb.from(table).select("*");
    if (error) throw error;
    const rows = (data ?? []) as unknown[];
    const haystack = JSON.stringify(rows).toLowerCase();
    const matched = expected ? haystack.includes(expected.toLowerCase()) : true;
    const forbiddenFound = mustNotContain.filter((t) => haystack.includes(t.toLowerCase()));
    return {
      ok: true,
      table,
      rows: rows.length,
      expectedCount,
      countOk: expectedCount == null || rows.length === expectedCount,
      matched,
      expected,
      forbiddenFound,
      ms: Date.now() - started,
      simulated: false,
    };
  } catch (e) {
    return {
      ok: false,
      table,
      rows: 0,
      expectedCount,
      countOk: false,
      matched: false,
      expected,
      forbiddenFound: [],
      ms: Date.now() - started,
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
