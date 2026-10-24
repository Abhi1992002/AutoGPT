/**
 * Compares the atom cases collected by collect.ts on the base and on the head.
 *
 *   cd <head frontend dir> && npx tsx compare.ts --base <base frontend dir> \
 *     --old base.json --new head.json --out <dir>
 *
 * A. Every case is rendered in Chromium (base markup with the base CSS, head
 *    markup with the head CSS) inside parents at leading-[1.5], leading-[30px]
 *    and leading-normal, at 1280px and 390px wide. For every element, and its
 *    ::placeholder/::before/::after, every computed CSS property is compared.
 * B. Every class attribute that differs is split by variant scope (`hover:`,
 *    `focus:`, `disabled:`, `placeholder:`, `!` …). Each scope whose classes
 *    changed is rendered without its prefix in the same parents and compared
 *    on every property either side's classes emit, plus the text properties.
 *    That covers states (hover, focus, aria-pressed) that A cannot trigger.
 * Exits 1 on any difference.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";

const headDir = process.cwd();
const req = createRequire(join(headDir, "package.json"));
const postcss = req("postcss");
const tailwindcss = req("tailwindcss");
const loadConfig = req("tailwindcss/loadConfig");
const { chromium } = req("@playwright/test");

function flag(name: string) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const baseDir = resolve(flag("--base")!);
const oldCases: Record<string, string> = JSON.parse(readFileSync(flag("--old")!, "utf8"));
const newCases: Record<string, string> = JSON.parse(readFileSync(flag("--new")!, "utf8"));
const outDir = resolve(flag("--out") ?? "equiv-out");

const PARENTS = ["leading-[1.5]", "leading-[30px]", "leading-normal"];
const WIDTHS = [1280, 390];
const TEXT_PROPS = [
  "font-size",
  "line-height",
  "letter-spacing",
  "font-weight",
  "font-family",
  "text-transform",
  "color",
];

async function compileCss(dir: string, raw: string) {
  const config = loadConfig(join(dir, "tailwind.config.ts"));
  const globals = readFileSync(join(dir, "src/app/globals.css"), "utf8");
  const result = await postcss([
    tailwindcss({ ...config, content: [{ raw, extension: "html" }] }),
  ]).process(globals, { from: join(dir, "src/app/globals.css") });
  return result.css as string;
}

// ---- B: class strings split by variant scope ----------------------------

function splitClass(cls: string) {
  let depth = 0;
  let last = -1;
  for (let i = 0; i < cls.length; i++) {
    const c = cls[i];
    if (c === "[" || c === "(") depth++;
    else if (c === "]" || c === ")") depth--;
    else if (c === ":" && depth === 0) last = i;
  }
  let scope = last >= 0 ? cls.slice(0, last) : "";
  let utility = last >= 0 ? cls.slice(last + 1) : cls;
  // `!important` stays on the class: the scope is the variant chain only, so
  // `text-black !text-zinc-400` and a tone's single class compare as one list.
  return { scope, utility };
}

function scopes(classString: string) {
  const map = new Map<string, string[]>();
  for (const cls of classString.split(/\s+/).filter(Boolean)) {
    const { scope, utility } = splitClass(cls);
    map.set(scope, [...(map.get(scope) ?? []), utility]);
  }
  return map;
}

// Every start tag with a class, as its class list and inline style.
function classAttrs(html: string) {
  return [...html.matchAll(/<[a-zA-Z][^>]*>/g)]
    .map((m) => m[0])
    .filter((tag) => / class="/.test(tag))
    .map((tag) => ({
      cls: / class="([^"]*)"/.exec(tag)![1],
      style: (/ style="([^"]*)"/.exec(tag)?.[1] ?? "").replace(/&quot;/g, '"'),
    }));
}

interface ScopePair {
  scope: string;
  oldClasses: string;
  newClasses: string;
  oldStyle: string;
  newStyle: string;
  where: Set<string>;
}

function styleProps(style: string) {
  return style
    .split(";")
    .map((d) => d.slice(0, d.indexOf(":")).trim())
    .filter((p) => p && !p.startsWith("--"));
}

// Tailwind escapes `,`, `#`, `(` … in selectors; compare unescaped.
function unescapeSelector(sel: string) {
  return sel
    .replace(/\\([0-9a-fA-F]{1,6}) ?/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/\\(.)/g, "$1");
}

function escapeClass(cls: string) {
  return cls.replace(/[^a-zA-Z0-9_-]/g, (ch) => `\\${ch}`);
}

function emitted(css: string, classes: string) {
  const props = new Set<string>();
  const root = postcss.parse(css);
  for (const cls of classes.split(" ").filter(Boolean)) {
    const selector = `.${cls.replace(/^!/, "")}`;
    root.walkRules((rule: { selectors: string[]; walkDecls: Function }) => {
      if (
        !rule.selectors.map(unescapeSelector).some(
          (s: string) =>
            s === selector ||
            s.startsWith(`${selector}:`) ||
            s.startsWith(`${selector} `) ||
            s.startsWith(`${selector}>`),
        )
      )
        return;
      rule.walkDecls((d: { prop: string }) => {
        if (!d.prop.startsWith("--")) props.add(d.prop);
      });
    });
    // Ring colours paint through box-shadow.
    if (/^ring-(?!\d|inset|offset)/.test(cls) || /^ring-offset-/.test(cls))
      props.add("box-shadow");
  }
  return props;
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const ids = Object.keys(oldCases).sort();
  const missing = ids.filter((id) => !(id in newCases));
  if (missing.length || Object.keys(newCases).length !== ids.length) {
    throw new Error(`case sets differ: ${missing.join(", ")}`);
  }

  // Collect B pairs.
  const pairs = new Map<string, ScopePair>();
  let structural: string[] = [];
  for (const id of ids) {
    const a = classAttrs(oldCases[id]);
    const b = classAttrs(newCases[id]);
    if (a.length !== b.length) {
      structural.push(`${id}: ${a.length} vs ${b.length} class attributes`);
      continue;
    }
    a.forEach((oldAttr, i) => {
      if (oldAttr.cls === b[i].cls && oldAttr.style === b[i].style) return;
      const so = scopes(oldAttr.cls);
      const sn = scopes(b[i].cls);
      for (const scope of new Set([...so.keys(), ...sn.keys()])) {
        const o = (so.get(scope) ?? []).join(" ");
        const n = (sn.get(scope) ?? []).join(" ");
        // The inline style only applies to the element's own (unscoped) state.
        const os = scope ? "" : oldAttr.style;
        const ns = scope ? "" : b[i].style;
        if (o === n && os === ns) continue;
        const key = `${scope}\u0000${o}\u0000${n}\u0000${os}\u0000${ns}`;
        const entry = pairs.get(key) ?? { scope, oldClasses: o, newClasses: n, oldStyle: os, newStyle: ns, where: new Set<string>() };
        entry.where.add(id.split(" ")[0]);
        pairs.set(key, entry);
      }
    });
  }
  const scopePairs = [...pairs.values()];

  const rawOld = ids.map((id) => oldCases[id]).join("\n") + scopePairs.map((p) => p.oldClasses).join(" ") + PARENTS.join(" ");
  const rawNew = ids.map((id) => newCases[id]).join("\n") + scopePairs.map((p) => p.newClasses).join(" ") + PARENTS.join(" ");
  const oldCss = await compileCss(baseDir, rawOld);
  const newCss = await compileCss(headDir, rawNew);

  const browser = await chromium.launch();

  // ---- A ----
  // Identical (old, new) markup pairs only need rendering once.
  const seen = new Set<string>();
  const aIds = ids.filter((id) => {
    const key = `${oldCases[id]}\u0000${newCases[id]}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  async function digests(css: string, cases: Record<string, string>, width: number, detail: string | null) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const result: Record<string, string[]> = {};
    const BATCH = 60;
    for (let start = 0; start < aIds.length; start += BATCH) {
      const batch = detail ? [detail] : aIds.slice(start, start + BATCH);
      const body = batch
        .map((id, i) =>
          PARENTS.map(
            (parent, p) =>
              `<div data-case="${i}" data-parent="${p}" class="${parent}" style="font-size:16px;position:relative">${cases[id]}</div>`,
          ).join(""),
        )
        .join("");
      await page.evaluate("window.__name = (f) => f");
      await page.setContent(`<html><head><script>window.__name = (f) => f;</script><style>${css}</style></head><body>${body}</body></html>`);
      const out = await page.evaluate(
        ({ full }) => {
          for (const anim of document.getAnimations()) {
            anim.pause();
            anim.currentTime = 0;
          }
          function serialise(style: CSSStyleDeclaration) {
            const parts: string[] = [];
            for (let i = 0; i < style.length; i++) {
              const prop = style[i];
              if (prop.startsWith("--")) continue;
              parts.push(`${prop}:${style.getPropertyValue(prop)}`);
            }
            return parts.join(";");
          }
          function hash(s: string) {
            let h = 0x811c9dc5;
            for (let i = 0; i < s.length; i++) {
              h ^= s.charCodeAt(i);
              h = Math.imul(h, 0x01000193);
            }
            return (h >>> 0).toString(16);
          }
          const res: Record<string, string[]> = {};
          for (const host of Array.from(document.querySelectorAll("[data-case]"))) {
            const key = `${(host as HTMLElement).dataset.case}/${(host as HTMLElement).dataset.parent}`;
            const values: string[] = [];
            for (const el of Array.from(host.querySelectorAll("*"))) {
              const pseudo = [""];
              for (const p of ["::before", "::after"]) {
                const c = getComputedStyle(el, p).getPropertyValue("content");
                if (c !== "none" && c !== "normal") pseudo.push(p);
              }
              if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") pseudo.push("::placeholder");
              for (const p of pseudo) {
                const s = `${el.tagName}${p}|${serialise(getComputedStyle(el, p || null))}`;
                values.push(full ? s : hash(s));
              }
            }
            res[key] = values;
          }
          return res;
        },
        { full: Boolean(detail) },
      );
      batch.forEach((id, i) => {
        PARENTS.forEach((_, p) => {
          result[`${id}|${p}`] = out[`${i}/${p}`];
        });
      });
      if (detail) break;
      if (start % 600 === 0) console.error(`A: width ${width} ${start}/${aIds.length}`);
    }
    await page.close();
    return result;
  }

  const failuresA: string[] = [];
  let elementsCompared = 0;
  for (const width of process.argv.includes("--skip-a") ? [] : WIDTHS) {
    const a = await digests(oldCss, oldCases, width, null);
    const b = await digests(newCss, newCases, width, null);
    for (const key of Object.keys(a)) {
      elementsCompared += a[key].length;
      if (a[key].length !== b[key].length || a[key].some((v, i) => v !== b[key][i])) {
        const id = key.split("|")[0];
        const da = await digests(oldCss, oldCases, width, id);
        const db = await digests(newCss, newCases, width, id);
        const p = key.split("|")[1];
        const ea = da[`${id}|${p}`];
        const eb = db[`${id}|${p}`];
        const diffs: string[] = [];
        ea.forEach((v, i) => {
          if (v === eb[i]) return;
          const pa = new Map(v.split("|")[1].split(";").map((kv) => [kv.slice(0, kv.indexOf(":")), kv.slice(kv.indexOf(":") + 1)]));
          const pb = new Map((eb[i] ?? "").split("|")[1]?.split(";").map((kv) => [kv.slice(0, kv.indexOf(":")), kv.slice(kv.indexOf(":") + 1)]) ?? []);
          for (const [prop, val] of pa) if (pb.get(prop) !== val) diffs.push(`${v.split("|")[0]}#${i} ${prop}: ${val} != ${pb.get(prop)}`);
        });
        failuresA.push(`${key} @${width}: ${diffs.slice(0, 6).join("; ")}`);
      }
    }
  }

  // ---- B ----
  async function scopeValues(css: string, lists: string[], styles: string[], props: string[][], width: number) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const body = lists
      .map((cls, i) =>
        PARENTS.map(
          (parent) =>
            `<div class="${parent}" style="font-size:16px"><span data-i="${i}" class="${cls} ${/(^| )ring-(?!\d|inset|offset)/.test(cls) && !/(^| )ring(-\d)?( |$)/.test(cls) ? "ring-2" : ""}" style="display:block;${styles[i].replace(/"/g, "&quot;")}">Ag</span></div>`,
        ).join(""),
      )
      .join("");
    await page.evaluate("window.__name = (f) => f");
      await page.setContent(`<html><head><script>window.__name = (f) => f;</script><style>${css}</style></head><body>${body}</body></html>`);
    const values = await page.evaluate(
      (props) =>
        Array.from(document.querySelectorAll("span[data-i]")).map((el) => {
          const i = Number((el as HTMLElement).dataset.i);
          const style = getComputedStyle(el);
          return { i, v: Object.fromEntries(props[i].map((p) => [p, style.getPropertyValue(p)])) };
        }),
      props,
    );
    await page.close();
    const grouped: Record<string, string>[][] = lists.map(() => []);
    for (const { i, v } of values) grouped[i].push(v);
    return grouped;
  }

  // A side's classes plus its inline style decide what it sets.
  const oldSets = scopePairs.map((p) => new Set([...emitted(oldCss, p.oldClasses), ...styleProps(p.oldStyle)]));
  const newSets = scopePairs.map((p) => new Set([...emitted(newCss, p.newClasses), ...styleProps(p.newStyle)]));
  const propsFor = scopePairs.map((_, i) =>
    [...new Set([...oldSets[i], ...newSets[i], ...TEXT_PROPS])].sort(),
  );
  const rows: string[] = [
    "| scope | old classes | new classes | resolved value (computed, 16px root; parents at leading-[1.5] / leading-[30px] / leading-normal, 1280 and 390 wide) | result |",
    "| --- | --- | --- | --- | --- |",
  ];
  let failuresB = 0;
  const shownB: Record<string, string>[][] = [];
  const problemsB: Set<string>[] = scopePairs.map(() => new Set());
  for (const width of WIDTHS) {
    const ov = await scopeValues(oldCss, scopePairs.map((p) => p.oldClasses), scopePairs.map((p) => p.oldStyle), propsFor, width);
    const nv = await scopeValues(newCss, scopePairs.map((p) => p.newClasses), scopePairs.map((p) => p.newStyle), propsFor, width);
    scopePairs.forEach((p, i) => {
      if (!shownB[i]) shownB[i] = nv[i];
      ov[i].forEach((v, c) => {
        for (const prop of propsFor[i]) {
          if (v[prop] !== nv[i][c][prop]) problemsB[i].add(`${prop}: ${v[prop]} != ${nv[i][c][prop]}`);
        }
      });
      const oldEmits = oldSets[i];
      const newEmits = newSets[i];
      for (const prop of oldEmits) if (!newEmits.has(prop)) problemsB[i].add(`new classes do not set ${prop}`);
      for (const prop of newEmits) if (!oldEmits.has(prop)) problemsB[i].add(`new classes also set ${prop}`);
    });
  }
  scopePairs.forEach((p, i) => {
    if (problemsB[i].size) failuresB++;
    const emittedProps = [...new Set([...oldSets[i], ...newSets[i]])].sort();
    const shown = emittedProps.length ? emittedProps : ["(emits nothing on either side)"];
    const value = shown
      .map((prop) =>
        prop.startsWith("(")
          ? prop
          : `${prop}: ${[...new Set(shownB[i].map((v) => v[prop]))].join(" / ")}`,
      )
      .join("; ");
    rows.push(
      `| \`${p.scope || "(none)"}\` | \`${p.oldClasses || "—"}\`${p.oldStyle ? ` style \`${p.oldStyle}\`` : ""} | \`${p.newClasses || "—"}\`${p.newStyle ? ` style \`${p.newStyle}\`` : ""} | ${value} | ${problemsB[i].size ? `FAIL: ${[...problemsB[i]].join("; ")}` : "identical"} |`,
    );
  });

  // Compact view: per scope, the exact classes a change removed and added,
  // each distinct swap once, with the values those classes resolve to.
  const compact = new Map<string, { row: string; count: number }>();
  scopePairs.forEach((p, i) => {
    const o = p.oldClasses.split(" ").filter(Boolean);
    const n = p.newClasses.split(" ").filter(Boolean);
    const removed = o.filter((c) => !n.includes(c)).join(" ");
    const added = n.filter((c) => !o.includes(c)).join(" ");
    const styleNote =
      p.oldStyle !== p.newStyle ? ` (style \`${p.oldStyle || "—"}\` → \`${p.newStyle || "—"}\`)` : "";
    const key = `${p.scope}\u0000${removed}\u0000${added}\u0000${styleNote}`;
    const existing = compact.get(key);
    if (existing) {
      existing.count++;
      if (problemsB[i].size) existing.row = existing.row.replace(/identical$/, "FAIL");
      return;
    }
    const props = [
      ...new Set([
        ...emitted(oldCss, removed),
        ...emitted(newCss, added),
        ...styleProps(p.oldStyle),
        ...styleProps(p.newStyle),
      ]),
    ].sort();
    const value = props.length
      ? props.map((prop) => `${prop}: ${[...new Set(shownB[i].map((v) => v[prop]))].join(" / ")}`).join("; ")
      : "(emits nothing on either side)";
    compact.set(key, {
      row: `\`${p.scope || "(none)"}\` | \`${removed || "—"}\` | \`${added || "—"}\`${styleNote} | ${value} | ${problemsB[i].size ? "FAIL" : "identical"}`,
      count: 1,
    });
  });
  const compactRows = [
    "| scope | old class(es) | new class(es) | resolved value (computed, 16px root, in parents at leading-[1.5] / leading-[30px] / leading-normal) | full strings | result |",
    "| --- | --- | --- | --- | --- | --- |",
    ...[...compact.values()].map(({ row, count }) => {
      const cells = row.split(" | ");
      const result = cells.pop();
      return `| ${cells.join(" | ")} | ${count} | ${result} |`;
    }),
  ];
  writeFileSync(join(outDir, "compact-table.md"), compactRows.join("\n") + "\n");

  // Atomic view: each removed class with the added class(es) that set exactly
  // the same properties. What cannot be paired that way is listed whole.
  const atomic = new Map<string, { scope: string; o: string; n: string; value: string; count: number; fail: boolean }>();
  scopePairs.forEach((p, i) => {
    const o = p.oldClasses.split(" ").filter(Boolean);
    const n = p.newClasses.split(" ").filter(Boolean);
    const removed = o.filter((c) => !n.includes(c));
    const added = n.filter((c) => !o.includes(c));
    // Connected components over shared CSS properties: classes that set a
    // property in common (text-sm, leading-[22px] and text-body) form one unit.
    const tokens = [
      ...removed.map((c) => ({ c, side: "o", props: [...emitted(oldCss, c)] })),
      ...added.map((c) => ({ c, side: "n", props: [...emitted(newCss, c)] })),
    ];
    const parent = tokens.map((_, k) => k);
    const find = (k: number): number => (parent[k] === k ? k : (parent[k] = find(parent[k])));
    tokens.forEach((t, a) =>
      tokens.forEach((u, b) => {
        if (b > a && t.props.some((x) => u.props.includes(x))) parent[find(a)] = find(b);
      }),
    );
    const groups = new Map<number, typeof tokens>();
    tokens.forEach((t, k) => groups.set(find(k), [...(groups.get(find(k)) ?? []), t]));
    const units: [string, string][] = [...groups.values()].map((g) => [
      g.filter((t) => t.side === "o").map((t) => t.c).join(" "),
      g.filter((t) => t.side === "n").map((t) => t.c).join(" "),
    ]);
    const num = (st: string) => st.replace(/-?\d*\.?\d+(e-?\d+)?/g, "<n>");
    if (p.oldStyle !== p.newStyle) units.push([`style="${num(p.oldStyle)}"`, `style="${num(p.newStyle)}"`]);
    for (const [ro, an] of units) {
      const key = `${p.scope}\u0000${ro}\u0000${an}`;
      const entry = atomic.get(key);
      if (entry) {
        entry.count++;
        entry.fail ||= problemsB[i].size > 0;
        continue;
      }
      const props = ro.startsWith("style=")
        ? [...new Set([...styleProps(p.oldStyle), ...styleProps(p.newStyle)])]
        : [...new Set([...emitted(oldCss, ro), ...emitted(newCss, an)])].sort();
      const value = props.length
        ? props.map((prop) => `${prop}: ${[...new Set(shownB[i].map((v) => v[prop]))].join(" / ")}`).join("; ")
        : "(emits nothing on either side)";
      atomic.set(key, { scope: p.scope, o: ro, n: an, value, count: 1, fail: problemsB[i].size > 0 });
    }
  });
  const atomicRows = [
    "| scope | old class | new class | resolved value (computed, 16px root, in parents at leading-[1.5] / leading-[30px] / leading-normal) | in N changed strings | result |",
    "| --- | --- | --- | --- | --- | --- |",
    ...[...atomic.values()]
      .sort((a, b) => a.o.localeCompare(b.o) || a.scope.localeCompare(b.scope))
      .map((e) => `| \`${e.scope || "(none)"}\` | \`${e.o || "—"}\` | \`${e.n || "—"}\` | ${e.value} | ${e.count} | ${e.fail ? "FAIL" : "identical"} |`),
  ];
  writeFileSync(join(outDir, "atomic-table.md"), atomicRows.join("\n") + "\n");

  await browser.close();
  const summary = [
    `A. ${ids.length} render cases (${aIds.length} distinct) x ${PARENTS.length} parent line-heights x ${WIDTHS.length} widths: ${elementsCompared} element/pseudo-element styles compared on every computed property; ${failuresA.length} differing; ${structural.length} structural differences`,
    `B. ${scopePairs.length} changed class strings (per variant scope) compared on every emitted property plus ${TEXT_PROPS.join(", ")}: ${failuresB} failing`,
  ];
  writeFileSync(join(outDir, "scope-table.md"), rows.join("\n") + "\n");
  writeFileSync(join(outDir, "summary.txt"), [...summary, "", ...structural, ...failuresA].join("\n") + "\n");
  console.log(summary.join("\n"));
  if (structural.length) console.log(structural.slice(0, 20).join("\n"));
  if (failuresA.length) console.log(failuresA.slice(0, 30).join("\n"));
  if (failuresB) console.log(rows.filter((r) => r.includes("FAIL")).slice(0, 30).join("\n"));
  process.exitCode = failuresA.length || failuresB || structural.length ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
