import { getSiteData } from "@/lib/data-fetcher";
import { CredentialManager } from "@/components/admin/CredentialManager";

export const dynamic = "force-dynamic";

export default async function AdminExperiencePage() {
  const { credentials } = await getSiteData();
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Experience & credentials</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Education, certifications, hackathons & programs.</p>
      <CredentialManager credentials={credentials} />
    </div>
  );
}
