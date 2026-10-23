// Supplementary equivalence check for SECRT-3111 (DS5g-1).
//
// Every exact class string this PR writes is rendered twice in Chromium:
// the old string against the base checkout's tailwind.config.ts + globals.css,
// the new string against the head's. Each element sits inside parents at
// leading-[1.5], leading-[30px] and leading-normal, at 1280px and 390px, as
// written and after cn(), in the rest state and with hover / focus /
// focus-visible / active forced (and the parent hovered for group-*), plus
// disabled and aria-expanded variants. The ENTIRE computed style of the
// element and of its ::before, ::after and ::placeholder must match.
//
//   npx tsx equiv-pr.ts <baseFrontend> <headFrontend> <relDir> <outDir>
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { chromium, type Page } from "/home/vercel-sandbox/autogpt/autogpt_platform/frontend/node_modules/@playwright/test";
import ts from "/home/vercel-sandbox/autogpt/autogpt_platform/frontend/node_modules/typescript";
import { cn } from "/home/vercel-sandbox/autogpt/autogpt_platform/frontend/src/lib/utils";
import {
  buildReplacementMap,
  buildSizeMap,
  rewriteClassList,
} from "/home/vercel-sandbox/autogpt/autogpt_platform/frontend/scripts/codemod-tokens";
import { tones, variants } from "/home/vercel-sandbox/autogpt/autogpt_platform/frontend/src/components/atoms/Text/helpers";

const [baseDir, headDir] = process.argv.slice(2, 4).map((p) => resolve(p));
const rel = process.argv[4];
const outDir = resolve(process.argv[5]);
mkdirSync(outDir, { recursive: true });

const MAP = buildReplacementMap();
const SIZE = buildSizeMap();
const MANUAL: Record<string, string[]> = {
  "border-[#DADADC]": ["border-border-base"],
  "bg-[#F9F9FA]": ["bg-surface-muted"],
  "placeholder:text-zinc-400": ["placeholder:text-foreground-subtle"],
  "[&_div]:!text-[1.375rem]": ["[&_div]:!text-heading-sm"],
  "accent-zinc-900": ["accent-action-hover"],
  "focus-visible:ring-zinc-900": ["focus-visible:ring-action-hover"],
  "from-purple-500/30": ["from-brand/30"],
  "from-white": ["from-surface"],
  "ring-zinc-100": ["ring-separator"],
  "ring-zinc-800": ["ring-action"],
  "scrollbar-thumb-zinc-200": ["scrollbar-thumb-surface-active"],
  "to-blue-500/30": ["to-info/30"],
  "before:bg-[linear-gradient(90deg,transparent_0%,transparent_40%,#18181b_50%,transparent_60%,transparent_100%)]": ["before:bg-[linear-gradient(90deg,transparent_0%,transparent_40%,rgb(var(--color-primary))_50%,transparent_60%,transparent_100%)]"],
  "sm:text-[15px]": ["sm:text-body-md"],
};
function mapTokens(tokens: string[]) {
  return tokens.flatMap((t) =>
    MANUAL[t] ?? rewriteClassList(t, MAP, SIZE).output.split(/\s+/),
  );
}

type Pair = { group: string; where: string; oldList: string; newList: string; tag?: string };

function literals(file: string) {
  const sf = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out: { text: string; line: number }[] = [];
  sf.forEachChild(function v(n: ts.Node) {
    if (
      ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) ||
      ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)
    ) {
      const text = (n as ts.LiteralLikeNode).text.trim();
      if (text) out.push({ text, line: sf.getLineAndCharacterOfPosition(n.getStart()).line + 1 });
    }
    n.forEachChild(v);
  });
  return out;
}

const sortKey = (tokens: string[]) => [...tokens].sort().join(" ");

