"use client";

import { useState, useTransition } from "react";
import { deleteCredential, upsertCredential } from "@/lib/supabase/actions";
import type { Credential } from "@/lib/types";

const TYPES = ["Education", "Certification", "Hackathon", "Program"];

function Editor({ initial, onDone }: { initial: Partial<Credential> | null; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const res = await upsertCredential(new FormData(e.currentTarget));
      if (res.ok) onDone();
      else setMsg(res.error);
    });
  }
  const c = initial;
  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-ambient">
      <input type="hidden" name="id" defaultValue={c?.id ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="mb-1 block text-xs font-medium">Title *</label><input name="title" required defaultValue={c?.title ?? ""} className="input-apple" /></div>
        <div><label className="mb-1 block text-xs font-medium">Organization *</label><input name="organization" required defaultValue={c?.organization ?? ""} className="input-apple" /></div>
        <div><label className="mb-1 block text-xs font-medium">Date label *</label><input name="date_label" required placeholder="2025" defaultValue={c?.date_label ?? ""} className="input-apple" /></div>
        <div><label className="mb-1 block text-xs font-medium">Type *</label>
          <select name="type" defaultValue={c?.type ?? "Certification"} className="input-apple">
            {TYPES.map((t) => (<option key={t}>{t}</option>))}
          </select>
        </div>
        <div><label className="mb-1 block text-xs font-medium">Display order</label><input name="display_order" type="number" min={0} defaultValue={c?.display_order ?? 0} className="input-apple font-mono" /></div>
        <div><label className="mb-1 block text-xs font-medium">Location</label><input name="location" defaultValue={c?.location ?? ""} className="input-apple" /></div>
        <div><label className="mb-1 block text-xs font-medium">Badge text</label><input name="badge_text" defaultValue={c?.badge_text ?? ""} className="input-apple" /></div>
      </div>
      <div className="mt-4"><label className="mb-1 block text-xs font-medium">Description *</label><textarea name="description" required rows={3} defaultValue={c?.description ?? ""} className="input-apple" /></div>
      <div className="mt-4"><label className="mb-1 block text-xs font-medium">Credential URL</label><input name="credential_url" defaultValue={c?.credential_url ?? ""} className="input-apple" /></div>
      <div className="mt-5 flex gap-2">
        <button type="submit" disabled={pending} className="btn-primary !py-2 disabled:opacity-60">{pending ? "Saving…" : c?.id ? "Save changes" : "Create entry"}</button>
        <button type="button" onClick={onDone} className="btn-secondary !py-2">Cancel</button>
      </div>
      {msg && <p role="alert" className="mt-3 text-sm text-red-600">{msg}</p>}
    </form>
  );
}

export function CredentialManager({ credentials }: { credentials: Credential[] }) {
  const [editing, setEditing] = useState<Partial<Credential> | null | undefined>(undefined);
  const [, start] = useTransition();
  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-muted">{credentials.length} entries</p>
        <button onClick={() => setEditing(null)} className="btn-primary !py-2 !text-[13px]">+ New entry</button>
      </div>
      {editing !== undefined && (
        <div className="mb-6"><Editor initial={editing} onDone={() => setEditing(undefined)} /></div>
      )}
      <ul className="grid gap-3">
        {credentials.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-ambient">
            <div>
              <p className="font-semibold text-ink">{c.title} <span className="font-mono text-xs text-subtle">[{c.type}]</span></p>
              <p className="text-[13px] text-muted">{c.organization} · {c.date_label}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(c)} className="btn-secondary !px-4 !py-1.5 !text-[13px]">Edit</button>
              <button
                onClick={() => { if (confirm(`Delete “${c.title}”?`)) start(async () => { await deleteCredential(c.id); }); }}
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
