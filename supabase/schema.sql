-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILE CONFIGURATION TABLE (Single Row Settings & Identity)
CREATE TABLE IF NOT EXISTS public.profile_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL DEFAULT 'Prince Raj',
  handle TEXT NOT NULL DEFAULT 'Geet-Prince',
  headline TEXT NOT NULL DEFAULT 'Software Engineer & Data Science Specialist.',
  subheadline TEXT NOT NULL DEFAULT 'Building high-performance full-stack systems, competitive programming analytics, and data-driven applications. B.Tech CSE (Data Science) at NIET Greater Noida.',
  institution TEXT NOT NULL DEFAULT 'Noida Institute of Engineering and Technology (NIET), Greater Noida',
  institution_short TEXT NOT NULL DEFAULT 'NIET Greater Noida',
  degree TEXT NOT NULL DEFAULT 'Bachelor of Technology (B.Tech) in Computer Science and Engineering (Data Science)',
  location TEXT NOT NULL DEFAULT 'Greater Noida, Uttar Pradesh, India',
  bio_markdown TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT 'contact@geetprince.me',
  avatar_url TEXT DEFAULT '/avatar.jpg',
  resume_url TEXT DEFAULT '/Prince_Raj_Resume.pdf',
  github_url TEXT NOT NULL DEFAULT 'https://github.com/Geet-Prince',
  linkedin_url TEXT DEFAULT 'https://linkedin.com/in/geet-prince',
  leetcode_url TEXT DEFAULT 'https://leetcode.com/u/Geet-Prince/',
  huggingface_url TEXT DEFAULT 'https://huggingface.co/Geet-Prince',
  progex_url TEXT NOT NULL DEFAULT 'https://progex.geetprince.me',
  dsa_solved_count INTEGER NOT NULL DEFAULT 270,
  availability_status BOOLEAN NOT NULL DEFAULT true,
  availability_text TEXT NOT NULL DEFAULT 'Available for Software Engineering & Data Science Roles',
  seo_keywords TEXT[] NOT NULL DEFAULT ARRAY[
    'Prince Raj', 'Geet-Prince', 'geetprince', 'NIET Prince Raj',
    'Prince Raj NIET Greater Noida', 'Noida Institute of Engineering and Technology Prince Raj',
    'Prince Raj Data Science', 'Prince Raj Software Engineer', 'Progex Prince Raj'
  ],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tagline TEXT NOT NULL,
  description_markdown TEXT NOT NULL,
  architecture_highlights TEXT[] DEFAULT '{}',
  live_url TEXT,
  github_url TEXT,
  thumbnail_url TEXT,
  tech_stack TEXT[] NOT NULL DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'Full-Stack', -- 'Full-Stack' | 'Data Science' | 'Developer Tools' | 'Cloud'
  metrics_badge TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SKILLS TABLE
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Languages & Core' | 'Backend & Web Frameworks' | 'Data Science & Analytics' | 'Cloud, DevOps & OS'
  proficiency INTEGER NOT NULL DEFAULT 90,
  is_highlighted BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0
);

-- 4. CREDENTIALS, EDUCATION, HACKATHONS & CERTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  location TEXT,
  type TEXT NOT NULL, -- 'Education' | 'Certification' | 'Hackathon' | 'Program'
  date_label TEXT NOT NULL,
  description TEXT NOT NULL,
  credential_url TEXT,
  badge_text TEXT,
  display_order INTEGER NOT NULL DEFAULT 0
);

-- 5. CONTACT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profile_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Public Read Policies (Anyone & Any Search Crawler can read portfolio data)
CREATE POLICY "Public Read Profile" ON public.profile_config FOR SELECT USING (true);
CREATE POLICY "Public Read Projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Public Read Skills" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Public Read Credentials" ON public.credentials FOR SELECT USING (true);

-- Public Insert Policy for Contact Messages
CREATE POLICY "Public Insert Contact" ON public.contact_messages FOR INSERT WITH CHECK (true);

-- Authenticated Admin Full Access Policies
CREATE POLICY "Admin All Profile" ON public.profile_config FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin All Projects" ON public.projects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin All Skills" ON public.skills FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin All Credentials" ON public.credentials FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin All Contact" ON public.contact_messages FOR ALL USING (auth.role() = 'authenticated');

