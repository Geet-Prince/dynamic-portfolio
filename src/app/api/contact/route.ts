import { z } from "zod";
import {
  createServerSupabase,
  createServiceSupabase,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import { mutateLocalStore, newLocalId, nowIso } from "@/lib/local-store";

const schema = z.object({
  sender_name: z.string().min(2).max(80),
  sender_email: z.string().email().max(160),
  subject: z.string().max(120).optional().or(z.literal("")),
  message: z.string().min(10).max(4000),
  company: z.string().max(200).optional().or(z.literal("")), // honeypot
});

// Naive in-memory rate limit (per instance).
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 5;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    return Response.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  // Honeypot: bots fill this — pretend success.
  if (parsed.data.company && parsed.data.company.trim() !== "") {
    return Response.json({ ok: true });
  }
  const row = {
    sender_name: parsed.data.sender_name.trim(),
    sender_email: parsed.data.sender_email.trim(),
    subject: parsed.data.subject?.trim() || null,
    message: parsed.data.message.trim(),
  };
  // 1) Try Supabase (service role bypasses RLS).
  if (isSupabaseConfigured()) {
    try {
      const supabase = createServiceSupabase() ?? (await createServerSupabase());
      const { error } = await supabase.from("contact_messages").insert(row);
      if (!error) return Response.json({ ok: true, storage: "supabase" });
    } catch {
      // Fall through to the local store — no message is ever lost.
    }
  }
  // 2) Dual-mode local persistence: the inbox works with zero env config.
  try {
    await mutateLocalStore((store) => {
      store.messages.unshift({
        id: newLocalId("msg"),
        ...row,
        is_read: false,
        created_at: nowIso(),
      });
      store.messages = store.messages.slice(0, 500);
    });
    return Response.json({ ok: true, storage: "local" });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to send." },
      { status: 500 }
    );
  }
}
