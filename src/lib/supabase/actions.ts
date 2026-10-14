"use server";

import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createServerSupabase,
  createServiceSupabase,
  isSupabaseConfigured,
} from "./server";
import {
  getLocalStore,
  mutateLocalStore,
  newLocalId,
  nowIso,
  sortByOrder,
} from "../local-store";

function revalidateAll() {
  // Bust the RAM-cached portfolio bundle first so the next request refetches.
  revalidateTag("portfolio-data");
  revalidatePath("/", "layout");
  revalidatePath("/projects", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/llms.txt");
  revalidatePath("/llms-full.txt");
  revalidatePath("/sitemap.xml");
}

type OkLocal = { ok: true; preview: true };
type OkRemote = { ok: true };
type Err = { ok: false; error: string };

export async function adminLogin(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.ADMIN_PASSWORD || "admin123";
  if (password !== expected) {
    return { ok: false as const, error: "Incorrect password." };
  }
  const store = await cookies();
  store.set("admin_auth", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/admin");
}

export async function adminLogout() {
  const store = await cookies();
  store.delete("admin_auth");
  redirect("/admin/login");
}

async function requireAdmin() {
  const store = await cookies();
  if (store.get("admin_auth")?.value !== "1") {
    throw new Error("Unauthorized — please log in at /admin/login.");
  }
}

/**
 * Write client: service-role key first (bypasses RLS — required because
 * /admin uses cookie auth, not Supabase Auth sessions, so the anon key is
 * denied by the `authenticated` RLS policies on every write). Falls back to
 * the anon client when no service key is configured.
 */
async function writeClient() {
  return createServiceSupabase() ?? (await createServerSupabase());
}

/** Merge a patch into the offline preview cookie (profile + theme share it). */
async function writePreviewCookie(patch: Record<string, unknown>) {
  try {
    const store = await cookies();
    let existing: Record<string, unknown> = {};
    try {
      const raw = store.get("portfolio-preview")?.value;
      if (raw) existing = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
    } catch {
      existing = {};
    }
    store.set(
      "portfolio-preview",
      Buffer.from(JSON.stringify({ ...existing, ...patch })).toString("base64"),
      { path: "/", maxAge: 60 * 60 * 24 * 30 }
    );
  } catch {
    /* cookie too large — ignore */
  }
}

// ---------- Profile ----------

const profileSchema = z.object({
  full_name: z.string().min(1).max(120),
  handle: z.string().min(1).max(80),
  headline: z.string().min(1).max(200),
  subheadline: z.string().min(1).max(500),
  institution: z.string().min(1).max(200),
  institution_short: z.string().min(1).max(80),
  degree: z.string().min(1).max(200),
  location: z.string().min(1).max(200),
  bio_markdown: z.string().min(1).max(8000),
  email: z.string().email().max(160),
  avatar_url: z.string().max(500).optional().or(z.literal("")),
  resume_url: z.string().max(500).optional().or(z.literal("")),
  github_url: z.string().url().max(500),
  linkedin_url: z.string().max(500).optional().or(z.literal("")),
  leetcode_url: z.string().max(500).optional().or(z.literal("")),
  huggingface_url: z.string().max(500).optional().or(z.literal("")),
  progex_url: z.string().url().max(500),
  dsa_solved_count: z.coerce.number().int().min(0).max(100000),
  availability_status: z.coerce.boolean().default(true),
  availability_text: z.string().min(1).max(200),
  seo_keywords: z.string().max(2000),
});

export async function updateProfile(formData: FormData): Promise<OkRemote | OkLocal | Err> {
  await requireAdmin();
  const raw: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) raw[k] = v;
  // checkbox handling
  raw.availability_status = formData.get("availability_status") === "on" ? true : false;
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = {
    ...parsed.data,
    seo_keywords: parsed.data.seo_keywords
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    updated_at: new Date().toISOString(),
  };

  // Ephemeral preview cookie (instant, per-browser).
  await writePreviewCookie({ profile: data });

  // 1) Try Supabase.
  if (isSupabaseConfigured()) {
    try {
      const supabase = await writeClient();
      const { data: existing } = await supabase.from("profile_config").select("id").limit(1).single();
      if (!existing) {
        const { error } = await supabase.from("profile_config").insert(data);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("profile_config")
          .update(data)
          .eq("id", (existing as { id: string }).id);
        if (error) throw error;
      }
      revalidateAll();
      return { ok: true as const };
    } catch {
      // Fall through to the local store — persistence is mandatory.
    }
  }

  // 2) Dual-mode local persistence — always works, frontend updates instantly.
  await mutateLocalStore((s) => {
    s.profile = { ...s.profile, ...data };
  });
  revalidateAll();
  return { ok: true as const, preview: true as const };
}

// ---------- Projects ----------

const projectSchema = z.object({
  id: z.string().max(80).optional().or(z.literal("")),
  title: z.string().min(1).max(160),
  slug: z.string().min(1).max(160).regex(/^[a-z0-9-]+$/),
  tagline: z.string().min(1).max(300),
  description_markdown: z.string().min(1).max(12000),
  architecture_highlights: z.string().max(4000).default(""),
  live_url: z.string().max(500).optional().or(z.literal("")),
  github_url: z.string().max(500).optional().or(z.literal("")),
  thumbnail_url: z.string().max(500).optional().or(z.literal("")),
  tech_stack: z.string().max(1000),
  category: z.string().min(1).max(80),
  metrics_badge: z.string().max(160).optional().or(z.literal("")),
  is_featured: z.boolean().default(true),
  display_order: z.coerce.number().int().min(0).max(10000).default(0),
});

function nullIfEmpty(s: string | undefined): string | null {
  if (!s || s.trim() === "") return null;
  return s.trim();
}

export async function upsertProject(formData: FormData): Promise<OkRemote | OkLocal | Err> {
  await requireAdmin();
  const raw: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) raw[k] = v;
  raw.is_featured = formData.get("is_featured") === "on";
  const parsed = projectSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const p = parsed.data;
  const row = {
    title: p.title.trim(),
    slug: p.slug.trim(),
    tagline: p.tagline.trim(),
    description_markdown: p.description_markdown,
    architecture_highlights: p.architecture_highlights.split("\n").map((s) => s.trim()).filter(Boolean),
    live_url: nullIfEmpty(p.live_url),
    github_url: nullIfEmpty(p.github_url),
    thumbnail_url: nullIfEmpty(p.thumbnail_url),
    tech_stack: p.tech_stack.split(",").map((s) => s.trim()).filter(Boolean),
    category: p.category.trim(),
    metrics_badge: nullIfEmpty(p.metrics_badge),
    is_featured: p.is_featured,
    display_order: p.display_order,
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = await writeClient();
      if (p.id) {
        const { error } = await supabase.from("projects").update(row).eq("id", p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("projects").insert(row);
        if (error) throw error;
      }
      revalidateAll();
      return { ok: true as const };
    } catch {
      // Fall through to the local store.
    }
  }

  await mutateLocalStore((s) => {
    if (p.id) {
      const i = s.projects.findIndex((x) => x.id === p.id);
      if (i >= 0) s.projects[i] = { ...s.projects[i], ...row };
      else s.projects.push({ id: p.id, created_at: nowIso(), ...row });
    } else {
      s.projects.push({ id: newLocalId("proj"), created_at: nowIso(), ...row });
    }
    s.projects = sortByOrder(s.projects);
  });
  revalidateAll();
  return { ok: true as const, preview: true as const };
}

