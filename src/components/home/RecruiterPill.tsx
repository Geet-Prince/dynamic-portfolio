/**
 * Recruiter personalized welcome pill for `?for=Company` links.
 * Server-rendered, fully sanitized upstream — renders nothing for
 * empty/unknown values. No tracking, no cookies, crawler-safe.
 * A per-company custom message from /admin/design overrides the default text.
 */
export function RecruiterPill({
  company,
  customMessage = null,
}: {
  company: string | null;
  customMessage?: string | null;
}) {
  if (!company) return null;
  return (
    <div className="mx-auto max-w-6xl px-5 pt-6">
      <p className="mx-auto w-fit rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-1.5 text-center text-[13px] text-muted shadow-ambient">
        {customMessage ? (
          <>
            Welcome, <span className="font-semibold text-ink">{company}</span> — {customMessage}
          </>
        ) : (
          <>
            Welcome, <span className="font-semibold text-ink">{company}</span> hiring team — here&apos;s
            Prince in 60 seconds <span aria-hidden="true">↓</span>
          </>
        )}
      </p>
    </div>
  );
}

/** Keep the `for` query param to safe display text (letters, numbers, space, . & -). */
export function sanitizeCompany(raw: string | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^A-Za-z0-9 .&-]/g, "").trim().slice(0, 40);
  return cleaned.length >= 2 ? cleaned : null;
}
