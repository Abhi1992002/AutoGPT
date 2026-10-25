// Every exact class string each PR writes: old (legacy, as dev renders it) vs new.
// `extra` = the cn()-merged string on the real element (component base + caller).
import { writeFileSync } from "node:fs";
const { cn } = await import("/home/vercel-sandbox/autogpt/autogpt_platform/frontend/src/lib/utils.ts");
type Extra = { real: string; oldCls: string; newCls: string };
type P = { file: string; old: string; new: string; tag: string | null; extra?: Extra[]; atomOwnsBase?: boolean };
const out: Record<string, P[]> = {};
const add = (pr: string, p: P) => (out[pr] ??= []).push(p);

// ---- PR1 pagination-controls
// Text-first: the label is <Text variant="body" as="span" className="leading-5 text-inherit">, i.e. Text's body classes merged with the override
const { variants: TEXT, tones: TONES } = await import("/home/vercel-sandbox/autogpt/autogpt_platform/frontend/src/components/atoms/Text/helpers.ts");
add("pr1", { file: "molecules/PaginationControls/PaginationControls.tsx (<Text variant=\"body-tight\" tone=\"inherit\" as=span>)", old: "text-sm", new: cn(TEXT["body-tight"], TONES.inherit), tag: "span", atomOwnsBase: true });

// ---- PR1 pagination buttons: legacy outline Button -> atoms/Button variant="legacy-outline" (DS3a-3 #16092's strings)
{
  const { buttonVariants: LEGACY_BTN } = await import("/home/vercel-sandbox/autogpt/autogpt_platform/frontend/src/components/__legacy__/ui/button.tsx");
  const { legacyButtonVariants } = await import("/home/vercel-sandbox/wt/p1/autogpt_platform/frontend/src/components/atoms/Button/helpers.ts");
  add("pr1", { file: "molecules/PaginationControls: Previous / Next (<Button variant=\"legacy-outline\">, was the legacy outline Button)", old: cn(LEGACY_BTN({ variant: "outline", size: "default" })), new: cn(legacyButtonVariants({ variant: "legacy-outline", size: "legacy-default" })), tag: "button", atomOwnsBase: true });
  add("pr1", { file: "atoms/Button `legacy-destructive` (#16092's 520bc19e6 string; no call site in this stack)", old: cn(LEGACY_BTN({ variant: "destructive", size: "default" })), new: cn(legacyButtonVariants({ variant: "legacy-destructive", size: "legacy-default" })), tag: "button", atomOwnsBase: true });
}

