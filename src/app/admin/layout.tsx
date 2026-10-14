import Link from "next/link";
import { adminLogout, purgeCache } from "@/lib/supabase/actions";
import { AdminAutoSync } from "@/components/admin/AdminAutoSync";

function PurgeButton() {
  async function purgeAction() {
    "use server";
    await purgeCache();
  }
  return (
    <form action={purgeAction}>
      <button
        type="submit"
        className="rounded-full bg-[var(--accent-fill)] px-4 py-1.5 text-[13px] font-semibold text-white hover:bg-[var(--accent-fill-hover)]"
      >
        Purge cache & publish
      </button>
    </form>
  );
}

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/skills", label: "Skills" },
  { href: "/admin/experience", label: "Experience" },
  { href: "/admin/faqs", label: "FAQs" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/design", label: "Design" },
  { href: "/admin/seo-bot", label: "SEO Bot" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      <AdminAutoSync />
      <header className="glass-bar sticky top-0 z-40 border-b border-[var(--border-subtle)]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <Link href="/admin" className="font-mono text-sm font-semibold text-ink">
            admin<span className="text-accent-blue">.geetprince.me</span>
          </Link>
          <div className="flex items-center gap-3">
            <a href="/" target="_blank" rel="noopener" className="text-[13px] font-semibold text-accent-blue">
              View live →
            </a>
            <PurgeButton />
            <form action={adminLogout}>
              <button type="submit" className="text-[13px] font-medium text-muted hover:text-ink">
                Log out
              </button>
            </form>
          </div>
        </div>
        <nav aria-label="Admin" className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-5 pb-2">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-full bg-pill px-4 py-1.5 text-[13px] font-medium text-ink hover:bg-black/10"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
