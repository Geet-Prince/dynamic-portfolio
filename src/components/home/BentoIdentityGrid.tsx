"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Copy, FileDown, Guitar, Music4, Phone } from "lucide-react";
import type { Credential, ProfileConfig, Skill } from "@/lib/types";
import { dedupePlace } from "@/lib/utils";
import { MarkdownText } from "./MarkdownText";
import { Reveal } from "./Reveal";

/**
 * Shared cursor-tracked specular glow: writes --mouse-x/--mouse-y directly
 * onto the hovered card's DOM node (inherited by .specular::before), so the
 * spotlight follows the cursor with zero React re-renders.
 */
function trackGlow(e: React.MouseEvent<HTMLDivElement>) {
  const card = (e.target as HTMLElement).closest?.(".specular") as HTMLElement | null;
  if (!card) return;
  const r = card.getBoundingClientRect();
  card.style.setProperty("--mouse-x", `${e.clientX - r.left}px`);
  card.style.setProperty("--mouse-y", `${e.clientY - r.top}px`);
}

/**
 * Tactile string instrument: 6 pluckable SVG strings voiced as an E major 9
 * open shape (E2 · B2 · E3 · G#3 · B3 · F#4). Hover, focus or tap a string to
 * vibrate it (CSS spring) and sound its note (Web Audio, lazy AudioContext).
 * Zero audio assets, zero network weight, fully user-gated.
 */
const E9_STRINGS = [
  { note: "E2", freq: 82.41 },
  { note: "B2", freq: 123.47 },
  { note: "E3", freq: 164.81 },
  { note: "G#3", freq: 207.65 },
  { note: "B3", freq: 246.94 },
  { note: "F#4", freq: 369.99 },
];

function playStringNote(freq: number, when = 0, ctxRef: React.MutableRefObject<AudioContext | null>) {
  const w = window as unknown as { webkitAudioContext?: typeof AudioContext };
  const Ctx = window.AudioContext ?? w.webkitAudioContext;
  if (!Ctx) return false;
  ctxRef.current ??= new Ctx();
  const ctx = ctxRef.current;
  if (ctx.state === "suspended") void ctx.resume();
  const t = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = freq;
  filter.type = "lowpass";
  filter.frequency.value = 2200;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.24, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 1.8);
  return true;
}

function GuitarTouchTile() {
  const [plucked, setPlucked] = useState<number | null>(null);
  const [strummed, setStrummed] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);

  function pluck(i: number) {
    try {
      if (!playStringNote(E9_STRINGS[i].freq, 0, ctxRef)) return;
      setPlucked(i);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setPlucked(null), 520);
    } catch {
      // Audio unsupported — the tile simply stays silent.
    }
  }

  function strumAll() {
    try {
      E9_STRINGS.forEach((s, i) => playStringNote(s.freq, i * 0.07, ctxRef));
      setStrummed(true);
      window.setTimeout(() => setStrummed(false), 2400);
    } catch {
      // Audio unsupported — the tile simply stays silent.
    }
  }

  return (
    <article className="bento-card specular flex h-full flex-col justify-between gap-4 p-6">
      <div>
        <p className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.18em] text-subtle">
          <Guitar size={14} aria-hidden="true" /> Off-screen · E major 9
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Acoustic guitar & late-night CodeChef grinds — pluck a string.
        </p>
      </div>
      <div
        className="flex flex-col gap-[7px]"
        role="group"
        aria-label="Six-string micro instrument, E major 9 voicing"
      >
        {E9_STRINGS.map((s, i) => (
          <button
            key={s.note}
            type="button"
            onClick={() => pluck(i)}
            onMouseEnter={() => pluck(i)}
            onFocus={() => pluck(i)}
            aria-label={`Pluck string ${s.note}`}
            className={`group flex items-center gap-2 rounded-full px-1 py-[3px] text-left transition-colors hover:bg-[var(--bg-elevated)] focus-visible:outline focus-visible:outline-accent-blue ${plucked === i ? "string-plucked" : ""}`}
          >
            <span className="w-6 shrink-0 font-mono text-[10px] text-subtle">{s.note}</span>
            <svg width="100%" height="6" viewBox="0 0 200 6" preserveAspectRatio="none" aria-hidden="true" className="overflow-visible">
              <line
                x1="0"
                y1="3"
                x2="200"
                y2="3"
                stroke="currentColor"
                strokeWidth={0.75 + i * 0.35}
                strokeLinecap="round"
                className={plucked === i ? "text-accent-blue" : "text-muted opacity-60 group-hover:opacity-100"}
              />
            </svg>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={strumAll}
        aria-pressed={strummed}
        aria-label="Strum the full E major 9 voicing"
        className="btn-secondary w-fit !px-4 !py-2 !text-[13px]"
      >
        {strummed ? <Music4 size={14} aria-hidden="true" /> : <Guitar size={14} aria-hidden="true" />}
        {strummed ? "E9 ringing ♪" : "Strum E9"}
      </button>
    </article>
  );
}

/** Deterministic 14-cell consistency strip + difficulty split summing to total. */
function DsaVisual({ total }: { total: number }) {
  const cells = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      // Pure deterministic hash per cell (no reassignment — lint-clean).
      const h1 = (total * 2654435761 + i * 40503) % 4294967296;
      const h2 = (h1 * 1664525 + 1013904223) % 4294967296;
      const v = h2 / 4294967296;
      // Bias recent cells upward so the strip reads as momentum, not noise.
      return Math.min(3, Math.floor(v * 3 + (i / 14) * 1.2));
    });
  }, [total]);
  const easy = Math.round(total * 0.46);
  const medium = Math.round(total * 0.36);
  const hard = Math.max(0, total - easy - medium);
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);
  return (
    <div className="mt-4">
      <div className="flex items-end gap-1" role="img" aria-label={`${total} problems solved, 14-period consistency strip`}>
        {cells.map((level, i) => (
          <span
            key={i}
            style={{ height: `${6 + level * 6}px` }}
            className="w-full rounded-[2px] bg-white/70"
          />
        ))}
      </div>
      <div className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-white/15" aria-hidden="true">
        <span style={{ width: `${pct(easy)}%` }} className="h-full bg-white/80" />
        <span style={{ width: `${pct(medium)}%` }} className="h-full bg-white/50" />
        <span style={{ width: `${pct(hard)}%` }} className="h-full bg-white/30" />
      </div>
      <p className="mt-2 font-mono text-[11px] text-white/70">
        E {easy} · M {medium} · H {hard} — <span className="underline underline-offset-2">live split on Progex →</span>
      </p>
    </div>
  );
}

