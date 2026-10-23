/**
 * Per-string equivalence for DS5g-3 (SECRT-3111). Not committed.
 *
 * For every class string this PR writes, renders the base (dev) string with
 * the base checkout's Tailwind build and the head string with the head
 * build, exactly as the element receives it (after the component's cn()),
 * and compares the FULL computed style of the element and of a child span,
 * in every state (rest, :hover, disabled), inside parents at
 * leading-[1.5] / leading-[30px] / leading-normal, at 1440 and 390 wide.
 * Also screenshots each page and pixel-diffs old against new.
 *
 *   cd <head frontend> && npx tsx eq-strings.ts <base frontend> <out dir>
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { chromium, type Browser } from "@playwright/test";

const HEAD = process.cwd();
const BASE = resolve(process.argv[2]);
const OUT = resolve(process.argv[3]);
const req = createRequire(join(HEAD, "package.json"));
const postcss = req("postcss");
const tailwindcss = req("tailwindcss");
const loadConfig = req("tailwindcss/loadConfig");

type Cn = (...a: unknown[]) => string;
interface Tree {
  cn: Cn;
  variants: Record<string, string>;
  tones: Record<string, string>;
  button: (o: { variant: string; size: string; className: string }) => string;
  message: string;
}

async function loadTree(dir: string): Promise<Tree> {
  const { cn } = await import(join(dir, "src/lib/utils.ts"));
  const text = await import(join(dir, "src/components/atoms/Text/helpers.ts"));
  const btn = await import(join(dir, "src/components/atoms/Button/helpers.ts"));
  return {
    cn,
    variants: text.variants,
    tones: text.tones,
    button: btn.extendedButtonVariants,
    message: readFileSync(
      join(dir, "src/components/ai-elements/message.tsx"),
      "utf8",
    ),
  };
}

// MessageContent's own classes, asserted against message.tsx in both trees.
const MESSAGE_BASE = [
  "is-user:dark flex w-full min-w-0 max-w-full flex-col gap-2 overflow-hidden text-sm",
  "group-[.is-user]:w-fit",
  "group-[.is-user]:ml-auto group-[.is-user]:rounded-lg group-[.is-user]:bg-neutral-100 group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-user]:text-neutral-950",
  "group-[.is-assistant]:text-neutral-950",
];
const CONVERSATION_BASE = "relative flex-1 overflow-y-hidden";

interface Pair {
  where: string;
  old: string;
  new: string;
  tag?: string;
  group?: "is-user" | "is-assistant";
  attrs?: string;
}

// Every "as written" string must appear verbatim in a dev file (old) and in a
// head file (new), so the table can never drift from the committed code.
const SCOPE = [
  "src/app/(platform)/copilot/CopilotChatHost.tsx",
  "src/app/(platform)/copilot/CopilotPage.tsx",
  "src/app/(platform)/copilot/sharing/ShareChatDialog.tsx",
  "src/app/(platform)/copilot/styleguide/page.tsx",
  "src/app/(platform)/copilot/voice/components/VoiceModeBar.tsx",
  "src/app/(platform)/copilot/voice/components/VoiceModeButton.tsx",
];
const sources = (dir: string) =>
  SCOPE.map((f) => readFileSync(join(dir, f), "utf8")).join("\n");
let baseSrc = "";
let headSrc = "";
function assertWritten(where: string, o: string, n: string) {
  if (!baseSrc.includes(`"${o}"`)) throw new Error(`${where}: old not in dev: ${o}`);
  if (!headSrc.includes(`"${n}"`)) throw new Error(`${where}: new not in head: ${n}`);
}

function pairs(b: Tree, h: Tree): Pair[] {
  baseSrc = sources(BASE);
  headSrc = sources(HEAD);
  for (const t of [b, h]) {
    for (const s of MESSAGE_BASE) {
      if (!t.message.includes(`"${s}"`)) throw new Error(`message.tsx: ${s}`);
    }
  }
  const out: Pair[] = [];
  const asWritten = (where: string, o: string, n: string, tag = "div") => {
    assertWritten(where, o, n);
    out.push({ where: `${where} (as written)`, old: o, new: n, tag });
  };
  const text = (
    where: string,
    old: { v: string; c?: string },
    neu: { v: string; tone?: string; c?: string },
  ) => {
    const oldJsx = `<Text variant="${old.v}"${old.c ? ` className="${old.c}"` : ""}>`;
    const newJsx = `<Text variant="${neu.v}"${neu.tone ? ` tone="${neu.tone}"` : ""}${neu.c ? ` className="${neu.c}"` : ""}>`;
    if (!baseSrc.includes(oldJsx)) throw new Error(`${where}: not in dev: ${oldJsx}`);
    if (!headSrc.includes(newJsx)) throw new Error(`${where}: not in head: ${newJsx}`);
    out.push({
      where: `${where} <Text>`,
      old: b.cn(b.variants[old.v], undefined, false, old.c),
      new: h.cn(
        h.variants[neu.v],
        neu.tone && h.tones[neu.tone],
        false,
        neu.c ?? "",
      ),
      tag: "p",
    });
  };

  // CopilotChatHost.tsx: Test mode banner
  asWritten(
    "CopilotChatHost dry-run banner",
    "flex items-center justify-center gap-1.5 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800",
    "flex items-center justify-center gap-1.5 bg-warning-surface px-3 py-1.5 text-xs font-medium text-amber-800",
  );

  // ShareChatDialog.tsx
  asWritten(
    "ShareChatDialog warning box",
    "space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3",
    "space-y-2 rounded-md border border-warning-border bg-warning-surface p-3",
  );
  asWritten(
    "ShareChatDialog disclosure box",
    "rounded-md border border-zinc-200 bg-zinc-50 p-3",
    "rounded-md border border-border-base bg-surface-muted p-3",
  );
  text(
    "ShareChatDialog 'Currently sharing'",
    { v: "small", c: "font-medium text-zinc-900" },
    { v: "small-medium", tone: "primary" },
  );
  asWritten(
    "ShareChatDialog disclosure list",
    "mt-1 list-disc pl-5 text-xs text-zinc-700",
    "mt-1 list-disc pl-5 text-xs text-foreground-body",
    "ul",
  );
  asWritten(
    "ShareChatDialog toggle row",
    "flex items-center justify-between gap-3 rounded border border-zinc-200 px-3 py-2.5",
    "flex items-center justify-between gap-3 rounded border border-border-base px-3 py-2.5",
  );
  text(
    "ShareChatDialog 'Share workflow runs'",
    { v: "body", c: "font-medium" },
    { v: "body-medium" },
  );
  text(
    "ShareChatDialog 'Includes every run'",
    { v: "small", c: "text-zinc-500" },
    { v: "small", tone: "muted" },
  );
  text(
    "ShareChatDialog 'Share link'",
    { v: "small", c: "font-medium" },
    { v: "small-medium" },
  );
  text(
    "ShareChatDialog warning copy (unchanged, amber-900 TODO)",
    { v: "small", c: "text-amber-900" },
    { v: "small", c: "text-amber-900" },
  );
  asWritten(
    "ShareChatDialog share URL input",
    "flex-1 rounded border border-zinc-200 bg-zinc-50 px-2 py-1.5 font-mono text-xs",
    "flex-1 rounded border border-border-base bg-surface-muted px-2 py-1.5 font-mono text-xs",
    "input",
  );

  // styleguide/page.tsx
  asWritten(
    "styleguide nav",
    "sticky top-0 hidden h-full w-56 shrink-0 overflow-y-auto border-r border-neutral-200 bg-white px-3 py-6 lg:block",
    "sticky top-0 hidden h-full w-56 shrink-0 overflow-y-auto border-r border-neutral-200 bg-surface px-3 py-6 lg:block",
    "nav",
  );
  asWritten(
    "styleguide 'Sections' label",
    "mb-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400",
    "mb-3 px-2 text-caption-sm font-semibold uppercase leading-inherit tracking-wider text-neutral-400",
    "p",
  );
  asWritten(
    "styleguide nav link",
    "block rounded-md px-2 py-1.5 text-[13px] text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900",
    "block rounded-md px-2 py-1.5 text-body-sm leading-inherit text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900",
    "a",
  );
  asWritten(
    "styleguide error state",
    "rounded-lg bg-red-50 p-3 text-red-600",
    "rounded-lg bg-error-surface p-3 text-red-600",
  );
  for (const [where, o, n] of [
    [
      "styleguide Conversation",
      "min-h-0 rounded-lg border bg-white",
      "min-h-0 rounded-lg border bg-surface",
    ],
  ]) {
    asWritten(where, o, n);
    out.push({
      where: `${where} (after Conversation cn)`,
      old: b.cn(CONVERSATION_BASE, o),
      new: h.cn(CONVERSATION_BASE, n),
    });
  }
  const messages: [string, string, "is-user" | "is-assistant" | undefined][] =
    [
      [
        "user bubble",
        "leading-relaxed group-[.is-user]:rounded-xl group-[.is-user]:bg-purple-100 group-[.is-user]:px-3 group-[.is-user]:py-2.5 group-[.is-user]:text-slate-900 group-[.is-user]:[border-bottom-right-radius:0]",
        "is-user",
      ],
      [
        "assistant bubble",
        "leading-relaxed group-[.is-assistant]:bg-transparent group-[.is-assistant]:text-slate-900",
        "is-assistant",
      ],
      ["thinking bubble", "leading-relaxed", "is-assistant"],
    ];
  for (const [where, rest, group] of messages) {
    const o = `text-[1rem] ${rest}`;
    const n = `text-body-lg ${rest}`;
    assertWritten(where, o, n);
    out.push({
      where: `styleguide MessageContent ${where} (as written)`,
      old: o,
      new: n,
      group,
    });
    out.push({
      where: `styleguide MessageContent ${where} (after MessageContent cn)`,
      old: b.cn(...MESSAGE_BASE, o),
      new: h.cn(...MESSAGE_BASE, n),
      group,
    });
  }

  // voice/components
  assertWritten("VoiceModeBar speaking colour", "bg-zinc-900", "bg-action-hover");
  assertWritten(
    "VoiceModeButton base",
    "border-transparent bg-transparent text-black shadow-none hover:border-transparent hover:bg-zinc-100 hover:text-black",
    "border-transparent bg-transparent text-foreground-base shadow-none hover:border-transparent hover:bg-surface-hover hover:text-foreground-base",
  );
  assertWritten(
    "VoiceModeButton active",
    "bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white",
    "bg-action-hover text-action-foreground hover:bg-action hover:text-action-foreground",
  );
  out.push({
    where: "VoiceTrace column, speaking colour",
    old: b.cn("w-[4px] shrink-0 rounded-full", "bg-zinc-900"),
    new: h.cn("w-[4px] shrink-0 rounded-full", "bg-action-hover"),
    tag: "span",
    attrs: 'style="display:inline-block;height:12px"',
  });
  for (const isActive of [false, true]) {
    for (const disabled of [false, true]) {
      const oldCls = b.cn(
        "border-transparent bg-transparent text-black shadow-none hover:border-transparent hover:bg-zinc-100 hover:text-black",
        undefined,
        disabled && "opacity-40",
        isActive && "bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white",
      );
      const newCls = h.cn(
        "border-transparent bg-transparent text-foreground-base shadow-none hover:border-transparent hover:bg-surface-hover hover:text-foreground-base",
        undefined,
        disabled && "opacity-40",
        isActive &&
          "bg-action-hover text-action-foreground hover:bg-action hover:text-action-foreground",
      );
      out.push({
        where: `VoiceModeButton isActive=${isActive} disabled=${disabled} (after Button cn)`,
        old: b.cn(
          b.button({ variant: "icon", size: "icon", className: oldCls }),
          false,
          false,
        ),
        new: h.cn(
          h.button({ variant: "icon", size: "icon", className: newCls }),
          false,
          false,
        ),
        tag: "button",
        attrs: `aria-pressed="${isActive}"${disabled ? " disabled" : ""}`,
      });
    }
  }
  if (process.env.NEGATIVE_CONTROL) {
    out.push({ where: "NEGATIVE size without leading-inherit", old: "text-[13px]", new: "text-body-sm" });
    out.push({ where: "NEGATIVE wrong colour role", old: "bg-zinc-900", new: "bg-action" });
  }
  return out;
}

async function compile(dir: string, raw: string) {
  const config = loadConfig(join(dir, "tailwind.config.ts"));
  const globals = readFileSync(join(dir, "src/app/globals.css"), "utf8");
  const result = await postcss([
    tailwindcss({ ...config, content: [{ raw, extension: "html" }] }),
  ]).process(globals, { from: join(dir, "src/app/globals.css") });
  return result.css as string;
}

const PARENTS = ["leading-[1.5]", "leading-[30px]", "leading-normal"];
const WIDTHS = [1440, 390];

function cellsHtml(list: Pair[], side: "old" | "new") {
  return list
    .map((p, i) =>
      PARENTS.map((parent, j) => {
        const tag = p.tag ?? "div";
        const cls = p[side];
        const inner =
          tag === "input"
            ? `<input data-i="${i}-${j}" class="${cls}" value="https://example.com/share/abc" readonly>`
            : `<${tag} data-i="${i}-${j}" class="${cls}" ${p.attrs ?? ""}>Ag text <span data-c="${i}-${j}">child</span></${tag}>`;
        const groupOpen = p.group ? `<div class="group ${p.group}">` : "";
        const groupClose = p.group ? "</div>" : "";
        return `<div class="${parent}" style="padding:4px">${groupOpen}${inner}${groupClose}</div>`;
      }).join(""),
    )
    .join("");
}

async function measure(
  browser: Browser,
  css: string,
  list: Pair[],
  side: "old" | "new",
  width: number,
) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.setContent(
    `<html><head><style>${css}</style></head><body>${cellsHtml(list, side)}</body></html>`,
  );
  // A plain-JS string: tsx would wrap named functions in a __name helper
  // that the page does not have.
  const READ = `(() => {
    const all = (el) => {
      if (!el) return {};
      const s = getComputedStyle(el);
      const o = {};
      for (let k = 0; k < s.length; k++) { const p = s.item(k); o[p] = s.getPropertyValue(p); }
      return o;
    };
    return Array.from(document.querySelectorAll("[data-i]")).map((el) => ({
      id: el.dataset.i,
      self: all(el),
      child: all(document.querySelector('[data-c="' + el.dataset.i + '"]')),
    }));
  })()`;
  const read = () =>
    page.evaluate(READ) as Promise<
      { id: string; self: Record<string, string>; child: Record<string, string> }[]
    >;
  const rest = await read();
  const shot = await page.screenshot({ fullPage: true, animations: "disabled" });
  const hover: Record<string, Record<string, string>> = {};
  for (const el of await page.$$("[data-i]")) {
    const id = await el.getAttribute("data-i");
    await el.hover({ force: true }).catch(() => undefined);
    hover[id!] = (await page.evaluate(
      `(() => { const s = getComputedStyle(document.querySelector('[data-i="${id}"]')); const o = {}; for (let k = 0; k < s.length; k++) { const p = s.item(k); o[p] = s.getPropertyValue(p); } return o; })()`,
    )) as Record<string, string>;
  }
  await page.close();
  return { rest, hover, shot };
}

function diffProps(a: Record<string, string>, b: Record<string, string>) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].filter((k) => a[k] !== b[k]).map((k) => `${k}: ${a[k]} != ${b[k]}`);
}

const SHOWN = [
  "font-size",
  "line-height",
  "letter-spacing",
  "font-weight",
  "font-family",
  "text-transform",
  "color",
  "background-color",
  "border-top-color",
  "box-shadow",
  "opacity",
  "border-bottom-right-radius",
];

async function main() {
  mkdirSync(OUT, { recursive: true });
  const b = await loadTree(BASE);
  const h = await loadTree(HEAD);
  const list = pairs(b, h);
  const raw = (side: "old" | "new") => cellsHtml(list, side);
  const oldCss = await compile(BASE, raw("old"));
  const newCss = await compile(HEAD, raw("new"));
  const { comparePngs } = await import(join(HEAD, "scripts/screenshot-pages.ts"));
  const browser = await chromium.launch();
  const failures: string[] = [];
  const rows: string[] = [];
  let cases = 0;
  let shotDiff = 0;
  const sample: Record<number, Record<string, string>> = {};
  const hoverSample: Record<number, Record<string, string>> = {};
  for (const width of WIDTHS) {
    const o = await measure(browser, oldCss, list, "old", width);
    const n = await measure(browser, newCss, list, "new", width);
    const { diffPixels } = comparePngs(o.shot, n.shot);
    shotDiff += diffPixels;
    writeFileSync(join(OUT, `cells-old-${width}.png`), o.shot);
    writeFileSync(join(OUT, `cells-new-${width}.png`), n.shot);
    for (let k = 0; k < o.rest.length; k++) {
      const id = o.rest[k].id;
      const i = Number(id.split("-")[0]);
      cases += 1;
      const d = [
        ...diffProps(o.rest[k].self, n.rest[k].self).map((x) => `self ${x}`),
        ...diffProps(o.rest[k].child, n.rest[k].child).map((x) => `child ${x}`),
        ...diffProps(o.hover[id], n.hover[id]).map((x) => `hover ${x}`),
      ];
      if (d.length) failures.push(`${list[i].where} [${width}px, ${PARENTS[Number(id.split("-")[1])]}]: ${d.join("; ")}`);
      if (id.endsWith("-1") && width === 1440) {
        sample[i] = o.rest[k].self;
        hoverSample[i] = o.hover[id];
      }
    }
  }
  await browser.close();
  rows.push("| Where | Old class string (dev) | New class string (head) | Computed (16px root, parent leading-[30px], 1440px) | Result |");
  rows.push("| --- | --- | --- | --- | --- |");
  list.forEach((p, i) => {
    const v = sample[i];
    const hv = hoverSample[i];
    const shown = SHOWN.map((k) => `${k}: ${v[k]}`).join("; ");
    const hoverShown =
      hv && (hv["background-color"] !== v["background-color"] || hv.color !== v.color)
        ? `; :hover bg ${hv["background-color"]}, color ${hv.color}`
        : "";
    const bad = failures.some((f) => f.startsWith(`${p.where} [`));
    rows.push(`| ${p.where} | \`${p.old}\` | \`${p.new}\` | ${shown}${hoverShown} | ${bad ? "FAIL" : "identical (6 cases x rest+hover, all properties)"} |`);
  });
  const summary = `${list.length} class strings x ${PARENTS.length} parent line-heights x ${WIDTHS.length} viewports = ${cases} cases, every computed property of the element and a child span, at rest and on :hover: ${failures.length} failing. Cell screenshots old vs new: ${shotDiff} differing pixels.`;
  const md = [...rows, "", summary, ...failures.map((f) => `FAIL ${f}`)].join("\n");
  writeFileSync(join(OUT, "per-string-equivalence.md"), md);
  console.log(md);
  process.exitCode = failures.length || shotDiff ? 1 : 0;
}

main();
