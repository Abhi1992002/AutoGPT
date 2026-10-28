import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

/** A Hugeicons glyph at onboarding's sizes. Stroke 1.5 sits with 400–500 text. Decorative unless labelled. */
export function Icon({ icon, size = 18, strokeWidth = 1.5, label, className }: { icon: IconSvgElement; size?: number; strokeWidth?: number; label?: string; className?: string }) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={strokeWidth}
      color="currentColor"
      className={className}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      focusable={false}
    />
  );
}
