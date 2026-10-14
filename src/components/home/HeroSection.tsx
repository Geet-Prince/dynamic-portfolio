import type { Credential, ProfileConfig } from "@/lib/types";
import { dedupePlace } from "@/lib/utils";
import { HeroDock } from "./HeroDock";
import { MarkdownText } from "./MarkdownText";

export type HeroLayoutKind = "apple-centered" | "split-executive" | "bento-first";

function resolveAwsTitle(credentials: Credential[] | undefined): string | null {
  if (!credentials) return "AWS Certified Cloud Practitioner";
  const cert =
    credentials.find(
      (c) =>
        c.type === "Certification" &&
        /aws certified/i.test(`${c.title} ${c.badge_text ?? ""}`)
    ) ?? credentials.find((c) => c.type === "Certification");
  return cert ? cert.title : null;
}

/**
 * High fact-density entity triple for GEO: one machine-verifiable sentence
 * binding name → handle → credential → degree → institution → location,
 * with descriptive anchor text to the canonical properties.
 */
function EntityFact({
  profile,
  awsTitle,
}: {
  profile: ProfileConfig;
  awsTitle: string | null;
}) {
  return (
    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
      {profile.full_name} (developer handle: {profile.handle}) is{" "}
      {awsTitle ? (
        <>an <span className="font-medium text-ink">{awsTitle}</span></>
      ) : (
        "a software engineer"
      )}{" "}
      and a {profile.degree} student at {dedupePlace(profile.institution, profile.location)}. Verifiable work: the{" "}
      <a
        href={profile.progex_url}
        className="font-medium text-ink underline decoration-accent-blue/40 underline-offset-2 hover:text-accent-blue"
      >
        Progex competitive-programming analytics platform
      </a>{" "}
      and{" "}
      <a
        href={profile.github_url}
        className="font-medium text-ink underline decoration-accent-blue/40 underline-offset-2 hover:text-accent-blue"
      >
        open-source projects on GitHub
      </a>
      .
    </p>
  );
}

function HeroTelemetryStrip({ profile }: { profile: ProfileConfig }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] py-2 font-mono text-[11px] tracking-[0.14em] text-[var(--text-muted)]">
      <span>LOC: GREATER NOIDA, IN (28.4744° N, 77.5040° E) • NIET CSE (DS)</span>
      {profile.availability_status ? (
        <span className="inline-flex shrink-0 items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-accent-emerald" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-emerald" />
          </span>
          SYS.STATUS: AVAILABLE FOR ROLES
        </span>
      ) : (
        <span className="shrink-0">SYS.STATUS: {profile.availability_text.toUpperCase()}</span>
      )}
    </div>
  );
}

function HeroCallouts({
  awsTitle,
  dsaCount,
}: {
  awsTitle: string | null;
  dsaCount: number;
}) {
  return (
    <span className="mt-4 inline-flex flex-wrap items-center gap-1.5 font-mono text-[11px] tracking-[0.1em] text-[var(--text-muted)]">
      {awsTitle && <sup className="rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-1.5 py-0.5">[AWS-CCP]</sup>}
      <sup className="rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-1.5 py-0.5">[{dsaCount}+ DSA]</sup>
      <sup className="rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-1.5 py-0.5">[NIET CSE-DS]</sup>
    </span>
  );
}

function AvailabilityBadge({ profile }: { profile: ProfileConfig }) {
  if (!profile.availability_status) return null;
  return (
    <p className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-1.5 text-[13px] font-medium text-muted shadow-ambient">
      <span className="relative flex h-2 w-2" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-accent-emerald" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-emerald" />
      </span>
      {profile.availability_text}
    </p>
  );
}