export async function deleteProject(id: string): Promise<OkRemote | OkLocal | Err> {
  await requireAdmin();
  if (isSupabaseConfigured()) {
    try {
      const supabase = await writeClient();
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
      revalidateAll();
      return { ok: true as const };
    } catch {
      // Fall through to the local store.
    }
  }
  await mutateLocalStore((s) => {
    s.projects = s.projects.filter((x) => x.id !== id);
  });
  revalidateAll();
  return { ok: true as const, preview: true as const };
}

// ---------- Skills ----------

const skillSchema = z.object({
  id: z.string().max(80).optional().or(z.literal("")),
  name: z.string().min(1).max(120),
  category: z.string().min(1).max(120),
  proficiency: z.coerce.number().int().min(0).max(100).default(90),
  is_highlighted: z.boolean().default(true),
  display_order: z.coerce.number().int().min(0).max(10000).default(0),
});

export async function upsertSkill(formData: FormData): Promise<OkRemote | OkLocal | Err> {
  await requireAdmin();
  const raw: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) raw[k] = v;
  raw.is_highlighted = formData.get("is_highlighted") === "on";
  const parsed = skillSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const s = parsed.data;
  const row = {
    name: s.name.trim(),
    category: s.category.trim(),
    proficiency: s.proficiency,
    is_highlighted: s.is_highlighted,
    display_order: s.display_order,
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = await writeClient();
      if (s.id) {
        const { error } = await supabase.from("skills").update(row).eq("id", s.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("skills").insert(row);
        if (error) throw error;
      }
      revalidateAll();
      return { ok: true as const };
    } catch {
      // Fall through to the local store.
    }
  }

  await mutateLocalStore((store) => {
    if (s.id) {
      const i = store.skills.findIndex((x) => x.id === s.id);
      if (i >= 0) store.skills[i] = { ...store.skills[i], ...row };
      else store.skills.push({ id: s.id, ...row });
    } else {
      store.skills.push({ id: newLocalId("skill"), ...row });
    }
    store.skills = sortByOrder(store.skills);
  });
  revalidateAll();
  return { ok: true as const, preview: true as const };
}

