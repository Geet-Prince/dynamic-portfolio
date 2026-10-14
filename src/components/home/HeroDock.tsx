"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, FileDown } from "lucide-react";

/**
 * Tactile dual-action dock: primary CTA + morphing copy-email pill +
 * resume trigger. Client island so the hero itself stays server-rendered.
 */
export function HeroDock({
  email,
  resumeUrl,
}: {
  email: string;
  resumeUrl: string | null;
}) {
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      <Link href="/#projects" className="btn-primary">
        Explore Architecture <ArrowRight size={16} aria-hidden="true" />
      </Link>
      <button
        type="button"
        onClick={copyEmail}
        aria-live="polite"
        className={`btn-secondary ${copied ? "animate-dock-pop" : ""}`}
      >
        {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
        {copied ? "✓ Copied to Clipboard" : "Copy Email"}
      </button>
      {resumeUrl && (
        <a href={resumeUrl} className="btn-secondary" download>
          <FileDown size={16} aria-hidden="true" /> Resume.pdf ↗
        </a>
      )}
    </div>
  );
}