// ---- PR2 calendar
const GHOST = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-0 disabled:pointer-events-none disabled:opacity-50 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-50 h-9 px-4 py-2";
const cal: [string, string][] = [
  ["flex  items-center justify-center text-sm font-medium", "flex  items-center justify-center text-body leading-5 font-medium"],
  ["text-neutral-500 rounded-md w-8 font-normal text-[0.8rem] dark:text-neutral-400", "text-neutral-500 rounded-md w-8 font-normal text-[0.8rem] dark:text-neutral-400"],
  [cn("relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-neutral-100 [&:has([aria-selected].day-outside)]:bg-neutral-100/50 [&:has([aria-selected].day-range-end)]:rounded-r-md dark:[&:has([aria-selected])]:bg-neutral-800 dark:[&:has([aria-selected].day-outside)]:bg-neutral-800/50", "[&:has([aria-selected])]:rounded-md"),
   cn("relative p-0 text-center text-body leading-5 focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-neutral-100 [&:has([aria-selected].day-outside)]:bg-neutral-100/50 [&:has([aria-selected].day-range-end)]:rounded-r-md dark:[&:has([aria-selected])]:bg-neutral-800 dark:[&:has([aria-selected].day-outside)]:bg-neutral-800/50", "[&:has([aria-selected])]:rounded-md")],
  [cn(GHOST, "h-8 w-8 p-0 font-normal aria-selected:opacity-100"), "inline-flex items-center justify-center whitespace-nowrap rounded-md text-body leading-5 transition-colors focus-visible:outline-none focus-visible:ring-0 disabled:pointer-events-none disabled:opacity-50 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-50 h-8 w-8 p-0 font-normal aria-selected:opacity-100"],
  ["bg-neutral-900 text-neutral-100 hover:bg-neutral-900 hover:text-neutral-50 focus:bg-neutral-700 focus:text-neutral-50 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-50 dark:hover:text-neutral-900 dark:focus:bg-neutral-50 dark:focus:text-neutral-900", "bg-neutral-900 text-neutral-100 hover:bg-neutral-900 hover:text-neutral-50 focus:bg-neutral-700 focus:text-neutral-50 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-50 dark:hover:text-neutral-900 dark:focus:bg-neutral-50 dark:focus:text-neutral-900"],
  ["bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50", "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50"],
  ["day-outside text-neutral-500 opacity-50  aria-selected:bg-neutral-100/50 aria-selected:text-neutral-500 aria-selected:opacity-30 dark:text-neutral-400 dark:aria-selected:bg-neutral-800/50 dark:aria-selected:text-neutral-400", "day-outside text-neutral-500 opacity-50  aria-selected:bg-neutral-100/50 aria-selected:text-neutral-500 aria-selected:opacity-30 dark:text-neutral-400 dark:aria-selected:bg-neutral-800/50 dark:aria-selected:text-neutral-400"],
  ["text-neutral-500 opacity-50 dark:text-neutral-400", "text-neutral-500 opacity-50 dark:text-neutral-400"],
  ["aria-selected:bg-neutral-100 aria-selected:text-neutral-900 dark:aria-selected:bg-neutral-800 dark:aria-selected:text-neutral-50", "aria-selected:bg-neutral-100 aria-selected:text-neutral-900 dark:aria-selected:bg-neutral-800 dark:aria-selected:text-neutral-50"],
];
for (const [o, n] of cal) add("pr2", { file: "atoms/Calendar/Calendar.tsx", old: o, new: n, tag: null });
const TRIGGER = "agpt-border-input agpt-shadow-input flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border bg-transparent px-3 py-2 text-body leading-5 ring-offset-surface placeholder:text-neutral-500 data-[state=open]:border-gray-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-neutral-400 [&>span]:line-clamp-1";
add("pr2", { file: "atoms/Calendar/Calendar.tsx <SelectTrigger> (the primitive's base + this caller's classes, cn()-merged; the caller no longer repeats the base's text-body leading-5)", old: cn(TRIGGER, "w-[120px] space-x-2 bg-white text-sm"), new: cn(TRIGGER, "w-[120px] space-x-2 bg-surface"), tag: "SelectTrigger" });
const SCONTENT = "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-neutral-200 bg-surface text-neutral-950 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1";
add("pr2", { file: "atoms/Calendar/Calendar.tsx", old: "bg-white", new: "bg-surface", tag: "SelectContent",
  extra: [{ real: "<SelectContent> (legacy select)", oldCls: cn(SCONTENT, "bg-white"), newCls: cn(SCONTENT, "bg-surface") }] });
add("pr2", { file: "molecules/ScrollArea/ScrollArea.tsx", old: "relative flex-1 rounded-full bg-neutral-200 dark:bg-neutral-800", new: "relative flex-1 rounded-full bg-neutral-200 dark:bg-neutral-800", tag: null });
add("pr2", { file: "atoms/LoadingSpinner (MCPToolDialog, NodeExecutionBadge)", old: cn("size-16 animate-spin", "size-4"), new: cn("animate-spin text-inherit", "h-6 w-6", "size-4"), tag: "svg" });
add("pr2", { file: "atoms/LoadingSpinner (reset-password fallback)", old: cn("size-16 animate-spin", undefined), new: cn("animate-spin text-inherit", "h-6 w-6", "size-16"), tag: "svg" });
add("pr2", { file: "reset-password/page.tsx (fallback wrapper)", old: cn("flex items-center justify-center", "h-[80vh]"), new: "flex h-[80vh] items-center justify-center", tag: "div" });

