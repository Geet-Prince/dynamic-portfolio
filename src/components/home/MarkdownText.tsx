import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Minimal safe Markdown renderer (server + client safe: pure React, no deps).
// Supports paragraphs, **bold**, and [text](url) links. All other markup is
// rendered as escaped plain text, so admin input can never inject HTML.
// ---------------------------------------------------------------------------

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const tokenRe = /(\*\*[^*\n]+\*\*|\[[^\]\n]+\]\([^)\s\n]+\))/g;
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = tokenRe.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      out.push(
        <strong key={`${keyPrefix}-${k++}`} className="font-medium text-ink">
          {tok.slice(2, -2)}
        </strong>
      );
    } else {
      const label = tok.slice(1, tok.indexOf("]"));
      const href = tok.slice(tok.indexOf("(") + 1, -1);
      if (/^(https?:\/\/|mailto:)/i.test(href)) {
        out.push(
          <a
            key={`${keyPrefix}-${k++}`}
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noopener" : undefined}
            className="font-medium text-ink underline decoration-accent-blue/40 underline-offset-2 hover:text-accent-blue"
          >
            {label}
          </a>
        );
      } else {
        out.push(tok);
      }
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function MarkdownText({
  text,
  className,
  paragraphClassName,
}: {
  text: string;
  className?: string;
  paragraphClassName?: string;
}) {
  const paras = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paras.length === 0) return null;
  return (
    <div className={className}>
      {paras.map((p, i) => (
        <p key={i} className={paragraphClassName}>
          {renderInline(p.replace(/\n/g, " "), `md-${i}`)}
        </p>
      ))}
    </div>
  );
}