export async function deleteSkill(id: string): Promise<OkRemote | OkLocal | Err> {
  await requireAdmin();
  if (isSupabaseConfigured()) {
    try {
      const supabase = await writeClient();
      const { error } = await supabase.from("skills").delete().eq("id", id);
      if (error) throw error;
      revalidateAll();
      return { ok: true as const };
    } catch {
      // Fall through to the local store.
    }
  }
  await mutateLocalStore((store) => {
    store.skills = store.skills.filter((x) => x.id !== id);
  });
  revalidateAll();
  return { ok: true as const, preview: true as const };
}

// ---------- Credentials ----------

const credentialSchema = z.object({
  id: z.string().max(80).optional().or(z.literal("")),
  title: z.string().min(1).max(200),
  organization: z.string().min(1).max(200),
  location: z.string().max(200).optional().or(z.literal("")),
  type: z.enum(["Education", "Certification", "Hackathon", "Program"]),
  date_label: z.string().min(1).max(80),
  description: z.string().min(1).max(4000),
  credential_url: z.string().max(500).optional().or(z.literal("")),
  badge_text: z.string().max(80).optional().or(z.literal("")),
  display_order: z.coerce.number().int().min(0).max(10000).default(0),
});

export async function upsertCredential(formData: FormData): Promise<OkRemote | OkLocal | Err> {
  await requireAdmin();
  const raw: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) raw[k] = v;
  const parsed = credentialSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const c = parsed.data;
  const row = {
    title: c.title.trim(),
    organization: c.organization.trim(),
    location: nullIfEmpty(c.location),
    type: c.type,
    date_label: c.date_label.trim(),
    description: c.description.trim(),
    credential_url: nullIfEmpty(c.credential_url),
    badge_text: nullIfEmpty(c.badge_text),
    display_order: c.display_order,
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = await writeClient();
      if (c.id) {
        const { error } = await supabase.from("credentials").update(row).eq("id", c.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("credentials").insert(row);
        if (error) throw error;
      }
      revalidateAll();
      return { ok: true as const };
    } catch {
      // Fall through to the local store.
    }
  }

  await mutateLocalStore((store) => {
    if (c.id) {
      const i = store.credentials.findIndex((x) => x.id === c.id);
      if (i >= 0) store.credentials[i] = { ...store.credentials[i], ...row };
      else store.credentials.push({ id: c.id, ...row });
    } else {
      store.credentials.push({ id: newLocalId("cred"), ...row });
    }
    store.credentials = sortByOrder(store.credentials);
  });
  revalidateAll();
  return { ok: true as const, preview: true as const };
}

export async function deleteCredential(id: string): Promise<OkRemote | OkLocal | Err> {
  await requireAdmin();
  if (isSupabaseConfigured()) {
    try {
      const supabase = await writeClient();
      const { error } = await supabase.from("credentials").delete().eq("id", id);
      if (error) throw error;
      revalidateAll();
      return { ok: true as const };
    } catch {
      // Fall through to the local store.
    }
  }
  await mutateLocalStore((store) => {
    store.credentials = store.credentials.filter((x) => x.id !== id);
  });
  revalidateAll();
  return { ok: true as const, preview: true as const };
}

