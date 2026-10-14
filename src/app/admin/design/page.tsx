import { getLiveSiteData } from "@/lib/data-fetcher";
import { DesignStudio } from "@/components/admin/DesignStudio";
import { AdminSavePublishBar } from "@/components/admin/AdminSavePublishBar";

export const dynamic = "force-dynamic";

export default async function AdminDesignPage() {
  const { theme } = await getLiveSiteData();
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Design Studio</h1>
      <p className="mb-6 mt-1 text-sm text-muted">
        Restyle the entire site — themes, hero, geometry, sections, recruiter links. Zero code.
      </p>
      <DesignStudio theme={theme} />
      <AdminSavePublishBar section="design" label="design" formId="design-form" expected={theme.accent_color} />
    </div>
  );
}
