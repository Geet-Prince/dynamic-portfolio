"use client";

import { useState, useTransition } from "react";
import { deleteProject, upsertProject } from "@/lib/supabase/actions";
import type { Project } from "@/lib/types";

const CATEGORIES = ["Full-Stack", "Data Science", "Developer Tools", "Cloud"];

function Editor({
  initial,
  onDone,
}: {
  initial: Partial<Project> | null;
  onDone: () => void;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await upsertProject(fd);
      if (res.ok) onDone();
      else setMsg(res.error);
    });
  }

  const p = initial;
  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-ambient">
      <input type="hidden" name="id" defaultValue={p?.id ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="mb-1 block text-xs font-medium">Title *</label><input name="title" required defaultValue={p?.title ?? ""} className="input-apple" /></div>
        <div><label className="mb-1 block text-xs font-medium">Slug * (lowercase-hyphens)</label><input name="slug" required pattern="[a-z0-9-]+" defaultValue={p?.slug ?? ""} className="input-apple font-mono" /></div>
      </div>
      <div className="mt-4"><label className="mb-1 block text-xs font-medium">Tagline *</label><input name="tagline" required defaultValue={p?.tagline ?? ""} className="input-apple" /></div>
      <div className="mt-4"><label className="mb-1 block text-xs font-medium">Description (markdown) *</label><textarea name="description_markdown" required rows={6} defaultValue={p?.description_markdown ?? ""} className="input-apple font-mono !text-[13px]" /></div>
      <div className="mt-4"><label className="mb-1 block text-xs font-medium">Architecture highlights (one per line)</label><textarea name="architecture_highlights" rows={3} defaultValue={(p?.architecture_highlights ?? []).join("\n")} className="input-apple font-mono !text-[13px]" /></div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div><label className="mb-1 block text-xs font-medium">Live URL</label><input name="live_url" defaultValue={p?.live_url ?? ""} className="input-apple" /></div>
        <div><label className="mb-1 block text-xs font-medium">GitHub URL</label><input name="github_url" defaultValue={p?.github_url ?? ""} className="input-apple" /></div>
        <div><label className="mb-1 block text-xs font-medium">Thumbnail URL</label><input name="thumbnail_url" defaultValue={p?.thumbnail_url ?? ""} className="input-apple" /></div>
        <div><label className="mb-1 block text-xs font-medium">Metrics badge</label><input name="metrics_badge" defaultValue={p?.metrics_badge ?? ""} className="input-apple" /></div>
        <div><label className="mb-1 block text-xs font-medium">Category *</label>
          <select name="category" defaultValue={p?.category ?? "Full-Stack"} className="input-apple">
            {CATEGORIES.map((c) => (<option key={c}>{c}</option>))}
          </select>
        </div>
        <div><label className="mb-1 block text-xs font-medium">Display order</label><input name="display_order" type="number" min={0} defaultValue={p?.display_order ?? 0} className="input-apple font-mono" /></div>
      </div>
      <div className="mt-4"><label className="mb-1 block text-xs font-medium">Tech stack (comma-separated) *</label><input name="tech_stack" required defaultValue={(p?.tech_stack ?? []).join(", ")} className="input-apple font-mono" /></div>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_featured" defaultChecked={p?.is_featured ?? true} className="h-4 w-4 accent-[var(--accent-fill)]" /> Featured on homepage
      </label>
      <div className="mt-5 flex gap-2">
        <button type="submit" disabled={pending} className="btn-primary !py-2 disabled:opacity-60">{pending ? "Saving…" : p?.id ? "Save changes" : "Create project"}</button>
        <button type="button" onClick={onDone} className="btn-secondary !py-2">Cancel</button>
      </div>
      {msg && <p role="alert" className="mt-3 text-sm text-red-600">{msg}</p>}
    </form>
  );
}

export function ProjectsManager({ projects }: { projects: Project[] }) {
  const [editing, setEditing] = useState<Partial<Project> | null | undefined>(undefined);
  const [pending, start] = useTransition();

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-muted">{projects.length} projects</p>
        <button onClick={() => setEditing(null)} className="btn-primary !py-2 !text-[13px]">+ New project</button>
      </div>
      {editing !== undefined && (
        <div className="mb-6">
          <Editor initial={editing} onDone={() => setEditing(undefined)} />
        </div>
      )}
      <ul className="grid gap-3">
        {projects.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-ambient">
            <div className="min-w-0">
              <p className="font-semibold text-ink">{p.title} <span className="font-mono text-xs text-subtle">/{p.slug} · #{p.display_order} {p.is_featured ? "· ★" : ""}</span></p>
              <p className="truncate text-[13px] text-muted">{p.tagline}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(p)} className="btn-secondary !px-4 !py-1.5 !text-[13px]">Edit</button>
              <button
                disabled={pending}
                onClick={() => { if (confirm(`Delete “${p.title}”?`)) start(async () => { await deleteProject(p.id, p.slug); }); }}
                className="rounded-full border border-red-200 px-4 py-1.5 text-[13px] font-semibold text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