// ---------- AEO FAQs ----------

const faqSchema = z.object({
  id: z.string().max(80).optional().or(z.literal("")),
  question: z.string().min(10).max(200),
  answer: z.string().min(10).max(4000),
  display_order: z.coerce.number().int().min(0).max(10000).default(0),
  is_active: z.boolean().default(true),
});

export async function upsertFaq(formData: FormData): Promise<OkRemote | OkLocal | Err> {
  await requireAdmin();
  const raw: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) raw[k] = v;
  raw.is_active = formData.get("is_active") === "on";
  const parsed = faqSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const f = parsed.data;
  const row = {
    question: f.question.trim(),
    answer: f.answer.trim(),
    display_order: f.display_order,
    is_active: f.is_active,
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = await writeClient();
      if (f.id) {
        const { error } = await supabase.from("aeo_faqs").update(row).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("aeo_faqs").insert(row);
        if (error) throw error;
      }
      revalidateAll();
      return { ok: true as const };
    } catch {
      // Fall through to the local store (e.g. table not migrated yet).
    }
  }

  await mutateLocalStore((store) => {
    if (f.id) {
      const i = store.faqs.findIndex((x) => x.id === f.id);
      if (i >= 0) store.faqs[i] = { ...store.faqs[i], ...row };
      else store.faqs.push({ id: f.id, created_at: nowIso(), ...row });
    } else {
      store.faqs.push({ id: newLocalId("faq"), created_at: nowIso(), ...row });
    }
    store.faqs = sortByOrder(store.faqs);
  });
  revalidateAll();
  return { ok: true as const, preview: true as const };
}

export async function deleteFaq(id: string): Promise<OkRemote | OkLocal | Err> {
  await requireAdmin();
  if (isSupabaseConfigured()) {
    try {
      const supabase = await writeClient();
      const { error } = await supabase.from("aeo_faqs").delete().eq("id", id);
      if (error) throw error;
      revalidateAll();
      return { ok: true as const };
    } catch {
      // Fall through to the local store.
    }
  }
  await mutateLocalStore((store) => {
    store.faqs = store.faqs.filter((x) => x.id !== id);
  });
  revalidateAll();
  return { ok: true as const, preview: true as const };
}

// ---------- Messages ----------

export async function markMessageRead(id: string, isRead: boolean): Promise<OkRemote | OkLocal | Err> {
  await requireAdmin();
  if (isSupabaseConfigured()) {
    try {
      const supabase = await writeClient();
      const { error } = await supabase.from("contact_messages").update({ is_read: isRead }).eq("id", id);
      if (error) throw error;
      return { ok: true as const };
    } catch {
      // Fall through to the local store.
    }
  }
  await mutateLocalStore((store) => {
    const m = store.messages.find((x) => x.id === id);
    if (m) m.is_read = isRead;
  });
  return { ok: true as const, preview: true as const };
}

export async function deleteMessage(id: string): Promise<OkRemote | OkLocal | Err> {
  await requireAdmin();
  if (isSupabaseConfigured()) {
    try {
      const supabase = await writeClient();
      const { error } = await supabase.from("contact_messages").delete().eq("id", id);
      if (error) throw error;
      return { ok: true as const };
    } catch {
      // Fall through to the local store.
    }
  }
  await mutateLocalStore((store) => {
    store.messages = store.messages.filter((x) => x.id !== id);
  });
  return { ok: true as const, preview: true as const };
}

export async function purgeCache() {
  await requireAdmin();
  revalidateAll();
  return { ok: true as const };
}

// ---------- Design Studio (site_theme_config) ----------

const themeSchema = z.object({
  theme_preset: z.enum(["cupertino-light", "sequoia-dark", "editorial-paper", "nordic-slate"]),
  hero_layout: z.enum(["apple-centered", "split-executive", "bento-first"]),
  card_radius: z.enum(["8px", "16px", "24px", "32px"]),
  glass_blur: z
    .string()
    .regex(/^\d+px$/, "Glass blur must look like 20px.")
    .refine(
      (v) => {
        const n = parseInt(v, 10);
        return n >= 4 && n <= 40;
      },
      { message: "Glass blur must be between 4px and 40px." }
    ),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Accent must be a #RRGGBB hex color."),
  section_order: z.string().max(300),
  section_visibility: z.string().max(300).optional().or(z.literal("")),
  default_project_view: z.enum(["executive", "xray"]),
  recruiter_messages: z.string().max(8000).optional().or(z.literal("")),
});

