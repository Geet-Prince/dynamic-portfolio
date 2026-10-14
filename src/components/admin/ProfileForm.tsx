"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/lib/supabase/actions";
import type { ProfileConfig } from "@/lib/types";

export function ProfileForm({ profile }: { profile: ProfileConfig }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await updateProfile(fd);
      setMsg(
        res.ok
          ? "preview" in res && res.preview
            ? "Saved locally (preview mode — connect Supabase to persist to production)."
            : "Published — cache purged across /, /projects, llms.txt & sitemap."
          : `Error: ${res.error}`
      );
    });
  }

  const field = "mb-4";
  const label = "mb-1.5 block text-[13px] font-medium text-ink";
  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-ambient">
      <h2 className="text-base font-semibold text-ink">Hero, bio, metrics & SEO</h2>
      <p className="mb-5 mt-1 text-[13px] text-muted">Every field below renders live on geetprince.me — no code edits needed.</p>
      <div className="grid gap-x-4 sm:grid-cols-2">
        <div className={field}><label className={label} htmlFor="full_name">Full name</label><input id="full_name" name="full_name" defaultValue={profile.full_name} required className="input-apple" /></div>
        <div className={field}><label className={label} htmlFor="handle">Handle</label><input id="handle" name="handle" defaultValue={profile.handle} required className="input-apple" /></div>
      </div>
      <div className={field}><label className={label} htmlFor="headline">Headline (H1 suffix)</label><input id="headline" name="headline" defaultValue={profile.headline} required className="input-apple" /></div>
      <div className={field}><label className={label} htmlFor="subheadline">Subheadline</label><textarea id="subheadline" name="subheadline" defaultValue={profile.subheadline} required rows={2} className="input-apple" /></div>
      <div className={field}><label className={label} htmlFor="bio_markdown">Bio (markdown)</label><textarea id="bio_markdown" name="bio_markdown" defaultValue={profile.bio_markdown} required rows={6} className="input-apple font-mono !text-[13px]" /></div>
      <div className="grid gap-x-4 sm:grid-cols-2">
        <div className={field}><label className={label} htmlFor="degree">Degree</label><input id="degree" name="degree" defaultValue={profile.degree} required className="input-apple" /></div>
        <div className={field}><label className={label} htmlFor="institution">Institution</label><input id="institution" name="institution" defaultValue={profile.institution} required className="input-apple" /></div>
        <div className={field}><label className={label} htmlFor="institution_short">Institution (short)</label><input id="institution_short" name="institution_short" defaultValue={profile.institution_short} required className="input-apple" /></div>
        <div className={field}><label className={label} htmlFor="location">Location</label><input id="location" name="location" defaultValue={profile.location} required className="input-apple" /></div>
        <div className={field}><label className={label} htmlFor="email">Email</label><input id="email" name="email" type="email" defaultValue={profile.email} required className="input-apple" /></div>
        <div className={field}><label className={label} htmlFor="dsa_solved_count">DSA solved count</label><input id="dsa_solved_count" name="dsa_solved_count" type="number" min={0} defaultValue={profile.dsa_solved_count} required className="input-apple font-mono" /></div>
        <div className={field}><label className={label} htmlFor="github_url">GitHub URL</label><input id="github_url" name="github_url" defaultValue={profile.github_url} required className="input-apple" /></div>
        <div className={field}><label className={label} htmlFor="progex_url">Progex URL</label><input id="progex_url" name="progex_url" defaultValue={profile.progex_url} required className="input-apple" /></div>
        <div className={field}><label className={label} htmlFor="linkedin_url">LinkedIn URL</label><input id="linkedin_url" name="linkedin_url" defaultValue={profile.linkedin_url ?? ""} className="input-apple" /></div>
        <div className={field}><label className={label} htmlFor="leetcode_url">LeetCode URL</label><input id="leetcode_url" name="leetcode_url" defaultValue={profile.leetcode_url ?? ""} className="input-apple" /></div>
        <div className={field}><label className={label} htmlFor="huggingface_url">HuggingFace URL</label><input id="huggingface_url" name="huggingface_url" defaultValue={profile.huggingface_url ?? ""} className="input-apple" /></div>
        <div className={field}><label className={label} htmlFor="avatar_url">Avatar URL</label><input id="avatar_url" name="avatar_url" defaultValue={profile.avatar_url ?? ""} className="input-apple" /></div>
        <div className={field}><label className={label} htmlFor="resume_url">Resume URL</label><input id="resume_url" name="resume_url" defaultValue={profile.resume_url ?? ""} className="input-apple" /></div>
        <div className={field}><label className={label} htmlFor="availability_text">Availability text</label><input id="availability_text" name="availability_text" defaultValue={profile.availability_text} required className="input-apple" /></div>
      </div>
      <div className={field}>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="availability_status" defaultChecked={profile.availability_status} className="h-4 w-4 accent-[var(--accent-fill)]" />
          Show availability badge (emerald pulse)
        </label>
      </div>
      <div className={field}><label className={label} htmlFor="seo_keywords">SEO keywords (comma-separated)</label><textarea id="seo_keywords" name="seo_keywords" defaultValue={profile.seo_keywords.join(", ")} rows={2} className="input-apple font-mono !text-[13px]" /></div>
      <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
        {pending ? "Publishing…" : "Save & publish"}
      </button>
      {msg && (<p role="status" className="mt-3 text-sm text-muted">{msg}</p>)}
    </form>
  );
}
