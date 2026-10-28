import type { LucideIcon } from "lucide-react";

/*
 * Icon – a lucide icon in one of the design system's sizes.
 * Stroke and size follow the AffectUI components (1.7–1.8 stroke, 14–20px tiles).
 */

export type IconProps = {
  icon: LucideIcon;
  size?: "xs" | "sm" | "md" | "lg";
  /** Colour; defaults to the text colour around it */
  tone?: "inherit" | "muted" | "subtle" | "accent" | "danger";
  className?: string;
  /** Accessible name – without one the icon is decorative */
  label?: string;
};

const SIZES = { xs: 14, sm: 16, md: 18, lg: 20 };

export function Icon({ icon: Lucide, size = "sm", tone = "inherit", className, label }: IconProps) {
  const px = SIZES[size] ?? SIZES.sm;
  return (
    <>
      <style href="ui-icon" precedence="default">
        {css}
      </style>
      <Lucide
        className={["ui-icon", className].filter(Boolean).join(" ")}
        data-tone={tone}
        width={px}
        height={px}
        strokeWidth={1.8}
        absoluteStrokeWidth
        aria-hidden={label ? undefined : true}
        aria-label={label}
        role={label ? "img" : undefined}
      />
    </>
  );
}

const css = /* css */ `
.ui-icon { display: inline-block; flex: none; vertical-align: middle; color: currentColor; }
.ui-icon[data-tone="muted"] { color: var(--ds-soft); }
.ui-icon[data-tone="subtle"] { color: var(--ds-muted); }
.ui-icon[data-tone="accent"] { color: var(--ds-accent-text); }
.ui-icon[data-tone="danger"] { color: var(--ds-danger); }
`;
