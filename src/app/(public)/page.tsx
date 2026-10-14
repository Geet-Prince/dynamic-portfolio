import type { Metadata } from "next";
import { Fragment } from "react";
import { getSiteData } from "@/lib/data-fetcher";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PaletteIsland } from "@/components/layout/PaletteIsland";
import { HeroSection, type HeroLayoutKind } from "@/components/home/HeroSection";
import { BentoIdentityGrid } from "@/components/home/BentoIdentityGrid";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { SkillsMatrix } from "@/components/home/SkillsMatrix";
import { TimelineSection } from "@/components/home/TimelineSection";
import { AeoEntityDossier } from "@/components/home/AeoEntityDossier";
import { ContactSection } from "@/components/home/ContactSection";
import { RecruiterPill, sanitizeCompany } from "@/components/home/RecruiterPill";
import { llmsAlternateTypes, projectMatchesTech } from "@/lib/utils";
import type { SectionKey } from "@/lib/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Prince Raj (Geet-Prince) — Software Engineer & Data Science | NIET Greater Noida",
  description:
    "Prince Raj (Geet-Prince), B.Tech CSE (Data Science) at NIET Greater Noida. Scalable backends, data-driven systems, Progex analytics (progex.geetprince.me). 270+ DSA solved. AWS Certified Cloud Practitioner.",
  // NOTE: child `alternates` replaces the root object — repeat the LLM types.
  alternates: { canonical: "https://geetprince.me", types: { ...llmsAlternateTypes } },
};

const DEFAULT_ORDER: SectionKey[] = ["hero", "bento", "projects", "skills", "timeline", "aeo", "contact"];
const HERO_LAYOUTS: HeroLayoutKind[] = ["apple-centered", "split-executive", "bento-first"];

// Canonical ⌘K tech filters (kept only if they match ≥1 project).
const CANONICAL_TECHS = ["Java", "Spring Boot", "Python", "Flask", "React", "Data Science"];

// Architectural index coordinates for the blueprint grid (hero carries its
// own telemetry strip, so it needs no index bar).
const INDEX_LABELS: Partial<Record<SectionKey, string>> = {
  bento: "[ 01 // IDENTITY & TELEMETRY ]",
  projects: "[ 02 // SELECTED ARCHITECTURE ]",
  skills: "[ 03 // CAPABILITY MATRIX ]",
  timeline: "[ 04 // ACADEMIC & CREDENTIAL LEDGER ]",
  aeo: "[ 05 // ENTITY DOSSIER (AEO) ]",
  contact: "[ 06 // DIRECT TRANSMISSION ]",
};

/**
 * Horizontal section divider with crosshair markers where it meets the
 * vertical rails, plus the section's monospace index coordinate.
 */
function SectionRule({ index }: { index: string }) {
  return (
    <div className="blueprint-rail" aria-hidden="true">
      <span className="crosshair crosshair-left" />
      <span className="crosshair crosshair-right" />
      <div className="border-b border-[var(--border-subtle)]" />
      <p className="px-5 pt-3 font-mono text-[11px] tracking-[0.18em] text-[var(--text-muted)] opacity-40 select-none">
        {index}
      </p>
    </div>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ for?: string }>;
}) {
  const { for: forParam } = await searchParams;
  const company = sanitizeCompany(forParam);
  const { profile, projects, skills, credentials, theme, faqs } = await getSiteData();

  const heroLayout: HeroLayoutKind = HERO_LAYOUTS.includes(theme.hero_layout as HeroLayoutKind)
    ? (theme.hero_layout as HeroLayoutKind)
    : "apple-centered";

  // Section Ordering + Visibility Engine (both driven by /admin/design).
  const stored = Array.isArray(theme.section_order) ? theme.section_order : [];
  const validStored = stored.filter((s): s is SectionKey =>
    (DEFAULT_ORDER as string[]).includes(s)
  );
  const ordered: SectionKey[] = [
    ...validStored,
    ...DEFAULT_ORDER.filter((k) => !validStored.includes(k)),
  ];
  const visible = new Set(
    (Array.isArray(theme.section_visibility) && theme.section_visibility.length > 0
      ? theme.section_visibility
      : DEFAULT_ORDER
    ).filter((s) => (DEFAULT_ORDER as string[]).includes(s))
  );
  const order = ordered.filter((k) => visible.has(k));

  const defaultView = theme.default_project_view === "xray" ? "xray" : "executive";

  const customMessage = company
    ? theme.recruiter_messages?.[company.toLowerCase()] ?? null
    : null;

  const techs = CANONICAL_TECHS.filter((t) =>
    projects.some((p) => projectMatchesTech(p, t))
  );

  const sections: Record<SectionKey, React.ReactNode> = {
    hero: <HeroSection profile={profile} layout={heroLayout} credentials={credentials} />,
    bento: (
      <BentoIdentityGrid
        profile={profile}
        skills={skills}
        easterEggEnabled={theme.enable_guitar_easter_egg !== false}
        credentials={credentials}
      />
    ),
    projects: (
      <FeaturedProjects
        projects={projects}
        xrayEnabled={theme.enable_architecture_xray !== false}
        defaultView={defaultView}
      />
    ),
    skills: <SkillsMatrix skills={skills} projects={projects} />,
    timeline: <TimelineSection credentials={credentials} />,
    aeo: <AeoEntityDossier faqs={faqs} profile={profile} projects={projects} credentials={credentials} />,
    contact: <ContactSection profile={profile} />,
  };

  return (
    <>
      <Navbar
        showCommandPill={theme.enable_command_palette !== false}
        availability={
          profile.availability_status
            ? { text: profile.availability_text }
            : null
        }
      />
      <main id="main-content">
        {/* Exposed Swiss structural rails: continuous hairlines Navbar → Footer */}
        <div className="mx-auto max-w-6xl border-x border-[var(--border-subtle)]">
          <RecruiterPill company={company} customMessage={customMessage} />
          {order.map((key) => (
            <Fragment key={key}>
              {INDEX_LABELS[key] && <SectionRule index={INDEX_LABELS[key] as string} />}
              {sections[key]}
            </Fragment>
          ))}
        </div>
      </main>
      <Footer profile={profile} />
      <PaletteIsland
        enabled={theme.enable_command_palette !== false}
        resumeUrl={profile.resume_url}
        email={profile.email}
        progexUrl={profile.progex_url}
        techs={techs.length > 0 ? techs : CANONICAL_TECHS}
      />
    </>
  );
}
