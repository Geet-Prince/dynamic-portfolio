"use client";

import { useState } from "react";
import { adminLogin } from "@/lib/supabase/actions";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await adminLogin(new FormData(e.currentTarget));
    // On success adminLogin redirects (throws NEXT_REDIRECT) — we never get here.
    if (res && !res.ok) {
      setError(res.error);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 shadow-ambient">
      <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-ink">
        Admin password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        placeholder="••••••••"
        className="input-apple"
      />
      <button type="submit" disabled={busy} className="btn-primary mt-4 w-full disabled:opacity-60">
        {busy ? "Signing in…" : "Sign in"}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>
      )}
      <p className="mt-4 font-mono text-xs text-subtle">
        Local default: <code>admin123</code> (set ADMIN_PASSWORD in .env.local for production).
      </p>
    </form>
  );
}
