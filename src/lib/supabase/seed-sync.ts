import { createAdminSupabase } from "./admin";
import {
  seedCredentials,
  seedFaqs,
  seedProfile,
  seedProjects,
  seedSkills,
  seedTheme,
} from "../seed-data";

// ---------------------------------------------------------------------------
// Automatic Supabase seeding (server-only).
//
// Idempotent: tables are only ever filled when EMPTY (single-row and list
// tables), except `skills`, which merges missing seed skills by name and
// collapses exact duplicate names. Deterministic UUIDv4 seed IDs make every
// upsert/delete safe against Postgres `uuid` primary keys. Never throws —
// callers in the read path receive a result object instead.
// ---------------------------------------------------------------------------

export interface SeedSyncResult {
  /** Human-readable log of what was seeded/deduped. */
  seeded: string[];
  /** Non-fatal problems (missing key, missing table, RLS, network). */
  errors: string[];
}

async function tableCount(
  sb: NonNullable<ReturnType<typeof createAdminSupabase>>,
  table: string
): Promise<number> {
  const { count, error } = await sb
    .from(table)
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function ensureSupabaseSeeded(): Promise<SeedSyncResult> {
  const seeded: string[] = [];
  const errors: string[] = [];
  const sb = createAdminSupabase();
  if (!sb) {
    return { seeded, errors: ["service-role key missing — skipping Supabase seed sync"] };
  }

  // Single-row tables: seed exactly once, when empty.
  const singles: Array<[string, Record<string, unknown>]> = [
    ["profile_config", seedProfile as unknown as Record<string, unknown>],
    ["site_theme_config", seedTheme as unknown as Record<string, unknown>],
  ];
  for (const [table, row] of singles) {
    try {
      if ((await tableCount(sb, table)) === 0) {
        const { error } = await sb.from(table).upsert(row, { onConflict: "id" });
        if (error) throw error;
        seeded.push(`${table}: inserted initial row`);
      }
    } catch (e) {
      errors.push(`${table}: ${e instanceof Error ? e.message : "seed failed"}`);
    }
  }

  // List tables: seed the full set only when completely empty.
  const lists: Array<[string, Array<Record<string, unknown>>]> = [
    ["projects", seedProjects as unknown as Array<Record<string, unknown>>],
    ["credentials", seedCredentials as unknown as Array<Record<string, unknown>>],
    ["aeo_faqs", seedFaqs as unknown as Array<Record<string, unknown>>],
  ];
  for (const [table, rows] of lists) {
    try {
      if ((await tableCount(sb, table)) === 0) {
        const { error } = await sb.from(table).upsert(rows, { onConflict: "id" });
        if (error) throw error;
        seeded.push(`${table}: inserted ${rows.length} seed rows`);
      }
    } catch (e) {
      errors.push(`${table}: ${e instanceof Error ? e.message : "seed failed"}`);
    }
  }

  // Skills: merge missing seeds by name + collapse exact duplicates.
  try {
    const { data, error } = await sb
      .from("skills")
      .select("id,name,created_at")
      .order("created_at", { ascending: true });
    if (error) throw error;
    const existing = (data ?? []) as Array<{ id: string; name: string; created_at: string }>;

    // Deduplicate: group by normalized name, keep earliest, delete the rest.
    const byName = new Map<string, Array<{ id: string; created_at: string }>>();
    for (const row of existing) {
      const key = row.name.trim().toLowerCase();
      const group = byName.get(key) ?? [];
      group.push({ id: row.id, created_at: row.created_at });
      byName.set(key, group);
    }
    const dupIds: string[] = [];
    for (const group of byName.values()) {
      if (group.length > 1) {
        dupIds.push(...group.slice(1).map((g) => g.id));
      }
    }
    if (dupIds.length > 0) {
      const { error: delErr } = await sb.from("skills").delete().in("id", dupIds);
      if (delErr) throw delErr;
      seeded.push(`skills: removed ${dupIds.length} duplicate row(s)`);
    }

    const present = new Set(
      existing.map((r) => r.name.trim().toLowerCase())
    );
    const missing = seedSkills.filter(
      (s) => !present.has(s.name.trim().toLowerCase())
    );
    if (missing.length > 0) {
      const { error: insErr } = await sb
        .from("skills")
        .upsert(missing as unknown as Array<Record<string, unknown>>, { onConflict: "id" });
      if (insErr) throw insErr;
      seeded.push(`skills: inserted ${missing.length} missing seed skill(s)`);
    }
  } catch (e) {
    errors.push(`skills: ${e instanceof Error ? e.message : "seed failed"}`);
  }

  return { seeded, errors };
}
