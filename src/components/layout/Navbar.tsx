"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "/#about", label: "About", section: "about" },
  { href: "/#projects", label: "Projects", section: "projects" },
  { href: "/projects", label: "Archive", section: null },
  { href: "/#skills", label: "Skills", section: "skills" },
  { href: "/#journey", label: "Journey", section: "journey" },
  { href: "/#contact", label: "Contact", section: "contact" },
];

const TRACKED_SECTIONS = ["about", "projects", "skills", "journey", "contact"];

export function Navbar({
  showCommandPill = true,
  availability = null,
}: {
  showCommandPill?: boolean;
  availability?: { text: string } | null;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  function openPalette() {
    setOpen(false);
    window.dispatchEvent(new CustomEvent("command-palette-open"));
  }

  // Razor-thin scroll progress: ref-driven (no re-renders), rAF-throttled.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        const pct = max > 0 ? Math.min(1, Math.max(0, h.scrollTop / max)) : 0;
        if (progressRef.current) {
          progressRef.current.style.transform = `scaleX(${pct})`;
        }
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Active-section pill: observes only sections that actually rendered
  // (admin visibility toggles may hide any of them).
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    TRACKED_SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <div className="sticky top-4 z-50 mx-auto max-w-4xl px-4">
      <header className="glass-bar relative overflow-hidden rounded-full border border-[var(--border-subtle)] shadow-sm">
        <nav
          aria-label="Primary"
          className="flex h-12 items-center justify-between px-4"
        >
          <Link
            href="/"
            className="font-mono text-sm font-semibold tracking-tight text-ink"
            aria-label="Prince Raj (Geet-Prince) home"
          >
            geetprince<span className="text-accent-blue">.me</span>
          </Link>
          <ul className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <li key={l.href + l.label}>
                <Link
                  href={l.href}
                  aria-current={l.section && active === l.section ? "true" : undefined}
                  className={`rounded-full px-3 py-1 text-[13px] font-medium transition-colors ${
                    l.section && active === l.section
                      ? "bg-[var(--bg-elevated)] text-ink"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            {showCommandPill && (
              <li>
                <button
                  type="button"
                  onClick={openPalette}
                  aria-label="Open command palette (Control or Command K)"
                  className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-1 font-mono text-[11px] text-muted transition-colors hover:text-ink"
                >
                  ⌘K
                </button>
              </li>
            )}
            <li>
              <Link
                href="/#contact"
                className="rounded-full bg-[var(--accent-fill)] px-4 py-1.5 text-[13px] font-semibold text-white transition-all hover:scale-[1.03] hover:bg-[var(--accent-fill-hover)]"
              >
                Hire me
              </Link>
            </li>
            {availability && (
              <li aria-label={`Availability: ${availability.text}`}>
                <span
                  title={availability.text}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 text-[11px] font-medium text-muted"
                >
                  <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-accent-emerald" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-emerald" />
                  </span>
                  Available
                </span>
              </li>
            )}
          </ul>
          <button
            type="button"
            className="rounded-lg p-2 text-ink md:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>
        <span
          aria-hidden="true"
          ref={progressRef}
          className="absolute bottom-0 left-0 h-[1.5px] w-full origin-left scale-x-0 bg-accent-blue"
        />
      </header>
      {open && (
        <ul className="glass-bar mt-2 rounded-2xl border border-[var(--border-subtle)] px-5 py-3 shadow-sm md:hidden">
          {availability && (
            <li aria-label={`Availability: ${availability.text}`}>
              <span className="inline-flex items-center gap-1.5 py-2 text-[13px] font-medium text-muted">
                <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-accent-emerald" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-emerald" />
                </span>
                {availability.text}
              </span>
            </li>
          )}
          {LINKS.map((l) => (
            <li key={l.href + l.label}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block rounded-lg py-2.5 text-sm font-medium transition-colors ${
                  l.section && active === l.section
                    ? "bg-[var(--bg-elevated)] px-3 text-ink"
                    : "text-ink"
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
