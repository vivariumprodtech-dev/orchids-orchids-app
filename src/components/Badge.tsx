"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BadgeSize    = "sm" | "md" | "lg";
export type BadgeVariant = "neutral" | "primary" | "primary-darker" | "neutral-tonal-disabled";

export interface BadgeProps {
  /** Text label inside the badge */
  label?: string;
  /** Icon placed before the label */
  iconStart?: LucideIcon;
  /** Show × dismiss icon after the label */
  dismissible?: boolean;
  /** Show a numeric count instead of a label (e.g. +99) */
  count?: number;
  /** Render as icon-only (no label) */
  iconOnly?: LucideIcon;
  size?: BadgeSize;
  variant?: BadgeVariant;
  /** Extra inline styles — merged last, can override variant colours */
  style?: React.CSSProperties;
  className?: string;
  onDismiss?: () => void;
}

// ─── Variant colour map ───────────────────────────────────────────────────────

const VARIANT_STYLE: Record<BadgeVariant, React.CSSProperties> = {
  "neutral": {
    backgroundColor: "var(--neutral-surface)",
    color:           "var(--invert)",
  },
  "primary": {
    backgroundColor: "var(--primary-surface)",
    color:           "var(--invert)",
  },
  "primary-darker": {
    backgroundColor: "var(--primary-action-hover)",
    color:           "var(--invert)",
  },
  "neutral-tonal-disabled": {
    backgroundColor: "var(--neutral-tonal)",
    color:           "var(--disabled-font)",
  },
};

// ─── Token maps ───────────────────────────────────────────────────────────────

const SIZE_CONFIG: Record<
  BadgeSize,
  {
    paddingX:        string;
    paddingY:        string;
    paddingNumberY:  string;
    paddingIconOnlyX: string;
    paddingIconOnlyY: string;
    font:            string;
    gap:             string;
    iconSize:        number;
    iconOnlySize:    number;
  }
> = {
  sm: {
    paddingX:         "var(--spacing-2)",
    paddingY:         "var(--spacing-1)",
    paddingNumberY:   "var(--spacing-0-5)",
    paddingIconOnlyX: "var(--spacing-1)",
    paddingIconOnlyY: "var(--spacing-1)",
    font:             "label-sm",
    gap:              "var(--spacing-1-5)",
    iconSize:         12,   // --icon-3
    iconOnlySize:     16,   // --icon-4
  },
  md: {
    paddingX:         "var(--spacing-2-5)",
    paddingY:         "var(--spacing-1-5)",
    paddingNumberY:   "var(--spacing-1)",
    paddingIconOnlyX: "var(--spacing-1-5)",
    paddingIconOnlyY: "var(--spacing-1-5)",
    font:             "label-md",
    gap:              "var(--spacing-1-5)",
    iconSize:         16,   // --icon-4
    iconOnlySize:     20,   // --icon-5
  },
  lg: {
    paddingX:         "var(--spacing-3)",
    paddingY:         "var(--spacing-2)",
    paddingNumberY:   "var(--spacing-1-5)",
    paddingIconOnlyX: "var(--spacing-2)",
    paddingIconOnlyY: "var(--spacing-2)",
    font:             "label-lg",
    gap:              "var(--spacing-1-5)",
    iconSize:         20,   // --icon-5
    iconOnlySize:     24,   // --icon-6
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Badge({
  label,
  iconStart: IconStart,
  dismissible = false,
  count,
  iconOnly: IconOnly,
  size = "md",
  variant = "neutral",
  style,
  className,
  onDismiss,
}: BadgeProps) {
  const cfg = SIZE_CONFIG[size];

  // Determine padding based on mode
  const isIconOnly  = !!IconOnly;
  const isNumber    = count !== undefined;

  const paddingTop    = isIconOnly ? cfg.paddingIconOnlyY : isNumber ? cfg.paddingNumberY : cfg.paddingY;
  const paddingBottom = paddingTop;
  const paddingLeft   = isIconOnly ? cfg.paddingIconOnlyX : cfg.paddingX;
  const paddingRight  = paddingLeft;

  const baseStyle: React.CSSProperties = {
    display:        "inline-flex",
    alignItems:     "center",
    justifyContent: "center",
    borderRadius:   "var(--rounded-full)",
    gap:            cfg.gap,
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
    // Variant colours, caller overrides last
    ...VARIANT_STYLE[variant],
    ...style,
  };

  if (isIconOnly && IconOnly) {
    return (
      <span style={baseStyle} className={className}>
        <IconOnly size={cfg.iconOnlySize} strokeWidth={2} />
      </span>
    );
  }

  if (isNumber) {
    return (
      <span style={baseStyle} className={className}>
        <span className={cfg.font}>+{count}</span>
      </span>
    );
  }

  return (
    <span style={baseStyle} className={className}>
      {IconStart && <IconStart size={cfg.iconSize} strokeWidth={2} />}
      {label    && <span className={cfg.font}>{label}</span>}
      {dismissible && (
        <button
          onClick={onDismiss}
          style={{
            display:    "inline-flex",
            alignItems: "center",
            background: "none",
            border:     "none",
            padding:    0,
            cursor:     "pointer",
            color:      "inherit",
            lineHeight: 0,
          }}
          aria-label="Rimuovi"
        >
          <X size={cfg.iconSize} strokeWidth={2.5} />
        </button>
      )}
    </span>
  );
}