function collectPairs() {
  const files = execSync(`find "${rel}" -name '*.tsx' -o -name '*.ts'`, { cwd: headDir })
    .toString().trim().split("\n")
    .filter((f) => !/\.(test|stories)\.tsx?$/.test(f) && !f.includes("__tests__"));
  const pairs: Pair[] = [];
  const unpaired: string[] = [];
  for (const f of files) {
    const b = join(baseDir, f);
    if (!existsSync(b)) continue;
    const oldLits = literals(b);
    const newLits = literals(join(headDir, f));
    const newTexts = new Set(newLits.map((l) => l.text));
    const oldTexts = new Set(oldLits.map((l) => l.text));
    const byKey = new Map<string, { text: string; line: number }[]>();
    for (const l of newLits) {
      if (oldTexts.has(l.text)) continue;
      const k = sortKey(l.text.split(/\s+/));
      byKey.set(k, [...(byKey.get(k) ?? []), l]);
    }
    const used = new Set<string>();
    for (const l of oldLits) {
      if (newTexts.has(l.text)) continue;
      const mapped = mapTokens(l.text.split(/\s+/));
      if (mapped.join(" ") === l.text) continue; // nothing to map: a hand edit
      let k = sortKey(mapped);
      let hit = byKey.get(k)?.find((x) => !used.has(`${x.line}:${x.text}`));
      if (!hit) {
        // The codemod drops leading-inherit when a same-scope leading-* exists.
        const alt = sortKey(mapped.filter((t) => !/(^|:)leading-inherit$/.test(t)));
        hit = byKey.get(alt)?.find((x) => !used.has(`${x.line}:${x.text}`));
      }
      if (!hit) {
        unpaired.push(`${f}:${l.line}: ${l.text}`);
        continue;
      }
      used.add(`${hit.line}:${hit.text}`);
      pairs.push({ group: "class string", where: `${f.replace(rel + "/", "")}:${hit.line}`, oldList: l.text, newList: hit.text });
    }
  }
  return { pairs, unpaired };
}

// Hand edits, written out with the exact strings each element renders.
function textVariant(variant: keyof typeof variants, tone: keyof typeof tones | undefined, className: string) {
  return cn(variants[variant], tone && tones[tone], className);
}
// MessageContent's own classes (src/components/ai-elements/message.tsx, unchanged).
const MESSAGE_CONTENT = [
  "is-user:dark flex w-full min-w-0 max-w-full flex-col gap-2 overflow-hidden text-sm",
  "group-[.is-user]:w-fit",
  "group-[.is-user]:ml-auto group-[.is-user]:rounded-lg group-[.is-user]:bg-neutral-100 group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-user]:text-neutral-950",
  "group-[.is-assistant]:text-neutral-950",
];
const messageContent = (className: string) => cn(...MESSAGE_CONTENT, className);
const STATUS_PILL = (size: string, styles: string, className?: string) =>
  cn(`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 ${size} font-medium`, styles, className);
