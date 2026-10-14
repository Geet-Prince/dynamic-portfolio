# MASTER ARCHITECTURAL SPECIFICATION & AI CONTEXT (`CONTEXT.md`)
**Project:** Official Dynamic Portfolio & Headless CMS for **Prince Raj (`Geet-Prince`)**
**Production Domain:** `https://geetprince.me`
**Target Scores:** 100/100 Google Lighthouse (Performance, Accessibility, Best Practices, SEO) + #1 Ranking on Google Search & AI Answer Engines (ChatGPT Search, Perplexity, Claude, Gemini).

---

## 0. SYSTEM ROLE & DIRECTIVE FOR AI CODING AGENT (OPENCODE)
You are an elite Principal Full-Stack Architect, UI/UX Behavioural Psychologist, and Technical SEO/GEO Engineer. You are tasked with building a complete, dynamic, zero-code-update personal portfolio website and secure Admin CMS for **Prince Raj** (`Geet-Prince`) at `https://geetprince.me`.

**CRITICAL EXECUTION RULES:**
1. **No Placeholders or TODOs:** Write complete, production-ready implementations for all files, components, Server Actions, and API routes.
2. **Server-First Rendering (SSR/ISR):** Public pages MUST be React Server Components (RSC). Never use client-side `useEffect` or `fetch` to load portfolio content on public routes. Web crawlers and AI bots must receive 100% populated semantic HTML on the initial HTTP response.
3. **Resilient Fallback Architecture:** The database layer must gracefully fall back to `src/lib/seed-data.ts` if environment variables (`NEXT_PUBLIC_SUPABASE_URL`, etc.) are not yet configured, ensuring the application builds (`npm run build`) and runs (`npm run dev`) with zero errors out of the box.
4. **Zero-Code Dynamic Administration:** Every piece of text, metric, skill, project, certification, experience, resume link, and SEO keyword on the public website must be editable from the `/admin` dashboard without modifying a single line of code.

---

## 1. TECH STACK & DEPENDENCIES
- **Framework:** Next.js 15 (App Router, `src/` directory, TypeScript strict mode).
- **Database, Auth & Storage:** Supabase (`@supabase/supabase-js`, `@supabase/ssr`) with PostgreSQL, Row Level Security (RLS), and Supabase Storage buckets (`portfolio-media`, `resume-files`).
- **Validation & Forms:** `zod` for server-side schema validation.
- **Styling:** Tailwind CSS v3.4+ (`clsx`, `tailwind-merge`), custom Apple design tokens.
- **Motion & Micro-Interactions:** `framer-motion` (strictly using `LazyMotion` + `domAnimation` for minimal JS bundle overhead and 60fps GPU-accelerated transforms).
- **Icons:** `lucide-react`.
- **Typography:** `next/font/google` — `Inter` (primary UI/Display, tracking tight) and `JetBrains Mono` (code metrics, technical tags, live counters).

---

## 2. VISUAL DESIGN SYSTEM: APPLE AESTHETIC & SUBCONSCIOUS AD PSYCHOLOGY
The visual identity must emulate **Apple.com product pages**: calm, ultra-clean, authoritative, minimalist, and engineered with subconscious persuasion principles used in high-converting luxury advertising.

### 2.1 Color Psychology & Exact Design Tokens
Configure these tokens in `tailwind.config.ts` and `src/app/globals.css`:
- **Primary Canvas (`bg-canvas`):** `#FBFBFD` (Cupertino Alabaster — softer than `#FFFFFF`, eliminates retinal fatigue, evokes calm focus and cognitive trust).
- **Elevated Surface / Bento Card (`bg-surface`):** `#FFFFFF` (Pure crisp white with subtle ambient shadow `0 4px 24px -2px rgba(0, 0, 0, 0.03)` and hairline border `1px solid rgba(0, 0, 0, 0.06)`).
- **Glassmorphic Navigation (`bg-glass`):** `rgba(251, 251, 253, 0.78)` with `backdrop-filter: saturate(180%) blur(20px)`.
- **Primary Ink (`text-ink`):** `#1D1D1F` (Apple Obsidian — 17.4:1 contrast ratio against canvas, authoritative without pure-black harshness).
- **Secondary Ink (`text-muted`):** `#6E6E73` (Titanium Muted Grey — passes WCAG AA 4.8:1 contrast ratio for metadata and captions).
- **Subtle Label Ink (`text-subtle`):** `#86868B` (Used only for decorative micro-headers and non-essential dividers; ensure readable text uses `#6E6E73`).
- **Interactive Trust Accent (`accent-blue`):** `#0066CC` (Hover: `#0071E3` — universally triggers trust, reliability, and high-agency action).
- **Subconscious Vitality Signal (`accent-emerald`):** `#10B981` (Used solely for the soft-pulsing live indicator dot next to *"Available for Software & Data Science Roles"* and live project status badges).
- **Subtle Surface Highlight (`bg-pill`):** `#F5F5F7` (Apple Secondary Fill — used for tech stack pills, filter tabs, and subtle input backgrounds).

