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
// Factory reset (server-only, EXPLICIT INVOCATION ONLY).
//
// This is the ONE place that writes seed-data.ts into Supabase. It must NEVER
// run automatically on reads, renders, deletes, or "Save & publish" — doing so
// resurrects rows the admin intentionally deleted. The only caller is the
// confirmation-gated "Reset to Factory Seed Data" action in /admin.
//
// Semantics: force every seed row into place AND delete any custom/extra rows
// so the database matches seed-data.ts exactly (a true factory reset).
// Never throws — returns a result object.
// ---------------------------------------------------------------------------

export interface FactoryResetResult {
  /** Human-readable log of what was restored. */
  seeded: string[];
  /** Non-fatal problems (missing key, missing table, RLS, network). */
  errors: string[];
}

type AdminClient = NonNullable<ReturnType<typeof createAdminSupabase>>;

async function upsert(sb: AdminClient, table: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const { error } = await sb.from(table).upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

/** Delete rows in `table` whose id is not in `keepIds` (only if any exist). */
async function pruneExtras(sb: AdminClient, table: string, keepIds: string[]) {
  let query = sb.from(table).delete();
  // PostgREST: `not.in` prunes everything outside the seed id set.
  query = keepIds.length > 0 ? query.not("id", "in", `(${keepIds.join(",")})`) : query;
  const { error } = await query;
  if (error) throw error;
}

export async function resetToFactorySeed(): Promise<FactoryResetResult> {
  const seeded: string[] = [];
  const errors: string[] = [];
  const sb = createAdminSupabase();
  if (!sb) {
    return { seeded, errors: ["service-role key missing — cannot reset factory seed"] };
  }

  const seedSets: Array<[string, Array<Record<string, unknown>>]> = [
    ["projects", seedProjects as unknown as Array<Record<string, unknown>>],
    ["skills", seedSkills as unknown as Array<Record<string, unknown>>],
    ["credentials", seedCredentials as unknown as Array<Record<string, unknown>>],
    ["aeo_faqs", seedFaqs as unknown as Array<Record<string, unknown>>],
  ];
  for (const [table, rows] of seedSets) {
    try {
      await upsert(sb, table, rows);
      try {
        await pruneExtras(sb, table, rows.map((r) => String(r.id)));
      } catch (e) {
        errors.push(`${table}: restored seed rows but could not prune extras (${e instanceof Error ? e.message : "error"})`);
      }
      seeded.push(`${table}: restored ${rows.length} factory row(s)`);
    } catch (e) {
      errors.push(`${table}: ${e instanceof Error ? e.message : "reset failed"}`);
    }
  }

  const singles: Array<[string, Record<string, unknown>]> = [
    ["profile_config", seedProfile as unknown as Record<string, unknown>],
    ["site_theme_config", seedTheme as unknown as Record<string, unknown>],
  ];
  for (const [table, row] of singles) {
    try {
      await upsert(sb, table, [row]);
      seeded.push(`${table}: restored factory row`);
    } catch (e) {
      errors.push(`${table}: ${e instanceof Error ? e.message : "reset failed"}`);
    }
  }

  return { seeded, errors };
}
