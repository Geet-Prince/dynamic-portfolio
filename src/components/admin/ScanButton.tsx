"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Radar } from "lucide-react";
import { runSerpScanAndRevalidate, runSerpScanNow } from "@/lib/supabase/actions";

export function ScanButton({ mode = "scan" }: { mode?: "scan" | "scan-revalidate" }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  function run() {
    setMsg(null);
    start(async () => {
      const res =
        mode === "scan-revalidate" ? await runSerpScanAndRevalidate() : await runSerpScanNow();
      if (res.ok) {
        const top = res.summary
          .map((s) => `${s.query}: #${s.domain_rank ?? "—"}`)
          .join(" · ");
        setMsg(
          `Scan complete via ${res.provider} (${res.storage === "supabase" ? "persisted to Supabase" : "stored locally"}${mode === "scan-revalidate" ? " + full cache revalidated" : ""}). ${top}`
        );
        router.refresh();
      } else {
        setMsg(`Error: ${res.error}`);
      }
    });
  }

  return (
    <div>
      <button type="button" onClick={run} disabled={pending} className="btn-primary !py-2.5 disabled:opacity-60">
        <Radar size={15} aria-hidden="true" />
        {pending
          ? "Scanning Google India…"
          : mode === "scan-revalidate"
            ? "Run Live SERP Scan & Revalidate Cache"
            : "Run Live SERP Scan Now"}
      </button>
      {msg && (
        <p role="status" className="mt-2 max-w-xl text-[13px] text-muted">
          {msg}
        </p>
      )}
    </div>
  );
}
