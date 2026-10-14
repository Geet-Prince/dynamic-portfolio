import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { GithubIcon } from "@/components/icons";
import { getProjectBySlug, getSiteData } from "@/lib/data-fetcher";
import { llmsAlternateTypes } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const revalidate = 3600;

export async function generateStaticParams() {
  const { projects } = await getSiteData();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project not found" };
  return {
    title: `${project.title} — Case Study`,
    description: project.tagline,
    keywords: [...project.tech_stack, "Prince Raj", "Geet-Prince", project.title],
    alternates: {
      canonical: `https://geetprince.me/projects/${project.slug}`,
      // NOTE: child `alternates` replaces the root object — repeat the LLM types.
      types: { ...llmsAlternateTypes },
    },
    openGraph: {
      title: `${project.title} by Prince Raj (Geet-Prince)`,
      description: project.tagline,
      url: `https://geetprince.me/projects/${project.slug}`,
      type: "article",
    },
  };
}

export default async function ProjectCaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [project, site] = await Promise.all([
    getProjectBySlug(slug),
    getSiteData(),
  ]);
  if (!project) notFound();

  const others = site.projects.filter((p) => p.slug !== slug).slice(0, 2);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: project.title,
    description: project.tagline,
    author: { "@type": "Person", name: "Prince Raj", alternateName: "Geet-Prince" },
    programmingLanguage: project.tech_stack,
    codeRepository: project.github_url ?? undefined,
    url: `https://geetprince.me/projects/${project.slug}`,
  };
  const liveHost = (() => {
    try {
      return project.live_url ? new URL(project.live_url).hostname : null;
    } catch {
      return null;
    }
  })();

  return (
    <>
      <Navbar
        availability={
          site.profile.availability_status
            ? { text: site.profile.availability_text }
            : null
        }
      />
      <main id="main-content" className="mx-auto max-w-4xl px-5 pb-16 pt-12">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
          <ArrowLeft size={15} aria-hidden="true" /> All projects
        </Link>
        <p className="section-label mt-8">{project.category} · Case study</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.03em] text-ink sm:text-6xl">
          {project.title}
        </h1>
        <p className="mt-4 text-lg text-muted">{project.tagline}</p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
          {project.title} is designed and built by {site.profile.full_name}{" "}
          (developer handle: {site.profile.handle}), a {site.profile.degree}{" "}
          student at {site.profile.institution}, {site.profile.location}.
        </p>
        {project.metrics_badge && (
          <p className="mt-3 font-mono text-sm text-accent-emerald">● {project.metrics_badge}</p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          {project.live_url && (
            <a href={project.live_url} target="_blank" rel="noopener" className="btn-primary" aria-label={`Live demo of ${project.title}${liveHost ? ` at ${liveHost}` : ""}`}>
              Live demo <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          )}
          {project.github_url && (
            <a href={project.github_url} target="_blank" rel="noopener" className="btn-secondary" aria-label={`${project.title} source code by Geet-Prince on GitHub`}>
              <GithubIcon size={15} /> Source code
            </a>
          )}
        </div>
        {/* Citation & Fact Block — structured dl so RAG pipelines extract exact facts */}
        <aside aria-label="Technical Specification & Impact Summary" className="bento-card !transform-none mt-8 p-6 sm:p-7">
          <h2 className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-subtle">
            Technical Specification & Impact Summary
          </h2>
          <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">Author</dt>
              <dd className="mt-0.5 font-medium text-ink">
                {site.profile.full_name} / {site.profile.handle}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">Architecture</dt>
              <dd className="mt-0.5 font-medium text-ink">
                {project.architecture_highlights[0] ?? `${project.category} application architecture`}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">Primary Stack</dt>
              <dd className="mt-0.5 font-medium text-ink">{project.tech_stack.join(" · ")}</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">Live Endpoint</dt>
              <dd className="mt-0.5 font-medium text-ink">
                {project.live_url ? (
                  <a href={project.live_url} target="_blank" rel="noopener" className="text-accent-blue hover:underline">
                    {liveHost ?? project.live_url}
                  </a>
                ) : (
                  "Source-available (no public demo)"
                )}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">Verification Status</dt>
              <dd className="mt-0.5 font-medium text-ink">
                {project.metrics_badge ?? "Verified via public GitHub repository"} · Built by {site.profile.full_name} ({site.profile.handle}), {site.profile.institution_short}
              </dd>
            </div>
          </dl>
        </aside>
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Tech stack">
          {project.tech_stack.map((t) => (
            <li key={t} className="pill">{t}</li>
          ))}
        </ul>
        <article className="bento-card mt-8 whitespace-pre-line p-7 text-[15px] leading-relaxed text-ink sm:p-9">
          {project.description_markdown}
        </article>
        {project.architecture_highlights.length > 0 && (
          <section aria-label="Architecture highlights" className="mt-6">
            <h2 className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-subtle">
              Architecture highlights
            </h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {project.architecture_highlights.map((h) => (
                <li key={h} className="bento-card p-5 font-mono text-[13px] leading-relaxed text-ink">
                  {h}
                </li>
              ))}
            </ul>
          </section>
        )}
        {others.length > 0 && (
          <nav aria-label="More projects" className="mt-12 border-t border-[var(--border-subtle)] pt-8">
            <h2 className="text-lg font-semibold text-ink">Keep exploring</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {others.map((o) => (
                <li key={o.id}>
                  <Link href={`/projects/${o.slug}`} className="bento-card block p-5">
                    <span className="font-mono text-xs text-subtle">{o.category}</span>
                    <span className="mt-1 block font-semibold text-ink">{o.title} →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </main>
      <Footer profile={site.profile} />
    </>
  );
}