const HAND: Pair[] = [
  // Rule 14: cn()-merged strings, as the components render them.
  { group: "cn() Text", where: "ChatMessagesContainer/components/StoppedTaskCard.tsx (Text body)", oldList: cn(variants.body, "mt-1 text-[13px] text-zinc-600"), newList: cn(variants.body, "mt-1 text-body-sm leading-inherit text-foreground-secondary") },
  { group: "cn() Text", where: "ToolAccordion/AccordionContent.tsx ContentBadge (Text small)", oldList: cn(variants.small, cn("shrink-0 rounded-full border bg-muted px-2 py-0.5 text-[11px] text-zinc-800")), newList: cn(variants.small, cn("shrink-0 rounded-full border bg-muted px-2 py-0.5 text-caption-sm leading-inherit text-foreground-emphasis")) },
  { group: "cn() MessageContent", where: "ChatMessagesContainer.tsx / PendingUploadMessage.tsx", oldList: messageContent("text-[1rem] leading-relaxed"), newList: messageContent("text-body-lg leading-relaxed") },
  { group: "cn() StatusPill", where: "ToolChain/SubSessionLive.tsx StatusPill className=text-sm", oldList: STATUS_PILL("text-[11px]", "bg-green-50 text-green-600", "text-sm"), newList: STATUS_PILL("text-caption-sm leading-inherit", "bg-success-surface text-success", "text-sm") },
  { group: "cn() StatusPill", where: "ToolChain/ResultCards.tsx StatusPill (no className)", oldList: STATUS_PILL("text-[11px]", "bg-zinc-100 text-zinc-500"), newList: STATUS_PILL("text-caption-sm leading-inherit", "bg-surface-hover text-foreground-tertiary") },
  { group: "cn() ExpertPageLink", where: "ContextPanel/components/IntegrationsTab/IntegrationsTab.tsx className=justify-between py-2", oldList: cn("flex items-center gap-1 text-[13px] font-medium text-zinc-700 transition-colors hover:text-zinc-950", "justify-between py-2"), newList: cn("flex items-center gap-1 text-body-sm font-medium leading-inherit text-foreground-body transition-colors hover:text-foreground", "justify-between py-2"), tag: "a" },
  {
    group: "Text atom",
    where: "AgentSavedCard/AgentSavedCard.tsx:41",
    oldList: cn(variants["body-medium"], "mb-2 text-[16px] text-black"),
    newList: textVariant("large-medium", undefined, "mb-2 leading-inherit"),
  },
  {
    group: "Text atom",
    where: "OnboardingWelcomeDialog/ConnectProviderRow.tsx:65",
    oldList: "truncate text-[14px] font-medium leading-[22px] text-zinc-800",
    newList: textVariant("body-medium", undefined, "truncate text-foreground-emphasis"),
    tag: "span",
  },
  {
    group: "Text atom",
    where: "OnboardingWelcomeDialog/ConnectProviderRow.tsx:83",
    oldList: "truncate text-[12px] leading-[16px] text-zinc-500",
    newList: textVariant("small", "muted", "truncate leading-4"),
    tag: "span",
  },
  {
    group: "sm: size next to text-base",
    where: "ExpertOnboardingCard/components/OnboardingChoices/OnboardingChoices.tsx:86",
    oldList: "flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-base leading-snug outline-none transition-colors focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 sm:py-2.5 sm:text-[15px] [@media(hover:none)]:min-h-11",
    newList: "flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-base leading-snug outline-none transition-colors focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 sm:py-2.5 sm:text-body-md sm:leading-snug [@media(hover:none)]:min-h-11",
  },
  {
    group: "sm: size next to text-base",
    where: "ExpertOnboardingCard/components/OnboardingChoices/OnboardingChoices.tsx:117",
    oldList: "resize-none rounded-md bg-zinc-50 px-4 py-3 text-base leading-relaxed text-zinc-800 ring-1 ring-zinc-200 transition-shadow placeholder:text-zinc-400 focus:outline-none focus:ring-zinc-400 sm:text-[15px]",
    newList: "resize-none rounded-md bg-surface-muted px-4 py-3 text-base leading-relaxed text-foreground-emphasis ring-1 ring-border-base transition-shadow placeholder:text-foreground-subtle focus:outline-none focus:ring-zinc-400 sm:text-body-md sm:leading-relaxed",
    tag: "textarea",
  },
  {
    group: "sm: size next to text-base",
    where: "ExpertOnboardingCard/components/OnboardingChoices/OnboardingChoices.tsx:124",
    oldList: "flex w-full items-center gap-3 rounded-md border border-dashed border-zinc-200 px-3 py-3 text-left text-base text-zinc-500 outline-none transition-colors hover:bg-zinc-50 hover:text-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 sm:py-2.5 sm:text-[15px] [@media(hover:none)]:min-h-11",
    newList: "flex w-full items-center gap-3 rounded-md border border-dashed border-border-base px-3 py-3 text-left text-base text-foreground-tertiary outline-none transition-colors hover:bg-surface-muted hover:text-foreground-body focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 sm:py-2.5 sm:text-body-md [@media(hover:none)]:min-h-11",
    tag: "button",
  },
  {
    group: "sm: size next to text-base",
    where: "ExpertOnboardingCard/components/OnboardingReview.tsx:40",
    oldList: "break-words text-base text-zinc-900 sm:text-[15px]",
    newList: "break-words text-base text-foreground-strong sm:text-body-md",
    tag: "span",
  },
];

const localRequire = createRequire(join(headDir, "package.json"));
const postcss = localRequire("postcss");
const tailwindcss = localRequire("tailwindcss");
const loadConfig = localRequire("tailwindcss/loadConfig");

