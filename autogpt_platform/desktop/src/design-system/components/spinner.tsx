/*
 * Spinner – two AffectUI spinners. "arc": the button's loading spinner (a faint ring and a quarter arc,
 * one turn every 900ms). "rays": the thinking-loader's eight rays fading one after another (800ms).
 */

export type SpinnerProps = {
  variant?: "arc" | "rays";
  size?: "sm" | "md" | "lg";
  /** Screen-reader text; defaults to "Loading" */
  label?: string;
  className?: string;
};

const RAYS = [0, 1, 2, 3, 4, 5, 6, 7];

export function Spinner({ variant = "arc", size = "md", label = "Loading", className }: SpinnerProps) {
  return (
    <>
      <style href="ui-spinner" precedence="default">
        {css}
      </style>
      <span className={["ui-spinner", className].filter(Boolean).join(" ")} data-size={size} role="status" aria-label={label}>
        {variant === "rays" ? (
          <svg className="ui-spinner__rays" viewBox="0 0 16 16" aria-hidden="true">
            {RAYS.map((i) => (
              <line key={i} x1="8" y1="1.75" x2="8" y2="4.75" transform={`rotate(${i * 45} 8 8)`} style={{ animationDelay: `${(i - 8) * 100}ms` }} />
            ))}
          </svg>
        ) : (
          <svg className="ui-spinner__arc" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="8.5" opacity={0.2} />
            <path d="M12 3.5a8.5 8.5 0 0 1 8.5 8.5" />
          </svg>
        )}
      </span>
    </>
  );
}

const css = /* css */ `
.ui-spinner { --ui-sp-size: 18px; display: inline-grid; place-items: center; flex: none; width: var(--ui-sp-size); height: var(--ui-sp-size); color: var(--ds-ink); vertical-align: middle; }
.ui-spinner[data-size="sm"] { --ui-sp-size: 14px; }
.ui-spinner[data-size="lg"] { --ui-sp-size: 24px; }
.ui-spinner svg { display: block; width: 100%; height: 100%; overflow: visible; }
.ui-spinner__arc { animation: ui-spinner-spin 900ms linear infinite; }
.ui-spinner__rays line { stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; opacity: 0.18; animation: ui-spinner-ray 800ms linear infinite; }
@keyframes ui-spinner-spin { to { transform: rotate(1turn); } }
@keyframes ui-spinner-ray { 0% { opacity: 1; } 100% { opacity: 0.18; } }
@media (prefers-reduced-motion: reduce) {
  .ui-spinner__arc { animation-duration: 2400ms; }
  .ui-spinner__rays line { animation: none; opacity: 0.6; }
}
`;
