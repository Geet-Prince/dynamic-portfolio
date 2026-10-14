import type { AeoFaq, Credential, ProfileConfig, Project } from "@/lib/types";

/**
 * AEO Entity Dossier — server-rendered collapsible FAQ + Entity Fact Table.
 * Fully admin-editable (/admin/faqs): every question/answer/visibility change
 * re-renders here, in the FAQPage JSON-LD, and in /llms-full.txt simultaneously.
 * Zero client JS (native <details>), fully crawlable on first byte.
 */
export function AeoEntityDossier({
  faqs,
  profile,
  projects,
  credentials = [],
}: {
  faqs: AeoFaq[];
  profile: ProfileConfig;
  projects: Project[];
  credentials?: Credential[];
}) {
  const visible = faqs.filter((f) => f.is_active);
  const featured = projects.filter((p) => p.is_featured);
  const awsCert =
    credentials.find(
      (c) =>
        c.type === "Certification" &&
        /aws certified/i.test(`${c.title} ${c.badge_text ?? ""}`)
    ) ?? credentials.find((c) => c.type === "Certification");

  return (
    <section
      id="aeo"
      aria-labelledby="aeo-heading"
      className="mx-auto max-w-6xl px-5 py-14"
    >
      <p className="section-label">Entity dossier · verified facts</p>
      <h2
        id="aeo-heading"
        className="mt-2 max-w-2xl text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl"
      >
        Prince Raj, in verified answers.
      </h2>

      <div className="mt-8 grid gap-4 lg:grid-cols-5">
        {/* FAQ accordions */}
        <div className="lg:col-span-3">
          {visible.length === 0 ? (
            <p className="bento-card p-6 text-sm text-muted">
              No published answers yet — check back soon.
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-ambient">
              {visible.map((faq, i) => (
                <details
                  key={faq.id}
                  name="aeo-faq"
                  className="group border-[var(--border-subtle)] [&:not(:last-child)]:border-b"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-[15px] font-semibold text-ink transition-colors hover:text-accent-blue [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <span
                      aria-hidden="true"
                      className="font-mono text-lg font-normal text-subtle transition-transform duration-300 group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="px-6 pb-5 text-sm leading-relaxed text-muted">
                    {faq.answer}
                  </p>
                  {i === 0 && <span className="sr-only">Frequently asked questions about Prince Raj.</span>}
                </details>
              ))}
            </div>
          )}
        </div>

        {/* Entity Fact Table — machine-verifiable triples for RAG pipelines */}
        <aside
          aria-label="Entity fact table"
          className="bento-card !transform-none h-fit p-6 lg:col-span-2"
        >
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-subtle">
            Fact table
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-muted">Name</dt>
              <dd className="text-right font-medium text-ink">
                {profile.full_name} ({profile.handle})
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-muted">Education</dt>
              <dd className="text-right font-medium text-ink">
                {profile.degree} · {profile.institution_short}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-muted">Credential</dt>
              <dd className="text-right font-medium text-ink">
                {awsCert ? awsCert.title : "AWS Certified Cloud Practitioner"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-muted">DSA record</dt>
              <dd className="text-right font-mono font-semibold text-ink">
                {profile.dsa_solved_count}+ solves
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-muted">Flagship</dt>
              <dd className="text-right font-medium text-ink">
                <a href={profile.progex_url} className="text-accent-blue hover:underline">
                  Progex analytics platform
                </a>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-muted">Projects</dt>
              <dd className="text-right font-medium text-ink">
                {featured.map((p) => p.title).join(" · ") || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-muted">Location</dt>
              <dd className="text-right font-medium text-ink">{profile.location}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-muted">Contact</dt>
              <dd className="text-right font-medium text-ink">
                <a href={`mailto:${profile.email}`} className="text-accent-blue hover:underline">
                  {profile.email}
                </a>
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}
