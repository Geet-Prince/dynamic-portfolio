import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // All tokens resolve to server-injected CSS variables (see src/lib/themes.ts).
        // rgb-triplet form keeps Tailwind opacity modifiers (e.g. decoration-accent-blue/40) working.
        canvas: "rgb(var(--bg-canvas-rgb) / <alpha-value>)",
        surface: "rgb(var(--bg-surface-rgb) / <alpha-value>)",
        elevated: "rgb(var(--bg-elevated-rgb) / <alpha-value>)",
        input: "rgb(var(--bg-input-rgb) / <alpha-value>)",
        glass: "var(--bg-glass)",
        ink: "rgb(var(--text-ink-rgb) / <alpha-value>)",
        muted: "rgb(var(--text-muted-rgb) / <alpha-value>)",
        subtle: "rgb(var(--text-subtle-rgb) / <alpha-value>)",
        accent: {
          blue: "rgb(var(--accent-primary-rgb) / <alpha-value>)",
          "blue-hover": "var(--accent-fill-hover)",
          emerald: "rgb(var(--accent-emerald-rgb) / <alpha-value>)",
        },
        pill: "rgb(var(--bg-elevated-rgb) / <alpha-value>)",
      },
      boxShadow: {
        ambient: "0 4px 24px -2px rgba(0, 0, 0, 0.03)",
        lift: "0 12px 32px -4px rgba(0, 0, 0, 0.06)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      animation: {
        "pulse-soft": "pulseSoft 2.4s ease-in-out infinite",
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.55", transform: "scale(0.86)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
