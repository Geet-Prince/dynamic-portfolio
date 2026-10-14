import { getMessages, getLiveSiteData } from "@/lib/data-fetcher";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getTableCounts } from "@/lib/supabase/sql-sync";
import { ProfileForm } from "@/components/admin/ProfileForm";
import { AdminSavePublishBar } from "@/components/admin/AdminSavePublishBar";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const data = await getLiveSiteData();
  const messages = await getMessages(500);
  const counts = await getTableCounts();
  const unread = messages.filter((m) => !m.is_read).length;
  const live = isSupabaseConfigured();
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Overview</h1>
      <p className="mt-1 text-sm text-muted">
        {data.projects.length} projects · {data.skills.length} skills · {data.credentials.length} credentials ·{" "}
        {data.faqs.length} FAQs · {unread} unread messages
        {!live && (
          <> · <span className="font-mono text-xs text-accent-emerald">● local persistence active (data/portfolio-store.json)</span></>
        )}
      </p>

      {/* Supabase SQL Status strip — confirms every table is populated at a glance. */}
      <section
        aria-label="Supabase SQL status"
        className="mt-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-ambient"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-subtle">
            Supabase SQL status
          </h2>
          <span className={`font-mono text-xs ${live ? "text-accent-emerald" : "text-amber-600"}`}>
            {live ? "● jrstuyoyukweffafkytp · connected" : "○ local persistence mode"}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {counts.map((c) => (
            <span
              key={c.table}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1 font-mono text-[12px]"
            >
              <span className="text-subtle">{c.label}:</span>
              <span className={c.count && c.count > 0 ? "font-semibold text-ink" : "text-subtle"}>
                {c.count ?? "—"}
              </span>
            </span>
          ))}
        </div>
        <p className="mt-2 font-mono text-[11px] text-subtle">
          public.profile_config · projects · skills · credentials · aeo_faqs · site_theme_config · seo_tracked_keywords · bot_config
        </p>
      </section>

      <div className="mt-6">
        <ProfileForm profile={data.profile} />
      </div>

      <AdminSavePublishBar section="profile" label="profile" formId="profile-form" expected={data.profile.full_name} />
    </div>
  );
}
