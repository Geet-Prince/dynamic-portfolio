import { getMessages, getSiteData } from "@/lib/data-fetcher";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/admin/ProfileForm";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const data = await getSiteData();
  const messages = await getMessages(500);
  const unread = messages.filter((m) => !m.is_read).length;
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Overview</h1>
      <p className="mt-1 text-sm text-muted">
        {data.projects.length} projects · {data.skills.length} skills · {data.credentials.length} credentials ·{" "}
        {data.faqs.length} FAQs · {unread} unread messages
        {!isSupabaseConfigured() && (
          <> · <span className="font-mono text-xs text-accent-emerald">● local persistence active (data/portfolio-store.json)</span></>
        )}
      </p>
      <div className="mt-6">
        <ProfileForm profile={data.profile} />
      </div>
    </div>
  );
}
