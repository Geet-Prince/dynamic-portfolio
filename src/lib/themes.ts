import type { ThemeConfig } from "./types";

// ---------------------------------------------------------------------------
// Theme presets — single source of truth for the Design Studio.
// Tokens are injected server-side as CSS variables (zero-FOUC, zero client JS).
// ---------------------------------------------------------------------------

export interface ThemeTokens {
  label: string;
  canvas: string;
  surface: string;
  elevated: string;
  input: string;
  glass: string;
  ink: string;
  muted: string;
  subtle: string;
  pill: string;
  borderSubtle: string;
  borderStrong: string;
  accentPrimary: string;
  accentText: string;
  accentFill: string;
  accentFillHover: string;
  emerald: string;
}

export const THEME_PRESETS: Record<string, ThemeTokens> = {
  "cupertino-light": {
    label: "Cupertino Daylight",
    canvas: "#FBFBFD",
    surface: "#FFFFFF",
    elevated: "#F5F5F7",
    input: "#F5F5F7",
    glass: "rgba(251, 251, 253, 0.78)",
    ink: "#1D1D1F",
    muted: "#52525B",
    subtle: "#86868B",
    pill: "#F5F5F7",
    borderSubtle: "rgba(0, 0, 0, 0.08)",
    borderStrong: "rgba(0, 0, 0, 0.18)",
    accentPrimary: "#0066CC",
    accentText: "#FFFFFF",
    accentFill: "#0066CC",
    accentFillHover: "#0071E3",
    emerald: "#10B981",
  },
  "sequoia-dark": {
    label: "Sequoia Midnight",
    canvas: "#09090B",
    surface: "#141417",
    elevated: "#1E1E22",
    input: "#09090B",
    glass: "rgba(9, 9, 11, 0.72)",
    ink: "#F5F5F7",
    muted: "#A1A1AA",
    subtle: "#6E6E73",
    pill: "#1E1E22",
    borderSubtle: "rgba(255, 255, 255, 0.09)",
    borderStrong: "rgba(255, 255, 255, 0.22)",
    accentPrimary: "#2997FF",
    accentText: "#FFFFFF",
    accentFill: "#0066CC",
    accentFillHover: "#0071E3",
    emerald: "#10B981",
  },
  "editorial-paper": {
    label: "Warm Editorial Paper",
    canvas: "#F7F5F0",
    surface: "#FFFDF9",
    elevated: "#ECE8E1",
    input: "#ECE8E1",
    glass: "rgba(247, 245, 240, 0.8)",
    ink: "#1C1917",
    muted: "#57534E",
    subtle: "#A8A29E",
    pill: "#ECE8E1",
    borderSubtle: "rgba(28, 25, 23, 0.1)",
    borderStrong: "rgba(28, 25, 23, 0.22)",
    accentPrimary: "#0066CC",
    accentText: "#FFFFFF",
    accentFill: "#0066CC",
    accentFillHover: "#0071E3",
    emerald: "#059669",
  },
  "nordic-slate": {
    label: "Nordic Data Slate",
    canvas: "#F1F5F9",
    surface: "#FFFFFF",
    elevated: "#E2E8F0",
    input: "#E2E8F0",
    glass: "rgba(241, 245, 249, 0.8)",
    ink: "#0F172A",
    muted: "#475569",
    subtle: "#94A3B8",
    pill: "#E2E8F0",
    borderSubtle: "rgba(15, 23, 42, 0.1)",
    borderStrong: "rgba(15, 23, 42, 0.22)",
    accentPrimary: "#0066CC",
    accentText: "#FFFFFF",
    accentFill: "#0066CC",
    accentFillHover: "#0071E3",
    emerald: "#059669",
  },
};

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full.slice(0, 6), 16);
  if (Number.isNaN(n)) return "0 102 204";
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

function sanitizeRadius(v: string): string {
  return /^\d+(\.\d+)?(px|rem)$/.test(v.trim()) ? v.trim() : "24px";
}

function sanitizeBlur(v: string): string {
  return /^\d+(\.\d+)?px$/.test(v.trim()) ? v.trim() : "20px";
}