### 2.2 Subconscious Psychological Hooks (Ad-Tech Principles)
1. **The Halo Effect (First-50ms Impression):**
   - Maintain **35%+ open whitespace** (`#FBFBFD`).
   - Typography scale: Hero Headline uses `text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-[-0.03em] leading-[1.08] text-[#1D1D1F]`.
   - Section Headers use `text-2xl sm:text-4xl font-semibold tracking-[-0.02em]`.
2. **Cognitive Fluency (Apple Bento Grid Architecture):**
   - Human brains trust information that is effortless to process. Present Prince Raj's core identity in a **6-tile asymmetric Bento Grid** right below the Hero section so recruiters absorb his entire value proposition in one glance:
     - **Tile 1 (Span 2x2 - Core Identity & NIET Authority):** Deep summary of Prince Raj (`Geet-Prince`), B.Tech in CSE (Data Science) at **Noida Institute of Engineering and Technology (NIET), Greater Noida**, specializing in scalable backend architectures & data-driven systems.
     - **Tile 2 (Span 1x1 - Algorithmic Proof):** High-contrast metric card displaying **`270+`** Data Structures & Algorithms problems solved across LeetCode, GeeksforGeeks, and CodeChef, with a direct link to his analytics platform `progex.geetprince.me`.
     - **Tile 3 (Span 1x1 - Cloud & Engineering Authority):** Official **AWS Certified Cloud Practitioner** badge highlight + Linux (`Ubuntu` / `Linux Mint`) workflow mastery.
     - **Tile 4 (Span 2x1 - Technical Arsenal Marquee/Grid):** Clean categorized pills for `Core Java`, `Spring Boot`, `Python`, `Flask`, `React`, `JavaScript`, `SQL`, `REST APIs`, `NumPy`, `Pandas`, `Matplotlib`.
     - **Tile 5 (Span 1x1 - Live Ecosystem Status):** Real-time status badge showing `progex.geetprince.me` online & monitored, linking directly to GitHub `@Geet-Prince`.
     - **Tile 6 (Span 1x1 - Direct Conversion Trigger):** One-click "Download Resume (PDF)" and "Copy Email / Schedule Call" action card with subtle micro-feedback.
3. **Von Restorff Isolation Effect:**
   - Because 95% of the interface uses calm achromatic tones (`#FBFBFD`, `#FFFFFF`, `#1D1D1F`, `#6E6E73`), the `#0066CC` primary CTA button and `#10B981` live availability pulse command immediate visual attention without feeling aggressive or salesy.
4. **Apple Motion Curve Physics:**
   - All transitions and scroll reveals MUST use `ease: [0.16, 1, 0.3, 1]` and `duration: 0.55`.
   - Hovering over any Bento card or Project card triggers `translate-y-[-2px]`, border darkening to `rgba(0,0,0,0.12)`, and shadow expansion to `0 12px 32px -4px rgba(0,0,0,0.06)`.

---

