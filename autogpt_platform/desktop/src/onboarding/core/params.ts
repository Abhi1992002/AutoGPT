import { STEP_IDS, stepAt, stepIndex, type StepId } from "./steps";

/*
 * Dev viewing through the URL:
 *   ?onboarding=1&variant=a|b|c&step=1..7&freeze=1&devtools=0
 * freeze=1 holds each step in a representative state: no mock timers, no auto-advance.
 */

export const VARIANTS = ["a", "b", "c"] as const;
export type VariantId = (typeof VARIANTS)[number];

export type ViewParams = { variant: VariantId; step: StepId; freeze: boolean; devtools: boolean };

export const wantsOnboarding = () => new URLSearchParams(window.location.search).has("onboarding");

export function readParams(): ViewParams {
  const q = new URLSearchParams(window.location.search);
  const variant = (VARIANTS as readonly string[]).includes(q.get("variant") ?? "") ? (q.get("variant") as VariantId) : "a";
  const n = Number(q.get("step"));
  const step = Number.isInteger(n) && n >= 1 && n <= STEP_IDS.length ? stepAt(n - 1) : "welcome";
  return { variant, step, freeze: q.get("freeze") === "1", devtools: q.get("devtools") !== "0" };
}

/** Mirrors the view into the URL without adding history entries */
export function writeParams(view: Partial<ViewParams>) {
  const q = new URLSearchParams(window.location.search);
  q.set("onboarding", "1");
  if (view.variant) q.set("variant", view.variant);
  if (view.step) q.set("step", String(stepIndex(view.step) + 1));
  if (view.freeze !== undefined) {
    if (view.freeze) q.set("freeze", "1");
    else q.delete("freeze");
  }
  window.history.replaceState(null, "", `${window.location.pathname}?${q}`);
}
