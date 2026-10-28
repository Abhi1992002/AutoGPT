import type { ComponentPropsWithRef } from "react";

/*
 * Link – text links. Underline values come from the AffectUI email-draft body links:
 * a 1.5px line at 35% that turns solid on hover. "accent" is the blue resend link of the OTP input.
 */

export type LinkProps = ComponentPropsWithRef<"a"> & {
  tone?: "default" | "accent" | "muted";
  /** Underline always, or only on hover */
  underline?: "always" | "hover";
};

export function Link({ tone = "default", underline = "always", className, children, ...rest }: LinkProps) {
  return (
    <>
      <style href="ui-link" precedence="default">
        {css}
      </style>
      <a className={["ui-link", className].filter(Boolean).join(" ")} data-tone={tone} data-underline={underline} {...rest}>
        {children}
      </a>
    </>
  );
}

const css = /* css */ `
.ui-link {
  color: var(--ds-text);
  font-weight: 500;
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, currentColor 35%, transparent);
  text-decoration-thickness: 1.5px;
  text-underline-offset: 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: color 160ms ease, text-decoration-color 160ms ease;
}
.ui-link:hover { color: var(--ds-ink); text-decoration-color: currentColor; }
.ui-link[data-tone="accent"] { color: var(--ds-accent-text); }
.ui-link[data-tone="accent"]:hover { color: var(--ds-accent-text); }
.ui-link[data-tone="muted"] { color: var(--ds-soft); }
.ui-link[data-underline="hover"] { text-decoration-color: transparent; }
.ui-link[data-underline="hover"]:hover { text-decoration-color: currentColor; }
.ui-link:focus-visible { outline: 2px solid var(--ds-focus); outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) { .ui-link { transition: none; } }
`;
