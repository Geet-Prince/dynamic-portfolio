import { Award, Briefcase, GraduationCap, Sparkles } from "lucide-react";
import type { Credential } from "@/lib/types";
import { Reveal } from "./Reveal";

const ICONS: Record<string, typeof Award> = {
  Education: GraduationCap,
  Certification: Award,
  Hackathon: Sparkles,
  Program: Briefcase,
};

const GROUPS = ["Education", "Certification", "Program", "Hackathon"];

export function TimelineSection({ credentials }: { credentials: Credential[] }) {
  return (
    <section id="journey" aria-labelledby="journey-heading" className="mx-auto max-w-6xl px-5 py-14">
      <Reveal>
        <p className="section-label">Journey · NIET · Credentials</p>
        <h2 id="journey-heading" className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">
          Education, certifications & hackathons.
        </h2>
      </Reveal>
      {GROUPS.map((group) => {
        const items = credentials.filter((c) => c.type === group);
        if (items.length === 0) return null;
        return (
          <div key={group} className="mt-10">
            <h3 className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-subtle">
              {group}
            </h3>
            <ol className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {items.map((c, i) => {
                const Icon = ICONS[c.type] ?? Award;
                return (
                  <Reveal key={c.id} as="li" delay={Math.min(i * 0.04, 0.16)} className="bento-card flex h-full gap-4 p-6">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pill text-ink" aria-hidden="true">
                      <Icon size={18} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[15px] font-semibold text-ink">{c.title}</p>
                        {c.badge_text && <span className="pill !text-[11px]">{c.badge_text}</span>}
                      </div>
                      <p className="mt-0.5 text-sm text-muted">{c.organization}</p>
                      <p className="mt-0.5 font-mono text-xs text-subtle">{c.date_label}</p>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{c.description}</p>
                      {c.credential_url && (
                        <a href={c.credential_url} target="_blank" rel="noopener" className="mt-2 inline-block text-[13px] font-semibold text-accent-blue">
                          Verify credential →
                        </a>
                      )}
                    </div>
                  </Reveal>
                );
              })}
            </ol>
          </div>
        );
      })}
    </section>
  );
}
