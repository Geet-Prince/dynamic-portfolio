import Link from "next/link";
import type { ProfileConfig } from "@/lib/types";

export function Footer({ profile }: { profile: ProfileConfig }) {
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3">
        <div>
          <p className="font-mono text-sm font-semibold text-[var(--text-ink)]">
            geetprince<span className="text-accent-blue">.me</span>
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--text-muted)]">
            {profile.full_name} ({profile.handle}) — {profile.degree} at{" "}
            {profile.institution_short}.
          </p>
        </div>
        <nav aria-label="Footer">
          <p className="section-label">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="text-[var(--text-muted)] hover:text-[var(--text-ink)]" href="/projects">All projects</Link></li>
            <li><Link className="text-[var(--text-muted)] hover:text-[var(--text-ink)]" href="/#skills">Skills matrix</Link></li>
            <li><Link className="text-[var(--text-muted)] hover:text-[var(--text-ink)]" href="/#journey">Journey & credentials</Link></li>
            <li><Link className="text-[var(--text-muted)] hover:text-[var(--text-ink)]" href="/llms.txt">llms.txt (AI profile)</Link></li>
          </ul>
        </nav>
        <nav aria-label="Authority links">
          <p className="section-label">Ecosystem</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a className="text-[var(--text-muted)] hover:text-[var(--text-ink)]" href={profile.progex_url} target="_blank" rel="noopener">Progex — progex.geetprince.me</a></li>
            <li><a className="text-[var(--text-muted)] hover:text-[var(--text-ink)]" href={profile.github_url} target="_blank" rel="noopener">GitHub @Geet-Prince</a></li>
            {profile.leetcode_url && (<li><a className="text-[var(--text-muted)] hover:text-[var(--text-ink)]" href={profile.leetcode_url} target="_blank" rel="noopener">LeetCode — Geet-Prince</a></li>)}
            {profile.linkedin_url && (<li><a className="text-[var(--text-muted)] hover:text-[var(--text-ink)]" href={profile.linkedin_url} target="_blank" rel="noopener">LinkedIn</a></li>)}
          </ul>
        </nav>
      </div>
      <div className="border-t border-[var(--border-subtle)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-5 font-mono text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <span>
            ©{" "}
            <span suppressHydrationWarning>
              {new Date().getFullYear()}
            </span>{" "}
            Prince Raj (Geet-Prince) · Greater Noida, India
          </span>
          <span>B.Tech CSE (Data Science) · {profile.institution_short}</span>
        </div>
      </div>
    </footer>
  );
}
