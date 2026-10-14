import { promises as fs } from "node:fs";
import path from "node:path";
import {
  seedCredentials,
  seedFaqs,
  seedProfile,
  seedProjects,
  seedSkills,
  seedTheme,
} from "./seed-data";
import type {
  AeoFaq,
  BotConfig,
  ContactMessage,
  CrawlerVisit,
  Credential,
  ProfileConfig,
  Project,
  SerpLog,
  Skill,
  ThemeConfig,
  TrackedKeyword,
} from "./types";

// ---------------------------------------------------------------------------
// Dual-mode persistent data engine (server-only — never import from client).
//
// When Supabase is unreachable or unconfigured, every admin mutation is
// applied here: an in-memory cache layered over data/portfolio-store.json,
// auto-initialized from seed-data.ts. Reads overlay the same store, so the
// public frontend updates immediately with or without .env.local.
// ---------------------------------------------------------------------------

export interface LocalStore {
  profile: ProfileConfig;
  projects: Project[];
  skills: Skill[];
  credentials: Credential[];
  theme: ThemeConfig;
  faqs: AeoFaq[];
  messages: ContactMessage[];
  serpLogs: SerpLog[];
  crawlerVisits: CrawlerVisit[];
  trackedKeywords: TrackedKeyword[];
  botConfig: BotConfig;
}

const STORE_PATH = path.join(process.cwd(), "data", "portfolio-store.json");

let cache: LocalStore | null = null;

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function freshStore(): LocalStore {
  return {
    profile: clone(seedProfile),
    projects: clone(seedProjects),
    skills: clone(seedSkills),
    credentials: clone(seedCredentials),
    theme: clone(seedTheme),
    faqs: clone(seedFaqs),
    messages: [],
    serpLogs: [],
    crawlerVisits: [],
    trackedKeywords: [],
    botConfig: freshBotConfig(),
  };
}

/** Default vault contents. Secrets are generated per install, never seeded. */
export function freshBotConfig(): BotConfig {
  return {
    id: newLocalId("botcfg"),
    serper_api_key: null,
    google_cse_api_key: null,
    google_cse_cx: null,
    cron_secret: makeSecret(32),
    indexnow_key: makeSecret(24),
    target_keywords: [],
    auto_ping_indexnow: true,
    last_telemetry: null,
    updated_at: nowIso(),
  };
}

function makeSecret(n: number): string {
  try {
    const bytes = crypto.getRandomValues(new Uint8Array(n));
    return Array.from(bytes, (b) => "0123456789abcdef"[b % 16]).join("");
  } catch {
    return `${Date.now().toString(16)}${Math.floor(Math.random() * 1e12).toString(16)}`;
  }
}

export async function getLocalStore(): Promise<LocalStore> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<LocalStore>;
    const fresh = freshStore();
    cache = { ...fresh, ...parsed };
  } catch {
    cache = freshStore();
  }
  // Backfill for store files written before a field existed.
  if (!cache.botConfig || typeof cache.botConfig !== "object") {
    cache.botConfig = freshBotConfig();
  }
  if (!Array.isArray(cache.botConfig.target_keywords)) {
    cache.botConfig.target_keywords = [];
  }
  return cache;
}

async function persist(store: LocalStore): Promise<void> {
  try {
    await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
    const tmp = `${STORE_PATH}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf-8");
    await fs.rename(tmp, STORE_PATH);
  } catch {
    // Read-only filesystem (e.g. serverless): the in-memory cache still
    // serves this process, so the frontend keeps updating for the session.
  }
}

/** Apply a mutation to the local store and persist it (best-effort file write). */
export async function mutateLocalStore(
  mut: (store: LocalStore) => void
): Promise<LocalStore> {
  const store = await getLocalStore();
  mut(store);
  await persist(store);
  return store;
}

export function sortByOrder<T extends { display_order: number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.display_order - b.display_order);
}

export function newLocalId(prefix = "local"): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}
