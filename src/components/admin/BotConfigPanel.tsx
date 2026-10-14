"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, KeyRound, Rocket } from "lucide-react";
import { saveBotConfig, saveBotConfigAndScan } from "@/lib/supabase/actions";

export interface BotPanelStatus {
  live: boolean;
  keySource: "env" | "vault" | "none";
  serperHint: string | null;
  hasCse: boolean;
  keywords: string[];
  autoPing: boolean;
  indexnowConfigured: boolean;
}

interface ScanTelemetrySummary {
  at: string;
  endpoints: Array<{ label: string; ok: boolean; status: number | null; latency_ms: number | null; error: string | null }>;
  githubOk: boolean;
  githubRepos: number | null;
  githubFollowers: number | null;
  indexnow: { attempted: boolean; ok: boolean; status: number | null; skipped_reason: string | null };
}

export function BotConfigPanel({ status }: { status: BotPanelStatus }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<{
    provider: string;
    keySource: string;
    scanned: number;
    telemetry: ScanTelemetrySummary;
  } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [curlCopied, setCurlCopied] = useState(false);
  const router = useRouter();

  function submit(runScan: boolean) {
    const form = formRef.current;
    if (!form) return;
    setMsg(null);
    setLastScan(null);
    const fd = new FormData(form);
    start(async () => {
      const res = runScan ? await saveBotConfigAndScan(fd) : await saveBotConfig(fd);
      if (!res.ok) {
        setMsg(`Error: ${res.error}`);
        return;
      }
      if (runScan && "summary" in res && res.summary) {
        const r = res as unknown as {
          provider: string;
          keySource: string;
          scanned: number;
          telemetry: ScanTelemetrySummary;
        };
        setLastScan({ provider: r.provider, keySource: r.keySource, scanned: r.scanned, telemetry: r.telemetry });
        const live = r.provider !== "simulated";
        setMsg(
          live
            ? `LIVE Google India SERP active via ${r.provider} (${r.keySource === "env" ? ".env.local" : "in-admin vault"}). ${r.scanned} queries scanned.`
            : `Saved. Still in diagnostic mode (simulated SERP) + live endpoint telemetry — paste a Serper key above for real Google data.`
        );
      } else {
        setMsg("Configuration saved. Effective on the next scan — no restart needed.");
      }
      router.refresh();
    });
  }

  function copyCurl() {
    const cmd = `curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://geetprince.me/api/cron/seo-bot`;
    try {
      void navigator.clipboard?.writeText(cmd).then(
        () => {
          setCurlCopied(true);
          setTimeout(() => setCurlCopied(false), 1600);
        },
        () => setCurlCopied(false)
      );
    } catch {
      setCurlCopied(false);
    }
  }

  const live = lastScan ? lastScan.provider !== "simulated" : status.live;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-ambient">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-ink">Bot Configuration & Live SERP Activation</h2>
          {live ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-emerald/15 px-3 py-1 font-mono text-xs font-semibold text-accent-emerald">
              <span aria-hidden="true">●</span> LIVE GOOGLE SERP
              {lastScan ? ` · ${lastScan.provider}` : status.keySource === "env" ? " · .env.local" : " · vault"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 font-mono text-xs font-semibold text-amber-600">
              <span aria-hidden="true">●</span> SIMULATED SERP + LIVE ENDPOINT TELEMETRY
            </span>
          )}
        </div>
        {!status.live && (
          <p className="mt-2 text-[13px] text-muted">
            Diagnostic mode: SERP ranks are date-seeded simulations, but every scan still performs{" "}
            <strong>real live checks</strong> (site latency, sitemap, GitHub). Paste a free{" "}
            <a href="https://serper.dev" target="_blank" rel="noopener" className="font-semibold text-accent-blue hover:underline">
              serper.dev
            </a>{" "}
            key below (2,500 free searches) for real Google India data — no restart needed.
          </p>
        )}

        <form ref={formRef} onSubmit={(e) => e.preventDefault()} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="serper_api_key" className="mb-1.5 block text-[13px] font-medium text-ink">
                Serper.dev API key{" "}
                {status.serperHint && (
                  <span className="font-mono text-xs font-normal text-subtle">(stored: {status.serperHint})</span>
                )}
              </label>
              <input
                id="serper_api_key"
                name="serper_api_key"
                type="password"
                autoComplete="off"
                placeholder={status.serperHint ? "Blank keeps current key" : "Paste key — sk-…"}
                className="input-apple font-mono"
              />
            </div>
            <div className="grid grid-cols-[1fr_auto] items-end gap-2">
              <div>
                <label htmlFor="google_cse_api_key" className="mb-1.5 block text-[13px] font-medium text-ink">
                  Google CSE key {status.hasCse && <span className="font-mono text-xs font-normal text-subtle">(stored)</span>}
                </label>
                <input
                  id="google_cse_api_key"
                  name="google_cse_api_key"
                  type="password"
                  autoComplete="off"
                  placeholder="Optional fallback"
                  className="input-apple font-mono"
                />
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="google_cse_cx" className="mb-1.5 block text-[13px] font-medium text-ink">
              Google CSE search-engine ID (cx)
            </label>
            <input
              id="google_cse_cx"
              name="google_cse_cx"
              type="text"
              autoComplete="off"
              placeholder="Optional fallback"
              className="input-apple font-mono"
            />
          </div>
          <div>
            <label htmlFor="target_keywords" className="mb-1.5 block text-[13px] font-medium text-ink">
              Base target keywords <span className="font-normal text-subtle">(one per line — overrides the 5 defaults)</span>
            </label>
            <textarea
              id="target_keywords"
              name="target_keywords"
              rows={5}
              defaultValue={status.keywords.join("\n")}
              placeholder={"geetprince\nPrince Raj\nNIET Prince Raj"}
              className="input-apple font-mono !text-[13px]"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              name="auto_ping_indexnow"
              defaultChecked={status.autoPing}
              className="h-4 w-4 accent-[#0066CC]"
            />
            Auto-ping IndexNow on every scan {status.indexnowConfigured ? "(key configured)" : "(key auto-generated on first scan)"}
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => submit(false)} disabled={pending} className="btn-secondary !py-2.5 disabled:opacity-60">
              <KeyRound size={15} aria-hidden="true" />
              {pending ? "Saving…" : "Save configuration"}
            </button>
            <button type="button" onClick={() => submit(true)} disabled={pending} className="btn-primary !py-2.5 disabled:opacity-60">
              <Rocket size={15} aria-hidden="true" />
              {pending ? "Saving & scanning…" : "Save Key & Run Live Google Scan"}
            </button>
          </div>
          {msg && (
            <p role="status" className="text-sm text-muted">
              {msg}
            </p>
          )}
        </form>

        {lastScan && (
          <div className="mt-5 rounded-xl bg-pill p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">
              Last scan · {lastScan.provider} · {lastScan.scanned} queries
            </p>
            <ul className="mt-2 space-y-1 text-[13px]">
              {lastScan.telemetry.endpoints.map((e) => (
                <li key={e.label} className="flex items-center justify-between gap-3">
                  <span className="text-ink">{e.label}</span>
                  <span className={`font-mono text-xs ${e.ok ? "text-accent-emerald" : "text-red-500"}`}>
                    {e.ok ? `● ${e.status} · ${e.latency_ms}ms` : `○ ${e.error ?? `HTTP ${e.status ?? "—"}`}`}
                  </span>
                </li>
              ))}
              <li className="flex items-center justify-between gap-3">
                <span className="text-ink">GitHub @Geet-Prince</span>
                <span className="font-mono text-xs text-muted">
                  {lastScan.telemetry.githubOk
                    ? `${lastScan.telemetry.githubRepos} repos · ${lastScan.telemetry.githubFollowers} followers`
                    : "unreachable"}
                </span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="text-ink">IndexNow</span>
                <span className="font-mono text-xs text-muted">
                  {!lastScan.telemetry.indexnow.attempted
                    ? lastScan.telemetry.indexnow.skipped_reason ?? "skipped"
                    : lastScan.telemetry.indexnow.ok
                      ? `pinged · HTTP ${lastScan.telemetry.indexnow.status}`
                      : (lastScan.telemetry.indexnow.skipped_reason ?? "failed")}
                </span>
              </li>
            </ul>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-ambient">
        <h2 className="text-base font-semibold text-ink">Cron schedule & webhook inspector</h2>
        <dl className="mt-3 space-y-2 font-mono text-[13px]">
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-subtle">Schedule</dt>
            <dd className="text-ink">Daily 18:00 UTC · 11:30 PM IST (`0 18 * * *`)</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-subtle">vercel.json cron</dt>
            <dd className="text-accent-emerald">● present in repo</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-subtle">GitHub Actions backup</dt>
            <dd className="text-accent-emerald">● .github/workflows/daily-seo-bot.yml present</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-subtle">Endpoint</dt>
            <dd className="text-ink">GET /api/cron/seo-bot</dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={copyCurl}
          className="btn-secondary mt-4 !px-4 !py-2 !text-[13px]"
        >
          <Copy size={14} aria-hidden="true" />
          {curlCopied ? "Copied!" : "Copy cURL command"}
        </button>
        <p className="mt-2 font-mono text-[11px] text-subtle">
          Uses `Authorization: Bearer YOUR_CRON_SECRET` — take the value from `.env.local` CRON_SECRET or the vault secret shown to admins. Never commit it.
        </p>
      </section>
    </div>
  );
}
