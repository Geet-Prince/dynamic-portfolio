import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Shared <link rel="alternate"> descriptors for LLM Markdown discovery.
 * Spread into every route's `alternates` — child metadata REPLACES (not merges)
 * the root alternates object, so each route must repeat these or crawlers lose them.
 */
export const SITE_URL = "https://geetprince.me";

export const llmsAlternateTypes: Record<
  string,
  Array<{ url: string; title: string }>
> = {
  "text/markdown": [
    { url: `${SITE_URL}/llms.txt`, title: "LLM Curated Guide" },
    { url: `${SITE_URL}/llms-full.txt`, title: "Full LLM Knowledge Base" },
  ],
};

/** Shared ⌘K tech-filter matcher (used by the home page + /projects archive). */
export function projectMatchesTech(
  p: { tech_stack: string[]; category: string },
  tech: string
): boolean {
  const stacks = p.tech_stack.map((s) => s.toLowerCase());
  const t = tech.toLowerCase();
  if (t === "java") {
    return stacks.some(
      (s) => s === "java" || s === "core java" || (s.includes("java") && !s.includes("javascript"))
    );
  }
  if (t === "data science") {
    return (
      p.category.toLowerCase() === "data science" ||
      stacks.some((s) =>
        ["numpy", "pandas", "matplotlib", "scikit-learn", "tensorflow", "machine learning"].some((k) =>
          s.includes(k)
        )
      )
    );
  }
  return stacks.some((s) => s === t || s.includes(t));
}