// ---- PR3 multiselect + command
const CMD_OLD = "flex h-full w-full flex-col overflow-hidden rounded-md bg-white text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50";
const CMD_NEW = "flex h-full w-full flex-col overflow-hidden rounded-md bg-surface text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50";
const MS = "flex flex-col overflow-visible bg-transparent";
add("pr3", { file: "MultiSelect/components/Command.tsx", old: CMD_OLD, new: CMD_NEW, tag: null, extra: [
  { real: "<MultiSelector className=\"w-full\"> (SelectWidget)", oldCls: cn(CMD_OLD, cn(MS, "w-full")), newCls: cn(CMD_NEW, cn(MS, "w-full")) },
  { real: "<MultiSelector className=\"nodrag\"> (MultiSelectField)", oldCls: cn(CMD_OLD, cn(MS, "nodrag")), newCls: cn(CMD_NEW, cn(MS, "nodrag")) }] });
add("pr3", { file: "MultiSelect empty copy: was <CommandEmpty py-6 text-center text-sm> > <span text-muted-foreground>, now <CommandEmpty py-6 text-center> > <Text variant=\"body-tight\" tone=\"inherit\" className=\"text-muted-foreground\" as=span> (the text node's own styling)", old: "py-6 text-center text-sm text-muted-foreground", new: cn("py-6 text-center", cn(TEXT["body-tight"], TONES.inherit, "text-muted-foreground")), tag: "span", atomOwnsBase: true });
const ITEM_OLD = "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-neutral-100 data-[selected=true]:text-neutral-900 data-[disabled=true]:opacity-50 dark:data-[selected=true]:bg-neutral-800 dark:data-[selected=true]:text-neutral-50";
const ITEM_NEW = "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-body leading-5 outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-neutral-100 data-[selected=true]:text-neutral-900 data-[disabled=true]:opacity-50 dark:data-[selected=true]:bg-neutral-800 dark:data-[selected=true]:text-neutral-50";
const MSI = (inc: boolean) => cn("flex cursor-pointer justify-between rounded-md px-2 py-1 transition-colors", undefined, inc && "cursor-default opacity-50");
add("pr3", { file: "MultiSelect/components/Command.tsx", old: ITEM_OLD, new: ITEM_NEW, tag: null, extra: [
  { real: "<MultiSelectorItem>", oldCls: cn(ITEM_OLD, MSI(false)), newCls: cn(ITEM_NEW, MSI(false)) },
  { real: "<MultiSelectorItem> (selected)", oldCls: cn(ITEM_OLD, MSI(true)), newCls: cn(ITEM_NEW, MSI(true)) }] });
const TR_OLD = "agpt-border-input agpt-shadow-input flex flex-wrap gap-1 rounded-lg bg-background px-3 py-2 pl-1 text-sm";
const TR_NEW = "agpt-border-input agpt-shadow-input flex flex-wrap gap-1 rounded-lg bg-background px-3 py-2 pl-1 text-body leading-5";
add("pr3", { file: "MultiSelect/MultiSelect.tsx", old: TR_OLD, new: TR_NEW, tag: null, extra: [
  { real: "<MultiSelectorTrigger> (MultiSelectField)", oldCls: cn(TR_OLD, "rounded-3xl border border-border-base bg-surface px-2 shadow-none"), newCls: cn(TR_NEW, "rounded-3xl border border-border-base bg-surface px-2 shadow-none") }] });
