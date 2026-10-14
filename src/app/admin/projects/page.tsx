import { getSiteData } from "@/lib/data-fetcher";
import { ProjectsManager } from "@/components/admin/ProjectsManager";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const { projects } = await getSiteData();
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Projects</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Add, edit, reorder, feature or delete. Changes publish instantly.</p>
      <ProjectsManager projects={projects} />
    </div>
  );
}
