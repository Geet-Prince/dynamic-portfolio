import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  SECTION_TABLE,
  syncSection,
  type AdminSection,
  type SyncMode,
} from "@/lib/supabase/sql-sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SECTIONS = new Set(Object.keys(SECTION_TABLE));
const MODES = new Set<SyncMode>(["replace", "reset"]);
const MAX_ITEMS = 500;

function revalidateAll() {
  revalidateTag("portfolio-data");
  revalidatePath("/", "layout");
  revalidatePath("/projects", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/llms.txt");
  revalidatePath("/llms-full.txt");
  revalidatePath("/sitemap.xml");
}

export async function POST(req: Request) {
  const store = await cookies();
  if (store.get("admin_auth")?.value !== "1") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  let body: { section?: string; mode?: string; items?: unknown } = {};
  try {
    body = (await req.json()) as { section?: string; mode?: string; items?: unknown };
  } catch {
    body = {};
  }
  const section = (body.section ?? "profile") as AdminSection;
  const mode = (body.mode ?? "replace") as SyncMode;
  if (!SECTIONS.has(section)) {
    return NextResponse.json({ ok: false, error: `Unknown section "${section}".` }, { status: 400 });
  }
  if (!MODES.has(mode)) {
    return NextResponse.json({ ok: false, error: `Unknown mode "${mode}".` }, { status: 400 });
  }

  let items: Array<Record<string, unknown>> = [];
  if (mode === "replace") {
    if (!Array.isArray(body.items)) {
      return NextResponse.json(
        { ok: false, error: "replace requires an `items` array of the current on-screen rows." },
        { status: 400 }
      );
    }
    if (body.items.length > MAX_ITEMS) {
      return NextResponse.json(
        { ok: false, error: `Too many items (max ${MAX_ITEMS}).` },
        { status: 400 }
      );
    }
    items = body.items.filter(
      (r): r is Record<string, unknown> => !!r && typeof r === "object" && !Array.isArray(r)
    );
    // Every item must carry an id so upsert-by-id + prune-not-in-id is safe.
    const missingId = items.some((r) => typeof r.id !== "string" || !r.id);
    if (missingId) {
      return NextResponse.json(
        { ok: false, error: "Every item must include a string `id`." },
        { status: 400 }
      );
    }
  }

  const outcome = await syncSection(section, mode, items);
  if (outcome.ok) revalidateAll();
  return NextResponse.json(outcome, { status: outcome.ok ? 200 : 500 });
}