## 3. DIRECTORY STRUCTURE
Generate the following exact project structure:
```text
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                  # Main SSR/ISR Portfolio Page (Hero, Bento, Projects, Experience, Certs, Contact)
│   │   ├── projects/
│   │   │   ├── page.tsx              # Full filterable project archive (SSR)
│   │   │   └── [slug]/
│   │   │       └── page.tsx          # Individual Project Case Study page with dynamic SEO & Schema
│   ├── projects/
│   │   └── [slug]/
│   │       └── llms.txt/
│   │           └── route.ts      # Per-project Markdown endpoint for AI agents
│   ├── admin/
│   │   ├── login/
│   │   │   └── page.tsx              # Minimalist Apple-style Admin Login
│   │   ├── layout.tsx                # Protected Admin Shell with sidebar & "Purge Cache / View Live" topbar
│   │   ├── page.tsx                  # Overview Dashboard + Profile/Hero/SEO Editor + DSA Counter
│   │   ├── projects/
│   │   │   └── page.tsx              # Full CRUD Project Manager (Add/Edit/Delete/Reorder/Featured Toggle)
│   │   ├── skills/
│   │   │   └── page.tsx              # Full CRUD Skills Manager by Category
│   │   ├── experience/
│   │   │   └── page.tsx              # Full CRUD Education, Experience, Hackathons & Certifications Manager
│   │   ├── faqs/
│   │   │   └── page.tsx              # AEO FAQ / Entity Dossier Manager (CRUD + reorder + visibility)
│   │   └── messages/
│   │       └── page.tsx              # Contact Form Submissions Inbox
│   ├── api/
│   │   ├── revalidate/
│   │   │   └── route.ts              # Webhook / Manual On-Demand ISR Cache Revalidation endpoint
│   │   ├── crawler-log/
│   │   │   └── route.ts              # Bot-visit ingest endpoint (fire-and-forget from middleware)
│   │   ├── cron/
│   │   │   └── seo-bot/
│   │   │       └── route.ts          # GEET-SENTINEL daily SERP scan (Vercel cron 0 18 * * * UTC)
│   │   └── contact/
│   │       └── route.ts              # Public Contact Submission endpoint with rate-limit/honeypot
│   ├── admin/                        # (route group segment: see §3 structure below)
│   ├── llms.txt/
│   │   └── route.ts                  # AI Search / LLM Crawler Markdown Summary Endpoint
│   ├── llms-full.txt/
│   │   └── route.ts                  # Comprehensive AI Crawler Knowledge Dump (Full Projects + Bio + NIET)
│   ├── opengraph-image.tsx           # Dynamic Apple-style OG Image generator (1200x630)
│   ├── robots.ts                     # Dynamic robots.txt whitelisting Googlebot + AI Search Bots
│   ├── sitemap.ts                    # Dynamic XML Sitemap including all projects & llms.txt
│   ├── layout.tsx                    # Root Layout with Inter/JetBrains fonts, JSON-LD Graph, Metadata
│   └── globals.css                   # Tailwind directives + Apple smooth scrolling & scrollbar styling
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx                # Sticky frosted-glass header with subtle section indicators + ⌘K pill
│   │   ├── Footer.tsx                # Semantic footer with cross-links to progex.geetprince.me & GitHub
│   │   └── CommandPalette.tsx        # ⌘K/Ctrl+K Apple Spotlight palette (lazy-mounted, zero Lighthouse cost)
│   ├── home/
│   │   ├── HeroSection.tsx           # Server-rendered LCP-optimized Hero (apple-centered | split-executive | bento-first)
│   │   ├── BentoIdentityGrid.tsx     # 7-tile psychological Bento Grid (incl. off-screen guitar/CP touch tile)
│   │   ├── FeaturedProjects.tsx      # Executive View / Architecture X-Ray segmented toggle
│   │   ├── RecruiterPill.tsx         # ?for=Company personalized welcome pill (server-rendered, sanitized)
│   │   ├── SkillsMatrix.tsx          # Categorized engineering & data science capabilities
│   │   ├── TimelineSection.tsx       # NIET Education, Hackathons, Programs & AWS Certification
│   │   └── ContactSection.tsx        # Zero-friction contact form + direct social links
│   ├── admin/
│   │   ├── ProfileForm.tsx           # No-code form for updating bio, headline, DSA count, resume URL, SEO tags
│   │   ├── ProjectModal.tsx          # Rich CRUD modal/drawer for projects + image upload
│   │   ├── SkillManager.tsx          # Interactive skill chip editor
│   │   └── CredentialManager.tsx     # Editor for Education, Certifications, and Hackathons
│   │   ├── FaqManager.tsx            # CRUD editor for AEO FAQs (question, answer, order, visibility)
│   └── seo/
│       └── JsonLd.tsx                # Rich Schema.org @graph injector (Person, CollegeOrUniversity, WebSite, ItemList)
│   │   ├── AeoEntityDossier.tsx      # Server-rendered collapsible FAQ + Entity Fact Table (AEO/GEO)
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser Supabase client
│   │   ├── server.ts                 # Server Component & Server Action Supabase client
│   │   └── actions.ts                # All CRUD Server Actions with Zod validation & revalidatePath()
│   ├── types.ts                      # Strict TypeScript interfaces for all entities
│   ├── seed-data.ts                  # Complete fallback data for Prince Raj (Geet-Prince)
│   ├── data-fetcher.ts               # Unified data layer (queries Supabase with automatic fallback to seed-data)
│   └── utils.ts                      # cn() helper and formatting utilities
│   │   ├── seo-bot.ts                    # GEET-SENTINEL core: bot detection, SERP scan, health audit, simulation fallback
│   └── middleware.ts                     # Protects /admin routes and injects security/SEO headers

---

## 4. SIGNATURE SYSTEM I — SUBTLE APPLE-GRADE CREATIVE FEATURES (PUBLIC UI)

### 4.1 ⌘K Spotlight Command Palette (`src/components/layout/CommandPalette.tsx`)
- Lazy-mounted client island: renders nothing until opened, so Lighthouse JS cost is ~0 until first use.
- Opens via `⌘K` / `Ctrl+K` keyboard shortcut or the subtle `⌘K` pill in the Navbar (dispatches a `command-palette-open` window event — no global state, no provider).
- Zero-dependency fuzzy filter over a server-computed command list (props, never `useEffect` fetching): jump to sections (`#about`, `#projects`, `#skills`, `#journey`, `#contact`), open `progex.geetprince.me`, download resume, copy email, filter archive by tech stack (`Java`, `Spring Boot`, `Python`, `Flask`, `React`, `Data Science` → navigates to `/projects?tech=<stack>`), toggle Architecture X-Ray view (dispatches `xray-toggle` event).
- Fully keyboard navigable (↑↓ + Enter + Esc), `role="dialog"` + `aria-modal`, `aria-activedescendant` listbox.

