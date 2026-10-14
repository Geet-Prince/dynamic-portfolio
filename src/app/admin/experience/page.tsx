import { getLiveSiteData } from "@/lib/data-fetcher";
import { CredentialManager } from "@/components/admin/CredentialManager";
import { AdminSavePublishBar } from "@/components/admin/AdminSavePublishBar";

export const dynamic = "force-dynamic";

export default async function AdminExperiencePage() {
  const { credentials } = await getLiveSiteData();
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Experience &amp; credentials</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Education, certifications, hackathons &amp; programs.</p>
      <CredentialManager credentials={credentials} />
      <AdminSavePublishBar
        section="experience"
        label="experience"
        items={credentials}
        labelKey="title"
        expectedCount={credentials.length}
      />
    </div>
  );
}