const VALID_SECTIONS = ["hero", "bento", "projects", "skills", "timeline", "aeo", "contact"];

function parseRecruiterMessages(raw: string | undefined): Record<string, string> {
  if (!raw || raw.trim() === "") return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        const key = String(k).toLowerCase().trim().slice(0, 40);
        if (typeof v === "string" && key && v.trim()) {
          out[key] = v.trim().slice(0, 300);
        }
      }
      return out;
    }
  } catch {
    // Malformed JSON — ignore rather than fail the whole save.
  }
  return {};
}

export async function updateTheme(formData: FormData): Promise<OkRemote | OkLocal | Err> {
  await requireAdmin();
  const raw: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) raw[k] = v;
  raw.enable_command_palette = formData.get("enable_command_palette") === "on";
  raw.enable_architecture_xray = formData.get("enable_architecture_xray") === "on";
  raw.enable_guitar_easter_egg = formData.get("enable_guitar_easter_egg") === "on";
  const parsed = themeSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const order = parsed.data.section_order
    .split(",")
    .map((s) => s.trim())
    .filter((s) => VALID_SECTIONS.includes(s));
  const visibilityRaw = (parsed.data.section_visibility || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => VALID_SECTIONS.includes(s));
  const data = {
    theme_preset: parsed.data.theme_preset,
    hero_layout: parsed.data.hero_layout,
    card_radius: parsed.data.card_radius,
    glass_blur: parsed.data.glass_blur,
    accent_color: parsed.data.accent_color,
    enable_command_palette: raw.enable_command_palette as boolean,
    enable_architecture_xray: raw.enable_architecture_xray as boolean,
    enable_guitar_easter_egg: raw.enable_guitar_easter_egg as boolean,
    section_order: order.length > 0 ? order : [...VALID_SECTIONS],
    section_visibility: visibilityRaw.length > 0 ? visibilityRaw : [...VALID_SECTIONS],
    default_project_view: parsed.data.default_project_view,
    recruiter_messages: parseRecruiterMessages(parsed.data.recruiter_messages),
    updated_at: new Date().toISOString(),
  };

  await writePreviewCookie({ theme: data });

  if (isSupabaseConfigured()) {
    try {
      const supabase = await writeClient();
      const { data: existing } = await supabase.from("site_theme_config").select("id").limit(1).single();
      if (!existing) {
        const { error } = await supabase.from("site_theme_config").insert(data);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_theme_config")
          .update(data)
          .eq("id", (existing as { id: string }).id);
        if (error) throw error;
      }
      revalidateAll();
      return { ok: true as const };
    } catch {
      // Fall through (e.g. new columns not migrated yet in Supabase).
    }
  }

  await mutateLocalStore((store) => {
    store.theme = { ...store.theme, ...data };
  });
  revalidateAll();
  return { ok: true as const, preview: true as const };
}

// ---------- GEET-SENTINEL: tracked keywords ----------

const keywordSchema = z.object({
  keyword: z.string().trim().min(2).max(120),
});

export async function addTrackedKeyword(formData: FormData): Promise<OkRemote | OkLocal | Err> {
  await requireAdmin();
  const parsed = keywordSchema.safeParse({ keyword: formData.get("keyword") });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid keyword." };
  }
  const keyword = parsed.data.keyword;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await writeClient();
      const { data: existing } = await supabase
        .from("seo_tracked_keywords")
        .select("id")
        .ilike("keyword", keyword)
        .limit(1)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase
          .from("seo_tracked_keywords")
          .update({ is_active: true })
          .eq("id", (existing as { id: string }).id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("seo_tracked_keywords").insert({ keyword });
        if (error) throw error;
      }
      revalidatePath("/admin/seo-bot");
      return { ok: true as const };
    } catch {
      // Fall through to the local store.
    }
  }

  await mutateLocalStore((store) => {
    const found = store.trackedKeywords.find(
      (k) => k.keyword.toLowerCase() === keyword.toLowerCase()
    );
    if (found) found.is_active = true;
    else {
      store.trackedKeywords.push({
        id: newLocalId("kw"),
        keyword,
        is_active: true,
        created_at: nowIso(),
      });
    }
  });
  revalidatePath("/admin/seo-bot");
  return { ok: true as const, preview: true as const };
}

