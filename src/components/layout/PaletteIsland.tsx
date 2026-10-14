"use client";

import dynamic from "next/dynamic";

// Split into its own chunk, client-only: zero bytes in the SSR HTML and
// nothing render-blocking on first paint. The server still decides whether
// this island mounts at all (theme toggle in the parent page).
const CommandPalette = dynamic(
  () => import("./CommandPalette").then((m) => m.CommandPalette),
  { ssr: false }
);

export function PaletteIsland({
  enabled,
  resumeUrl,
  email,
  progexUrl,
  techs,
}: {
  enabled: boolean;
  resumeUrl: string | null;
  email: string;
  progexUrl: string;
  techs: string[];
}) {
  if (!enabled) return null;
  return (
    <CommandPalette
      resumeUrl={resumeUrl}
      email={email}
      progexUrl={progexUrl}
      techs={techs}
    />
  );
}
