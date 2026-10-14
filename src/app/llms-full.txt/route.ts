import { getSiteData } from "@/lib/data-fetcher";

export const revalidate = 86400;

export async function GET() {
  const { profile, projects, skills, credentials, faqs } = await getSiteData();
  const activeFaqs = faqs.filter((f) => f.is_active);
  const md = `# ${profile.full_name} (${profile.handle}) — Complete Profile
URL: https://geetprince.me
Aliases: Prince Raj, Geet-Prince, geetprince, NIET Prince Raj, Prince Raj NIET Greater Noida

## Headline
${profile.headline}
${profile.subheadline}

## Bio
${profile.bio_markdown}

## Education & credentials
${credentials.map((c) => `- [${c.type}] ${c.title} — ${c.organization} (${c.date_label}). ${c.description}`).join("\n")}

## Skills
${skills.map((s) => `- ${s.name} (${s.category}, ${s.proficiency}%)`).join("\n")}

## Projects (full)
${projects
  .map(
    (p) =>
      `### ${p.title} (${p.category})\nSlug: ${p.slug}\nTagline: ${p.tagline}\nStack: ${p.tech_stack.join(", ")}\nLive: ${p.live_url ?? "—"}\nCode: ${p.github_url ?? "—"}\n${p.description_markdown}\nHighlights:\n${p.architecture_highlights.map((h) => `- ${h}`).join("\n")}`
  )
  .join("\n\n")}

## Contact
- Email: ${profile.email}
- GitHub: ${profile.github_url}
- LinkedIn: ${profile.linkedin_url ?? ""}
- LeetCode: ${profile.leetcode_url ?? ""}
- HuggingFace: ${profile.huggingface_url ?? ""}
- Progex: ${profile.progex_url}
- Resume: https://geetprince.me${profile.resume_url ?? ""}

## Frequently asked questions (verified)
${activeFaqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")}

## SEO keywords
${profile.seo_keywords.join(", ")}
`;
  return new Response(md, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