export async function deleteTrackedKeyword(id: string): Promise<OkRemote | OkLocal | Err> {
  await requireAdmin();
  if (isSupabaseConfigured()) {
    try {
      const supabase = await writeClient();
      const { error } = await supabase.from("seo_tracked_keywords").delete().eq("id", id);
      if (error) throw error;
      revalidatePath("/admin/seo-bot");
      return { ok: true as const };
    } catch {
      // Fall through to the local store.
    }
  }
  await mutateLocalStore((store) => {
    store.trackedKeywords = store.trackedKeywords.filter((k) => k.id !== id);
  });
  revalidatePath("/admin/seo-bot");
  return { ok: true as const, preview: true as const };
}

// ---------- GEET-SENTINEL: bot config vault ----------

const botConfigSchema = z.object({
  // Empty string = keep the stored value (keys are never echoed back to the UI).
  serper_api_key: z.string().max(200).optional().or(z.literal("")),
  google_cse_api_key: z.string().max(200).optional().or(z.literal("")),
  google_cse_cx: z.string().max(200).optional().or(z.literal("")),
  clear_serper_key: z.string().optional().or(z.literal("")),
  clear_cse_keys: z.string().optional().or(z.literal("")),
  target_keywords: z.string().max(2000).optional().or(z.literal("")),
  auto_ping_indexnow: z.boolean().default(true),
});

function parseKeywordLines(raw: string | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[\n,]+/)) {
    const q = part.trim().slice(0, 120);
    if (q.length >= 2 && !seen.has(q.toLowerCase())) {
      seen.add(q.toLowerCase());
      out.push(q);
    }
  }
  return out.slice(0, 50);
}

async function writeBotConfigRow(patch: {
  serper_api_key?: string | null;
  google_cse_api_key?: string | null;
  google_cse_cx?: string | null;
  target_keywords?: string[];
  auto_ping_indexnow?: boolean;
}): Promise<void> {
  const { getBotConfig } = await import("@/lib/seo-bot");
  const current = await getBotConfig();
  const next = {
    serper_api_key: patch.serper_api_key !== undefined ? patch.serper_api_key : current.serper_api_key,
    google_cse_api_key: patch.google_cse_api_key !== undefined ? patch.google_cse_api_key : current.google_cse_api_key,
    google_cse_cx: patch.google_cse_cx !== undefined ? patch.google_cse_cx : current.google_cse_cx,
    cron_secret: current.cron_secret,
    indexnow_key: current.indexnow_key,
    target_keywords: patch.target_keywords !== undefined ? patch.target_keywords : current.target_keywords,
    auto_ping_indexnow: patch.auto_ping_indexnow !== undefined ? patch.auto_ping_indexnow : current.auto_ping_indexnow,
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = await writeClient();
      const { data } = await supabase
        .from("bot_config")
        .select("id")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data && (data as { id: string }).id) {
        const { error } = await supabase.from("bot_config").update(next).eq("id", (data as { id: string }).id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("bot_config").insert(next);
        if (error) throw error;
      }
    } catch {
      // Fall through to the local store — the vault must always persist.
    }
  }

  await mutateLocalStore((store) => {
    store.botConfig = { ...store.botConfig, ...next, id: store.botConfig?.id ?? current.id };
  });
}