add("pr3", { file: "MultiSelect/MultiSelect.tsx (<Text variant=\"small-semibold-tight\" tone=\"inherit\" as=span>; the old span's font-semibold is the weight it inherited from the legacy Badge)", old: "text-xs font-semibold", new: cn(TEXT["small-semibold-tight"], TONES.inherit), tag: "span", atomOwnsBase: true });
const LIST = "absolute top-0 z-10 flex w-full flex-col gap-2 rounded-md border border-muted bg-background p-2 shadow-md transition-colors scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground scrollbar-thumb-rounded-lg";
add("pr3", { file: "MultiSelect/MultiSelect.tsx", old: `${LIST} dark:scrollbar-thumb-muted`, new: `${LIST} dark:scrollbar-thumb-muted`, tag: null, extra: [
  { real: "<CommandList> under <MultiSelectorList>", oldCls: cn("max-h-[300px] overflow-y-auto overflow-x-hidden", cn(`${LIST} dark:scrollbar-thumb-muted`, undefined)), newCls: cn("max-h-[300px] overflow-y-auto overflow-x-hidden", cn(`${LIST} dark:scrollbar-thumb-muted`, undefined)) }] });

// ---- PR3 multiselect chips: legacy secondary Badge -> atoms/Badge variant="secondary" (DS3a-2 #16118's chip strings)
{
  const { badgeVariants: LEGACY_BADGE } = await import("/home/vercel-sandbox/autogpt/autogpt_platform/frontend/src/components/__legacy__/ui/badge.tsx");
  const src = (await import("node:child_process")).execSync("git -C /home/vercel-sandbox/autogpt show 766fa6935:autogpt_platform/frontend/src/components/atoms/Badge/Badge.tsx", { encoding: "utf8" });
  const grab = (re: RegExp) => src.match(re)![1].replace(/"\s*\+?\s*"/g, "");
  const chipBase = [grab(/const chipLayout =\s*"([^"]+)"/), grab(/default: "([^"]+)"/), grab(/const chipBehaviour =\s*"([^"]+)"/)].join(" ");
  const chipSecondary = grab(/secondary:\s*"([^"]+)"/);
  const CHIP_CLS = "flex items-center gap-1 rounded-xl px-1 pl-2";
  add("pr3", { file: "molecules/MultiSelect chip (<Badge variant=\"secondary\">, was the legacy secondary Badge), with the chip's own className", old: cn(LEGACY_BADGE({ variant: "secondary" }), CHIP_CLS), new: cn(chipBase, chipSecondary, CHIP_CLS), tag: "div", atomOwnsBase: true });
  add("pr3", { file: "the same chip, highlighted (activeIndex)", old: cn(LEGACY_BADGE({ variant: "secondary" }), CHIP_CLS, "ring-2 ring-muted-foreground"), new: cn(chipBase, chipSecondary, CHIP_CLS, "ring-2 ring-muted-foreground"), tag: "div", atomOwnsBase: true });
}

// ---- PR4 popover
const POP_OLD = "z-50 w-72 rounded-medium border border-neutral-200 bg-white p-4 text-neutral-950 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50";
const POP_NEW = "z-50 w-72 rounded-lg border border-border-base bg-surface p-4 text-foreground-strong shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2";
const pops: [string, string, string][] = [
  ["BlockMenu", "absolute h-[80vh] w-[46.625rem] overflow-hidden border-none p-0 shadow-[0_2px_6px_0_rgba(0,0,0,0.05)]", "absolute h-[80vh] w-[46.625rem] overflow-hidden rounded-medium border-none border-neutral-200 p-0 text-neutral-950 shadow-[0_2px_6px_0_rgba(0,0,0,0.05)] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50"],
  ["NewSaveControl", "w-96 max-w-[400px] rounded-xlarge", "w-96 max-w-[400px] rounded-xlarge border-neutral-200 text-neutral-950 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50"],
  ["DateInput, DateTimeInput", "w-auto p-0", "w-auto rounded-medium border-neutral-200 p-0 text-neutral-950 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50"],
];
for (const [where, o, n] of pops) add("pr4", { file: `<PopoverContent> ${where} (component base + caller, cn()-merged)`, old: cn(POP_OLD, o), new: cn(POP_NEW, n), tag: "PopoverContent" });