async function compile(dir: string, raw: string, extraCss = "") {
  const config = loadConfig(join(dir, "tailwind.config.ts"));
  const globals = readFileSync(join(dir, "src/app/globals.css"), "utf8");
  const css = (
    await postcss([tailwindcss({ ...config, content: [{ raw, extension: "html" }] })]).process(globals + "\n" + extraCss, { from: join(dir, "src/app/globals.css") })
  ).css as string;
  return css;
}

const PARENTS = ["leading-[1.5]", "leading-[30px]", "leading-normal"];
const WIDTHS = [1280, 390];
const STATES = ["rest", "hover", "focus", "focus-visible", "active", "group-hover", "disabled", "aria-expanded", "is-user", "is-assistant"] as const;
const PSEUDOS = [null, "::before", "::after", "::placeholder"] as const;

function cellHtml(list: string, tag: string, id: string, parent: string, state: string) {
  const parentExtra = state === "is-user" ? " is-user" : state === "is-assistant" ? " is-assistant" : "";
  const attrs = [
    state === "disabled" ? "disabled" : "",
    state === "aria-expanded" ? 'aria-expanded="true"' : "",
    tag === "textarea" || tag === "input" ? 'placeholder="Ag"' : "",
    'tabindex="0"',
  ].join(" ");
  const inner = tag === "textarea" || tag === "input" ? "" : "Ag<span>b</span><span>c</span>";
  return `<div class="group ${parent}${parentExtra}" style="font-size:16px" data-p="${id}"><${tag} data-i="${id}" class="${list}" ${attrs}>${inner}</${tag}></div>`;
}

const FORCED = ["hover", "focus", "focus-visible", "active", "group-hover"];