-- 6. DYNAMIC DESIGN STUDIO CONFIGURATION (Chameleon Theme Engine)
CREATE TABLE IF NOT EXISTS public.site_theme_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  theme_preset TEXT NOT NULL DEFAULT 'cupertino-light', -- 'cupertino-light' | 'sequoia-dark' | 'editorial-paper' | 'nordic-slate'
  hero_layout TEXT NOT NULL DEFAULT 'apple-centered',   -- 'apple-centered' | 'split-executive' | 'bento-first'
  card_radius TEXT NOT NULL DEFAULT '24px',             -- '8px' | '16px' | '24px' | '32px'
  glass_blur TEXT NOT NULL DEFAULT '20px',              -- '8px'–'32px' recommended
  accent_color TEXT NOT NULL DEFAULT '#0066CC',
  enable_command_palette BOOLEAN NOT NULL DEFAULT true,
  enable_architecture_xray BOOLEAN NOT NULL DEFAULT true,
  enable_guitar_easter_egg BOOLEAN NOT NULL DEFAULT true,
  section_order TEXT[] NOT NULL DEFAULT ARRAY['hero', 'bento', 'projects', 'skills', 'timeline', 'aeo', 'contact'],
  section_visibility TEXT[] NOT NULL DEFAULT ARRAY['hero', 'bento', 'projects', 'skills', 'timeline', 'aeo', 'contact'],
  default_project_view TEXT NOT NULL DEFAULT 'executive', -- 'executive' | 'xray'
  recruiter_messages JSONB NOT NULL DEFAULT '{}',       -- {"google": "Custom welcome message…"}
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. DAILY SEO BOT SERP RANKINGS LOG
CREATE TABLE IF NOT EXISTS public.seo_serp_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword TEXT NOT NULL,                 -- e.g. 'geetprince', 'Prince Raj', 'NIET Prince Raj'
  domain_rank INTEGER,                   -- Rank of geetprince.me (1-100, NULL if not in top 100)
  subdomain_rank INTEGER,                -- Rank of progex.geetprince.me
  github_rank INTEGER,                   -- Rank of github.com/Geet-Prince
  top_3_competitors JSONB DEFAULT '[]',  -- Stores [{position, title, link, snippet}]
  search_engine TEXT NOT NULL DEFAULT 'google-in',
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. REAL-TIME WEB & AI CRAWLER TELEMETRY LOG
CREATE TABLE IF NOT EXISTS public.crawler_visit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_name TEXT NOT NULL,                -- 'Googlebot' | 'GPTBot' | 'PerplexityBot' | 'ClaudeBot' | 'Bingbot'
  bot_category TEXT NOT NULL,            -- 'Search Engine' | 'AI Answer Engine' | 'Social Preview'
  path_visited TEXT NOT NULL,            -- '/', '/llms.txt', '/projects/progex'
  user_agent TEXT,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. AEO ENTITY DOSSIER / FAQ KNOWLEDGE BASE (drives AeoEntityDossier + FAQPage JSON-LD + llms-full.txt)
CREATE TABLE IF NOT EXISTS public.aeo_faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. GEET-SENTINEL CUSTOM TRACKED KEYWORDS (extends the 5 default TARGET_QUERIES)
CREATE TABLE IF NOT EXISTS public.seo_tracked_keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. GEET-SENTINEL BOT CONFIG VAULT (single row: API keys, secrets, targets).
-- Holds secrets: NO public read policy — server reads/writes via service role.
CREATE TABLE IF NOT EXISTS public.bot_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  serper_api_key TEXT,
  google_cse_api_key TEXT,
  google_cse_cx TEXT,
  cron_secret TEXT NOT NULL DEFAULT '',
  indexnow_key TEXT NOT NULL DEFAULT '',
  target_keywords TEXT[] NOT NULL DEFAULT '{}',
  auto_ping_indexnow BOOLEAN NOT NULL DEFAULT true,
  last_telemetry JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.site_theme_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_serp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawler_visit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aeo_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_tracked_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Theme" ON public.site_theme_config FOR SELECT USING (true);
CREATE POLICY "Admin All Theme" ON public.site_theme_config FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Read SEO Logs" ON public.seo_serp_logs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Public Insert Crawler Logs" ON public.crawler_visit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin Read Crawler Logs" ON public.crawler_visit_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Public Read FAQs" ON public.aeo_faqs FOR SELECT USING (is_active = true);
CREATE POLICY "Admin All FAQs" ON public.aeo_faqs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Public Read Tracked Keywords" ON public.seo_tracked_keywords FOR SELECT USING (is_active = true);
CREATE POLICY "Admin All Tracked Keywords" ON public.seo_tracked_keywords FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin All Bot Config" ON public.bot_config FOR ALL USING (auth.role() = 'authenticated');