// ---- PR5 card
add("pr5", { file: "atoms/Card CardDescription", old: "text-sm text-neutral-500 dark:text-neutral-400", new: "text-body leading-5 text-neutral-500", tag: "p" });
const AUTH = "overflow-hidden rounded-lg border border-slate-200 bg-surface shadow-sm";
for (const c of ["border-none dark:bg-slate-900", "border-dashed", "mb-6", "", AUTH, `w-full ${AUTH}`]) {
  add("pr5", { file: "atoms/Card variant=outlined", old: cn("agpt-card text-neutral-950", c), new: cn("agpt-card text-neutral-950", c), tag: "div",
    extra: [{ real: `<Card variant="outlined" className="${c}">`, oldCls: cn("agpt-card text-neutral-950", c), newCls: cn("agpt-card text-neutral-950", c) }] });
}

// ---- PR6 label
const LB_OLD = "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";
const LB_NEW = "text-body font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";
const labelCallers = ["", "text-base font-semibold", "mt-1 block text-sm text-gray-600", "text-base font-medium", "pt-2", "text-sm", cn(false && "text-red-500", undefined), "text-red-500 dark:text-red-900"];
add("pr6", { file: "atoms/Label/Label.tsx", old: LB_OLD, new: LB_NEW, tag: "label", extra: [...new Set(labelCallers)].map((c) => ({ real: `<Label className="${c}">`, oldCls: cn(LB_OLD, c), newCls: cn(LB_NEW, c) })) });

// ---- PR7 icons
const icons: [string, string, string][] = [
  ["StoreCard stars", cn("size-4", "text-black dark:text-yellow-500"), "size-4 text-foreground-base"],
  ["error.tsx", cn("size-4", "size-10"), "size-10"],
  ["RunSummary", cn("size-4", "size-4 cursor-help text-neutral-400 hover:text-neutral-600"), "size-4 cursor-help text-neutral-400 hover:text-neutral-600"],
  ["AgentTableCard more", cn("size-4", "h-5 w-5 text-neutral-800 dark:text-neutral-200"), "h-5 w-5 text-neutral-800 dark:text-neutral-200"],
  ["AgentTableCard star", cn("size-4", "h-4 w-4 text-neutral-800 dark:text-neutral-200"), "h-4 w-4 text-neutral-800 dark:text-neutral-200"],
  ["__legacy__/Sidebar", cn("size-4", "h-6 w-6"), "h-6 w-6"],
];
for (const [f, o, n] of icons) add("pr7", { file: f, old: o, new: n, tag: "svg" });

// ---- PR8 separator
const SEP_OLD = (h: boolean) => cn("shrink-0 bg-neutral-200 dark:bg-neutral-800", h ? "h-[1px] w-full" : "h-full w-[1px]");
const SEP_NEW = (h: boolean) => cn("shrink-0 bg-neutral-200", h ? "h-px w-full" : "h-full w-px");
add("pr8", { file: "atoms/Separator (horizontal)", old: SEP_OLD(true), new: SEP_NEW(true), tag: "div", extra:
  ["", "h-full w-[1px] text-zinc-300", "my-6 bg-transparent", "mb-[25px] mt-[60px] bg-transparent", "h-[1px] w-full text-zinc-300", "mb-8", "text-[#E1E1E1]"].map((c) => ({ real: `<Separator className="${c}">`, oldCls: cn(SEP_OLD(true), c), newCls: cn(SEP_NEW(true), c) })) });
add("pr8", { file: "atoms/Separator (vertical)", old: SEP_OLD(false), new: SEP_NEW(false), tag: "div" });

for (const [pr, pairs] of Object.entries(out)) writeFileSync(`/home/vercel-sandbox/autogpt/.context/ev/eq/pairs-${pr}.json`, JSON.stringify({ pairs }, null, 1));
console.log(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.length])));
