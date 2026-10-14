export interface ProfileConfig {
  id: string;
  full_name: string;
  handle: string;
  headline: string;
  subheadline: string;
  institution: string;
  institution_short: string;
  degree: string;
  location: string;
  bio_markdown: string;
  email: string;
  avatar_url: string | null;
  resume_url: string | null;
  github_url: string;
  linkedin_url: string | null;
  leetcode_url: string | null;
  huggingface_url: string | null;
  progex_url: string;
  dsa_solved_count: number;
  availability_status: boolean;
  availability_text: string;
  seo_keywords: string[];
  updated_at: string;
}

export type ProjectCategory =
  | "Full-Stack"
  | "Data Science"
  | "Developer Tools"
  | "Cloud";
export type SkillCategory =
  | "Languages & Core"
  | "Backend & Web Frameworks"
  | "Data Science & Analytics"
  | "Cloud, DevOps & OS";
export type CredentialType =
  | "Education"
  | "Certification"
  | "Hackathon"
  | "Program";

export interface Project {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  description_markdown: string;
  architecture_highlights: string[];
  live_url: string | null;
  github_url: string | null;
  thumbnail_url: string | null;
  tech_stack: string[];
  category: string;
  metrics_badge: string | null;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency: number;
  is_highlighted: boolean;
  display_order: number;
}

export interface Credential {
  id: string;
  title: string;
  organization: string;
  location: string | null;
  type: string;
  date_label: string;
  description: string;
  credential_url: string | null;
  badge_text: string | null;
  display_order: number;
}

export interface ContactMessage {
  id: string;
  sender_name: string;
  sender_email: string;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface SiteData {
  profile: ProfileConfig;
  projects: Project[];
  skills: Skill[];
  credentials: Credential[];
  theme: ThemeConfig;
  faqs: AeoFaq[];
}

// ---------- AEO Entity Dossier ----------

export interface AeoFaq {
  id: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrackedKeyword {
  id: string;
  keyword: string;
  is_active: boolean;
  created_at: string;
}

// ---------- Signature System II: Dynamic Design Studio ----------

export type ThemePreset =
  | "cupertino-light"
  | "sequoia-dark"
  | "editorial-paper"
  | "nordic-slate";

export type HeroLayout = "apple-centered" | "split-executive" | "bento-first";

export type SectionKey =
  | "hero"
  | "bento"
  | "projects"
  | "skills"
  | "timeline"
  | "aeo"
  | "contact";

export interface ThemeConfig {
  id: string;
  theme_preset: string;
  hero_layout: string;
  card_radius: string;
  glass_blur: string;
  accent_color: string;
  enable_command_palette: boolean;
  enable_architecture_xray: boolean;
  enable_guitar_easter_egg: boolean;
  section_order: string[];
  section_visibility: string[];
  default_project_view: string;
  recruiter_messages: Record<string, string>;
  updated_at: string;
}

// ---------- Signature System III: GEET-SENTINEL ----------

export interface SerpLog {
  id: string;
  keyword: string;
  domain_rank: number | null;
  subdomain_rank: number | null;
  github_rank: number | null;
  top_3_competitors: Array<{
    position: number;
    title: string;
    link: string;
    snippet?: string;
  }>;
  search_engine: string;
  checked_at: string;
  simulated?: boolean;
}

export interface CrawlerVisit {
  id: string;
  bot_name: string;
  bot_category: string;
  path_visited: string;
  user_agent: string | null;
  visited_at: string;
}

// ---------- GEET-SENTINEL bot configuration vault ----------

export interface BotConfig {
  id: string;
  serper_api_key: string | null;
  google_cse_api_key: string | null;
  google_cse_cx: string | null;
  cron_secret: string;
  indexnow_key: string;
  target_keywords: string[];
  auto_ping_indexnow: boolean;
  last_telemetry: ScanTelemetry | null;
  updated_at: string;
}

export interface EndpointCheck {
  url: string;
  label: string;
  ok: boolean;
  status: number | null;
  latency_ms: number | null;
  error: string | null;
}

export interface GitHubStats {
  ok: boolean;
  public_repos: number | null;
  followers: number | null;
  following: number | null;
  updated_at: string | null;
  error: string | null;
}

export interface IndexNowResult {
  attempted: boolean;
  ok: boolean;
  status: number | null;
  skipped_reason: string | null;
}

export interface ScanTelemetry {
  at: string;
  provider: "serper" | "google-cse" | "simulated";
  key_source: "env" | "vault" | "none";
  endpoints: EndpointCheck[];
  github: GitHubStats;
  indexnow: IndexNowResult;
}