// Old and new render in two same-sized iframes of one page; the browser
// compares every computed property and returns only the differences.
async function measureBatch(page: Page, oldCss: string, newCss: string, batch: { idx: number; oldList: string; newList: string; tag: string }[], state: string) {
  const cells = (side: "oldList" | "newList") =>
    batch.flatMap((p) => PARENTS.flatMap((parent, pi) => [p[side], cn(p[side])].map((l, mode) => cellHtml(l, p.tag, `${p.idx}-${pi}-${mode}`, parent, state)))).join("");
  const doc = (css: string, side: "oldList" | "newList") => `<html><head><style>${css}</style></head><body style="margin:0">${cells(side)}</body></html>`;
  await page.setContent(`<html><body style="margin:0"><iframe id="a" style="border:0;width:100%;height:400px"></iframe><iframe id="b" style="border:0;width:100%;height:400px"></iframe></body></html>`);
  await page.evaluate(([a, b]) => Promise.all([["a", a], ["b", b]].map(([id, html]) => new Promise<void>((res) => { const f = document.getElementById(id) as HTMLIFrameElement; f.onload = () => res(); f.srcdoc = html; }))), [doc(oldCss, "oldList"), doc(newCss, "newList")]);
  if (FORCED.includes(state)) {
    const client = await page.context().newCDPSession(page);
    await client.send("DOM.enable");
    await client.send("CSS.enable");
    const { root } = await client.send("DOM.getDocument", { depth: -1, pierce: true });
    const nodes: number[] = [];
    const walk = (n: any) => {
      const attrs: string[] = n.attributes ?? [];
      const has = (name: string) => attrs.some((x, k) => k % 2 === 0 && x === name);
      if (has("data-i") || (state === "group-hover" && has("data-p"))) nodes.push(n.nodeId);
      (n.children ?? []).forEach(walk);
      if (n.contentDocument) walk(n.contentDocument);
    };
    walk(root);
    const forced = state === "group-hover" ? ["hover"] : [state];
    for (const nodeId of nodes) await client.send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: forced });
    await client.detach();
  }
  // Settle both documents: finite transitions/animations jump to their end
  // state, infinite ones are pinned at their first frame.
  await page.evaluate(async () => {
    for (const id of ["a", "b"]) {
      const d = (document.getElementById(id) as HTMLIFrameElement).contentDocument!;
      for (const anim of d.getAnimations()) {
        const iterations = anim.effect?.getComputedTiming().iterations;
        if (iterations === Infinity) { anim.pause(); anim.currentTime = 0; }
        else anim.finish();
      }
    }
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
  return page.evaluate(([pseudos, shownProps]) => {
    const docA = (document.getElementById("a") as HTMLIFrameElement).contentDocument!;
    const docB = (document.getElementById("b") as HTMLIFrameElement).contentDocument!;
    const diffs: Record<string, string[]> = {};
    const varDiffs: Record<string, string[]> = {};
    const shown: Record<string, Record<string, string>> = {};
    let compared = 0;
    docA.querySelectorAll("[data-i]").forEach((ea) => {
      const id = (ea as HTMLElement).dataset.i!;
      const eb = docB.querySelector(`[data-i="${id}"]`)!;
      for (const pseudo of pseudos) {
        const sa = docA.defaultView!.getComputedStyle(ea, pseudo ?? undefined);
        const sb = docB.defaultView!.getComputedStyle(eb, pseudo ?? undefined);
        compared++;
        for (let k = 0; k < sa.length; k++) {
          const prop = sa[k];
          const va = sa.getPropertyValue(prop), vb = sb.getPropertyValue(prop);
          if (va === vb) continue;
          // Custom properties compute to their source text (#fefefe vs
          // rgb(254 254 254 / 1)); what renders is the real property that
          // consumes them (background-image, scrollbar-color), compared above.
          if (prop.startsWith("--")) (varDiffs[id] ??= []).push(prop);
          else (diffs[id] ??= []).push(`${pseudo ?? "element"} ${prop}: ${va} != ${vb}`);
        }
        if (sa.length !== sb.length) (diffs[id] ??= []).push(`${pseudo ?? "element"} property count ${sa.length} != ${sb.length}`);
      }
      if (id.endsWith("-0-0")) shown[id] = Object.fromEntries((shownProps as string[]).map((p) => [p, docB.defaultView!.getComputedStyle(eb).getPropertyValue(p)]));
    });
    return { diffs, varDiffs, shown, compared };
  }, [[...PSEUDOS], SHOWN] as const);
}

const SHOWN = ["font-size", "line-height", "font-weight", "letter-spacing", "color", "background-color", "border-top-color", "box-shadow"];

async function main() {
  // MessageRow's class builder, read from each checkout's source: its string
  // literals are the compact/regular ternary followed by the shared parts.
  const helpersPath = "src/app/(platform)/copilot/components/ChatMessagesContainer/components/MessageRow/helpers.ts";
  const builder = (dir: string, compact: boolean) => {
    const src = readFileSync(join(dir, helpersPath), "utf8");
    const body = src.slice(src.indexOf("export function getMessageContentClassName"));
    const fn = body.slice(0, body.indexOf("\n}\n"));
    const lits = [...fn.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
    return cn(compact ? lits[0] : lits[1], ...lits.slice(2));
  };
  for (const compact of [false, true])
    HAND.push({
      group: "cn() MessageContent",
      where: `MessageRow/helpers.ts getMessageContentClassName(${compact}) on MessageContent`,
      oldList: messageContent(builder(baseDir, compact)),
      newList: messageContent(builder(headDir, compact)),
    });
  const collected = collectPairs();
  const pairs = collected.pairs;
  // Hand edits are checked through HAND; a literal they cover is not unpaired.
  const covered = collected.unpaired.filter((u) => HAND.some((h) => h.oldList.includes(u.replace(/^.*?:\d+: /, ""))));
  const unpaired = collected.unpaired.filter((u) => !covered.includes(u));
  // NEGATIVE=1: a small run with two deliberately wrong pairs, which must fail.
  const negative = process.env.NEGATIVE
    ? [
        { group: "negative", where: "control", oldList: "text-zinc-500", newList: "text-foreground-secondary" },
        { group: "negative", where: "control", oldList: "text-base sm:text-[15px]", newList: "text-base sm:text-body-md sm:leading-inherit" },
      ]
    : [];
  const all = process.env.NEGATIVE ? [...pairs.slice(0, 10), ...negative] : [...pairs, ...HAND];
  const items = all.map((p) => ({
    ...p,
    tag: p.tag ?? (/(^|\s)(placeholder:|resize-none)/.test(p.oldList) ? "textarea" : /(disabled:|enabled:)/.test(p.oldList) ? "button" : "div"),
  }));
  const oldRaw = items.flatMap((p) => [p.oldList, cn(p.oldList)]).join(" ") + " group is-user is-assistant " + PARENTS.join(" ");
  const newRaw = items.flatMap((p) => [p.newList, cn(p.newList)]).join(" ") + " group is-user is-assistant " + PARENTS.join(" ");
  const oldCss = await compile(baseDir, oldRaw);
  const newCss = await compile(headDir, newRaw);
  const browser = await chromium.launch();
  const failures = new Map<number, Set<string>>();
  const shown = new Map<number, Record<string, string>>();
  const varOnly = new Map<number, Set<string>>();
  let cases = 0;
  const indexed = items.map((p, idx) => ({ ...p, idx }));
  const BATCH = 120;
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    for (const state of STATES) {
      for (let k = 0; k < indexed.length; k += BATCH) {
        const res = await measureBatch(page, oldCss, newCss, indexed.slice(k, k + BATCH), state);
        cases += res.compared;
        for (const [id, list] of Object.entries(res.varDiffs)) {
          const idx = Number(id.split("-")[0]);
          const set = varOnly.get(idx) ?? new Set();
          list.forEach((d) => set.add(d));
          varOnly.set(idx, set);
        }
        for (const [id, list] of Object.entries(res.diffs)) {
          const idx = Number(id.split("-")[0]);
          const set = failures.get(idx) ?? new Set();
          list.forEach((d) => set.add(`${state}@${width} ${d}`));
          failures.set(idx, set);
        }
        if (state === "rest" && width === 1280)
          for (const [id, v] of Object.entries(res.shown)) shown.set(Number(id.split("-")[0]), v);
      }
      console.error(`width ${width} state ${state} done`);
    }
    await page.close();
  }
  await browser.close();
  const lines = [
    "| # | where | old class string | new class string | computed (rest, 1280px, parent leading-[1.5]) | result |",
    "| --- | --- | --- | --- | --- | --- |",
  ];
  items.forEach((p, i) => {
    const f = failures.get(i);
    const v = shown.get(i) ?? {};
    lines.push(
      `| ${i + 1} | ${p.where} | \`${p.oldList}\` | \`${p.newList}\` | ${SHOWN.map((k) => `${k}: ${v[k]}`).join("; ")} | ${f ? `FAIL: ${[...f].slice(0, 6).join("; ")}` : varOnly.get(i) ? `identical (custom-property text differs: ${[...varOnly.get(i)!].join(", ")})` : "identical"} |`,
    );
  });
  const perPair = PARENTS.length * 2 * WIDTHS.length * STATES.length * PSEUDOS.length;
  const summary = `${cases} computed-style comparisons. ${items.length} class strings (${pairs.length} codemod/hand-swap strings + ${HAND.length} hand edits), each compared on every computed property of the element, ::before, ::after and ::placeholder in ${perPair} cases (3 parent line-heights x as written|cn() x 2 widths x ${STATES.length} states x 4 boxes): ${failures.size} failing; ${varOnly.size} strings differ only in custom-property text, with identical rendered values. ${covered.length} hand-edited literals are covered by the hand-edit rows; ${unpaired.length} changed literals are not covered.`;
  writeFileSync(join(outDir, "equivalence-pr.md"), `${summary}\n\n${lines.join("\n")}\n${unpaired.length ? `\nUnpaired:\n${unpaired.join("\n")}\n` : ""}`);
  console.log(summary);
  if (unpaired.length) console.log("Unpaired:\n" + unpaired.join("\n"));
  for (const [i, f] of failures) console.log(`FAIL ${items[i].where}: ${[...f].slice(0, 4).join(" | ")}`);
  process.exitCode = failures.size || unpaired.length ? 1 : 0;
}
main();
