import type { AeoFaq, Credential, ProfileConfig, Project, Skill } from "@/lib/types";

const SITE_URL = "https://geetprince.me";

export function JsonLd({
  profile,
  projects,
  credentials,
  skills = [],
  faqs = [],
}: {
  profile: ProfileConfig;
  projects: Project[];
  credentials: Credential[];
  skills?: Skill[];
  faqs?: AeoFaq[];
}) {
  const education = credentials.filter((c) => c.type === "Education");
  const certifications = credentials.filter((c) => c.type === "Certification");

  // Dynamic expertise graph: live skills first, SEO keywords fill the gaps.
  const knowsAbout: string[] = [];
  for (const s of skills) {
    if (s.name && !knowsAbout.includes(s.name)) knowsAbout.push(s.name);
  }
  for (const k of profile.seo_keywords) {
    const clean = k.trim();
    if (clean && !knowsAbout.some((x) => x.toLowerCase() === clean.toLowerCase())) {
      knowsAbout.push(clean);
    }
  }

  const activeFaqs = faqs.filter((f) => f.is_active);

  const graph: Record<string, unknown>[] = [
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: profile.full_name,
      alternateName: [profile.handle, "geetprince", "NIET Prince Raj"],
      url: SITE_URL,
      jobTitle: profile.headline,
      description: profile.subheadline,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Greater Noida",
        addressRegion: "Uttar Pradesh",
        addressCountry: "IN",
      },
      alumniOf: {
        "@type": "CollegeOrUniversity",
        "@id": `${SITE_URL}/#niet`,
        name: profile.institution,
      },
      hasCredential: certifications.map((c) => ({
        "@type": "EducationalOccupationalCredential",
        name: c.title,
        recognizedBy: { "@type": "Organization", name: c.organization },
      })),
      sameAs: [
        profile.github_url,
        profile.linkedin_url,
        profile.leetcode_url,
        profile.huggingface_url,
        profile.progex_url,
      ].filter(Boolean),
      knowsAbout,
    },
    {
      "@type": "CollegeOrUniversity",
      "@id": `${SITE_URL}/#niet`,
      name: "Noida Institute of Engineering and Technology",
      alternateName: ["NIET", "NIET Greater Noida"],
      location: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Greater Noida",
          addressRegion: "Uttar Pradesh",
          addressCountry: "IN",
        },
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Prince Raj (Geet-Prince) — Portfolio",
      author: { "@id": `${SITE_URL}/#person` },
      inLanguage: "en",
    },
    {
      "@type": "ProfilePage",
      "@id": `${SITE_URL}/#profilepage`,
      url: SITE_URL,
      about: { "@id": `${SITE_URL}/#person` },
      mainEntity: { "@id": `${SITE_URL}/#person` },
    },
    {
      "@type": "ItemList",
      "@id": `${SITE_URL}/#projects`,
      name: "Projects by Prince Raj (Geet-Prince)",
      itemListElement: projects.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "SoftwareApplication",
          "@id": `${SITE_URL}/projects/${p.slug}#app`,
          name: p.title,
          description: p.tagline,
          url: `${SITE_URL}/projects/${p.slug}`,
          author: { "@id": `${SITE_URL}/#person` },
          applicationCategory: p.category,
          programmingLanguage: p.tech_stack,
          ...(p.live_url ? { installUrl: p.live_url } : {}),
          ...(p.github_url ? { codeRepository: p.github_url } : {}),
        },
      })),
    },
    ...education.map((e) => ({
      "@type": "EducationalOccupationalCredential" as const,
      name: e.title,
      recognizedBy: { "@type": "Organization" as const, name: e.organization },
    })),
  ];

  // FAQPage mirrors the live AEO dossier: editing an FAQ in /admin updates
  // both the visible accordion and this hidden schema simultaneously.
  if (activeFaqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: activeFaqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }) }}
    />
  );
}
