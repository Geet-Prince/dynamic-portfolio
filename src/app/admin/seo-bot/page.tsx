import { getCrawlerVisits, getCustomKeywords, getSerpLogs, getSiteData, getTrackedKeywords } from "@/lib/data-fetcher";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { ScanButton } from "@/components/admin/ScanButton";
import { SimulateVisitButton } from "@/components/admin/SimulateVisitButton";
import { KeywordManager } from "@/components/admin/KeywordManager";
import { BotConfigPanel } from "@/components/admin/BotConfigPanel";
import { getBotConfigPublic, TARGET_QUERIES, seoHealthAudit, simulateHistory } from "@/lib/seo-bot";
import { formatDate } from "@/lib/utils";
import type { SerpLog } from "@/lib/types";

export const dynamic = "force-dynamic";

const CARD_QUERIES = ["geetprince", "Prince Raj", "NIET Prince Raj"];

/** Inline-SVG trend sparkline — no chart library, zero bundle cost. */
function Sparkline({ points }: { points: Array<number | null> }) {
  const W = 140;
  const H = 40;
  const vals = points.map((r) => (r == null ? null : Math.min(10, Math.max(1, r))));
  const coords = vals.map((v, i) => {
    const x = (i / Math.max(1, vals.length - 1)) * (W - 8) + 4;
    const y = v == null ? null : 4 + ((v - 1) / 9) * (H - 8);
    return { x, y };
  });
  // Split into contiguous segments so missing ranks render as gaps.
  const segments: Array<Array<{ x: number; y: number }>> = [];
  for (const c of coords) {
    if (c.y == null) {
      segments.push([]);
    } else {
      if (segments.length === 0 || segments[segments.length - 1].length === 0) {
        if (segments.length === 0 || segments[segments.length - 1].length > 0) segments.push([]);
      }
      segments[segments.length - 1].push({ x: c.x, y: c.y as number });
    }
  }
  const lines = segments.filter((s) => s.length > 1);
  const dots = segments.filter((s) => s.length === 1).flat();
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Rank trend, lower is better">
      {[1, 5, 10].map((r) => {
        const y = 4 + ((r - 1) / 9) * (H - 8);
        return <line key={r} x1={0} x2={W} y1={y} y2={y} stroke="currentColor" strokeOpacity={0.12} strokeWidth={1} />;
      })}
      {lines.map((seg, i) => (
        <polyline
          key={i}
          points={seg.map((c) => `${c.x},${c.y}`).join(" ")}
          fill="none"
          stroke="var(--accent-blue)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {dots.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={2.5} fill="var(--accent-blue)" />
      ))}
    </svg>
  );
}

function RankBadge({ rank }: { rank: number | null }) {
  if (rank == null) return <span className="pill">not in top 10</span>;
  const color =
    rank <= 3 ? "text-accent-emerald" : rank <= 6 ? "text-accent-blue" : "text-muted";
  return <span className={`font-mono text-3xl font-bold ${color}`}>#{rank}</span>;
}

