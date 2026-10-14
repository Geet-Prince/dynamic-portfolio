"use client";

import { useState } from "react";
import { Mail, Send } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/icons";
import type { ProfileConfig } from "@/lib/types";

export function ContactForm({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("failed");
      form.reset();
      setState("sent");
    } catch {
      setState("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="bento-card !transform-none p-6 sm:p-8" aria-label="Contact form">
      {/* Honeypot — must stay empty */}
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sender_name" className="mb-1.5 block text-[13px] font-medium text-ink">Name</label>
          <input id="sender_name" name="sender_name" required minLength={2} maxLength={80} placeholder="Your name" className="input-apple" />
        </div>
        <div>
          <label htmlFor="sender_email" className="mb-1.5 block text-[13px] font-medium text-ink">Email</label>
          <input id="sender_email" name="sender_email" type="email" required placeholder="you@example.com" className="input-apple" />
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor="subject" className="mb-1.5 block text-[13px] font-medium text-ink">Subject <span className="text-subtle">(optional)</span></label>
        <input id="subject" name="subject" maxLength={120} placeholder="Internship, collaboration, hello…" className="input-apple" />
      </div>
      <div className="mt-4">
        <label htmlFor="message" className="mb-1.5 block text-[13px] font-medium text-ink">Message</label>
        <textarea id="message" name="message" required minLength={10} maxLength={4000} rows={5} placeholder="Tell me about your role or project…" className="input-apple resize-y" />
      </div>
      <button type="submit" disabled={state === "sending"} className="btn-primary mt-5 w-full sm:w-auto disabled:opacity-60">
        <Send size={15} aria-hidden="true" />
        {state === "sending" ? "Sending…" : state === "sent" ? "Message sent ✓" : "Send message"}
      </button>
      {state === "sent" && (
        <p role="status" className="mt-3 text-sm text-accent-emerald">
          Thanks — your message is in my inbox. I usually reply within 48 hours. Prefer email? <a className="underline" href={`mailto:${email}`}>{email}</a>
        </p>
      )}
      {state === "error" && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          Something went wrong. Please email me directly at <a className="underline" href={`mailto:${email}`}>{email}</a>.
        </p>
      )}
    </form>
  );
}

export function ContactSection({ profile }: { profile: ProfileConfig }) {
  return (
    <section id="contact" aria-labelledby="contact-heading" className="mx-auto max-w-6xl px-5 py-16">
      <p className="section-label">Contact</p>
      <h2 id="contact-heading" className="mt-2 max-w-xl text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">
        Let&apos;s build something great.
      </h2>
      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ContactForm email={profile.email} />
        </div>
        <aside className="bento-card h-fit p-6 lg:col-span-2" aria-label="Direct links">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-subtle">Direct</p>
          {profile.availability_status && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-pill px-3 py-1 text-xs font-medium text-muted">
              <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-accent-emerald" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-emerald" />
              </span>
              {profile.availability_text}
            </p>
          )}
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a href={`mailto:${profile.email}`} className="inline-flex items-center gap-2 font-medium text-ink hover:text-accent-blue">
                <Mail size={16} aria-hidden="true" /> {profile.email}
              </a>
            </li>
            <li>
              <a href={profile.github_url} target="_blank" rel="noopener" className="inline-flex items-center gap-2 text-muted hover:text-ink">
                <GithubIcon size={16} /> GitHub @Geet-Prince
              </a>
            </li>
            {profile.linkedin_url && (
              <li>
                <a href={profile.linkedin_url} target="_blank" rel="noopener" className="inline-flex items-center gap-2 text-muted hover:text-ink">
                  <LinkedinIcon size={16} /> LinkedIn
                </a>
              </li>
            )}
          </ul>
          <p className="mt-5 border-t border-[var(--border-subtle)] pt-4 font-mono text-xs leading-relaxed text-subtle">
            Recruiters: mention “geetprince.me” in your subject line for priority triage.
          </p>
        </aside>
      </div>
    </section>
  );
}
