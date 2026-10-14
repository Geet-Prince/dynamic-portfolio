import { getLiveSiteData } from "@/lib/data-fetcher";
import { SkillManager } from "@/components/admin/SkillManager";
import { AdminSavePublishBar } from "@/components/admin/AdminSavePublishBar";

export const dynamic = "force-dynamic";

export default async function AdminSkillsPage() {
  const { skills } = await getLiveSiteData();
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Skills</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Manage the technical arsenal by category.</p>
      <SkillManager skills={skills} />
      <AdminSavePublishBar section="skills" label="skills" expected={skills[0]?.name ?? null} />
    </div>
  );
}
