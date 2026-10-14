"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Check, Copy, RotateCcw } from "lucide-react";
import { updateTheme } from "@/lib/supabase/actions";
import { THEME_PRESETS } from "@/lib/themes";
import type { ThemeConfig } from "@/lib/types";

const PRESET_KEYS = ["cupertino-light", "sequoia-dark", "editorial-paper", "nordic-slate"];
const HERO_LAYOUTS = [
  { value: "apple-centered", label: "Apple Centered", hint: "Halo-effect centered hero" },
  { value: "split-executive", label: "Split Executive", hint: "Two-column + at-a-glance rail" },
  { value: "bento-first", label: "Bento-First", hint: "Compact strip, bento rises" },
];
const RADII = ["8px", "16px", "24px", "32px"];
const BLURS = ["8px", "16px", "24px", "32px"];
const SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  bento: "Bento identity",
  projects: "Projects",
  skills: "Skills matrix",
  timeline: "Journey / timeline",
  aeo: "AEO entity dossier",
  contact: "Contact",
};
const DEFAULT_ORDER = ["hero", "bento", "projects", "skills", "timeline", "aeo", "contact"];
const DEFAULT_VIEWS = [
  { value: "executive", label: "Executive", hint: "Impact-first cards" },
  { value: "xray", label: "Architecture X-Ray", hint: "System anatomy first" },
];