export function HeroSection({
  profile,
  layout = "apple-centered",
  credentials,
}: {
  profile: ProfileConfig;
  layout?: HeroLayoutKind;
  credentials?: Credential[];
}) {
  const awsTitle = resolveAwsTitle(credentials);
  // bento-first: compact strip so the Bento grid rises above the fold.
  if (layout === "bento-first") {
    return (
      <section aria-labelledby="hero-heading" className="mx-auto max-w-6xl px-5 pb-2 pt-6">
        <HeroTelemetryStrip profile={profile} />
        <div className="pt-6">
          <AvailabilityBadge profile={profile} />
        </div>
        <h1
          id="hero-heading"
          className="mt-4 max-w-4xl text-3xl font-semibold leading-[1.04] tracking-[-0.035em] text-ink sm:text-5xl"
        >
          {profile.full_name} <span className="text-muted">({profile.handle})</span> — {profile.headline}
        </h1>
        <HeroCallouts awsTitle={awsTitle} dsaCount={profile.dsa_solved_count} />
        <EntityFact profile={profile} awsTitle={awsTitle} />
        <MarkdownText
          text={profile.bio_markdown}
          className="mt-5 max-w-2xl space-y-3"
          paragraphClassName="text-[15px] leading-relaxed text-muted"
        />
        <HeroDock email={profile.email} resumeUrl={profile.resume_url} />
      </section>
    );
  }

  // split-executive: two-column with a sticky at-a-glance meta rail.
  if (layout === "split-executive") {
    return (
      <section aria-labelledby="hero-heading" className="mx-auto max-w-6xl px-5 pb-10 pt-6 sm:pt-8">
        <HeroTelemetryStrip profile={profile} />
        <div className="grid items-start gap-10 pt-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <AvailabilityBadge profile={profile} />
            {/* Server-rendered H1 — never opacity-hidden so LCP is instant for crawlers */}
            <h1
              id="hero-heading"
              className="mt-6 text-4xl font-semibold leading-[1.04] tracking-[-0.035em] text-ink sm:text-5xl"
            >
              {profile.full_name} <span className="text-muted">({profile.handle})</span> — {profile.headline}
            </h1>
            <HeroCallouts awsTitle={awsTitle} dsaCount={profile.dsa_solved_count} />
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
              {profile.subheadline}
            </p>
            <EntityFact profile={profile} awsTitle={awsTitle} />
            <MarkdownText
              text={profile.bio_markdown}
              className="mt-5 max-w-xl space-y-3"
              paragraphClassName="text-[15px] leading-relaxed text-muted"
            />
            <HeroDock email={profile.email} resumeUrl={profile.resume_url} />
          </div>
          <aside aria-label="At a glance" className="bento-card !transform-none p-6 lg:col-span-2 lg:sticky lg:top-20">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-subtle">At a glance</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Degree</dt>
                <dd className="text-right font-medium text-ink">B.Tech CSE (Data Science)</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Institute</dt>
                <dd className="text-right font-medium text-ink">{profile.institution_short}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">DSA solved</dt>
                <dd className="text-right font-mono font-semibold text-ink">{profile.dsa_solved_count}+</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Cloud</dt>
                <dd className="text-right font-medium text-ink">AWS Certified</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Base</dt>
                <dd className="text-right font-medium text-ink">{profile.location}</dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--border-subtle)] pt-4">
              <a href={profile.progex_url} target="_blank" rel="noopener" className="text-[13px] font-semibold text-accent-blue">
                Progex ↗
              </a>
              <a href={profile.github_url} target="_blank" rel="noopener" className="text-[13px] font-semibold text-accent-blue">
                GitHub ↗
              </a>
              <a href={`mailto:${profile.email}`} className="text-[13px] font-semibold text-accent-blue">
                Email ↗
              </a>
            </div>
          </aside>
        </div>
      </section>
    );
  }

  // apple-centered (default Halo-effect hero)
  return (
    <section aria-labelledby="hero-heading" className="mx-auto max-w-6xl px-5 pb-10 pt-8 sm:pt-10">
      <HeroTelemetryStrip profile={profile} />
      <div className="pt-8">
        <AvailabilityBadge profile={profile} />
      </div>
      {/* Server-rendered H1 — never opacity-hidden so LCP is instant for crawlers */}
      <h1
        id="hero-heading"
        className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.04] tracking-[-0.035em] text-ink sm:text-6xl lg:text-7xl"
      >
        {profile.full_name} <span className="text-muted">({profile.handle})</span> — {profile.headline}
      </h1>
      <HeroCallouts awsTitle={awsTitle} dsaCount={profile.dsa_solved_count} />
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
        {profile.subheadline}
      </p>
      <EntityFact profile={profile} awsTitle={awsTitle} />
      <MarkdownText
        text={profile.bio_markdown}
        className="mt-5 max-w-2xl space-y-3"
        paragraphClassName="text-[15px] leading-relaxed text-muted"
      />
      <p className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-subtle">
        B.Tech CSE (Data Science) · {dedupePlace(profile.institution, profile.location)}
      </p>
      <HeroDock email={profile.email} resumeUrl={profile.resume_url} />
    </section>
  );
}
