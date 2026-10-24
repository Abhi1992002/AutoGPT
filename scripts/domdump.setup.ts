// Records every distinct DOM state a test renders (data-slot removed), so the
// same tests on two commits can be compared for tags, classes, roles and aria.
import { afterAll, afterEach, beforeEach, expect } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const states: Record<string, string[]> = {};
let current = "";

const slots = new Set<string>();

function serialise() {
  document.body.querySelectorAll("[data-slot]").forEach((el) => slots.add(el.getAttribute("data-slot")!));
  const clone = document.body.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("[data-slot]").forEach((el) => el.removeAttribute("data-slot"));
  return clone.innerHTML;
}

function record() {
  if (!current || !document.body.firstElementChild) return;
  const html = serialise();
  const list = (states[current] ??= []);
  if (list[list.length - 1] !== html) list.push(html);
}

// Registered after the project's cleanup hook, so it runs before it.
afterEach(() => record());

const observer = new MutationObserver(record);
observer.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });

beforeEach(() => {
  current = expect.getState().currentTestName ?? "unknown";
  states[current] = [];
});

afterAll(() => {
  const out = process.env.DOMDUMP_OUT!;
  mkdirSync(out, { recursive: true });
  const file = relative(process.cwd(), expect.getState().testPath ?? "unknown").replace(/[\/]/g, "__");
  writeFileSync(join(out, `${file}.json`), JSON.stringify(states, null, 1));
  mkdirSync(`${out}-slots`, { recursive: true });
  writeFileSync(join(`${out}-slots`, `${file}.json`), JSON.stringify([...slots].sort()));
});
