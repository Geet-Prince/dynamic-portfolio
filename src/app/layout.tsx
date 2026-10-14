import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { getSiteData } from "@/lib/data-fetcher";
import { isDarkPreset, themeCssVars } from "@/lib/themes";
import { SITE_URL, llmsAlternateTypes } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
});

export async function generateMetadata(): Promise<Metadata> {
  // Dynamic so /admin edits (bio, DSA count, SEO keywords) update <head> instantly.
  let profile = null;
  try {
    profile = (await getSiteData()).profile;
  } catch {
    profile = null;
  }
  const description = profile
    ? `${profile.full_name} (${profile.handle}) — ${profile.headline} ${profile.degree} at ${profile.institution_short}. ${profile.dsa_solved_count}+ DSA solved. AWS Certified Cloud Practitioner.`
    : "Prince Raj (Geet-Prince) — B.Tech CSE (Data Science) at Noida Institute of Engineering and Technology (NIET), Greater Noida. Software engineer building scalable backends, data-driven systems & Progex (progex.geetprince.me). 270+ DSA problems solved. AWS Certified Cloud Practitioner.";
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: "Prince Raj (Geet-Prince) — Software Engineer & Data Science | NIET Greater Noida",
      template: "%s | Prince Raj (Geet-Prince)",
    },
    description,
    keywords: profile?.seo_keywords ?? [
      "Prince Raj",
      "Geet-Prince",
      "geetprince",
      "NIET Prince Raj",
      "Prince Raj NIET Greater Noida",
      "Noida Institute of Engineering and Technology Prince Raj",
      "Prince Raj Data Science",
      "Prince Raj Software Engineer",
      "Progex Prince Raj",
    ],
    authors: [{ name: "Prince Raj", url: SITE_URL }],
    creator: "Prince Raj",
    publisher: "Prince Raj",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: SITE_URL,
      siteName: "Prince Raj (Geet-Prince)",
      title: "Prince Raj (Geet-Prince) — Software Engineer & Data Science",
      description:
        "B.Tech CSE (Data Science) at NIET Greater Noida. Scalable backends, data-driven apps, Progex analytics platform. 270+ DSA solved. AWS Certified.",
    },
    twitter: {
      card: "summary_large_image",
      title: "Prince Raj (Geet-Prince) — Software Engineer & Data Science",
      description:
        "B.Tech CSE (Data Science) at NIET Greater Noida. Builder of Progex, Eventify, Verse. 270+ DSA solved.",
    },
    alternates: {
      canonical: SITE_URL,
      types: {
        "text/plain": `${SITE_URL}/llms.txt`,
        // LLM discovery: crawlers + agents find the Markdown knowledge bases from <head>.
        ...llmsAlternateTypes,
      },
    },
    verification: {
      google: "google-site-verification-placeholder",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#FBFBFD",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await getSiteData();
  const theme = data.theme;
  return (
    <html
      lang="en"
      data-theme={theme.theme_preset}
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrains.variable}`}
      style={isDarkPreset(theme.theme_preset) ? { colorScheme: "dark" } : undefined}
    >
      <head>
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Active Design Studio tokens — inlined on the server: first paint already themed, zero FOUC */}
        <style dangerouslySetInnerHTML={{ __html: `:root{${themeCssVars(theme)}}` }} />
      </head>
      <body className="bg-canvas font-sans text-ink antialiased" suppressHydrationWarning>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <JsonLd
          profile={data.profile}
          projects={data.projects}
          credentials={data.credentials}
          skills={data.skills}
          faqs={data.faqs}
        />
        {children}
      </body>
    </html>
  );
}
