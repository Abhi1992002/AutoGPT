import { useState } from "react";
import { VARIANTS, type ViewParams } from "./core/params";
import { STEP_IDS, STEPS, stepIndex } from "./core/steps";
import "./dev-switcher.css";

/*
 * Dev-only picker for variant, step and freeze. Deliberately styled outside the design system,
 * so it never reads as part of the onboarding. Hide it with ?devtools=0.
 */

const NAMES = { a: "Zen", b: "Story", c: "Console" } as const;

export function DevSwitcher({ view, onChange }: { view: ViewParams; onChange: (patch: Partial<ViewParams>) => void }) {
  const [open, setOpen] = useState(true);
  const current = stepIndex(view.step);

  if (!open) {
    return (
      <button type="button" className="devsw devsw--closed" onClick={() => setOpen(true)} aria-label="Show onboarding dev switcher">
        dev
      </button>
    );
  }

  return (
    <div className="devsw" role="group" aria-label="Onboarding dev switcher">
      <div className="devsw__row" role="radiogroup" aria-label="Variant">
        {VARIANTS.map((v) => (
          <button key={v} type="button" role="radio" aria-checked={view.variant === v} className="devsw__btn" onClick={() => onChange({ variant: v })}>
            {v.toUpperCase()} <span className="devsw__dim">{NAMES[v]}</span>
          </button>
        ))}
      </div>
      <div className="devsw__row" role="radiogroup" aria-label="Step">
        {STEP_IDS.map((id, i) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={current === i}
            aria-label={`Step ${i + 1}: ${STEPS[id].label}`}
            title={STEPS[id].label}
            className="devsw__btn devsw__btn--step"
            onClick={() => onChange({ step: id })}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <div className="devsw__row">
        <button type="button" role="switch" aria-checked={view.freeze} className="devsw__btn" onClick={() => onChange({ freeze: !view.freeze })}>
          freeze {view.freeze ? "on" : "off"}
        </button>
        <button type="button" className="devsw__btn" onClick={() => onChange({})}>
          replay
        </button>
        <button type="button" className="devsw__btn" onClick={() => setOpen(false)} aria-label="Hide dev switcher">
          hide
        </button>
      </div>
    </div>
  );
}
