import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { SECTION_TABLE, verifySection, type AdminSection } from "@/lib/supabase/sql-sync";
import { SITE_URL } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SECTIONS = new Set(Object.keys(SECTION_TABLE));
const COLLECTION_SECTIONS = new Set<AdminSection>([
  "projects",
  "skills",
  "experience",
  "faqs",
]);

function revalidateAll() {
  revalidateTag("portfolio-data");
  revalidatePath("/", "layout");
  revalidatePath("/projects", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/llms.txt");
  revalidatePath("/llms-full.txt");
  revalidatePath("/sitemap.xml");
}

function parseList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function fetchLiveHtml(url: string): Promise<{ ok: boolean; status: number; html: string }> {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { "cache-control": "no-store" },
      signal: AbortSignal.timeout(9000),
    });
    return { ok: res.ok, status: res.status, html: res.ok ? await res.text() : "" };
  } catch {
    return { ok: false, status: 0, html: "" };
  }
}

export async function GET(req: Request) {
  const store = await cookies();
  if (store.get("admin_auth")?.value !== "1") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const section = (url.searchParams.get("section") ?? "profile") as AdminSection;
  const expected = url.searchParams.get("expected")?.trim() || null;
  const expectedCountRaw = url.searchParams.get("expectedCount");
  const expectedCount =
    expectedCountRaw != null && expectedCountRaw !== "" ? Number(expectedCountRaw) : null;
  const mustNotContain = parseList(url.searchParams.get("mustNotContain"));
  if (!SECTIONS.has(section)) {
    return NextResponse.json({ ok: false, error: `Unknown section "${section}".` }, { status: 400 });
  }

  // Stage 2 — read-after-write SQL audit (no-store SELECT): row count, expected
  // token present, and every deleted token absent.
  const sql = await verifySection(section, { expected, expectedCount, mustNotContain });
  const sqlOk = sql.ok && sql.countOk && sql.matched && sql.forbiddenFound.length === 0;

  // Stage 3 — purge the edge/route cache, then inspect the live public HTML.
  revalidateAll();
  const started = Date.now();
  const urls = COLLECTION_SECTIONS.has(section)
    ? [`${SITE_URL}/`, `${SITE_URL}/projects`]
    : [`${SITE_URL}/`];

  const pages = await Promise.all(urls.map(fetchLiveHtml));
  const reachable = pages.some((p) => p.ok);
  const combined = pages.map((p) => p.html.toLowerCase()).join("\n");

  const reflected = expected ? combined.includes(expected.toLowerCase()) : true;
  const stillPresent = mustNotContain.filter((t) => combined.includes(t.toLowerCase()));

  let live: {
    ok: boolean;
    url: string;
    urls: string[];
    reflected: boolean;
    reflectedInMs: number | null;
    stillPresent: string[];
    note?: string;
  };
  if (reachable) {
    live = {
      ok: reflected && stillPresent.length === 0,
      url: `${SITE_URL}/`,
      urls,
      reflected,
      reflectedInMs: reflected ? Date.now() - started : null,
      stillPresent,
      note: reflected
        ? stillPresent.length === 0
          ? undefined
          : `page reachable — deleted item(s) still present: ${stillPresent.join(", ")}`
        : "page reachable — updated value not found yet",
    };
  } else {
    live = {
      ok: sqlOk,
      url: `${SITE_URL}/`,
      urls,
      reflected: false,
      reflectedInMs: null,
      stillPresent: [],
      note: sqlOk
        ? "server could not fetch the live domain; SQL verified + cache purged"
        : "live reflection could not be confirmed",
    };
  }

  const verified = sqlOk && live.ok;
  return NextResponse.json({ ok: true, section, sql, live, verified });
}
