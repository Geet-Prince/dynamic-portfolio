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
const MODES = new Set<SyncMode>(["ensure", "seed", "reconcile"]);

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
  let body: { section?: string; mode?: string } = {};
  try {
    body = (await req.json()) as { section?: string; mode?: string };
  } catch {
    body = {};
  }
  const section = (body.section ?? "profile") as AdminSection;
  const mode = (body.mode ?? "reconcile") as SyncMode;
  if (!SECTIONS.has(section)) {
    return NextResponse.json({ ok: false, error: `Unknown section "${section}".` }, { status: 400 });
  }
  if (!MODES.has(mode)) {
    return NextResponse.json({ ok: false, error: `Unknown mode "${mode}".` }, { status: 400 });
  }
  const outcome = await syncSection(section, mode);
  if (outcome.ok) revalidateAll();
  return NextResponse.json(outcome, { status: outcome.ok ? 200 : 500 });
}
