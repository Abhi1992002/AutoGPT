import { useEffect, useState, type ReactNode } from "react";

/*
 * Progress bar – ported from the AffectUI progress-tracker bar (8px, ink fill gliding in 1100ms with
 * a light sweeping over it) and the profile-menu setup bar (4px, accent). Indeterminate runs a band.
 */

export type ProgressProps = {
  /** 0 … max; leave out for an indeterminate bar */
  value?: number;
  max?: number;
  label?: ReactNode;
  /** Shows "3 / 5" or "60%" after the label */
  showValue?: "fraction" | "percent";
  size?: "sm" | "md";
  tone?: "ink" | "accent";
  className?: string;
};

export function Progress({ value, max = 100, label, showValue, size = "md", tone = "ink", className }: ProgressProps) {
  const indeterminate = value === undefined || !Number.isFinite(value);
  const ratio = indeterminate ? 0 : Math.max(0, Math.min(1, value / (max || 1)));
  // Mounts at zero, then glides to its value – like the tracker's bar on load
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const f = requestAnimationFrame(() => setShown(ratio));
    return () => cancelAnimationFrame(f);
  }, [ratio]);
  const text = showValue === "fraction" ? `${value ?? 0} / ${max}` : showValue === "percent" ? `${Math.round(ratio * 100)}%` : null;

  return (
    <>
      <style href="ui-progress-bar" precedence="default">
        {css}
      </style>
      <div className={["ui-pbar", className].filter(Boolean).join(" ")} data-size={size} data-tone={tone} data-indeterminate={indeterminate || undefined}>
        {(label != null || text) && (
          <div className="ui-pbar__head">
            {label != null && <span className="ui-pbar__label">{label}</span>}
            {text && (
              <span className="ui-pbar__count">
                <span key={text} className="ui-pbar__digit">
                  {text}
                </span>
              </span>
            )}
          </div>
        )}
        <div
          className="ui-pbar__bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={indeterminate ? undefined : value}
          aria-label={typeof label === "string" ? label : undefined}
        >
          <div className="ui-pbar__fill" style={indeterminate ? undefined : { transform: `scaleX(${shown})` }}>
            <span key={ratio} className="ui-pbar__shine" />
          </div>
        </div>
      </div>
    </>
  );
}

const css = /* css */ `
.ui-pbar { --ui-pb-h: 8px; --ui-pb-track: #f0f0f0; --ui-pb-fill: var(--ds-ink); display: grid; gap: 8px; width: 100%; min-width: 0; font-family: var(--font-sans); color: var(--ds-ink); }
.ui-pbar[data-size="sm"] { --ui-pb-h: 4px; --ui-pb-track: rgba(0, 0, 0, 0.07); gap: 7px; }
.ui-pbar[data-tone="accent"] { --ui-pb-fill: var(--ds-accent); }
.ui-pbar__head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.ui-pbar__label { min-width: 0; font: 500 13px/18px var(--font-sans); color: var(--ds-text); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-pbar__count { flex: none; font: 500 13px/18px var(--font-sans); color: var(--ds-muted); font-variant-numeric: tabular-nums; }
.ui-pbar__digit { display: inline-block; animation: ui-pbar-roll 560ms var(--ds-ease); }
.ui-pbar__bar { position: relative; height: var(--ui-pb-h); overflow: hidden; border-radius: 999px; background: var(--ui-pb-track); }
.ui-pbar__fill { position: absolute; inset: 0; overflow: hidden; border-radius: inherit; background: var(--ui-pb-fill); transform-origin: 0 50%; transition: transform 1100ms var(--ds-ease); }
.ui-pbar[data-size="sm"] .ui-pbar__fill { transition-duration: 900ms; }
.ui-pbar__shine { position: absolute; inset: 0; background: linear-gradient(90deg, transparent 30%, rgba(255, 255, 255, 0.28) 50%, transparent 70%) 0 0 / 220% 100% no-repeat; animation: ui-pbar-shine 1400ms ease-out both; }
.ui-pbar[data-indeterminate] .ui-pbar__fill { width: 40%; transform: none; animation: ui-pbar-run 1400ms var(--ds-ease) infinite; }
.ui-pbar[data-indeterminate] .ui-pbar__shine { display: none; }
@keyframes ui-pbar-shine { from { background-position: 120% 0; opacity: 1; } to { background-position: -20% 0; opacity: 0; } }
@keyframes ui-pbar-roll { from { opacity: 0; transform: translateY(60%); } to { opacity: 1; transform: none; } }
@keyframes ui-pbar-run { from { left: -40%; } to { left: 100%; } }
@media (prefers-reduced-motion: reduce) { .ui-pbar__fill { transition-duration: 1ms; } .ui-pbar__shine, .ui-pbar__digit { animation: none; } .ui-pbar[data-indeterminate] .ui-pbar__fill { animation-duration: 2800ms; } }

:where(.dark, [data-theme="dark"]) .ui-pbar { --ui-pb-track: rgba(255, 255, 255, 0.1); }
:where(.dark, [data-theme="dark"]) .ui-pbar__shine { background-image: linear-gradient(90deg, transparent 30%, rgba(255, 255, 255, 0.7) 50%, transparent 70%); }
`;
