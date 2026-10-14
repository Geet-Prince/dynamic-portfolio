"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { simulateCrawlerVisit } from "@/lib/supabase/actions";

const BOTS = [
  "Googlebot",
  "Bingbot",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
  "Applebot",
];

const PATHS = ["/", "/llms.txt", "/llms-full.txt", "/projects", "/projects/progex"];

/** Fire a synthetic bot visit through the real ingest path to test the trap end-to-end. */
export function SimulateVisitButton() {
  const [bot, setBot] = useState("Googlebot");
  const [path, setPath] = useState("/");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  function run() {
    setMsg(null);
    const fd = new FormData();
    fd.set("bot", bot);
    fd.set("path", path);
    start(async () => {
      const res = await simulateCrawlerVisit(fd);
      if (res.ok) {
        setMsg(`Simulated ${bot} visit to ${path} logged — check the feed below.`);
        router.refresh();
      } else {
        setMsg(`Error: ${res.error}`);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-ambient">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
        <FlaskConical size={15} aria-hidden="true" /> Simulate crawler visit
      </h3>
      <p className="mb-3 mt-1 text-xs text-muted">
        Tests the middleware trap + ingest route without waiting for a real crawl.
      </p>
      <div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="sim-bot">Bot</label>
        <select id="sim-bot" value={bot} onChange={(e) => setBot(e.target.value)} className="input-apple !w-auto font-mono !text-[13px]">
          {BOTS.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="sim-path">Path</label>
        <select id="sim-path" value={path} onChange={(e) => setPath(e.target.value)} className="input-apple !w-auto font-mono !text-[13px]">
          {PATHS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <button type="button" onClick={run} disabled={pending} className="btn-secondary !py-2 !text-[13px] disabled:opacity-60">
          {pending ? "Logging…" : "Simulate visit"}
        </button>
      </div>
      {msg && (
        <p role="status" className="mt-2 text-[13px] text-muted">
          {msg}
        </p>
      )}
    </div>
  );
}
