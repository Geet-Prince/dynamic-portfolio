"use client";

import { useState } from "react";
import type { Project, Skill } from "@/lib/types";
import { Reveal } from "./Reveal";

const COLUMNS = [
  { key: "Languages & Core", label: "Languages & Core" },
  { key: "Backend & Web Frameworks", label: "Backend & Web" },
  { key: "Data Science & Analytics", label: "Data Science & AI" },
  { key: "Cloud, DevOps & OS", label: "Cloud & Linux OS" },
];

/** Real-world proof: which shipped projects actually use this skill. */
function projectsUsing(skillName: string, projects: Project[]): string[] {
  const q = skillName.toLowerCase();
  return projects
    .filter((p) =>
      (p.tech_stack ?? []).some((t) => {
        const s = t.toLowerCase();
        return s === q || s.includes(q) || q.includes(s);
      })
    )
    .map((p) => p.title);
}

export function SkillsMatrix({
  skills,
  projects = [],
}: {
  skills: Skill[];
  projects?: Project[];
}) {
  const [active, setActive] = useState<string | null>(null);
  const groups = COLUMNS.map((col) => ({
    ...col,
    items: skills.filter((s) => s.category === col.key),
  })).filter((g) => g.items.length > 0);

  return (
    <section id="skills" aria-labelledby="skills-heading" className="mx-auto max-w-6xl px-5 py-14">
      <Reveal>
        <p className="section-label">Capabilities</p>
        <h2 id="skills-heading" className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">
          Engineering & data science matrix.
        </h2>
        <p className="mt-2 font-mono text-[11px] tracking-[0.14em] text-[var(--text-muted)] opacity-70">
          HOVER A SKILL FOR SHIPPED-PROJECT PROOF ↓
        </p>
      </Reveal>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((g, gi) => (
          <Reveal key={g.key} delay={Math.min(gi * 0.05, 0.2)}>
            <article className="bento-card h-full p-6">
              <h3 className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-subtle">
                {g.label}
              </h3>
              <ul className="mt-4 space-y-3">
                {g.items.map((s) => {
                  const proof = projectsUsing(s.name, projects);
                  const isActive = active === s.id;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onMouseEnter={() => setActive(s.id)}
                        onMouseLeave={() => setActive(null)}
                        onFocus={() => setActive(s.id)}
                        onBlur={() => setActive(null)}
                        onClick={() => setActive((a) => (a === s.id ? null : s.id))}
                        aria-expanded={isActive}
                        className="block w-full rounded-lg px-1 py-0.5 text-left transition-colors hover:bg-[var(--bg-elevated)] focus-visible:outline focus-visible:outline-accent-blue"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-ink">{s.name}</span>
                          <span className="font-mono text-xs text-muted">{s.proficiency}%</span>
                        </div>
                        <div
                          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-pill"
                          role="progressbar"
                          aria-valuenow={s.proficiency}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${s.name} proficiency`}
                        >
                          <div
                            className="h-full rounded-full bg-ink"
                            style={{ width: `${s.proficiency}%` }}
                          />
                        </div>
                        {isActive && proof.length > 0 && (
                          <p className="animate-lens-fade mt-1.5 font-mono text-[11px] leading-relaxed text-accent-blue">
                            ▸ Used in: {proof.join(", ")}
                          </p>
                        )}
                        {isActive && proof.length === 0 && (
                          <p className="animate-lens-fade mt-1.5 font-mono text-[11px] text-subtle">
                            ▸ Foundational — applied across builds
                          </p>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
