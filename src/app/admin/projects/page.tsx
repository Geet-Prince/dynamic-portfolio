import { getLiveSiteData } from "@/lib/data-fetcher";
import { ProjectsManager } from "@/components/admin/ProjectsManager";
import { AdminSavePublishBar } from "@/components/admin/AdminSavePublishBar";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const { projects } = await getLiveSiteData();
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Projects</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Add, edit, reorder, feature or delete. Changes publish instantly.</p>
      <ProjectsManager projects={projects} />
      <AdminSavePublishBar section="projects" label="projects" expected={projects[0]?.title ?? null} />
    </div>
  );
}