### 4.2 Executive View vs. Architecture X-Ray View (`FeaturedProjects.tsx`)
- Apple segmented control (`Executive View | Architecture X-Ray`) above the project grid; state lives in the client island, defaults to Executive.
- Executive View: impact-first cards (tagline, metrics badge, live demo, case study).
- X-Ray View: per-project system anatomy — `architecture_highlights` rendered as architecture / data-flow / API-design checklist, full tech stack, bottleneck framing; also toggled remotely by the Command Palette via the `xray-toggle` window event.
- Archive page (`/projects`) additionally supports `?tech=<stack>` server-side filtering.

### 4.3 Personal Touch Tile (Bento Grid, 7th tile)
- Grid math stays symmetric: Tile 1 (2×2) + Tiles 2–4 fill rows 1–2; Tiles 5–6 + the new 2-col personal tile complete row 3 (2 + 2 = 4 columns).
- Tasteful minimalist tile: acoustic guitar + competitive-programming micro-copy ("Off-screen: acoustic guitar & late-night CodeChef grinds").
- Click (keyboard accessible, `aria-pressed`) synthesizes a warm acoustic-style G-major strum with the Web Audio API (lazy `AudioContext`, triangle oscillators + lowpass + exponential decay). Zero audio assets, zero network weight, user-gated so autoplay policies and Lighthouse are unaffected.

---

## 5. SIGNATURE SYSTEM II — DYNAMIC DESIGN STUDIO (`/admin/design` + `site_theme_config`)

### 5.1 Theme engine (zero-FOUC, Lighthouse-safe)
- All Tailwind color tokens resolve to CSS variables (`canvas: var(--canvas)`, `ink: var(--ink)`, `accent.blue: var(--accent-blue)` …); card radius (`--card-radius`) and glass blur (`--glass-blur`) are CSS variables consumed by `.bento-card` / `.glass-bar` in `globals.css`.
- `src/app/layout.tsx` fetches the active theme on the server and inlines `<style>:root{…}</style>` + `data-theme` on `<html>` — first paint already carries the theme, no flash, no client JS.
- Presets: `cupertino-light` (Cupertino Daylight `#FBFBFD`), `sequoia-dark` (Sequoia Midnight `#09090B` + dark-surface overrides via `[data-theme]` selectors), `editorial-paper` (Warm Editorial Paper `#F7F5F0`), `nordic-slate` (Nordic Data Slate `#F1F5F9`). Accent color is per-theme overridable from the studio.
- `site_theme_config` (single-row table, see `@schema.sql` §6): `theme_preset`, `hero_layout`, `card_radius`, `glass_blur`, `accent_color`, `enable_command_palette`, `enable_architecture_xray`, `enable_guitar_easter_egg`, `section_order TEXT[]`, `section_visibility TEXT[]`, `default_project_view`, `recruiter_messages JSONB`. Offline preview persists to the `portfolio-preview` cookie so the studio works with zero env config.

