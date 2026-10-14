"use client";

import { useState, useTransition } from "react";
import { deleteSkill, upsertSkill } from "@/lib/supabase/actions";
import type { Skill } from "@/lib/types";

const CATEGORIES = ["Languages & Core", "Backend & Web Frameworks", "Data Science & Analytics", "Cloud, DevOps & OS"];

export function SkillManager({ skills }: { skills: Skill[] }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [proficiency, setProficiency] = useState(90);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function add(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("category", category);
    fd.set("proficiency", String(proficiency));
    fd.set("is_highlighted", "on");
    fd.set("display_order", String(skills.length + 1));
    start(async () => {
      const res = await upsertSkill(fd);
      if (res.ok) setName("");
      else setMsg(res.error);
    });
  }

  return (
    <div>
      <form onSubmit={add} className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-ambient">
        <div><label className="mb-1 block text-xs font-medium">Skill name</label><input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Core Java" className="input-apple" /></div>
        <div><label className="mb-1 block text-xs font-medium">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-apple">
            {CATEGORIES.map((c) => (<option key={c}>{c}</option>))}
          </select>
        </div>
        <div><label className="mb-1 block text-xs font-medium">Proficiency ({proficiency}%)</label><input type="range" min={0} max={100} value={proficiency} onChange={(e) => setProficiency(Number(e.target.value))} className="w-40" /></div>
        <button type="submit" disabled={pending} className="btn-primary !py-2 !text-[13px] disabled:opacity-60">+ Add skill</button>
      </form>
      {msg && <p role="alert" className="mb-4 text-sm text-red-600">{msg}</p>}
      {CATEGORIES.map((cat) => {
        const items = skills.filter((s) => s.category === cat);
        if (!items.length) return null;
        return (
          <div key={cat} className="mb-5">
            <h2 className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-subtle">{cat}</h2>
            <ul className="flex flex-wrap gap-2">
              {items.map((s) => (
                <li key={s.id} className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-surface)] py-1 pl-4 pr-1.5 text-[13px] font-medium shadow-ambient border border-[var(--border-subtle)]">
                  {s.name} <span className="font-mono text-[11px] text-subtle">{s.proficiency}%</span>
                  <button
                    aria-label={`Delete ${s.name}`}
                    onClick={() => { if (confirm(`Delete “${s.name}”?`)) start(async () => { await deleteSkill(s.id); }); }}
                    className="rounded-full px-2 text-subtle hover:text-red-600"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
