"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ButtonVariant =
  | "neutral"
  | "neutral-outlined"
  | "neutral-link"
  | "neutral-tonal"
  | "neutral-invert"
  | "primary"
  | "primary-outlined"
  | "primary-link"
  | "primary-tonal"
  | "primary-invert"
  | "secondary"
  | "secondary-outlined"
  | "secondary-link"
  | "danger"
  | "danger-outlined"
  | "danger-link"
  | "warning"
  | "warning-outlined"
  | "warning-link"
  | "success"
  | "success-outlined"
  | "success-link";

type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icon placed before the label */
  iconStart?: LucideIcon;
  /** Icon placed after the label */
  iconEnd?: LucideIcon;
  /** Render as icon-only (no children, square padding) */
  iconOnly?: LucideIcon;
  /** Full-width block button */
  fullWidth?: boolean;
  children?: React.ReactNode;
}

// ─── Token maps ───────────────────────────────────────────────────────────────

const SIZE_FONT: Record<ButtonSize, string> = {
  sm: "label-md",
  md: "label-lg",
  lg: "label-md",
};

const SIZE_ICON: Record<ButtonSize, number> = {
  sm: 16,  // --icon-4
  md: 20,  // --icon-5
  lg: 24,  // --icon-6
};

// Returns inline style vars for a given variant
function variantStyle(variant: ButtonVariant): React.CSSProperties {
  const k = variant.replace(/-/g, "-"); // identity — just for clarity
  return {
    // We resolve these at runtime via CSS custom properties.
    // Each variant block in globals.css defines --aila-button-{variant}-* tokens.
    backgroundColor: `var(--aila-button-${k}-bg-default)`,
    color:           `var(--aila-button-${k}-text-default)`,
    borderColor:     `var(--aila-button-${k}-border-default)`,
  };
}

function sizeStyle(
  size: ButtonSize,
  mode: "default" | "icon-only" | "icon-start" | "icon-end"
): React.CSSProperties {
  const p = `--aila-button-${size}`;
  if (mode === "icon-only") {
    return {
      padding: `var(${p}-padding-y-icon-only) var(${p}-padding-x-icon-only)`,
      borderRadius: `var(${p}-border-radius)`,
      gap: `var(${p}-gap)`,
    };
  }
  if (mode === "icon-start") {
    return {
      paddingTop:    `var(${p}-padding-y)`,
      paddingBottom: `var(${p}-padding-y)`,
      paddingLeft:   `var(${p}-padding-left-icon-start)`,
      paddingRight:  `var(${p}-padding-right-icon-start)`,
      borderRadius:  `var(${p}-border-radius)`,
      gap:           `var(${p}-gap)`,
    };
  }
  if (mode === "icon-end") {
    return {
      paddingTop:    `var(${p}-padding-y)`,
      paddingBottom: `var(${p}-padding-y)`,
      paddingLeft:   `var(${p}-padding-left-icon-end)`,
      paddingRight:  `var(${p}-padding-right-icon-end)`,
      borderRadius:  `var(${p}-border-radius)`,
      gap:           `var(${p}-gap)`,
    };
  }
  return {
    padding:      `var(${p}-padding-y) var(${p}-padding-x)`,
    borderRadius: `var(${p}-border-radius)`,
    gap:          `var(${p}-gap)`,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Button({
  variant = "primary",
  size = "md",
  iconStart: IconStart,
  iconEnd: IconEnd,
  iconOnly: IconOnly,
  fullWidth = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  const iconSize = SIZE_ICON[size];

  const mode: "default" | "icon-only" | "icon-start" | "icon-end" = IconOnly
    ? "icon-only"
    : IconStart
    ? "icon-start"
    : IconEnd
    ? "icon-end"
    : "default";

  const combinedStyle: React.CSSProperties = {
    // Shared
    display:        "inline-flex",
    alignItems:     "center",
    justifyContent: "center",
    cursor:         disabled ? "not-allowed" : "pointer",
    opacity:        disabled ? 0.5 : 1,
    width:          fullWidth ? "100%" : undefined,
    border:         `var(--aila-button-border-width) solid`,
    transition:     "var(--aila-button-transition)",
    outline:        "none",
    userSelect:     "none",
    // Variant colours
    ...variantStyle(variant),
    // Size geometry
    ...sizeStyle(size, mode),
    // Caller overrides last
    ...style,
  };

  return (
    <button
      disabled={disabled}
      style={combinedStyle}
      onMouseEnter={(e) => {
        if (disabled) return;
        const el = e.currentTarget;
        const k = variant.replace(/-/g, "-");
        el.style.backgroundColor = `var(--aila-button-${k}-bg-hover)`;
        el.style.color            = `var(--aila-button-${k}-text-hover)`;
        el.style.borderColor      = `var(--aila-button-${k}-border-hover)`;
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        const el = e.currentTarget;
        const k = variant.replace(/-/g, "-");
        el.style.backgroundColor = `var(--aila-button-${k}-bg-default)`;
        el.style.color            = `var(--aila-button-${k}-text-default)`;
        el.style.borderColor      = `var(--aila-button-${k}-border-default)`;
      }}
      onMouseDown={(e) => {
        if (disabled) return;
        const el = e.currentTarget;
        const k = variant.replace(/-/g, "-");
        el.style.backgroundColor = `var(--aila-button-${k}-bg-active)`;
        el.style.color            = `var(--aila-button-${k}-text-active)`;
        el.style.borderColor      = `var(--aila-button-${k}-border-active)`;
        el.style.transform        = "scale(0.97)";
      }}
      onMouseUp={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = "scale(1)";
      }}
      {...props}
    >
      {IconOnly ? (
        <IconOnly size={iconSize} strokeWidth={2} />
      ) : (
        <>
          {IconStart && <IconStart size={iconSize} strokeWidth={2} />}
          {children && <span className={SIZE_FONT[size]}>{children}</span>}
          {IconEnd   && <IconEnd   size={iconSize} strokeWidth={2} />}
        </>
      )}
    </button>
  );
}
