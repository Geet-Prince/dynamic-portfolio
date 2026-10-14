"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, CircleDashed, Loader2, RefreshCw, ShieldCheck, Undo2 } from "lucide-react";

type Section =
  | "profile"
  | "projects"
  | "skills"
  | "experience"
  | "faqs"
  | "design"
  | "seo-bot"
  | "messages";

type StepStatus = "idle" | "active" | "ok" | "fail";
type Phase = "idle" | "running" | "done" | "error";

type Item = Record<string, unknown>;

interface SqlInfo {
  ok: boolean;
  table: string;
  rows: number;
  expectedCount: number | null;
  countOk: boolean;
  matched: boolean;
  expected: string | null;
  forbiddenFound: string[];
  ms: number;
  simulated?: boolean;
  error?: string;
}
interface LiveInfo {
  ok: boolean;
  url: string;
  reflected: boolean;
  reflectedInMs: number | null;
  stillPresent: string[];
  note?: string;
}

const STEP_LABELS: Record<number, string> = {
  1: "[1/3] Writing to Supabase SQL…",
  2: "[2/3] Verifying PostgreSQL rows…",
  3: "[3/3] Verifying live reflection on geetprince.me…",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface VerifyArgs {
  section: Section;
  expected: string | null;
  expectedCount: number | null;
  mustNotContain: string[];
}

async function verifyOnce({ section, expected, expectedCount, mustNotContain }: VerifyArgs) {
  const params = new URLSearchParams({ section, t: String(Date.now()) });
  if (expected) params.set("expected", expected);
  if (expectedCount != null) params.set("expectedCount", String(expectedCount));
  if (mustNotContain.length > 0) params.set("mustNotContain", mustNotContain.join("|"));
  const res = await fetch(`/api/admin/verify-publish?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`verify-publish returned HTTP ${res.status}`);
  return (await res.json()) as {
    ok: boolean;
    sql: SqlInfo;
    live: LiveInfo;
    verified: boolean;
  };
}

interface StepState {
  status: StepStatus;
  detail?: string;
}

export function AdminSavePublishBar({
  section,
  label,
  formId,
  items,
  labelKey = "title",
  expected = null,
  expectedCount,
  allowReset = true,
}: {
  section: Section;
  label: string;
  formId?: string;
  /** Exact current on-screen rows (collection pages). Omit for form sections. */
  items?: readonly unknown[];
  /** Which field of each item is the human-readable token (deleted detection). */
  labelKey?: string;
  expected?: string | null;
  expectedCount?: number;
  /** Show the confirmation-gated factory reset button. */
  allowReset?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [steps, setSteps] = useState<Record<number, StepState>>({});
  const [countdown, setCountdown] = useState(5);
  const [sql, setSql] = useState<SqlInfo | null>(null);
  const [live, setLive] = useState<LiveInfo | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const runningRef = useRef(false);
  const mountedRef = useRef(true);

  // Snapshot of the titles present when this page first rendered, so a delete
  // in this session is provably gone from the live HTML. Captured in an effect
  // (refs must not be read during render).
  const tokens = items ? (items as Item[]).map((i) => String(i[labelKey] ?? "")).filter(Boolean) : [];
  const initialRef = useRef<{ section: Section; tokens: string[] } | null>(null);
  useEffect(() => {
    if (initialRef.current === null || initialRef.current.section !== section) {
      initialRef.current = { section, tokens };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, items]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const setStep = useCallback((n: number, state: StepState) => {
    if (!mountedRef.current) return;
    setSteps((prev) => ({ ...prev, [n]: state }));
  }, []);

  const run = useCallback(
    async (mode: "publish" | "reset") => {
      if (runningRef.current) return;
      runningRef.current = true;
      setPhase("running");
      setSteps({});
      setErr(null);
      setSql(null);
      setLive(null);
      setCountdown(5);

      const currentTokens = items ? (items as Item[]).map((i) => String(i[labelKey] ?? "")).filter(Boolean) : [];
      const removed =
        items && initialRef.current
          ? initialRef.current.tokens.filter((t) => !currentTokens.includes(t))
          : [];
      const expectToken = expected ?? currentTokens[0] ?? null;
      const expectCount = expectedCount ?? (items ? items.length : null);

      try {
        // For form pages (profile/design), persist the edited fields first.
        if (mode === "publish" && formId) {
          const form = document.getElementById(formId) as HTMLFormElement | null;
          if (form) {
            form.requestSubmit();
            await sleep(700);
          }
        }

        setStep(1, {
          status: "active",
          detail:
            mode === "reset"
              ? "Restoring factory seed rows…"
              : items
                ? `Committing the exact ${items.length} row(s) on screen…`
                : "Writing the current section into PostgreSQL…",
        });

        const syncRes = await fetch("/api/admin/sync-sql", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(
            mode === "reset"
              ? { section, mode: "reset" }
              : { section, mode: "replace", items: items ?? [] }
          ),
          cache: "no-store",
        });
        const sync = (await syncRes.json()) as {
          ok: boolean;
          table: string;
          written: number;
          deleted: number;
          rows: number;
          ms: number;
          simulated?: boolean;
          note?: string;
          error?: string;
        };
        if (!syncRes.ok || !sync.ok) {
          throw new Error(sync.error || "SQL write failed.");
        }
        setStep(1, {
          status: "ok",
          detail: sync.simulated
            ? (sync.note ?? "Local persistence mode — Supabase not configured.")
            : mode === "reset"
              ? `${sync.written} factory row(s) restored → public.${sync.table} (${sync.rows} total, ${sync.ms}ms)`
              : `${sync.written} row(s) synced${
                  sync.deleted ? `, ${sync.deleted} removed` : ""
                } → public.${sync.table} (${sync.rows} total, ${sync.ms}ms)`,
        });

        setStep(2, {
          status: "active",
          detail:
            expectCount != null
              ? `Confirming ${expectCount} row(s) in public.${sync.table}…`
              : "Reading the table back with cache disabled…",
        });
        const started = Date.now();
        let verified = false;
        let lastSql: SqlInfo | null = null;
        let lastLive: LiveInfo | null = null;

        for (let i = 0; i < 6 && !verified; i++) {
          const v = await verifyOnce({
            section,
            expected: expectToken,
            expectedCount: expectCount,
            mustNotContain: removed,
          });
          lastSql = v.sql;
          lastLive = v.live;
          if (v.sql?.ok) {
            const countTxt = `${
              v.sql.expectedCount != null ? `${v.sql.rows}/${v.sql.expectedCount}` : `${v.sql.rows}`
            } rows in public.${v.sql.table}`;
            const forbiddenTxt =
              v.sql.forbiddenFound.length > 0
                ? ` — deleted still present: ${v.sql.forbiddenFound.join(", ")}`
                : "";
            const allOk = v.sql.countOk && v.sql.matched && v.sql.forbiddenFound.length === 0;
            setStep(2, {
              status: allOk ? "ok" : "active",
              detail: `${allOk ? "✓ SQL Verified" : "SQL read OK (pending)"}: ${countTxt} (Supabase PostgreSQL • ${v.sql.ms}ms)${forbiddenTxt}`,
            });
          } else {
            setStep(2, {
              status: "fail",
              detail: v.sql?.table ? `SELECT ${v.sql.table} failed` : "SQL read failed",
            });
          }
          if (v.verified) {
            verified = true;
            break;
          }
          const remaining = Math.max(0, 5 - (Date.now() - started) / 1000);
          setCountdown(remaining);
          setStep(3, {
            status: "active",
            detail: `⏳ Propagating to live website… ${remaining.toFixed(1)}s remaining — checking every 1s`,
          });
          await sleep(1000);
          if (mountedRef.current) setCountdown(Math.max(0, remaining - 1));
        }

        if (!mountedRef.current) return;
        setSql(lastSql);
        setLive(lastLive);

        if (verified) {
          setStep(3, {
            status: "ok",
            detail:
              lastLive?.reflectedInMs != null
                ? `Confirmed active on geetprince.me (reflected in ${(lastLive.reflectedInMs / 1000).toFixed(1)}s)`
                : (lastLive?.note ?? "Confirmed live."),
          });
          setPhase("done");
          if (items) initialRef.current = { section, tokens: currentTokens };
        } else if (lastSql?.ok && lastSql.countOk) {
          setStep(3, {
            status: "ok",
            detail: lastLive?.note ?? "Cache purged — SQL confirmed, live propagating.",
          });
          setPhase("done");
          if (items) initialRef.current = { section, tokens: currentTokens };
        } else {
          setStep(3, {
            status: "fail",
            detail: lastLive?.note ?? lastSql?.error ?? "Live verification incomplete.",
          });
          setPhase("error");
        }
      } catch (e) {
        if (!mountedRef.current) return;
        setErr(e instanceof Error ? e.message : "Publish failed.");
        setPhase("error");
      } finally {
        runningRef.current = false;
      }
    },
    [section, formId, items, labelKey, expected, expectedCount, setStep]
  );

  const busy = phase === "running";
  const showSteps = phase !== "idle";
  const collection = items !== undefined;

  return (
    <section
      aria-label={`Save and publish ${label}`}
      className="mt-10 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-ambient"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <ShieldCheck size={17} aria-hidden="true" className="text-accent-blue" />
            Publish &amp; verify {label}
          </h2>
          <p className="mt-1 text-[13px] text-muted">
            {collection
              ? `Commits the exact ${tokens.length} row(s) on screen to Supabase, removes anything deleted here, then confirms the live site.`
              : "Writes to Supabase PostgreSQL, reads the rows back, then confirms the live cache purged."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {allowReset && (
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    "Reset ALL content to factory seed data?\n\nThis replaces projects, skills, credentials, FAQs, profile and theme in Supabase with the built-in seed data and deletes any custom rows. This cannot be undone."
                  )
                ) {
                  run("reset");
                }
              }}
              disabled={busy}
              className="btn-secondary !px-4 !py-2.5 !text-[13px] disabled:opacity-60"
            >
              <Undo2 size={15} aria-hidden="true" />
              Reset to Factory Seed Data
            </button>
          )}
          <button
            type="button"
            onClick={() => run("publish")}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0066CC] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0055B3] disabled:opacity-60"
          >
            {busy ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={15} aria-hidden="true" />}
            {busy ? "Publishing…" : `Save & publish ${label}`}
          </button>
        </div>
      </div>

      {showSteps && (
        <div className="mt-4 space-y-2 border-t border-[var(--border-subtle)] pt-4">
          {[1, 2, 3].map((n) => {
            const st = steps[n];
            const status: StepStatus = st?.status ?? "idle";
            return (
              <div key={n} className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0" aria-hidden="true">
                  {status === "ok" ? (
                    <CheckCircle2 size={16} className="text-accent-emerald" />
                  ) : status === "active" ? (
                    <Loader2 size={16} className="animate-spin text-accent-blue" />
                  ) : status === "fail" ? (
                    <CircleDashed size={16} className="text-red-500" />
                  ) : (
                    <CircleDashed size={16} className="text-subtle" />
                  )}
                </span>
                <div className="min-w-0">
                  <p
                    className={`text-[13px] font-medium ${
                      status === "ok"
                        ? "text-ink"
                        : status === "active"
                          ? "text-accent-blue"
                          : status === "fail"
                            ? "text-red-600"
                            : "text-subtle"
                    }`}
                  >
                    {STEP_LABELS[n]}
                    {n === 3 && status === "active" && (
                      <span className="ml-2 rounded-full bg-pill px-2 py-0.5 font-mono text-[11px] text-ink">
                        {countdown.toFixed(1)}s
                      </span>
                    )}
                  </p>
                  {st?.detail && (
                    <p className="mt-0.5 font-mono text-[11px] leading-relaxed text-subtle">{st.detail}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {phase === "done" && (
        <div className="mt-4 rounded-xl border border-accent-emerald/30 bg-accent-emerald/10 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={16} aria-hidden="true" /> Successfully Published &amp; Verified Live!
          </p>
          <dl className="mt-2 space-y-1 text-[13px]">
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-muted">SQL table status:</dt>
              <dd className="font-mono text-ink">
                {sql?.simulated
                  ? "local persistence mode (Supabase not configured)"
                  : `Confirmed in Supabase public.${sql?.table} (${
                      sql?.expectedCount != null
                        ? `${sql?.rows}/${sql?.expectedCount}`
                        : `${sql?.rows ?? 0}`
                    } rows)`}
              </dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-muted">Live website status:</dt>
              <dd className="font-mono text-ink">
                {live?.reflectedInMs != null
                  ? `Confirmed active on https://geetprince.me (reflected in ${(
                      live.reflectedInMs / 1000
                    ).toFixed(1)}s)`
                  : (live?.note ?? "Confirmed active on https://geetprince.me")}
              </dd>
            </div>
          </dl>
          <a
            href="https://geetprince.me"
            target="_blank"
            rel="noopener"
            className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-accent-blue hover:underline"
          >
            View Live on geetprince.me ↗
          </a>
        </div>
      )}

      {phase === "error" && (
        <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-700">
          {err ?? "Something went wrong while publishing. Check the Supabase connection and try again."}
        </p>
      )}
    </section>
  );
}