### 5.2 Hero Layout Switcher + Section Ordering
- `hero_layout`: `apple-centered` (default Halo-effect centered hero), `split-executive` (two-column with sticky at-a-glance meta rail), `bento-first` (compact hero strip; Bento grid promoted above the fold headline block).
- `section_order TEXT[]` default `{hero,bento,projects,skills,timeline,aeo,contact}`; `(public)/page.tsx` renders sections strictly in the stored order, skipping any key absent from `section_visibility` (the Visibility Engine).

### 5.3 Recruiter Personalized Link Generator
- Studio generates `https://geetprince.me/?for=Company` links; the home page sanitizes `searchParams.for` (`[A-Za-z0-9 .&-]{1,40}`) and server-renders a subtle high-trust pill: *"Welcome, {Company} hiring team — here's Prince in 60 seconds ↓"*. Unknown/empty values render nothing. No tracking, no cookies, crawler-safe (pill is supplementary, H1 unchanged). Per-company custom messages stored in `recruiter_messages` override the default pill text.

---

## 6. SIGNATURE SYSTEM III — GEET-SENTINEL SEO & AI CRAWLER INTELLIGENCE (`/admin/seo-bot`)

### 6.1 Daily SERP rank bot (`src/app/api/cron/seo-bot/route.ts`, `src/lib/seo-bot.ts`)
- Vercel cron `0 18 * * *` UTC (see `vercel.json`) hits `GET /api/cron/seo-bot` with `Authorization: Bearer <CRON_SECRET>` (Vercel) or `?secret=<REVALIDATE_SECRET>` fallback.
- Target queries (Google India, `gl=in`): `"geetprince"`, `"Prince Raj"`, `"NIET Prince Raj"`, `"Prince Raj Greater Noida"`, `"Prince Raj Data Science"`.
- Provider chain: `SERPER_API_KEY` (serper.dev) → `GOOGLE_CUSTOM_SEARCH_KEY` + `GOOGLE_SEARCH_ENGINE_ID` → deterministic simulated diagnostic fallback (date-seeded pseudo-positions, flagged `simulated: true`, never presented as real data).
- Per query it records `domain_rank` (geetprince.me), `subdomain_rank` (progex.geetprince.me), `github_rank` (github.com/Geet-Prince) + `top_3_competitors` JSONB into `seo_serp_logs` (see `@schema.sql` §7). Manual runs via the **"Run Live SERP Scan Now"** button call the `runSerpScanNow` Server Action (same `runSerpScan()` core, admin-cookie authed).

### 6.2 Real-time bot crawler trap (`src/middleware.ts` + `src/app/api/crawler-log/route.ts`)
- Middleware matches `user-agent` against `Googlebot`, `Bingbot`, `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `anthropic-ai`, `Cohere-ai` (+ generic `bot|crawl|spider|slurp` fallback) on public routes and `/llms.txt`.
- On match it fires a `keepalive` POST to `/api/crawler-log/route.ts` **without awaiting** (zero response-latency impact); the route inserts (`bot_name`, `bot_category` ∈ {Search Engine, AI Answer Engine, Social Preview}, `path_visited`, `user_agent`, `visited_at`) into `crawler_visit_logs` (see `@schema.sql` §8) via the service-role key. Humans never trigger it.

### 6.3 Command Center (`/admin/seo-bot/page.tsx`)
- Keyword position cards + inline-SVG trend sparklines (no chart library) for `"geetprince"`, `"Prince Raj"`, `"NIET Prince Raj"`.
- Live feed of Googlebot & AI bot visits to `/` and `/llms.txt`.
- Automated On-Page SEO Health Audit checklist computed from live site data (title/H1/description lengths, canonical, OG, JSON-LD, sitemap, llms.txt endpoints, image alt, mobile viewport).
- All tables degrade to labeled simulated/preview data when Supabase is unconfigured, so `npm run build` stays green offline.