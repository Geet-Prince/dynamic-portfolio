"use client";

import { useTransition } from "react";
import { deleteMessage, markMessageRead } from "@/lib/supabase/actions";
import type { ContactMessage } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function MessagesInbox({ messages }: { messages: ContactMessage[] }) {
  const [pending, start] = useTransition();
  if (messages.length === 0) {
    return <p className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-sm text-muted shadow-ambient">No messages yet. Share geetprince.me to start receiving inquiries.</p>;
  }
  return (
    <ul className="grid gap-3">
      {messages.map((m) => (
        <li key={m.id} className={`rounded-2xl border p-5 shadow-ambient ${m.is_read ? "border-[var(--border-subtle)] bg-[var(--bg-surface)]" : "border-accent-blue/30 bg-[var(--bg-surface)]"}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-ink">{m.sender_name} <span className="font-mono text-xs font-normal text-subtle">{m.sender_email}</span></p>
            <span className="font-mono text-xs text-subtle">{formatDate(m.created_at)}</span>
          </div>
          {m.subject && <p className="mt-1 text-sm font-medium text-ink">{m.subject}</p>}
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">{m.message}</p>
          <div className="mt-3 flex gap-2">
            <button
              disabled={pending}
              onClick={() => start(async () => { await markMessageRead(m.id, !m.is_read); })}
              className="btn-secondary !px-4 !py-1.5 !text-[13px]"
            >
              {m.is_read ? "Mark unread" : "Mark read"}
            </button>
            <a href={`mailto:${m.sender_email}?subject=Re: ${m.subject ?? "your message"}`} className="btn-secondary !px-4 !py-1.5 !text-[13px]">Reply</a>
            <button
              disabled={pending}
              onClick={() => { if (confirm("Delete this message?")) start(async () => { await deleteMessage(m.id); }); }}
              className="rounded-full border border-red-200 px-4 py-1.5 text-[13px] font-semibold text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