export async function saveBotConfig(formData: FormData): Promise<OkRemote | OkLocal | Err> {
  await requireAdmin();
  const raw: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) raw[k] = v;
  raw.auto_ping_indexnow = formData.get("auto_ping_indexnow") === "on";
  const parsed = botConfigSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const p = parsed.data;
  const patch: {
    serper_api_key?: string | null;
    google_cse_api_key?: string | null;
    google_cse_cx?: string | null;
    target_keywords?: string[];
    auto_ping_indexnow?: boolean;
  } = {
    auto_ping_indexnow: p.auto_ping_indexnow,
  };
  if (p.clear_serper_key === "on") patch.serper_api_key = null;
  else if (p.serper_api_key && p.serper_api_key.trim()) patch.serper_api_key = p.serper_api_key.trim();
  if (p.clear_cse_keys === "on") {
    patch.google_cse_api_key = null;
    patch.google_cse_cx = null;
  } else {
    if (p.google_cse_api_key && p.google_cse_api_key.trim()) patch.google_cse_api_key = p.google_cse_api_key.trim();
    if (p.google_cse_cx && p.google_cse_cx.trim()) patch.google_cse_cx = p.google_cse_cx.trim();
  }
  if (p.target_keywords !== undefined) patch.target_keywords = parseKeywordLines(p.target_keywords);

  try {
    await writeBotConfigRow(patch);
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Save failed." };
  }
  revalidatePath("/admin/seo-bot");
  return { ok: true as const, preview: true as const };
}

/** Save the vault, then immediately run a live scan with the new keys. No restart. */
export async function saveBotConfigAndScan(formData: FormData) {
  const saved = await saveBotConfig(formData);
  if (!saved.ok) return saved;
  return runSerpScanNow();
}

// ---------- GEET-SENTINEL: manual SERP scan + crawler simulation ----------

export async function runSerpScanNow() {
  await requireAdmin();
  try {
    const { runSerpScan } = await import("@/lib/seo-bot");
    const { getTrackedKeywords } = await import("../data-fetcher");
    const queries = await getTrackedKeywords();
    const { results, provider, persisted, storage, telemetry, keySource } = await runSerpScan(queries);
    revalidatePath("/admin/seo-bot");
    return {
      ok: true as const,
      provider,
      persisted,
      storage,
      keySource,
      telemetry: {
        at: telemetry.at,
        endpoints: telemetry.endpoints.map((e) => ({
          label: e.label,
          ok: e.ok,
          status: e.status,
          latency_ms: e.latency_ms,
          error: e.error,
        })),
        githubOk: telemetry.github.ok,
        githubRepos: telemetry.github.public_repos,
        githubFollowers: telemetry.github.followers,
        indexnow: telemetry.indexnow,
      },
      scanned: results.length,
      summary: results.map((r) => ({
        query: r.query,
        domain_rank: r.domain_rank,
        simulated: r.simulated,
      })),
    };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Scan failed." };
  }
}

export async function runSerpScanAndRevalidate() {
  const res = await runSerpScanNow();
  if (!res.ok) return res;
  revalidateAll();
  return res;
}

const KNOWN_BOTS = [
  "Googlebot",
  "Bingbot",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
  "Applebot",
] as const;

export async function simulateCrawlerVisit(formData: FormData): Promise<OkRemote | OkLocal | Err> {
  await requireAdmin();
  const bot = String(formData.get("bot") ?? "Googlebot").slice(0, 80);
  const path = String(formData.get("path") ?? "/").slice(0, 300) || "/";
  if (!(KNOWN_BOTS as readonly string[]).includes(bot)) {
    return { ok: false as const, error: "Unknown bot. Pick one from the list." };
  }
  const { detectBot } = await import("@/lib/seo-bot");
  const match = detectBot(`${bot}/1.0 (GEET-SENTINEL simulation)`);
  const category = match?.category ?? "Search Engine";

  if (isSupabaseConfigured()) {
    try {
      const supabase = await writeClient();
      const { error } = await supabase.from("crawler_visit_logs").insert({
        bot_name: bot,
        bot_category: category,
        path_visited: path,
        user_agent: `${bot}/1.0 (GEET-SENTINEL simulation)`,
      });
      if (error) throw error;
      revalidatePath("/admin/seo-bot");
      return { ok: true as const };
    } catch {
      // Fall through to the local store.
    }
  }

  await mutateLocalStore((store) => {
    store.crawlerVisits.unshift({
      id: newLocalId("crawl"),
      bot_name: bot,
      bot_category: category,
      path_visited: path,
      user_agent: `${bot}/1.0 (GEET-SENTINEL simulation)`,
      visited_at: nowIso(),
    });
    store.crawlerVisits = store.crawlerVisits.slice(0, 200);
  });
  revalidatePath("/admin/seo-bot");
  return { ok: true as const, preview: true as const };
}