export function DesignStudio({ theme }: { theme: ThemeConfig }) {
  const [preset, setPreset] = useState(theme.theme_preset);
  const [hero, setHero] = useState(theme.hero_layout);
  const [radius, setRadius] = useState(theme.card_radius);
  const [blur, setBlur] = useState(theme.glass_blur);
  const [defaultView, setDefaultView] = useState(
    theme.default_project_view === "xray" ? "xray" : "executive"
  );
  const [accent, setAccent] = useState(
    /^#[0-9a-fA-F]{6}$/.test(theme.accent_color) ? theme.accent_color : "#0066CC"
  );
  const storedOrder = Array.isArray(theme.section_order) ? theme.section_order : [];
  const [order, setOrder] = useState<string[]>([
    ...storedOrder.filter((s) => DEFAULT_ORDER.includes(s)),
    ...DEFAULT_ORDER.filter((s) => !storedOrder.includes(s)),
  ]);
  const storedVisibility = Array.isArray(theme.section_visibility) ? theme.section_visibility : [];
  const [visible, setVisible] = useState<string[]>(
    storedVisibility.length > 0
      ? DEFAULT_ORDER.filter((s) => storedVisibility.includes(s))
      : [...DEFAULT_ORDER]
  );
  const [recruiterMsgs, setRecruiterMsgs] = useState<Record<string, string>>(
    theme.recruiter_messages && typeof theme.recruiter_messages === "object"
      ? theme.recruiter_messages
      : {}
  );
  const [newCompany, setNewCompany] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [company, setCompany] = useState("");
  const [copied, setCopied] = useState<"link" | "saved" | null>(null);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  // A stored blur outside the preset steps (e.g. legacy 20px) stays selectable.
  const blurOptions = BLURS.includes(blur) ? BLURS : [...BLURS, blur];

  function toggleVisible(key: string) {
    setVisible((v) => (v.includes(key) ? v.filter((k) => k !== key) : [...v, key]));
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await updateTheme(fd);
      setMsg(
        res.ok
          ? "preview" in res && res.preview
            ? "Theme applied locally (preview mode — connect Supabase to persist)."
            : "Theme published — the whole site re-rendered with zero code changes."
          : `Error: ${res.error}`
      );
      if (res.ok) setCopied("saved");
    });
  }

  const recruiterLink = `https://geetprince.me/?for=${encodeURIComponent(company.trim())}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(recruiterLink);
      setCopied("link");
      setTimeout(() => setCopied(null), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  const radioCard = (active: boolean) =>
    `rounded-2xl border p-4 text-left transition-all ${
      active ? "border-accent-blue bg-[var(--bg-surface)] shadow-ambient" : "border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]"
    }`;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form id="design-form" onSubmit={onSubmit} className="space-y-6 lg:col-span-2">
        {/* Presets */}
        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-ambient">
          <h2 className="text-base font-semibold text-ink">Theme preset</h2>
          <p className="mb-4 mt-1 text-[13px] text-muted">Tokens inject server-side — first paint is already themed.</p>
          <div className="grid grid-cols-2 gap-3">
            {PRESET_KEYS.map((key) => {
              const t = THEME_PRESETS[key];
              return (
                <label key={key} className={`${radioCard(preset === key)} cursor-pointer`}>
                  <input
                    type="radio"
                    name="theme_preset"
                    value={key}
                    checked={preset === key}
                    onChange={() => setPreset(key)}
                    className="sr-only"
                  />
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="h-6 w-6 rounded-full border border-[var(--border-subtle)]"
                      style={{ background: t.canvas }}
                    />
                    <span className="text-sm font-semibold text-ink">{t.label}</span>
                  </span>
                  <span className="mt-1 block font-mono text-[11px] text-subtle">{t.canvas} · {key}</span>
                </label>
              );
            })}
          </div>
        </section>

        {/* Hero layout */}
        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-ambient">
          <h2 className="text-base font-semibold text-ink">Hero layout</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {HERO_LAYOUTS.map((h) => (
              <label key={h.value} className={`${radioCard(hero === h.value)} cursor-pointer`}>
                <input
                  type="radio"
                  name="hero_layout"
                  value={h.value}
                  checked={hero === h.value}
                  onChange={() => setHero(h.value)}
                  className="sr-only"
                />
                <span className="block text-sm font-semibold text-ink">{h.label}</span>
                <span className="mt-0.5 block text-xs text-muted">{h.hint}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Geometry + accent */}
        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-ambient">
          <h2 className="text-base font-semibold text-ink">Geometry, glass & accent</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-3">
            <fieldset>
              <legend className="mb-2 text-[13px] font-medium text-ink">Card radius</legend>
              <div className="flex flex-wrap gap-2">
                {RADII.map((r) => (
                  <label key={r} className={`cursor-pointer rounded-full px-3 py-1.5 font-mono text-xs ${radius === r ? "bg-[var(--accent-fill)] text-white" : "bg-pill text-ink"}`}>
                    <input type="radio" name="card_radius" value={r} checked={radius === r} onChange={() => setRadius(r)} className="sr-only" />
                    {r}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-[13px] font-medium text-ink">Glass blur</legend>
              <div className="flex flex-wrap gap-2">
                {blurOptions.map((b) => (
                  <label key={b} className={`cursor-pointer rounded-full px-3 py-1.5 font-mono text-xs ${blur === b ? "bg-[var(--accent-fill)] text-white" : "bg-pill text-ink"}`}>
                    <input type="radio" name="glass_blur" value={b} checked={blur === b} onChange={() => setBlur(b)} className="sr-only" />
                    {b}
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor="accent_color" className="mb-2 block text-[13px] font-medium text-ink">
                Accent <span className="font-mono text-xs text-subtle">{accent}</span>
              </label>
              <input
                id="accent_color"
                name="accent_color"
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="h-10 w-20 cursor-pointer rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
              />
            </div>
          </div>
          <fieldset className="mt-5 border-t border-[var(--border-subtle)] pt-4">
            <legend className="mb-2 text-[13px] font-medium text-ink">Default project view</legend>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_VIEWS.map((v) => (
                <label key={v.value} className={`cursor-pointer rounded-full px-4 py-1.5 text-[13px] font-semibold ${defaultView === v.value ? "bg-[var(--accent-fill)] text-white" : "bg-pill text-ink"}`}>
                  <input type="radio" name="default_project_view" value={v.value} checked={defaultView === v.value} onChange={() => setDefaultView(v.value)} className="sr-only" />
                  {v.label} <span className="font-normal opacity-70">· {v.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-5 flex flex-wrap gap-4 border-t border-[var(--border-subtle)] pt-4">
            <legend className="sr-only">Signature features</legend>
            {[
              { name: "enable_command_palette", label: "⌘K palette", def: theme.enable_command_palette },
              { name: "enable_architecture_xray", label: "X-Ray toggle", def: theme.enable_architecture_xray },
              { name: "enable_guitar_easter_egg", label: "Guitar tile", def: theme.enable_guitar_easter_egg },
            ].map((f) => (
              <label key={f.name} className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                <input type="checkbox" name={f.name} defaultChecked={f.def !== false} className="h-4 w-4 accent-[var(--accent-fill)]" />
                {f.label}
              </label>
            ))}
          </fieldset>
        </section>

        {/* Section order + visibility */}
        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-ambient">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">Section order & visibility</h2>
            <button type="button" onClick={() => { setOrder([...DEFAULT_ORDER]); setVisible([...DEFAULT_ORDER]); }} className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent-blue">
              <RotateCcw size={13} aria-hidden="true" /> Reset
            </button>
          </div>
          <input type="hidden" name="section_order" value={order.join(",")} />
          <input type="hidden" name="section_visibility" value={visible.join(",")} />
          <input type="hidden" name="recruiter_messages" value={JSON.stringify(recruiterMsgs)} />
          <ol className="mt-4 space-y-2">
            {order.map((key, i) => (
              <li key={key} className="flex items-center justify-between rounded-xl bg-pill px-4 py-2.5">
                <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-ink">
                  <input
                    type="checkbox"
                    checked={visible.includes(key)}
                    onChange={() => toggleVisible(key)}
                    aria-label={`Show ${SECTION_LABELS[key] ?? key} section on homepage`}
                    className="h-4 w-4 accent-[var(--accent-fill)]"
                  />
                  <span className="font-mono text-xs text-subtle">{i + 1}</span>
                  {SECTION_LABELS[key] ?? key}
                  {!visible.includes(key) && (
                    <span className="rounded-full bg-[var(--bg-surface)] px-2 py-0.5 font-mono text-[11px] text-subtle">hidden</span>
                  )}
                </label>
                <span className="flex gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${SECTION_LABELS[key] ?? key} up`} className="rounded-lg p-1.5 text-ink hover:bg-black/10 disabled:opacity-30">
                    <ArrowUp size={15} />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === order.length - 1} aria-label={`Move ${SECTION_LABELS[key] ?? key} down`} className="rounded-lg p-1.5 text-ink hover:bg-black/10 disabled:opacity-30">
                    <ArrowDown size={15} />
                  </button>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
            {pending ? "Publishing theme…" : "Save & apply theme"}
          </button>
          <a href="/" target="_blank" rel="noopener" className="text-sm font-semibold text-accent-blue">
            Preview live site →
          </a>
        </div>
        {msg && <p role="status" className="text-sm text-muted">{msg}</p>}
      </form>

      {/* Recruiter link generator + custom messages */}
      <aside className="h-fit rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-ambient lg:sticky lg:top-24">
        <h2 className="text-base font-semibold text-ink">Recruiter link generator</h2>
        <p className="mb-4 mt-1 text-[13px] text-muted">
          Personalized <span className="font-mono">?for=Company</span> links render a high-trust welcome pill.
        </p>
        <label htmlFor="company" className="mb-1.5 block text-[13px] font-medium text-ink">Company name</label>
        <input
          id="company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="e.g. Google"
          maxLength={40}
          className="input-apple font-mono"
        />
        {company.trim().length >= 2 && (
          <div className="mt-4 rounded-xl bg-pill p-3">
            <p className="break-all font-mono text-xs text-ink">{recruiterLink}</p>
            <button type="button" onClick={copyLink} className="btn-secondary mt-3 !px-4 !py-1.5 !text-[13px]">
              {copied === "link" ? <Check size={14} /> : <Copy size={14} />}
              {copied === "link" ? "Copied!" : "Copy link"}
            </button>
          </div>
        )}

        <div className="mt-5 border-t border-[var(--border-subtle)] pt-4">
          <h3 className="text-sm font-semibold text-ink">Custom welcome messages</h3>
          <p className="mb-3 mt-0.5 text-xs text-muted">
            Saved with the theme — visiting <span className="font-mono">?for=Company</span> shows your text.
          </p>
          {Object.keys(recruiterMsgs).length === 0 ? (
            <p className="rounded-xl bg-pill p-3 text-xs text-muted">No custom messages yet.</p>
          ) : (
            <ul className="space-y-2">
              {Object.entries(recruiterMsgs).map(([key, message]) => (
                <li key={key} className="rounded-xl bg-pill p-3">
                  <p className="font-mono text-xs font-semibold text-ink">?for={key}</p>
                  <p className="mt-0.5 text-xs text-muted">{message}</p>
                  <button
                    type="button"
                    onClick={() => setRecruiterMsgs((m) => {
                      const next = { ...m };
                      delete next[key];
                      return next;
                    })}
                    className="mt-1.5 text-xs font-semibold text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 space-y-2">
            <input
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
              placeholder="Company (e.g. Google)"
              maxLength={40}
              aria-label="Company for custom message"
              className="input-apple font-mono !text-[13px]"
            />
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Custom welcome message (max 300 chars)"
              maxLength={300}
              rows={2}
              aria-label="Custom welcome message"
              className="input-apple !text-[13px]"
            />
            <button
              type="button"
              onClick={() => {
                const key = newCompany.trim().toLowerCase();
                const text = newMessage.trim();
                if (key.length < 2 || !text) return;
                setRecruiterMsgs((m) => ({ ...m, [key]: text.slice(0, 300) }));
                setNewCompany("");
                setNewMessage("");
              }}
              disabled={newCompany.trim().length < 2 || !newMessage.trim()}
              className="btn-secondary w-full !py-2 !text-[13px] disabled:opacity-50"
            >
              Add message (saves with theme)
            </button>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="mt-5 border-t border-[var(--border-subtle)] pt-4"
          style={{ borderRadius: radius }}
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">Live tokens</p>
          <div className="mt-2 flex gap-2">
            <span className="h-8 w-8 rounded-full border border-[var(--border-subtle)]" style={{ background: THEME_PRESETS[preset]?.canvas }} title="canvas" />
            <span className="h-8 w-8 rounded-full border border-[var(--border-subtle)]" style={{ background: accent }} title="accent" />
            <span className="flex h-8 items-center rounded-full bg-pill px-3 font-mono text-[11px] text-ink" title="radius + blur">
              {radius} · {blur}
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}
