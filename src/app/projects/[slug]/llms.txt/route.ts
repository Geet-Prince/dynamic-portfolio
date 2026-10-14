import { notFound } from "next/navigation";
import { getProjectBySlug, getSiteData } from "@/lib/data-fetcher";

export const revalidate = 3600;

/**
 * Per-project Markdown endpoint for AI agents:
 * GET /projects/<slug>/llms.txt → pure Markdown dossier for one project.
 * 100% admin-driven — edits in /admin/projects reflect immediately.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const [project, site] = await Promise.all([
    getProjectBySlug(slug),
    getSiteData(),
  ]);
  if (!project) notFound();
  const p = site.profile;
  const md = `# ${project.title} — by ${p.full_name} (${p.handle})
Canonical: https://geetprince.me/projects/${project.slug}
Author: ${p.full_name} / ${p.handle} — ${p.degree} student at ${p.institution}, ${p.location}

## Tagline
${project.tagline}

## Description
${project.description_markdown}

## Technical specification
- Author: ${p.full_name} / ${p.handle}
- Architecture: ${project.architecture_highlights[0] ?? `${project.category} application architecture`}
- Primary stack: ${project.tech_stack.join(", ")}
- Category: ${project.category}
- Live endpoint: ${project.live_url ?? "Source-available (no public demo)"}
- Source code: ${project.github_url ?? "—"}
- Verification: ${project.metrics_badge ?? "Verified via public GitHub repository"}

## Architecture highlights
${project.architecture_highlights.map((h) => `- ${h}`).join("\n")}

## Author links
- Portfolio: https://geetprince.me (Prince Raj, Geet-Prince, NIET Prince Raj)
- Progex analytics: ${p.progex_url}
- GitHub: ${p.github_url}
`;
  return new Response(md, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}


