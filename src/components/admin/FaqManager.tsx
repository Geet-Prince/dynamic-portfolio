"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { deleteFaq, upsertFaq } from "@/lib/supabase/actions";
import type { AeoFaq } from "@/lib/types";

function Editor({ initial, onDone }: { initial: Partial<AeoFaq> | null; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const res = await upsertFaq(new FormData(e.currentTarget));
      if (res.ok) onDone();
      else setMsg(res.error);
    });
  }

  const f = initial;
  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-ambient">
      <input type="hidden" name="id" defaultValue={f?.id ?? ""} />
      <div>
        <label htmlFor="faq-q" className="mb-1 block text-xs font-medium text-ink">
          Question * <span className="font-normal text-subtle">(10–200 chars, answer-engine phrased)</span>
        </label>
        <input id="faq-q" name="question" required minLength={10} maxLength={200} defaultValue={f?.question ?? ""} placeholder="Who is Prince Raj (Geet-Prince)?" className="input-apple" />
      </div>
      <div className="mt-4">
        <label htmlFor="faq-a" className="mb-1 block text-xs font-medium text-ink">
          Answer * <span className="font-normal text-subtle">(concise 40–60 word paragraph for snippets)</span>
        </label>
        <textarea id="faq-a" name="answer" required minLength={10} maxLength={4000} rows={5} defaultValue={f?.answer ?? ""} placeholder="Prince Raj, known online as Geet-Prince, is…" className="input-apple" />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-5">
        <div>
          <label htmlFor="faq-order" className="mb-1 block text-xs font-medium text-ink">Display order</label>
          <input id="faq-order" name="display_order" type="number" min={0} defaultValue={f?.display_order ?? 0} className="input-apple font-mono" />
        </div>
        <label className="flex cursor-pointer items-center gap-2 pt-5 text-sm text-ink">
          <input type="checkbox" name="is_active" defaultChecked={f?.is_active ?? true} className="h-4 w-4 accent-[var(--accent-fill)]" />
          Published (visible on site + JSON-LD)
        </label>
      </div>
      <div className="mt-5 flex gap-2">
        <button type="submit" disabled={pending} className="btn-primary !py-2 disabled:opacity-60">
          {pending ? "Saving…" : f?.id ? "Save changes" : "Create FAQ"}
        </button>
        <button type="button" onClick={onDone} className="btn-secondary !py-2">Cancel</button>
      </div>
      {msg && <p role="alert" className="mt-3 text-sm text-red-600">{msg}</p>}
    </form>
  );
}

function formFor(faq: AeoFaq, order: number): FormData {
  const fd = new FormData();
  fd.set("id", faq.id);
  fd.set("question", faq.question);
  fd.set("answer", faq.answer);
  fd.set("display_order", String(order));
  if (faq.is_active) fd.set("is_active", "on");
  return fd;
}

export function FaqManager({ faqs }: { faqs: AeoFaq[] }) {
  const [editing, setEditing] = useState<Partial<AeoFaq> | null | undefined>(undefined);
  const [pending, start] = useTransition();
  const sorted = [...faqs].sort((a, b) => a.display_order - b.display_order);

  function reorder(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= sorted.length) return;
    const a = sorted[i];
    const b = sorted[j];
    start(async () => {
      await upsertFaq(formFor(a, b.display_order));
      await upsertFaq(formFor(b, a.display_order));
    });
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-muted">
          {faqs.length} FAQs · {faqs.filter((f) => f.is_active).length} published
        </p>
        <button onClick={() => setEditing(null)} className="btn-primary !py-2 !text-[13px]">+ New FAQ</button>
      </div>
      {editing !== undefined && (
        <div className="mb-6"><Editor initial={editing} onDone={() => setEditing(undefined)} /></div>
      )}
      <ul className="grid gap-3">
        {sorted.map((f, i) => (
          <li key={f.id} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-ambient">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">
                  <span className="mr-2 font-mono text-xs font-normal text-subtle">#{f.display_order}</span>
                  {f.question}
                  {!f.is_active && (
                    <span className="ml-2 rounded-full bg-pill px-2 py-0.5 font-mono text-[11px] font-normal text-subtle">
                      hidden
                    </span>
                  )}
                </p>
                <p className="mt-1 line-clamp-2 text-[13px] text-muted">{f.answer}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button onClick={() => reorder(i, -1)} disabled={pending || i === 0} aria-label="Move up" className="rounded-lg p-1.5 text-ink hover:bg-black/10 disabled:opacity-30">
                  <ArrowUp size={15} />
                </button>
                <button onClick={() => reorder(i, 1)} disabled={pending || i === sorted.length - 1} aria-label="Move down" className="rounded-lg p-1.5 text-ink hover:bg-black/10 disabled:opacity-30">
                  <ArrowDown size={15} />
                </button>
                <button onClick={() => setEditing(f)} className="btn-secondary !px-4 !py-1.5 !text-[13px]">Edit</button>
                <button
                  disabled={pending}
                  onClick={() => { if (confirm("Delete this FAQ?")) start(async () => { await deleteFaq(f.id); }); }}
                  className="rounded-full border border-red-200 px-4 py-1.5 text-[13px] font-semibold text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {sorted.length === 0 && (
        <p className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-sm text-muted shadow-ambient">
          No FAQs yet. Add the five entity questions to power answer engines.
        </p>
      )}
    </div>
  );
}
