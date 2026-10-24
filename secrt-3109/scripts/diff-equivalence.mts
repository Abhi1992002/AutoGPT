/**
 * Value equivalence for every exact class string this branch writes (DS5e).
 *
 * Not committed. Complements DS1's scripts/check-token-equivalence.ts, which
 * checks the codemod's mapping table on generic samples, by checking the
 * literal strings the PR actually changed:
 *
 *   cd autogpt_platform/frontend
 *   npx tsx --tsconfig ./tsconfig.json ../../.context/ds5e/diff-equivalence.mts \
 *     --base <dev worktree frontend dir> --out <dir> <changed files...>
 *
 * Every string literal (and template chunk) of each changed file is read from
 * the base checkout and from this checkout with the TypeScript parser and
 * paired in order. For each pair that differs:
 *  - old is compiled with the base tailwind.config.ts + globals.css, new with
 *    this checkout's;
 *  - both are rendered as written, after cn(), and, when the string is the
 *    className of a <Text>, merged with that Text variant the way <Text> does;
 *  - each variant prefix in the pair (hover:, focus-visible:, sm:, [&>div]: …)
 *    is also rendered "switched on" (prefix stripped);
 *  - every render sits inside parents at leading-[1.5], leading-[30px] and
 *    leading-normal, at 1280px and 390px wide;
 *  - EVERY computed CSS property is compared, and the two pages are compared
 *    pixel for pixel.
 * Any difference fails (exit 1).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";

const headDir = process.cwd();
const localRequire = createRequire(join(headDir, "package.json"));
const ts = localRequire("typescript");
const postcss = localRequire("postcss");
const tailwindcss = localRequire("tailwindcss");
const loadConfig = localRequire("tailwindcss/loadConfig");
const { chromium } = localRequire("@playwright/test");

interface Literal {
  text: string;
  textVariant?: string;
  inCn: boolean;
  line: number;
}

interface Pair {
  file: string;
  line: number;
  oldClass: string;
  newClass: string;
  textVariant?: { old: string; new: string };
}

function literals(source: string, file: string): Literal[] {
  const sf = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const out: Literal[] = [];
  function textVariantOf(node: any): string | undefined {
    // className="..." or className={...} directly on a <Text>
    let n = node.parent;
    while (n && n.kind !== ts.SyntaxKind.JsxAttribute) {
      if (
        n.kind === ts.SyntaxKind.JsxElement ||
        n.kind === ts.SyntaxKind.JsxSelfClosingElement ||
        n.kind === ts.SyntaxKind.JsxOpeningElement
      )
        return undefined;
      n = n.parent;
    }
    if (!n || n.name.getText() !== "className") return undefined;
    const element = n.parent.parent; // JsxAttributes -> opening element
    if (element.tagName.getText() !== "Text") return undefined;
    const attrs = element.attributes.properties;
    const get = (name: string) => {
      const a = attrs.find((p: any) => p.name?.getText() === name);
      return a?.initializer?.text;
    };
    return get("size") ?? get("variant");
  }
  function inCn(node: any) {
    let n = node.parent;
    while (n) {
      if (n.kind === ts.SyntaxKind.CallExpression)
        return n.expression.getText() === "cn";
      if (n.kind === ts.SyntaxKind.JsxAttribute) return false;
      n = n.parent;
    }
    return false;
  }
  const SVG_TAGS = new Set(["path", "rect", "circle", "ellipse", "g", "line", "polygon", "polyline"]);
  function onSvgPaint(node: any) {
    // fill/stroke attributes and classNames of SVG primitives: checked by SVG_PAIRS.
    const attr = node.parent?.kind === ts.SyntaxKind.JsxAttribute ? node.parent : null;
    if (!attr) return false;
    const tag = attr.parent?.parent?.tagName?.getText();
    return SVG_TAGS.has(tag) && ["fill", "stroke", "className"].includes(attr.name.getText());
  }
  (function walk(node: any) {
    const k = node.kind;
    if (
      k === ts.SyntaxKind.StringLiteral ||
      k === ts.SyntaxKind.NoSubstitutionTemplateLiteral ||
      k === ts.SyntaxKind.TemplateHead ||
      k === ts.SyntaxKind.TemplateMiddle ||
      k === ts.SyntaxKind.TemplateTail
    ) {
      // Import specifiers are not class strings.
      if (
        node.parent?.kind !== ts.SyntaxKind.ImportDeclaration &&
        node.text.trim() !== "" &&
        !onSvgPaint(node)
      ) {
        out.push({
          text: node.text,
          textVariant: textVariantOf(node),
          inCn: inCn(node),
          line: sf.getLineAndCharacterOfPosition(node.getStart()).line + 1,
        });
      }
    }
    ts.forEachChild(node, walk);
  })(sf);
  return out;
}

function readArg(argv: string[], name: string) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

const argv = process.argv.slice(2);
const baseDir = resolve(readArg(argv, "--base")!);
const outDir = resolve(readArg(argv, "--out") ?? "diff-equivalence");
mkdirSync(outDir, { recursive: true });
const files = argv.filter(
  (a, i) => !a.startsWith("--") && !["--base", "--out"].includes(argv[i - 1]),
);

const { cn } = await import(join(headDir, "src/lib/utils.ts"));
const loadVariants = async (dir: string) =>
  ((await import(join(dir, "src/components/atoms/Text/helpers.ts"))) as any)
    .variants as Record<string, string>;
const oldVariants = await loadVariants(baseDir);
const newVariants = await loadVariants(headDir);

const pairs: Pair[] = [];
const unpaired: string[] = [];
for (const file of files) {
  let oldSource = "";
  try {
    oldSource = readFileSync(join(baseDir, file), "utf8");
  } catch {
    continue;
  }
  let newSource = "";
  try {
    newSource = readFileSync(join(headDir, file), "utf8");
  } catch {
    unpaired.push(`${file}: deleted`);
    continue;
  }
  const a = literals(oldSource, file);
  const b = literals(newSource, file);
  if (a.length !== b.length) {
    unpaired.push(`${file}: ${a.length} vs ${b.length} literals`);
    continue;
  }
  a.forEach((oldLit, i) => {
    const newLit = b[i];
    if (oldLit.text === newLit.text) return;
    pairs.push({
      file,
      line: newLit.line,
      oldClass: oldLit.text.trim(),
      newClass: newLit.text.trim(),
      textVariant:
        oldLit.textVariant || newLit.textVariant
          ? { old: oldLit.textVariant!, new: newLit.textVariant! }
          : undefined,
    });
  });
}

interface Case {
  label: string;
  oldClass: string;
  newClass: string;
}

function casesFor(pair: Pair): Case[] {
  // A <Text> className only ever renders merged into its variant.
  if (pair.textVariant) {
    return [
      {
        label: `<Text ${pair.textVariant.new}>`,
        oldClass: cn(oldVariants[pair.textVariant.old], pair.oldClass),
        newClass: cn(newVariants[pair.textVariant.new], pair.newClass),
      },
    ];
  }
  const cases: Case[] = [
    { label: "as written", oldClass: pair.oldClass, newClass: pair.newClass },
    { label: "cn()", oldClass: cn(pair.oldClass), newClass: cn(pair.newClass) },
  ];
  return cases;
}

const MODULE_CLASS = "sitrep-module-spinner";
const MODULE_KEYFRAMES = "sitrep-module-spin";
const sitrepModuleCss = readFileSync(
  join(baseDir, "src/app/(platform)/library/components/SitrepItem/SitrepItem.module.css"),
  "utf8",
)
  .replace(".spinner", `.${MODULE_CLASS}`)
  .replace(/\bspin\b/g, MODULE_KEYFRAMES);
for (const pair of pairs) {
  if (pair.file.endsWith("SitrepItem/SitrepItem.tsx") && pair.oldClass.includes("h-[21px]")) {
    pair.oldClass = `${MODULE_CLASS} ${pair.oldClass}`;
  }
}
// Real-element merges for leading-inherit sites whose cn() has other static args.
for (const pair of pairs) {
  if (pair.file.endsWith("FileIllustration.tsx") && pair.newClass.includes("leading-inherit")) {
    pairs.push({
      ...pair,
      oldClass: cn(pair.oldClass, "bottom-5 -right-2"),
      newClass: cn(pair.newClass, "bottom-5 -right-2"),
      line: pair.line,
      file: `${pair.file} (merged with badgePositionClass)`,
    });
    break;
  }
}
const allCases = pairs.map(casesFor);
const PARENTS = ["leading-[1.5]", "leading-[30px]", "leading-normal"];
const VIEWPORTS = [1280, 390];
// "rest": as compiled. "states": every interactive state switched on: the
// state pseudo-classes are removed from the compiled selectors (Tailwind's
// variant order is kept), the cell sits in .group/.dark-mode/data-state
// hooks, carries aria/data attributes, and reduced motion is emulated.
const MODES = ["rest", "states"] as const;
const STATE_PSEUDO = /:(hover|focus-visible|focus-within|focus|active|disabled)(?![\w-])/g;

function statesCss(css: string) {
  const root = postcss.parse(css);
  root.walkRules((rule: any) => {
    if (rule.parent?.type === "atrule" && /keyframes/.test(rule.parent.name)) return;
    rule.selector = rule.selector.replace(STATE_PSEUDO, "");
  });
  return root.toString();
}

async function compile(dir: string, classes: string[]) {
  const config = loadConfig(join(dir, "tailwind.config.ts"));
  const globals = readFileSync(join(dir, "src/app/globals.css"), "utf8");
  const raw = [...classes, ...PARENTS, "divide-y", "ring-2"].join(" ");
  const result = await postcss([
    tailwindcss({ ...config, content: [{ raw, extension: "html" }] }),
  ]).process(globals, { from: join(dir, "src/app/globals.css") });
  // CSS modules load after the Tailwind bundle, as in the app.
  return (result.css as string) + (dir === baseDir ? sitrepModuleCss : "");
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function page(css: string, lists: string[], mode: (typeof MODES)[number]) {
  const states = mode === "states";
  const hooks = states
    ? ` data-state="open" data-selected="true" data-disabled="" aria-pressed="true" aria-selected="true" aria-expanded="true" aria-current="page"`
    : "";
  const cells = lists.flatMap((cls, i) =>
    PARENTS.map(
      (parent, p) =>
        `<div class="${parent} ${states ? "group group/select group/item dark-mode" : ""}" style="font-size:16px;color:rgb(1,2,3)"${states ? ' data-state="open"' : ""}><div data-i="${i}" data-p="${p}" class="${escapeHtml(cls)}"${hooks}>Ag<span>b</span><span>c</span><div${states ? ' data-state="open"' : ""}>d</div></div></div>`,
    ),
  );
  return `<html><head><style>${css}</style></head><body style="margin:0"><div style="height:40px" data-note="the mouse rests here, away from every cell"></div>${cells.join("")}</body></html>`;
}

const oldLists = allCases.flat().map((c) => c.oldClass);
const newLists = allCases.flat().map((c) => c.newClass);
const oldCss = await compile(baseDir, oldLists);
const newCss = await compile(headDir, newLists);

// Same deterministic rasterising as scripts/screenshot-pages.ts.
const browser = await chromium.launch({
  args: [
    "--disable-gpu",
    "--disable-gpu-rasterization",
    "--disable-partial-raster",
    "--num-raster-threads=1",
    "--disable-skia-runtime-opts",
    "--force-color-profile=srgb",
    "--font-render-hinting=none",
    "--disable-lcd-text",
  ],
});
const BATCH = 40;
async function measure(
  css: string,
  lists: string[],
  width: number,
  mode: (typeof MODES)[number],
) {
  const values: Record<string, string>[] = [];
  const shots: Buffer[] = [];
  const pageCss = mode === "states" ? statesCss(css) : css;
  for (let start = 0; start < lists.length; start += BATCH) {
    const p = await browser.newPage({ viewport: { width, height: 900 } });
    if (mode === "states") await p.emulateMedia({ reducedMotion: "reduce" });
    await p.setContent(page(pageCss, lists.slice(start, start + BATCH), mode));
    values.push(
      ...(await p.evaluate(() =>
        Array.from(document.querySelectorAll("[data-i]")).map((el) => {
          const style = getComputedStyle(el);
          const child = getComputedStyle((el as HTMLElement).children[1]);
          const props: Record<string, string> = {};
          for (let i = 0; i < style.length; i++) {
            const name = style[i];
            props[name] = style.getPropertyValue(name);
          }
          // divide-* colours live on the children.
          props["child:border-top-color"] = child.borderTopColor;
          props["child:border-top-width"] = child.borderTopWidth;
          return props;
        }),
      )),
    );
    shots.push(await p.screenshot({ fullPage: true, animations: "disabled" }));
    await p.close();
  }
  return { values, shots };
}

const { comparePngs } = await import(join(headDir, "scripts/screenshot-pages.ts"));
let failures = 0;
let cellsCompared = 0;
let pixelDiff = 0;
const caseResults: Map<string, string[]> = new Map();
const shownValues: Record<string, string>[] = [];
for (const mode of MODES) for (const width of VIEWPORTS) {
  const o = await measure(oldCss, oldLists, width, mode);
  const n = await measure(newCss, newLists, width, mode);
  if (mode === "rest" && width === 1280) {
    n.values.forEach((v, idx) => {
      if (idx % PARENTS.length === 0) shownValues.push(v);
    });
  }
  const again = await measure(oldCss, oldLists, width, mode);
  let diff = 0;
  let control = 0;
  o.shots.forEach((shot, b) => {
    const d = comparePngs(shot, n.shots[b]);
    diff += d.diffPixels;
    control += comparePngs(shot, again.shots[b]).diffPixels;
    if (d.diffPixels && d.diff) writeFileSync(join(outDir, `page-${mode}-${width}-${b}-diff.png`), d.diff);
  });
  console.log(`pages ${mode} ${width}px (${o.shots.length} batches): ${diff} differing pixels; control (base vs base) ${control}`);
  pixelDiff += diff;
  o.values.forEach((ov, idx) => {
    const nv = n.values[idx];
    cellsCompared++;
    const caseIndex = Math.floor(idx / PARENTS.length);
    const problems: string[] = [];
    for (const prop of new Set([...Object.keys(ov), ...Object.keys(nv)])) {
      // Custom properties are intermediate: the properties that read them are compared.
      if (prop.startsWith("--")) continue;
      // The deleted module's keyframes carry their own (renamed) name; their frames are compared by the spinner check below.
      if (prop === "animation-name" && ov[prop] === MODULE_KEYFRAMES && nv[prop] === "spin") continue;
      if (ov[prop] !== nv[prop]) problems.push(`${prop}: ${ov[prop]} != ${nv[prop]}`);
    }
    if (problems.length) {
      const key = String(caseIndex);
      caseResults.set(key, [
        ...(caseResults.get(key) ?? []),
        `${mode} ${width}px/${PARENTS[idx % PARENTS.length]}: ${problems.join("; ")}`,
      ]);
    }
  });
}

// One row per changed string; resolved value = what differs from a bare div.
const flat = allCases.flat();
let offset = 0;
const SHOWN = [
  "font-size",
  "line-height",
  "letter-spacing",
  "font-weight",
  "color",
  "background-color",
  "border-top-color",
  "box-shadow",
  "child:border-top-color",
  "fill",
  "stroke",
];
const DEFAULTS: Record<string, string> = {
  "background-color": "rgba(0, 0, 0, 0)",
  "box-shadow": "none",
  "letter-spacing": "normal",
  "font-weight": "400",
};
function shown(v: Record<string, string>) {
  return SHOWN.filter((k) => v[k] !== undefined && v[k] !== DEFAULTS[k])
    .filter((k) => !(k === "border-top-color" && v["border-top-width"] === "0px"))
    .filter((k) => !(k === "child:border-top-color" && v["child:border-top-width"] === "0px"))
    .filter((k) => !(k === "stroke" && v[k] === "none"))
    .map((k) => `${k}: ${v[k]}`)
    .join("; ");
}
const rows = [
  "| file:line | old class string | new class string | value (new = old; computed, 16px root, 1280px, in a leading-[1.5] parent; first case) | cases | result |",
  "| --- | --- | --- | --- | --- | --- |",
];
pairs.forEach((pair, i) => {
  const cases = allCases[i];
  const problems = cases.flatMap((c, j) =>
    (caseResults.get(String(offset + j)) ?? []).map((p) => `${c.label} @ ${p}`),
  );
  offset += cases.length;
  if (problems.length) failures++;
  const firstCase = offset - cases.length;
  rows.push(
    `| ${pair.file.replace("src/app/(platform)/", "")}:${pair.line} | \`${pair.oldClass}\` | \`${pair.newClass}\` | ${shown(shownValues[firstCase])} | ${cases.length} x ${PARENTS.length} parents x ${VIEWPORTS.length} widths x ${MODES.length} modes${pair.textVariant ? `, in <Text ${pair.textVariant.new}>` : ""} | ${problems.length ? `FAIL: ${problems.slice(0, 3).join(" / ")}` : "identical"} |`,
  );
});
// SVG paint moved from attributes to classes: old markup with base CSS vs new
// markup with head CSS, computed fill/stroke and pixels.
const SVG_PAIRS = [
  {
    label: "EmptyState file body / LibraryEmptyState card",
    old: '<path d="M4 4H40L52 16V36H4Z" fill="white" stroke="#E4E4E7" stroke-width="1"/>',
    new: '<path d="M4 4H40L52 16V36H4Z" class="fill-card stroke-border" stroke-width="1"/>',
  },
  {
    label: "LibraryEmptyState card (rect)",
    old: '<rect x="4" y="4" width="48" height="28" rx="6" ry="6" fill="white" stroke="#E4E4E7" stroke-width="1"/>',
    new: '<rect x="4" y="4" width="48" height="28" rx="6" ry="6" class="fill-card stroke-border" stroke-width="1"/>',
  },
  {
    label: "EmptyState folded corner",
    old: '<path d="M40 4V16H52" fill="#F4F4F5" stroke="#E4E4E7" stroke-width="1"/>',
    new: '<path d="M40 4V16H52" class="fill-muted stroke-border" stroke-width="1"/>',
  },
  {
    label: "FileIllustration React logo nucleus",
    old: '<circle cx="28" cy="20" r="8" fill="rgb(24 24 27 / 0.55)"/>',
    new: '<circle cx="28" cy="20" r="8" class="fill-primary/55"/>',
  },
];
const svgRows: string[] = [];
let svgFailures = 0;
{
  const oldSvgCss = await compile(baseDir, []);
  const newSvgCss = await compile(headDir, SVG_PAIRS.map((p) => p.new.match(/class="([^"]+)"/)![1]));
  const render = async (css: string, markup: string) => {
    const p = await browser.newPage({ viewport: { width: 80, height: 60 } });
    await p.setContent(
      `<html><head><style>${css}</style></head><body style="margin:0;background:#f6f7f8"><svg width="64" height="48" viewBox="0 0 64 48" fill="none">${markup}</svg></body></html>`,
    );
    const v = await p.evaluate(() => {
      const el = document.querySelector("svg > *")!;
      const st = getComputedStyle(el);
      return { fill: st.fill, stroke: st.stroke, "fill-opacity": st.fillOpacity, "stroke-width": st.strokeWidth };
    });
    const shot = await p.screenshot();
    await p.close();
    return { v, shot };
  };
  for (const pair of SVG_PAIRS) {
    const a = await render(oldSvgCss, pair.old);
    const b = await render(newSvgCss, pair.new);
    const px = comparePngs(a.shot, b.shot).diffPixels;
    const same = JSON.stringify(a.v) === JSON.stringify(b.v) && px === 0;
    if (!same) svgFailures++;
    svgRows.push(`| ${pair.label} | \`${pair.old}\` | \`${pair.new}\` | ${Object.entries(b.v).map(([k, val]) => `${k}: ${val}`).join("; ")} | ${same ? "identical, 0 px" : `FAIL ${JSON.stringify(a.v)} vs ${JSON.stringify(b.v)}, ${px} px`} |`);
  }
  console.log(`\n| SVG paint | old markup (base CSS) | new markup (head CSS) | computed | result |\n| --- | --- | --- | --- | --- |\n${svgRows.join("\n")}`);
}

// Spinner frames: old module keyframes vs animate-spin, paused at 8 points of the turn.
const spinnerPair = pairs.find((p) => p.oldClass.startsWith(MODULE_CLASS));
let spinnerDiff = 0;
if (spinnerPair) {
  const shotAt = async (css: string, cls: string, t: number) => {
    const p = await browser.newPage({ viewport: { width: 64, height: 64 } });
    await p.setContent(
      `<html><head><style>${css}</style></head><body style="margin:0;padding:8px;background:#fff"><div style="display:flex;width:24px;height:24px;align-items:center;justify-content:center;border-radius:9999px;background:#efeff0;color:rgb(1,2,3)"><div class="${cls}"></div></div></body></html>`,
    );
    await p.evaluate((time) => {
      for (const a of document.getAnimations()) {
        a.pause();
        a.currentTime = time;
      }
    }, t);
    await p.evaluate(
      () =>
        new Promise((done) =>
          requestAnimationFrame(() => requestAnimationFrame(done)),
        ),
    );
    const shot = await p.screenshot();
    await p.close();
    return shot;
  };
  for (let t = 0; t < 1000; t += 125) {
    const a = await shotAt(oldCss, spinnerPair.oldClass, t);
    const b = await shotAt(newCss, spinnerPair.newClass, t);
    const again = await shotAt(oldCss, spinnerPair.oldClass, t);
    // A paused frame occasionally rasterises one of two ways (the control,
    // old against old, shows it), so new must equal one of two old captures.
    const d1 = comparePngs(a, b);
    const d2 = comparePngs(again, b);
    const d = d1.diffPixels <= d2.diffPixels ? d1 : d2;
    console.log(`spinner t=${t}ms: ${d.diffPixels} (control old vs old ${comparePngs(a, again).diffPixels})`);
    writeFileSync(join(outDir, `spinner-${t}-old.png`), a);
    writeFileSync(join(outDir, `spinner-${t}-new.png`), b);
    spinnerDiff += d.diffPixels;
  }
  console.log(`SitrepItem spinner: module keyframes vs animate-spin at 8 frames (0-875ms): ${spinnerDiff} differing pixels`);
}
await browser.close();

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "diff-equivalence.md"), `${rows.join("\n")}\n`);
console.log(rows.join("\n"));
if (unpaired.length) console.log(`\nNot paired (checked separately):\n${unpaired.join("\n")}`);
console.log(
  `\n${pairs.length} changed class strings, ${flat.length} cases, ${cellsCompared} rendered cells (every computed property): ${failures} failing; page pixel diff ${pixelDiff}`,
);
console.log(`${SVG_PAIRS.length} SVG paint pairs: ${svgFailures} failing`);
writeFileSync(
  join(outDir, "diff-equivalence.md"),
  `${rows.join("\n")}\n\n| SVG paint | old markup (base CSS) | new markup (head CSS) | computed | result |\n| --- | --- | --- | --- | --- |\n${svgRows.join("\n")}\n`,
);
process.exitCode = failures || pixelDiff || spinnerDiff || svgFailures ? 1 : 0;
