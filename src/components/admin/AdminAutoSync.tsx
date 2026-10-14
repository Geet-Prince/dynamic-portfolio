"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Fires the canonical Supabase SQL repair pass once per browser session when
 * /admin loads, so Prince's SQL tables are always fully populated (and the
 * Verse project content is corrected) without any manual action.
 * Fire-and-forget: never blocks paint, never throws into the UI.
 */
export function AdminAutoSync() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    try {
      if (sessionStorage.getItem("admin-auto-sync") === "1") return;
      sessionStorage.setItem("admin-auto-sync", "1");
    } catch {
      /* sessionStorage unavailable — still run once for this mount */
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/sync-sql", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ section: "projects", mode: "seed" }),
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as { ok?: boolean; written?: number };
        if (!cancelled && json?.ok && (json.written ?? 0) > 0) {
          router.refresh();
        }
      } catch {
        /* silent — the read path already seeds on demand */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
