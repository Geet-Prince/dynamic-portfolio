import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// GEET-SENTINEL crawler trap: intentionally tiny regex (no imports) so the
// Edge middleware bundle stays lean. Full classification lives in /api/crawler-log.
const BOT_RE =
  /googlebot|bingbot|gptbot|oai-searchbot|chatgpt-user|claudebot|perplexitybot|google-extended|applebot|anthropic-ai|cohere-ai|bot|crawl|spider|slurp|mediapartners/i;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin (except login page)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const authed = request.cookies.get("admin_auth")?.value === "1";
    if (!authed) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  // Real-time bot trap: public routes + /llms.txt only (never /api, /admin, /_next).
  const ua = request.headers.get("user-agent");
  const isPublicPath =
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/_next");
  if (ua && BOT_RE.test(ua) && isPublicPath) {
    // Fire-and-forget beacon: never awaited → zero response-latency impact.
    try {
      const url = new URL("/api/crawler-log", request.url);
      void fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname, userAgent: ua.slice(0, 500) }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* beacon failed — never break the response */
    }
  }

  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export const config = {
  // Tight matcher: middleware NEVER runs on _next assets, images, fonts, or
  // other static files — only admin routes, the homepage, project pages, and
  // the crawler-facing text endpoints. Human visitors see ~0ms overhead:
  // admin checks are a sync cookie read, and the bot beacon is fire-and-forget.
  matcher: [
    "/admin/:path*",
    "/",
    "/projects/:path*",
    "/llms.txt",
    "/llms-full.txt",
    "/robots.txt",
    "/sitemap.xml",
  ],
};