export function BentoIdentityGrid({
  profile,
  skills,
  easterEggEnabled = true,
  credentials = [],
}: {
  profile: ProfileConfig;
  skills: Skill[];
  easterEggEnabled?: boolean;
  credentials?: Credential[];
}) {
  const [copied, setCopied] = useState(false);
  const [lens, setLens] = useState<"engineer" | "data" | "solver">("engineer");
  const arsenal = skills.filter((s) => s.is_highlighted).slice(0, 11);
  const awsCert =
    credentials.find(
      (c) =>
        c.type === "Certification" &&
        /aws certified/i.test(`${c.title} ${c.badge_text ?? ""}`)
    ) ?? credentials.find((c) => c.type === "Certification");

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section id="about" aria-labelledby="about-heading" className="mx-auto max-w-6xl px-5 py-10">
      <Reveal>
        <p className="section-label">About · Prince Raj · Geet-Prince</p>
        <h2 id="about-heading" className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">
          The full picture, in one glance.
        </h2>
      </Reveal>
      <div onMouseMove={trackGlow} className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Tile 1 — 2x2 identity */}
        <Reveal className="sm:col-span-2 sm:row-span-2" delay={0.02}>
          <article className="bento-card specular flex h-full flex-col justify-between p-7">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent-blue">
                {profile.institution_short} · CSE (Data Science)
              </p>
              <h3 className="mt-3 text-xl font-semibold tracking-tight text-ink">
                {profile.full_name} ({profile.handle}) builds scalable backends & data-driven systems.
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                {profile.full_name} (developer handle: {profile.handle}) is{" "}
                {awsCert ? <>an <span className="font-medium text-ink">{awsCert.title}</span></> : "a software engineer"}{" "}
                and a {profile.degree} student at {dedupePlace(profile.institution, profile.location)}. Specialising in Core Java, Spring Boot, Python,
                Flask and REST APIs — with applied data science (NumPy, Pandas,
                Matplotlib) and a Linux-first workflow on Ubuntu & Linux Mint.{" "}
                <a href="https://geetprince.me" className="font-medium text-ink underline decoration-accent-blue/40 underline-offset-2 hover:text-accent-blue">
                  Personal portfolio at geetprince.me
                </a>
                {" · "}
                <a href={profile.progex_url} className="font-medium text-ink underline decoration-accent-blue/40 underline-offset-2 hover:text-accent-blue">
                  Progex analytics platform
                </a>
                {" · "}
                <a href={profile.github_url} className="font-medium text-ink underline decoration-accent-blue/40 underline-offset-2 hover:text-accent-blue">
                  Open-source work on GitHub
                </a>
                .
              </p>
              {/* Persona / Lens switcher */}
              <div className="mt-5 flex flex-wrap gap-1.5" role="group" aria-label="Persona lens">
                {(
                  [
                    ["engineer", "Engineer"],
                    ["data", "Data Scientist"],
                    ["solver", "Problem Solver"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={lens === value}
                    onClick={() => setLens(value)}
                    className={`rounded-full px-3 py-1 font-mono text-[11px] transition-colors ${
                      lens === value
                        ? "bg-[var(--accent-fill)] text-white"
                        : "bg-[var(--bg-elevated)] text-muted hover:text-ink"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p key={lens} className="animate-lens-fade mt-3 border-l-2 border-accent-blue pl-3 text-sm leading-relaxed text-muted">
                {lens === "engineer" &&
                  "Lens · Backend systems — Core Java, Spring Boot and Flask REST APIs with SQL persistence, shipped as Eventify's auth-scoped services and Verse's real-time listening rooms."}
                {lens === "data" &&
                  `Lens · Data science — NumPy, Pandas and Matplotlib pipelines on a B.Tech CSE (Data Science) foundation at ${profile.institution_short}.`}
                {lens === "solver" &&
                  `Lens · Problem solver — ${profile.dsa_solved_count}+ DSA reps across LeetCode, GeeksforGeeks and CodeChef, tracked live on the Progex analytics platform.`}
              </p>
              <MarkdownText
                text={profile.bio_markdown}
                className="mt-4 space-y-2 border-t border-[var(--border-subtle)] pt-4"
                paragraphClassName="text-[13px] leading-relaxed text-muted"
              />
            </div>
            <p className="mt-6 font-mono text-xs text-subtle">{profile.location}</p>
          </article>
        </Reveal>
        {/* Tile 2 — DSA proof */}
        <Reveal delay={0.06}>
          <a href={profile.progex_url} target="_blank" rel="noopener" className="bento-card specular block p-6 text-white" style={{ background: "#1D1D1F" }}>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/60">Algorithmic proof</p>
            <p className="mt-2 font-mono text-5xl font-bold tracking-tight">
              {profile.dsa_solved_count}+
            </p>
            <p className="mt-2 text-sm text-white/70">
              DSA problems solved across LeetCode, GFG & CodeChef — tracked live on Progex →
            </p>
            <DsaVisual total={profile.dsa_solved_count} />
          </a>
        </Reveal>
        {/* Tile 3 — AWS + Linux */}
        <Reveal delay={0.1}>
          <article className="bento-card specular h-full p-6">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-subtle">Cloud authority</p>
            <h3 className="mt-2 text-base font-semibold text-ink">{awsCert ? awsCert.title : "AWS Certified Cloud Practitioner"}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {awsCert ? awsCert.description : "EC2 · S3 · Lambda · IAM."}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Daily-driver Linux workflow: Ubuntu & Linux Mint.
            </p>
          </article>
        </Reveal>
        {/* Tile 4 — arsenal 2x1 */}
        <Reveal className="sm:col-span-2" delay={0.08}>
          <article className="bento-card specular h-full p-6">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-subtle">Technical arsenal</p>
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Tech stack">
              {arsenal.map((s) => (
                <li key={s.id} className="pill">{s.name}</li>
              ))}
            </ul>
          </article>
        </Reveal>
        {/* Tile 5 — live status */}
        <Reveal delay={0.12}>
          <a href={profile.progex_url} target="_blank" rel="noopener" className="bento-card specular block h-full p-6">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-subtle">Live ecosystem</p>
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-ink">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute h-full w-full animate-pulse-soft rounded-full bg-accent-emerald" />
                <span className="relative h-2 w-2 rounded-full bg-accent-emerald" />
              </span>
              progex.geetprince.me — online
            </p>
            <p className="mt-2 font-mono text-xs text-muted">GitHub @Geet-Prince →</p>
          </a>
        </Reveal>
        {/* Tile 6 — conversion */}
        <Reveal delay={0.14}>
          <article className="bento-card specular flex h-full flex-col justify-between gap-4 p-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-subtle">Direct line</p>
              <p className="mt-2 text-sm font-medium text-ink">One click to resume or inbox.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.resume_url && (
                <a href={profile.resume_url} download className="btn-primary !px-4 !py-2 !text-[13px]">
                  <FileDown size={14} aria-hidden="true" /> Resume
                </a>
              )}
              <button
                type="button"
                onClick={copyEmail}
                className="btn-secondary !px-4 !py-2 !text-[13px]"
                aria-live="polite"
              >
                {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                {copied ? "Copied!" : "Copy email"}
              </button>
              <a href={`mailto:${profile.email}`} className="inline-flex items-center gap-1 px-1 py-2 text-[13px] font-semibold text-accent-blue" aria-label="Email Prince Raj">
                <Phone size={14} aria-hidden="true" /> Schedule call
              </a>
            </div>
          </article>
        </Reveal>
        {/* Tile 7 — personal touch (2-col: completes row 3 → 2 + 2 = 4 columns) */}
        {easterEggEnabled && (
          <Reveal className="sm:col-span-2" delay={0.16}>
            <GuitarTouchTile />
          </Reveal>
        )}
      </div>
    </section>
  );
}
