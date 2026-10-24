/**
 * SECRT-3155 evidence. For every cn() merge that puts a custom radius name
 * (rounded-xsmall … rounded-2xlarge, any corner) next to another radius class,
 * render the merged class string from the base checkout (old cn, old call
 * site) and from this checkout (new cn, new call site) in Chromium and compare
 * the computed radius of all four corners at a 16px root, inside a parent with
 * a non-default line-height. Exit 1 on any difference.
 *
 *   cd autogpt_platform/frontend && pnpm exec tsx <this file> --base <base frontend dir>
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";

const headDir = process.cwd();
const baseDir = resolve(process.argv[process.argv.indexOf("--base") + 1]);
const req = createRequire(join(headDir, "package.json"));
const postcss = req("postcss");
const tailwindcss = req("tailwindcss");
const loadConfig = req("tailwindcss/loadConfig");
const { chromium } = req("@playwright/test");

type Cn = (...a: unknown[]) => string;

function src(dir: string, file: string) {
  return readFileSync(join(dir, file), "utf8");
}
// Pull a quoted class string out of a source file, failing if it is not there
// verbatim, so every row is built from the code as it is on that checkout.
function lit(dir: string, file: string, startsWith: string) {
  const text = src(dir, file);
  const re = new RegExp(`["\`](${startsWith.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^"\`]*)["\`]`);
  const m = text.match(re);
  if (!m) throw new Error(`${file}: no string starting ${startsWith}`);
  return m[1];
}

const F = {
  styles: "src/components/molecules/Dialog/components/styles.ts",
  cancel: "src/app/(no-navbar)/onboarding/steps/BrainDumpStep/components/RecordingControls/CancelRecordingDialog.tsx",
  expander: "src/components/renderers/InputRenderer/base/standard/widgets/TextInput/TextInputExpanderModal.tsx",
  input: "src/components/atoms/Input/Input.tsx",
  card: "src/components/atoms/Card/Card.tsx",
  offer: "src/components/organisms/SubscriptionPlans/components/SubscriptionOffer.tsx",
  legacyPopover: "src/components/__legacy__/ui/popover.tsx",
  popover: "src/components/molecules/Popover/Popover.tsx",
  save: "src/app/(platform)/build/components/NewControlPanel/NewSaveControl/NewSaveControl.tsx",
  blockMenu: "src/app/(platform)/build/components/NewControlPanel/NewBlockMenu/BlockMenu/BlockMenu.tsx",
  alert: "src/components/molecules/Alert/Alert.tsx",
  trigger: "src/app/(platform)/build/components/FlowEditor/Flow/components/TriggerAgentBanner.tsx",
  webhook: "src/app/(platform)/build/components/FlowEditor/nodes/CustomNode/components/WebhookDisclaimer.tsx",
  wallet: "src/components/layout/Navbar/components/Wallet/Wallet.tsx",
  inputGroup: "src/components/ui/input-group.tsx",
  chatInput: "src/app/(platform)/copilot/components/ChatInput/ChatInput.tsx",
};

async function cases(dir: string, cn: Cn) {
  const styles = await import(join(dir, F.styles));
  const { extendedButtonVariants } = await import(join(dir, "src/components/atoms/Button/helpers.ts"));
  const L = (f: keyof typeof F, s: string) => lit(dir, F[f], s);

  const cancelClass = L("cancel", "min-w-0 max-w-[30rem]");
  const btn = (variant: string) =>
    cn(extendedButtonVariants({ variant, size: "small", className: "h-10 rounded-xl" }));

  const expanderFirst = L("expander", "!min-h-[300px]");
  const inputBase = L("input", "rounded-xl border");
  const textarea = (json: boolean) => {
    const className = cn(expanderFirst, json && "font-mono text-sm");
    const base = cn(inputBase, "font-normal text-foreground-base", className);
    return cn(base, undefined, "-mb-1 h-auto min-h-[2.875rem]", ["min-h-[2.875rem] text-body", "py-2.5"]);
  };

  const inputGroupBase = L("inputGroup", "group/input-group");
  const chatPill = L("chatInput", "relative z-10 flex-col overflow-hidden");
  const chatStacked = L("chatInput", "gap-3 !rounded-3xl");
  const chatCompact = L("chatInput", "!rounded-xl border-zinc-200");
  const chat = (extra: string | false) => cn(inputGroupBase, "min-w-0 has-[>textarea]:h-auto", cn(chatPill, extra));

  return [
    ["CancelRecordingDialog, modal (≥ md)", "Dialog content", cn(styles.modalStyles.content, false, cancelClass)],
    ["CancelRecordingDialog, drawer (< md)", "Drawer content", cn(styles.drawerStyles.content, false, cancelClass)],
    ["CancelRecordingDialog, Keep recording", "Button secondary small", btn("secondary")],
    ["CancelRecordingDialog, Discard recording", "Button destructive small", btn("destructive")],
    ["TextInputExpanderModal, text", "Input textarea", textarea(false)],
    ["TextInputExpanderModal, json", "Input textarea", textarea(true)],
    ["Dialog, compact (modal)", "Dialog content", cn(styles.modalStyles.content, styles.compactStyles.content, undefined)],
    ["Dialog, compact (drawer)", "Drawer content", cn(styles.drawerStyles.content, styles.compactStyles.drawerContent, undefined)],
    ["Dialog, default (drawer)", "Drawer content", cn(styles.drawerStyles.content, false, undefined)],
    ["SubscriptionOffer", "Card", cn(L("card", "rounded-large"), cn(L("offer", "flex h-full flex-col rounded-2xl"), false))],
    ["SubscriptionOffer, highlighted", "Card", cn(L("card", "rounded-large"), cn(L("offer", "flex h-full flex-col rounded-2xl"), "border-purple-300"))],
    ["NewSaveControl", "legacy PopoverContent", cn(L("legacyPopover", "z-50 w-72 rounded-medium"), L("save", "w-96 max-w-[400px]"))],
    ["BlockMenu", "legacy PopoverContent", cn(L("legacyPopover", "z-50 w-72 rounded-medium"), L("blockMenu", "absolute h-[80vh]"))],
    ["TriggerAgentBanner", "Alert", cn(L("alert", "relative w-full rounded-lg"), L("trigger", "absolute bottom-4"))],
    ["WebhookDisclaimer", "Alert", cn(L("alert", "relative w-full rounded-lg"), L("webhook", "mb-3 rounded"))],
    ["Wallet, compact", "Popover content", cn(L("popover", "z-50 w-72 rounded-lg"), cn("z-50", L("wallet", "max-h-[var(--radix-popover-content-available-height)]")))],
    ["ChatInput, pill", "InputGroup", chat(false)],
    ["ChatInput, stacked", "InputGroup", chat(chatStacked)],
    ["ChatInput, compact", "InputGroup", chat(chatCompact)],
  ] as [string, string, string][];
}

async function compile(dir: string, classes: string[]) {
  const config = loadConfig(join(dir, "tailwind.config.ts"));
  const globals = src(dir, "src/app/globals.css");
  const out = await postcss([tailwindcss({ ...config, content: [{ raw: classes.join(" "), extension: "html" }] })]).process(globals, { from: join(dir, "src/app/globals.css") });
  return out.css as string;
}

const CORNERS = ["border-top-left-radius", "border-top-right-radius", "border-bottom-right-radius", "border-bottom-left-radius"];
const VIEWPORTS = [{ width: 1440, height: 900 }, { width: 390, height: 844 }];

async function measure(browser: any, css: string, lists: string[], vp: { width: number; height: number }) {
  const page = await browser.newPage({ viewport: vp });
  const body = lists.map((c, i) => `<div style="line-height:30px;position:relative;width:600px;height:400px"><div data-i="${i}" class="${c}" style="position:static;transform:none;width:200px;height:120px;min-height:0;max-height:none">x</div></div>`).join("");
  await page.setContent(`<html><head><style>${css}</style></head><body>${body}</body></html>`);
  const res = await page.evaluate((corners) => {
    if (getComputedStyle(document.documentElement).fontSize !== "16px") throw new Error("root not 16px");
    return [...document.querySelectorAll("[data-i]")].map((el) => {
      const s = getComputedStyle(el);
      return corners.map((p) => s.getPropertyValue(p)).join(" / ");
    });
  }, CORNERS);
  await page.close();
  return res;
}

function radiusClasses(list: string) {
  return list.split(/\s+/).filter((c) => /(^|:)!?rounded(-|$)/.test(c)).join(" ");
}

async function main() {
  const { cn: oldCn } = await import(join(baseDir, "src/lib/utils.ts"));
  const { cn: newCn } = await import(join(headDir, "src/lib/utils.ts"));
  const oldRows = await cases(baseDir, oldCn);
  const newRows = await cases(headDir, newCn);
  const oldCss = await compile(baseDir, oldRows.map((r) => r[2]));
  const newCss = await compile(headDir, newRows.map((r) => r[2]));
  const browser = await chromium.launch();
  let failures = 0;
  console.log("| call site | element | viewport | old radius classes after cn() (dev) | new radius classes after cn() (head) | computed radius TL / TR / BR / BL | result |");
  console.log("|---|---|---|---|---|---|---|");
  for (const vp of VIEWPORTS) {
    const oldV = await measure(browser, oldCss, oldRows.map((r) => r[2]), vp);
    const newV = await measure(browser, newCss, newRows.map((r) => r[2]), vp);
    oldRows.forEach((row, i) => {
      const same = oldV[i] === newV[i];
      if (!same) failures++;
      console.log(`| ${row[0]} | ${row[1]} | ${vp.width} | \`${radiusClasses(row[2])}\` | \`${radiusClasses(newRows[i][2])}\` | ${same ? oldV[i] : `${oldV[i]} → ${newV[i]}`} | ${same ? "same" : "DIFF"} |`);
    });
  }
  await browser.close();
  if (process.argv.includes("--full")) {
    oldRows.forEach((r, i) => console.log(`\n${r[0]}\n  old: ${r[2]}\n  new: ${newRows[i][2]}`));
  }
  console.log(`\n${oldRows.length * VIEWPORTS.length} rows, ${failures} differences`);
  process.exit(failures ? 1 : 0);
}
main();
