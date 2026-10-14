import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = "https://geetprince.me";
  return {
    rules: [
      {
        userAgent: [
          "Googlebot",
          "Bingbot",
          "Slurp",
          "DuckDuckBot",
          "Baiduspider",
          "YandexBot",
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "PerplexityBot",
          "Google-Extended",
          "anthropic-ai",
          "Cohere-ai",
          "*",
        ],
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: [`${base}/sitemap.xml`],
  };
}
