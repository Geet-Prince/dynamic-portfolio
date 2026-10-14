"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { addTrackedKeyword, deleteTrackedKeyword } from "@/lib/supabase/actions";
import type { TrackedKeyword } from "@/lib/types";

export function KeywordManager({ customs }: { customs: TrackedKeyword[] }) {
  const [value, setValue] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim().length < 2) return;
    setMsg(null);
    const fd = new FormData();
    fd.set("keyword", value.trim());
    start(async () => {
      const res = await addTrackedKeyword(fd);
      if (res.ok) {
        setValue("");
        router.refresh();
      } else {
        setMsg(res.error);
      }
    });
  }

  function remove(id: string) {
    start(async () => {
      await deleteTrackedKeyword(id);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-ambient">
      <h3 className="text-sm font-semibold text-ink">Custom tracked keywords</h3>
      <p className="mb-3 mt-1 text-xs text-muted">
        Added to every daily + manual SERP scan alongside the 5 defaults.
      </p>
      <form onSubmit={add} className="flex gap-2">
        <label htmlFor="kw" className="sr-only">New keyword</label>
        <input
          id="kw"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. Prince Raj portfolio"
          maxLength={120}
          className="input-apple !text-[13px]"
        />
        <button type="submit" disabled={pending || value.trim().length < 2} className="btn-primary shrink-0 !px-4 !py-2 !text-[13px] disabled:opacity-50">
          <Plus size={14} aria-hidden="true" /> Add
        </button>
      </form>
      {msg && (
        <p role="alert" className="mt-2 text-[13px] text-red-600">
          {msg}
        </p>
      )}
      {customs.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {customs.map((k) => (
            <li key={k.id} className="inline-flex items-center gap-1.5 rounded-full bg-pill py-1 pl-3 pr-1.5 text-[13px] text-ink">
              {k.keyword}
              <button
                type="button"
                onClick={() => remove(k.id)}
                disabled={pending}
                aria-label={`Remove keyword ${k.keyword}`}
                className="rounded-full p-1 text-subtle hover:text-red-600"
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
