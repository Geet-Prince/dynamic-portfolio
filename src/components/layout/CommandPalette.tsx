"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export interface PaletteCommand {
  id: string;
  group: "Navigate" | "Actions" | "Filter projects";
  title: string;
  hint?: string;
  keywords: string;
  run: () => void;
}

function buildCommands(opts: {
  resumeUrl: string | null;
  email: string;
  progexUrl: string;
  techs: string[];
  navigate: (href: string) => void;
}): PaletteCommand[] {
  const { resumeUrl, email, progexUrl, techs, navigate } = opts;
  const go = (id: string) => () => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const list: PaletteCommand[] = [
    { id: "about", group: "Navigate", title: "About — Bento identity grid", keywords: "about prince bio niet", run: go("about") },
    { id: "projects", group: "Navigate", title: "Featured projects", keywords: "projects work portfolio progex eventify verse", run: go("projects") },
    { id: "skills", group: "Navigate", title: "Skills matrix", keywords: "skills stack java python react", run: go("skills") },
    { id: "journey", group: "Navigate", title: "Journey & credentials", keywords: "journey education aws hackathon timeline niet", run: go("journey") },
    { id: "contact", group: "Navigate", title: "Contact Prince", keywords: "contact email hire message", run: go("contact") },
    { id: "aeo", group: "Navigate", title: "Verified answers (AEO dossier)", keywords: "faq answers questions who what where dossier", run: go("aeo") },
    { id: "archive", group: "Navigate", title: "Full project archive", keywords: "archive all projects", run: () => navigate("/projects") },
    {
      id: "progex",
      group: "Actions",
      title: "Open Progex analytics platform",
      hint: "progex.geetprince.me",
      keywords: "progex analytics dsa live demo",
      run: () => window.open(progexUrl, "_blank", "noopener"),
    },
    ...(resumeUrl
      ? [
          {
            id: "resume",
            group: "Actions" as const,
            title: "Download resume (PDF)",
            keywords: "resume cv pdf download",
            run: () => {
              const a = document.createElement("a");
              a.href = resumeUrl;
              a.download = "";
              document.body.appendChild(a);
              a.click();
              a.remove();
            },
          },
        ]
      : []),
    {
      id: "copy-email",
      group: "Actions",
      title: "Copy email address",
      hint: email,
      keywords: "copy email mail contact",
      run: () => navigator.clipboard?.writeText(email).catch(() => {}),
    },
    {
      id: "xray",
      group: "Actions",
      title: "Toggle Architecture X-Ray view",
      keywords: "xray architecture system engineering executive toggle",
      run: () => window.dispatchEvent(new CustomEvent("xray-toggle")),
    },
    ...techs.map((t) => ({
      id: `tech-${t}`,
      group: "Filter projects" as const,
      title: `Show ${t} projects`,
      hint: "/projects",
      keywords: `${t} filter stack`,
      run: () => navigate(`/projects?tech=${encodeURIComponent(t)}`),
    })),
  ];
  return list;
}

/**
 * Apple Spotlight-style command palette. Lazy-mounted: renders nothing until
 * first opened, so the Lighthouse JS cost is ~0. All data arrives via props
 * (server-computed) — never fetched in useEffect.
 */
export function CommandPalette({
  resumeUrl,
  email,
  progexUrl,
  techs,
}: {
  resumeUrl: string | null;
  email: string;
  progexUrl: string;
  techs: string[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const openRef = useRef(false);
  const router = useRouter();

  function setOpenBoth(v: boolean) {
    openRef.current = v;
    if (v) {
      setQuery("");
      setActive(0);
    }
    setOpen(v);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpenBoth(!openRef.current);
      } else if (e.key === "Escape") {
        setOpenBoth(false);
      }
    }
    function onOpen() {
      setOpenBoth(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("command-palette-open", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("command-palette-open", onOpen);
    };
  }, []);

  const commands = useMemo(
    () =>
      buildCommands({
        resumeUrl,
        email,
        progexUrl,
        techs,
        navigate: (href) => router.push(href),
      }),
    [resumeUrl, email, progexUrl, techs, router]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) =>
      `${c.title} ${c.keywords} ${c.group}`.toLowerCase().includes(q)
    );
  }, [commands, query]);

  // Clamped during render (no effect): the highlight can never dangle past the list.
  const safeActive = filtered.length === 0 ? 0 : Math.min(active, filtered.length - 1);

  if (!open) return null;

  const groups: Array<PaletteCommand["group"]> = ["Navigate", "Actions", "Filter projects"];

  function runAt(i: number) {
    const cmd = filtered[i];
    if (!cmd) return;
    setOpenBoth(false);
    // Let the dialog unmount before navigating/scrolling.
    setTimeout(() => cmd.run(), 30);
  }

  return (
    <div
      className="cmdk-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpenBoth(false);
      }}
    >
      <div className="cmdk-panel" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-4">
          <span aria-hidden="true" className="font-mono text-sm text-subtle">⌘K</span>
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, filtered.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                runAt(safeActive);
              }
            }}
            placeholder="Jump to a section, filter projects, copy email…"
            aria-label="Search commands"
            role="combobox"
            aria-expanded="true"
            aria-controls="cmdk-list"
            aria-activedescendant={filtered[safeActive] ? `cmdk-${filtered[safeActive].id}` : undefined}
            className="w-full bg-transparent py-3.5 text-sm text-ink placeholder:text-subtle focus:outline-none"
          />
          <kbd className="rounded-md bg-pill px-1.5 py-0.5 font-mono text-[11px] text-subtle">esc</kbd>
        </div>
        <ul id="cmdk-list" role="listbox" aria-label="Commands" className="max-h-[320px] overflow-y-auto p-2">
          {groups.map((g) => {
            const items = filtered.filter((c) => c.group === g);
            if (items.length === 0) return null;
            return (
              <li key={g}>
                <p className="px-3 pb-1 pt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-subtle" aria-hidden="true">
                  {g}
                </p>
                <ul>
                {items.map((c) => {
                  const idx = filtered.indexOf(c);
                  return (
                    <li
                      key={c.id}
                      id={`cmdk-${c.id}`}
                      role="option"
                      aria-selected={idx === safeActive}
                      data-active={idx === safeActive}
                      className="cmdk-item flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2"
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => runAt(idx)}
                    >
                      <span className="cmdk-title text-sm font-medium text-ink">{c.title}</span>
                      {c.hint && (
                        <span className="truncate font-mono text-[11px] text-subtle">{c.hint}</span>
                      )}
                    </li>
                  );
                })}
                </ul>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted">
              No matches for “{query}”.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
