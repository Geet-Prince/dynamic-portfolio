"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { GithubIcon } from "@/components/icons";
import type { Project } from "@/lib/types";
import { Reveal } from "./Reveal";

type View = "executive" | "xray";

/**
 * Bespoke SVG architectural node pipeline, generated from the project's own
 * tech_stack + live endpoint (never placeholder art). A data-packet dot
 * travels each connector via SMIL animateMotion — zero JS, GPU-cheap.
 */
function SchematicHeader({ project }: { project: Project }) {
  const p = project;
  const labels = (() => {
    const stack = (p.tech_stack ?? []).slice(0, 3);
    let terminal = p.slug;
    try {
      if (p.live_url) terminal = new URL(p.live_url).hostname;
    } catch {
      terminal = p.slug;
    }
    const all = [...stack, terminal].filter(Boolean).slice(0, 4);
    return all.length >= 2 ? all : [p.category, terminal];
  })();
  const W = 600;
  const H = 76;
  const n = labels.length;
  const xs = labels.map((_, i) => (n === 1 ? W / 2 : 70 + (i * (W - 140)) / (n - 1)));
  const short = (s: string) => (s.length > 16 ? `${s.slice(0, 15)}…` : s);
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mt-4 w-full"
      role="img"
      aria-label={`${p.title} system schematic: ${labels.join(" to ")}`}
    >
      {labels.slice(0, -1).map((_, i) => {
        const x1 = xs[i] + 62;
        const x2 = xs[i + 1] - 62;
        const d = `M ${x1} 38 L ${x2} 38`;
        return (
          <g key={i}>
            <path d={d} stroke="var(--border-strong)" strokeWidth="1.5" fill="none" />
            <path d={d} stroke="var(--accent-primary)" strokeWidth="1.5" fill="none" strokeDasharray="3 9" opacity="0.55" />
            <circle r="3.5" fill="var(--accent-primary)" className="flow-dot">
              <animateMotion dur={`${1.8 + i * 0.5}s`} repeatCount="indefinite" path={d} />
            </circle>
          </g>
        );
      })}
      {labels.map((label, i) => {
        const last = i === labels.length - 1;
        return (
          <g key={label}>
            <rect
              x={xs[i] - 62}
              y={21}
              width={124}
              height={34}
              rx={9}
              fill={last ? "var(--bg-surface)" : "var(--bg-elevated)"}
              stroke={last ? "var(--accent-primary)" : "var(--border-strong)"}
              strokeWidth={last ? 1.5 : 1}
            />
            <text
              x={xs[i]}
              y={42}
              textAnchor="middle"
              fontSize="11"
              fontFamily="ui-monospace, monospace"
              fill="var(--text-ink)"
            >
              {short(label)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ExecutiveCard({ project }: { project: Project }) {
  const p = project;
  return (
    <article className="bento-card flex h-full flex-col p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="pill !bg-pill">{p.category}</p>
        {p.metrics_badge && (
          <p className="font-mono text-xs text-accent-emerald">● {p.metrics_badge}</p>
        )}
      </div>
      <SchematicHeader project={p} />
      <h3 className="mt-4 text-xl font-semibold tracking-tight text-ink">{p.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{p.tagline}</p>
      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label={`${p.title} tech stack`}>
        {p.tech_stack.slice(0, 6).map((t) => (
          <li key={t} className="pill !text-[11px]">{t}</li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap items-center gap-4 pt-1 text-sm font-semibold">
        <Link href={`/projects/${p.slug}`} className="inline-flex items-center gap-1 text-accent-blue hover:text-accent-blue-hover">
          Case study <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
        {p.live_url && (
          <a href={p.live_url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-ink hover:underline">
            Live demo <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        )}
        {p.github_url && (
          <a href={p.github_url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-muted hover:text-ink" aria-label={`${p.title} source on GitHub`}>
            <GithubIcon size={15} /> Code
          </a>
        )}
      </div>
    </article>
  );
}

function XrayCard({ project }: { project: Project }) {
  const p = project;
  return (
    <article className="bento-card flex h-full flex-col p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-emerald">
          ◈ X-Ray · {p.slug}
        </p>
        {p.metrics_badge && (
          <p className="font-mono text-xs text-muted">{p.metrics_badge}</p>
        )}
      </div>
      <h3 className="mt-3 text-xl font-semibold tracking-tight text-ink">{p.title}</h3>
      <p className="mt-1 font-mono text-xs text-subtle">{p.category} · system anatomy</p>
      {p.architecture_highlights.length > 0 ? (
        <ul className="xray-list mt-4 space-y-2 font-mono text-[13px] leading-relaxed text-ink" aria-label={`${p.title} architecture highlights`}>
          {p.architecture_highlights.map((h, n) => (
            <li key={h}><span className="text-subtle">{String(n + 1).padStart(2, "0")}</span><span>{h}</span></li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 font-mono text-[13px] text-muted">Anatomy notes ship with the case study.</p>
      )}
      <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">Data flow · API · Stack</p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {p.tech_stack.map((t) => (
            <li key={t} className="pill !text-[11px]">{t}</li>
          ))}
        </ul>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-4 text-sm font-semibold">
        <Link href={`/projects/${p.slug}`} className="inline-flex items-center gap-1 text-accent-blue hover:text-accent-blue-hover">
          Full bottleneck analysis <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
        {p.github_url && (
          <a href={p.github_url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-muted hover:text-ink" aria-label={`${p.title} source on GitHub`}>
            <GithubIcon size={15} /> Code
          </a>
        )}
      </div>
    </article>
  );
}

export function FeaturedProjects({
  projects,
  xrayEnabled = true,
  defaultView = "executive",
}: {
  projects: Project[];
  xrayEnabled?: boolean;
  defaultView?: View;
}) {
  const [view, setView] = useState<View>(defaultView);
  const featured = projects.filter((p) => p.is_featured).slice(0, 6);

  // Remote toggle from the ⌘K palette (or any dispatcher of `xray-toggle`).
  useEffect(() => {
    if (!xrayEnabled) return;
    function toggle() {
      setView((v) => (v === "executive" ? "xray" : "executive"));
      document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
    }
    window.addEventListener("xray-toggle", toggle);
    return () => window.removeEventListener("xray-toggle", toggle);
  }, [xrayEnabled]);

  const effective: View = xrayEnabled ? view : "executive";

  return (
    <section id="projects" aria-labelledby="projects-heading" className="mx-auto max-w-6xl px-5 py-14">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-label">Selected work</p>
            <h2 id="projects-heading" className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">
              Featured projects.
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {xrayEnabled && (
              <div className="segmented" role="group" aria-label="Project card view">
                <button
                  type="button"
                  aria-pressed={effective === "executive"}
                  onClick={() => setView("executive")}
                >
                  Executive View
                </button>
                <button
                  type="button"
                  aria-pressed={effective === "xray"}
                  onClick={() => setView("xray")}
                >
                  Architecture X-Ray
                </button>
              </div>
            )}
            <Link href="/projects" className="text-sm font-semibold text-accent-blue hover:text-accent-blue-hover">
              View full archive →
            </Link>
          </div>
        </div>
      </Reveal>
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        {featured.map((p, i) => (
          <Reveal key={p.id} delay={Math.min(i * 0.05, 0.2)}>
            <div key={effective} className="animate-xray-in h-full">
              {effective === "executive" ? (
                <ExecutiveCard project={p} />
              ) : (
                <XrayCard project={p} />
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