function sanitizeHex(v: string, fallback: string): string {
  return /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(v.trim()) ? v.trim() : fallback;
}

/** Builds the `:root{…}` declaration block for the active theme. */
export function themeCssVars(theme: ThemeConfig): string {
  const preset = THEME_PRESETS[theme.theme_preset] ?? THEME_PRESETS["cupertino-light"];
  const accent = sanitizeHex(theme.accent_color || "#0066CC", "#0066CC");
  const entries: Record<string, string> = {
    // Canonical server-first tokens (consumed natively by every component).
    "--bg-canvas": preset.canvas,
    "--bg-surface": preset.surface,
    "--bg-elevated": preset.elevated,
    "--bg-input": preset.input,
    "--bg-glass": preset.glass,
    "--text-ink": preset.ink,
    "--text-muted": preset.muted,
    "--text-subtle": preset.subtle,
    "--border-subtle": preset.borderSubtle,
    "--border-strong": preset.borderStrong,
    "--accent-primary": accent,
    "--accent-text": preset.accentText,
    "--accent-fill": preset.accentFill,
    "--accent-fill-hover": preset.accentFillHover,
    "--accent-emerald": preset.emerald,
    "--card-radius": sanitizeRadius(theme.card_radius || "24px"),
    "--glass-blur": sanitizeBlur(theme.glass_blur || "20px"),
    // Legacy aliases (kept so older selectors keep resolving).
    "--canvas": preset.canvas,
    "--surface": preset.surface,
    "--ink": preset.ink,
    "--muted": preset.muted,
    "--subtle": preset.subtle,
    "--pill": preset.pill,
    "--glass": preset.glass,
    "--accent-blue": accent,
    "--accent-blue-hover": preset.accentFillHover,
  };
  const SKIP_RGB = new Set([
    "--bg-glass",
    "--glass",
    "--accent-fill-hover",
    "--accent-blue-hover",
    "--card-radius",
    "--glass-blur",
    "--border-subtle",
    "--border-strong",
  ]);
  for (const [k, v] of Object.entries(entries)) {
    if (!SKIP_RGB.has(k)) {
      entries[`${k}-rgb`] = v.startsWith("#") ? hexToRgb(v) : v;
    }
  }
  return Object.entries(entries)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}

export function isDarkPreset(preset: string): boolean {
  return preset === "sequoia-dark";
}

const KNOWN_SECTIONS = ["hero", "bento", "projects", "skills", "timeline", "aeo", "contact"];

/** Fill missing theme columns (old Supabase rows predate newer studio fields). */
export function normalizeTheme(row: Partial<ThemeConfig>): ThemeConfig {
  const order = Array.isArray(row.section_order)
    ? row.section_order.filter((s): s is string => KNOWN_SECTIONS.includes(s))
    : [];
  const visibility = Array.isArray(row.section_visibility)
    ? row.section_visibility.filter((s): s is string => KNOWN_SECTIONS.includes(s))
    : [];
  return {
    id: row.id ?? "local-theme",
    theme_preset: row.theme_preset || "cupertino-light",
    hero_layout: row.hero_layout || "apple-centered",
    card_radius: row.card_radius || "24px",
    glass_blur: row.glass_blur || "20px",
    accent_color: row.accent_color || "#0066CC",
    enable_command_palette: row.enable_command_palette !== false,
    enable_architecture_xray: row.enable_architecture_xray !== false,
    enable_guitar_easter_egg: row.enable_guitar_easter_egg !== false,
    section_order: order.length > 0 ? order : [...KNOWN_SECTIONS],
    section_visibility: visibility.length > 0 ? visibility : [...KNOWN_SECTIONS],
    default_project_view: row.default_project_view === "xray" ? "xray" : "executive",
    recruiter_messages:
      row.recruiter_messages && typeof row.recruiter_messages === "object"
        ? (row.recruiter_messages as Record<string, string>)
        : {},
    updated_at: row.updated_at ?? new Date().toISOString(),
  };
}
