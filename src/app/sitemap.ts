import type { MetadataRoute } from "next";
import { getSiteData } from "@/lib/data-fetcher";

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://geetprince.me";
  const { projects } = await getSiteData();
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/projects`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...projects.map((p) => ({
      url: `${base}/projects/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...projects.map((p) => ({
      url: `${base}/projects/${p.slug}/llms.txt`,
      lastModified: new Date(p.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
    { url: `${base}/llms.txt`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.5 },
    { url: `${base}/llms-full.txt`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.5 },
  ];
}
