import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { SECTION_TABLE, verifySection, type AdminSection } from "@/lib/supabase/sql-sync";
import { SITE_URL } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SECTIONS = new Set(Object.keys(SECTION_TABLE));

function revalidateAll() {
  revalidateTag("portfolio-data");
  revalidatePath("/", "layout");
  revalidatePath("/projects", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/llms.txt");
  revalidatePath("/llms-full.txt");
  revalidatePath("/sitemap.xml");
}

export async function GET(req: Request) {
  const store = await cookies();
  if (store.get("admin_auth")?.value !== "1") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const section = (url.searchParams.get("section") ?? "profile") as AdminSection;
  const expected = url.searchParams.get("expected")?.trim() || null;
  if (!SECTIONS.has(section)) {
    return NextResponse.json({ ok: false, error: `Unknown section "${section}".` }, { status: 400 });
  }

  // Step 2 — read-after-write SQL audit (no-store SELECT).
  const sql = await verifySection(section, expected);

  // Step 3 — purge the edge/ISR cache, then check the live public HTML.
  revalidateAll();
  const started = Date.now();
  let live: {
    ok: boolean;
    url: string;
    reflected: boolean;
    reflectedInMs: number | null;
    note?: string;
  } = { ok: false, url: `${SITE_URL}/`, reflected: false, reflectedInMs: null };
  try {
    const res = await fetch(`${SITE_URL}/`, {
      cache: "no-store",
      headers: { "cache-control": "no-store" },
      signal: AbortSignal.timeout(9000),
    });
    const html = res.ok ? await res.text() : "";
    const reflected =
      res.ok && (expected ? html.toLowerCase().includes(expected.toLowerCase()) : true);
    live = {
      ok: reflected,
      url: `${SITE_URL}/`,
      reflected,
      reflectedInMs: reflected ? Date.now() - started : null,
      note: res.ok
        ? reflected
          ? undefined
          : "page reachable — updated value not found yet"
        : `live page returned HTTP ${res.status}`,
    };
  } catch {
    // The server may be unable to reach the public domain (preview/offline).
    // SQL proof + cache purge still succeeded, so surface that rather than hang.
    live = {
      ok: sql.ok && sql.matched,
      url: `${SITE_URL}/`,
      reflected: false,
      reflectedInMs: null,
      note: sql.ok && sql.matched
        ? "server could not fetch the live domain; SQL verified + cache purged"
        : "live reflection could not be confirmed",
    };
  }

  const verified = sql.ok && sql.matched && live.ok;
  return NextResponse.json({ ok: true, section, sql, live, verified });
}
