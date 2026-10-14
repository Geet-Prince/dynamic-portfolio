"use client";

import { LazyMotion, domAnimation, m } from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  /** Render as `li` when wrapping list items (keeps ol/ul HTML valid, kills hydration warnings). */
  as?: "div" | "li";
}) {
  const MotionTag = as === "li" ? m.li : m.div;
  return (
    <LazyMotion features={domAnimation}>
      <MotionTag
        className={className}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.55, ease: EASE, delay }}
      >
        {children}
      </MotionTag>
    </LazyMotion>
  );
}
