import { getSiteData } from "@/lib/data-fetcher";

export const revalidate = 86400;

export async function GET() {
  const { profile, projects, faqs } = await getSiteData();
  const activeFaqs = faqs.filter((f) => f.is_active);
  const md = `# ${profile.full_name} (${profile.handle})

> ${profile.headline}
> ${profile.subheadline}

- Identity: ${profile.full_name} aka ${profile.handle} aka geetprince aka NIET Prince Raj
- Education: ${profile.degree} — ${profile.institution}
- Location: ${profile.location}
- DSA: ${profile.dsa_solved_count}+ problems (LeetCode, GeeksforGeeks, CodeChef)
- Status: ${profile.availability_text}
- Site: https://geetprince.me
- Progex analytics: ${profile.progex_url}
- GitHub: ${profile.github_url}
- LeetCode: ${profile.leetcode_url ?? ""}
- LinkedIn: ${profile.linkedin_url ?? ""}

## Featured projects
${projects
  .filter((p) => p.is_featured)
  .map(
    (p) =>
      `- ${p.title} — ${p.tagline} (https://geetprince.me/projects/${p.slug}) [${p.tech_stack.join(", ")}]`
  )
  .join("\n")}

## Frequently asked (verified)
${activeFaqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")}

## Full profile for AI answers
See https://geetprince.me/llms-full.txt for the complete knowledge dump.
`;
  return new Response(md, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
