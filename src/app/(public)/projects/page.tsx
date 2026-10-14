import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { GithubIcon } from "@/components/icons";
import { getSiteData } from "@/lib/data-fetcher";
import { llmsAlternateTypes, projectMatchesTech } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

// Live from Supabase on every request — no ISR/cache layer.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  // Derived from the live projects table so the description can never name a
  // project that has been removed from /admin. getSiteData is per-request
  // cached, so this shares the page's fetch.
  const { projects } = await getSiteData();
  const names = projects.map((p) => p.title).join(", ");
  return {
    title: "All Projects",
    description: names
      ? `Every project by Prince Raj (Geet-Prince) — ${names}. Full-stack, data science & dev tools.`
      : "Every project by Prince Raj (Geet-Prince). Full-stack, data science & developer tools.",
    // NOTE: child `alternates` replaces the root object — repeat the LLM types.
    alternates: { canonical: "https://geetprince.me/projects", types: { ...llmsAlternateTypes } },
  };
}

const CATEGORIES = ["All", "Full-Stack", "Data Science", "Developer Tools", "Cloud"];

export default async function ProjectsArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tech?: string }>;
}) {
  const { category, tech } = await searchParams;
  const active = category && CATEGORIES.includes(category) ? category : "All";
  const techFilter = tech?.trim().slice(0, 40) ?? "";
  const { profile, projects } = await getSiteData();
  const filtered = projects
    .filter((p) => (active === "All" ? true : p.category === active))
    .filter((p) => (techFilter ? projectMatchesTech(p, techFilter) : true));

  return (
    <>
      <Navbar
        availability={
          profile.availability_status
            ? { text: profile.availability_text }
            : null
        }
      />
      <main id="main-content" className="mx-auto max-w-6xl px-5 pb-16 pt-12">
        <p className="section-label">Archive · Prince Raj · Geet-Prince</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.03em] text-ink sm:text-6xl">
          All projects.
        </h1>
        <p className="mt-4 max-w-2xl text-muted">
          {projects.length} builds across full-stack systems, data science and developer tools.
        </p>
        {techFilter && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--accent-fill)] px-4 py-1.5 font-mono text-xs text-white">
            Stack: {techFilter}
            <Link href="/projects" aria-label="Clear tech filter" className="opacity-70 hover:opacity-100">
              ×
            </Link>
          </p>
        )}
        <nav aria-label="Filter by category" className="mt-6 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={c === "All" ? "/projects" : `/projects?category=${encodeURIComponent(c)}`}
              aria-current={active === c ? "page" : undefined}
              className={`rounded-full px-4 py-1.5 font-mono text-xs transition-colors ${
                active === c
                  ? "bg-[var(--accent-fill)] text-white"
                  : "bg-pill text-ink hover:bg-black/10"
              }`}
            >
              {c}
            </Link>
          ))}
        </nav>
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((p) => (
            <article key={p.id} className="bento-card flex h-full flex-col p-7">
              <div className="flex items-center justify-between gap-3">
                <p className="pill">{p.category}</p>
                {p.metrics_badge && (
                  <p className="font-mono text-xs text-accent-emerald">● {p.metrics_badge}</p>
                )}
              </div>
              <h2 className="mt-4 text-xl font-semibold tracking-tight text-ink">
                <Link href={`/projects/${p.slug}`} className="hover:text-accent-blue">
                  {p.title}
                </Link>
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.tagline}</p>
              <ul className="mt-4 flex flex-wrap gap-1.5" aria-label={`${p.title} tech stack`}>
                {p.tech_stack.map((t) => (
                  <li key={t} className="pill !text-[11px]">{t}</li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold">
                <Link href={`/projects/${p.slug}`} className="inline-flex items-center gap-1 text-accent-blue">
                  Case study <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
                {p.live_url && (
                  <a href={p.live_url} target="_blank" rel="noopener" className="text-ink hover:underline">
                    Live demo →
                  </a>
                )}
                {p.github_url && (
                  <a href={p.github_url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-muted hover:text-ink">
                    <GithubIcon size={15} /> Code
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="mt-10 text-muted">No projects in this category yet.</p>
        )}
      </main>
      <Footer profile={profile} />
    </>
  );
}
