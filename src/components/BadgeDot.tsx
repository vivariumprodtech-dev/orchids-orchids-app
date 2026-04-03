"use client";

import React from "react";
import type { BadgeVariant } from "./Badge";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BadgeDotSize = "sm" | "md" | "lg";

export interface BadgeDotProps {
  size?: BadgeDotSize;
  variant?: BadgeVariant;
  /** Extra inline styles — merged last */
  style?: React.CSSProperties;
  className?: string;
}

// ─── Token maps ───────────────────────────────────────────────────────────────

const DOT_SIZE: Record<BadgeDotSize, string> = {
  sm: "0.375rem",  // 6px
  md: "0.5rem",    // 8px
  lg: "0.625rem",  // 10px
};

const DOT_COLOR: Record<BadgeVariant, string> = {
  "neutral":               "var(--neutral-surface)",
  "primary":               "var(--primary-surface)",
  "primary-darker":        "var(--primary-action-hover)",
  "neutral-tonal-disabled":"var(--disabled-surface)",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function BadgeDot({
  size = "md",
  variant = "neutral",
  style,
  className,
}: BadgeDotProps) {
  const diameter = DOT_SIZE[size];

  return (
    <span
      className={className}
      style={{
        display:         "inline-block",
        width:           diameter,
        height:          diameter,
        borderRadius:    "var(--rounded-full)",
        backgroundColor: DOT_COLOR[variant],
        flexShrink:      0,
        ...style,
      }}
    />
  );
}
