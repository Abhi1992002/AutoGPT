// Prints every tutorial step's id, title, HTML text and buttons as JSON,
// from the checkout this runs in (cwd = its frontend dir).
import { join } from "node:path";
(globalThis as any).window ??= globalThis;
const { createTutorialSteps } = await import(join(process.cwd(), "src/app/(platform)/build/components/FlowEditor/tutorial/steps/index.ts"));
const tour = new Proxy({}, { get: () => () => undefined });
const steps = createTutorialSteps(tour).map((s: any) => ({
  id: s.id,
  title: typeof s.title === "function" ? s.title() : s.title ?? "",
  text: typeof s.text === "function" ? s.text() : s.text ?? "",
  buttons: (s.buttons ?? []).map((b: any) => ({ text: typeof b.text === "function" ? b.text() : b.text, classes: b.classes ?? "" })),
}));
console.log(JSON.stringify(steps));