export default async function SeoBotPage() {
  const [logs, visits, site, customs, tracked, botPublic] = await Promise.all([
    getSerpLogs(200),
    getCrawlerVisits(50),
    getSiteData(),
    getCustomKeywords(),
    getTrackedKeywords(),
    getBotConfigPublic(),
  ]);
  const live = isSupabaseConfigured();
  const hasSnapshots = logs.length > 0;
  const lastTelemetry = botPublic.lastTelemetry;
  const lastLive = lastTelemetry != null && lastTelemetry.provider !== "simulated";

  // Latest snapshot per keyword (logs are newest-first).
  const latestByKeyword = new Map<string, SerpLog>();
  for (const l of logs) {
    if (!latestByKeyword.has(l.keyword)) latestByKeyword.set(l.keyword, l);
  }
  // Chronological history per keyword (last 14 points).
  const historyByKeyword = new Map<string, Array<number | null>>();
  for (const q of tracked) {
    const pts = logs
      .filter((l) => l.keyword === q)
      .slice(0, 14)
      .reverse()
      .map((l) => l.domain_rank);
    historyByKeyword.set(
      q,
      hasSnapshots && pts.length > 0 ? pts : simulateHistory(q).map((h) => h.rank)
    );
  }

  const audit = seoHealthAudit({
    title: "Prince Raj (Geet-Prince) — Software Engineer & Data Science | NIET Greater Noida",
    description: site.profile.subheadline,
    keywords: site.profile.seo_keywords,
    h1: `Prince Raj (Geet-Prince) — ${site.profile.headline}`,
    projectCount: site.projects.length,
    projectsWithAlt: site.projects.length,
  });
  const passing = audit.filter((a) => a.pass).length;
  const restQueries = tracked.filter((q) => !CARD_QUERIES.includes(q));

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">GEET-SENTINEL</h1>
          <p className="mb-1 mt-1 text-sm text-muted">
            Daily Google India rank tracking + real-time search & AI bot telemetry.
          </p>
          <p className="font-mono text-xs text-subtle">
            {live ? (
              <>● {hasSnapshots ? `${logs.length} snapshots` : "connected — no snapshots yet"} · cron 0 18 * * * UTC</>
            ) : (
              <>○ local persistence active — scans, visits & keywords stored in data/portfolio-store.json</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ScanButton />
          <ScanButton mode="scan-revalidate" />
        </div>
      </div>

      {lastTelemetry && (
        <p className="mt-4">
          {lastLive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-emerald/15 px-3 py-1 font-mono text-xs font-semibold text-accent-emerald">
              <span aria-hidden="true">●</span> LAST SCAN: LIVE GOOGLE SERP ({lastTelemetry.provider})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 font-mono text-xs font-semibold text-amber-600">
              <span aria-hidden="true">●</span> LAST SCAN: SIMULATED SERP + LIVE ENDPOINT TELEMETRY
            </span>
          )}
        </p>
      )}

      <div className="mt-6">
        <BotConfigPanel
          status={{
            live: botPublic.hasSerperKey,
            keySource: botPublic.keySource,
            serperHint: botPublic.serperHint,
            hasCse: botPublic.hasCse,
            keywords: botPublic.targetKeywords,
            autoPing: botPublic.autoPingIndexnow,
            indexnowConfigured: botPublic.indexnowConfigured,
          }}
        />
      </div>

      {/* Keyword position cards */}
      <h2 className="mb-3 mt-8 font-mono text-xs font-medium uppercase tracking-[0.18em] text-subtle">
        Keyword positions · geetprince.me
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        {CARD_QUERIES.map((q) => {
          const latest = latestByKeyword.get(q);
          const pts = historyByKeyword.get(q) ?? [];
          return (
            <article key={q} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-ambient">
              <p className="font-mono text-xs text-subtle">“{q}”</p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div>
                  <RankBadge rank={latest?.domain_rank ?? pts[pts.length - 1] ?? null} />
                  <p className="mt-1 font-mono text-[11px] text-subtle">
                    {latest
                      ? `checked ${formatDate(latest.checked_at)}`
                      : "simulated · today"}
                    {latest?.simulated ? " · simulated" : ""}
                  </p>
                </div>
                <div className="text-ink">
                  <Sparkline points={pts} />
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--border-subtle)] pt-3 font-mono text-[11px]">
                <div>
                  <dt className="text-subtle">progex</dt>
                  <dd className="text-ink">#{latest?.subdomain_rank ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-subtle">github</dt>
                  <dd className="text-ink">#{latest?.github_rank ?? "—"}</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>

      {/* Remaining tracked queries (defaults + customs) */}
      <h2 className="mb-3 mt-8 font-mono text-xs font-medium uppercase tracking-[0.18em] text-subtle">
        Also tracked
      </h2>
      <ul className="flex flex-wrap gap-2">
        {restQueries.map((q) => {
          const latest = latestByKeyword.get(q);
          return (
            <li key={q} className="pill !py-1.5">
              “{q}” <span className="ml-1 font-bold">#{latest?.domain_rank ?? historyByKeyword.get(q)?.slice(-1)[0] ?? "—"}</span>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <KeywordManager customs={customs} />
          <SimulateVisitButton />
        </div>

        {/* Crawler feed */}
        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-ambient">
          <h2 className="text-base font-semibold text-ink">Bot visit feed</h2>
          <p className="mb-4 mt-1 text-[13px] text-muted">
            Googlebot, Applebot & AI answer-engine crawls of <span className="font-mono">/</span>,{" "}
            <span className="font-mono">/projects/*</span> and <span className="font-mono">/llms.txt</span>.
          </p>
          {visits.length === 0 ? (
            <p className="rounded-xl bg-pill p-4 text-[13px] text-muted">
              No visits logged yet. Real crawls are trapped by the middleware automatically —
              or fire a <strong>Simulate crawler visit</strong> test on the left.
            </p>
          ) : (
            <ol className="max-h-96 space-y-2 overflow-y-auto">
              {visits.map((v) => (
                <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-pill px-3 py-2">
                  <span className="text-[13px] font-semibold text-ink">
                    {v.bot_name}
                    <span className="ml-2 rounded-full bg-[var(--bg-surface)] px-2 py-0.5 font-mono text-[11px] font-normal text-muted">
                      {v.bot_category}
                    </span>
                  </span>
                  <span className="font-mono text-[11px] text-subtle">
                    {v.path_visited} · {formatDate(v.visited_at)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {/* Live endpoint telemetry (real network checks from the last scan) */}
      <section className="mt-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-ambient">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold text-ink">Live endpoint telemetry</h2>
          {lastTelemetry ? (
            <p className="font-mono text-xs text-subtle">measured {formatDate(lastTelemetry.at)}</p>
          ) : (
            <p className="font-mono text-xs text-subtle">no scan yet — run one above</p>
          )}
        </div>
        {!lastTelemetry ? (
          <p className="mt-3 rounded-xl bg-pill p-4 text-[13px] text-muted">
            Endpoint latency, GitHub authority, and IndexNow outcomes appear here after the first scan.
          </p>
        ) : (
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <ul className="space-y-2">
              {lastTelemetry.endpoints.map((e) => (
                <li key={e.url} className="flex items-center justify-between gap-3 rounded-xl bg-pill px-3 py-2">
                  <span className="text-[13px] font-medium text-ink">
                    {e.label}
                    <span className="ml-2 font-mono text-[11px] font-normal text-subtle">{e.url.replace("https://", "")}</span>
                  </span>
                  <span className={`font-mono text-xs font-semibold ${e.ok ? "text-accent-emerald" : "text-red-500"}`}>
                    {e.ok ? `● ${e.status} · ${e.latency_ms}ms` : `○ ${e.error ?? `HTTP ${e.status ?? "—"}`}`}
                  </span>
                </li>
              ))}
            </ul>
            <ul className="space-y-2">
              <li className="flex items-center justify-between gap-3 rounded-xl bg-pill px-3 py-2">
                <span className="text-[13px] font-medium text-ink">GitHub @Geet-Prince</span>
                <span className="font-mono text-xs text-muted">
                  {lastTelemetry.github.ok
                    ? `${lastTelemetry.github.public_repos ?? "—"} repos · ${lastTelemetry.github.followers ?? "—"} followers`
                    : (lastTelemetry.github.error ?? "unreachable")}
                </span>
              </li>
              <li className="flex items-center justify-between gap-3 rounded-xl bg-pill px-3 py-2">
                <span className="text-[13px] font-medium text-ink">IndexNow sitemap ping</span>
                <span className="font-mono text-xs text-muted">
                  {!lastTelemetry.indexnow.attempted
                    ? (lastTelemetry.indexnow.skipped_reason ?? "skipped")
                    : lastTelemetry.indexnow.ok
                      ? `sent · HTTP ${lastTelemetry.indexnow.status}`
                      : (lastTelemetry.indexnow.skipped_reason ?? "failed")}
                </span>
              </li>
              <li className="flex items-center justify-between gap-3 rounded-xl bg-pill px-3 py-2">
                <span className="text-[13px] font-medium text-ink">SERP provider</span>
                <span className={`font-mono text-xs font-semibold ${lastLive ? "text-accent-emerald" : "text-amber-600"}`}>
                  {lastLive ? `LIVE · ${lastTelemetry.provider}` : "SIMULATED"}
                </span>
              </li>
            </ul>
          </div>
        )}
      </section>

      {/* SEO health audit */}
      <section className="mt-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-ambient">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-ink">On-page SEO health</h2>
          <p className="font-mono text-xs text-accent-emerald">
            {passing}/{audit.length} passing
          </p>
        </div>
        <ul className="mt-4 grid gap-2 md:grid-cols-2">
          {audit.map((a) => (
            <li key={a.label} className="flex items-start gap-2.5 text-sm">
              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px] ${
                  a.pass ? "bg-accent-emerald/15 text-accent-emerald" : "bg-red-500/10 text-red-600"
                }`}
              >
                {a.pass ? "✓" : "!"}
              </span>
              <span>
                <span className="font-medium text-ink">{a.label}</span>
                <span className="block font-mono text-[11px] text-subtle">{a.detail}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 font-mono text-[11px] text-subtle">
          Defaults tracked: {TARGET_QUERIES.map((q) => `“${q}”`).join(" · ")}
          {customs.length > 0 && <> + {customs.length} custom</>}
        </p>
      </section>
    </div>
  );
}
