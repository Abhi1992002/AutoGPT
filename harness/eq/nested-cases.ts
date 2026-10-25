// Old/new DOM fragments for the copy-into-Text restructures, per PR. Old =
// the base's class strings, new = the head's; Text spans resolved with the
// head's variants and cn(), as Text composes them. Run with cwd = head checkout.
// usage: nested-cases.ts <pr> <out.json>
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const pr = Number(process.argv[2]);
const H = require(join(process.cwd(), "src/components/atoms/Text/helpers"));
const { cn } = require(join(process.cwd(), "src/lib/utils"));
const text = (variant: string, tone?: string, className?: string) => cn(H.variants[variant], tone && H.tones[tone], className);
const svg = (cls: string) => `<svg class="${cls}" width="16" height="16" viewBox="0 0 24 24"><path d="M4 8l8 8 8-8"/></svg>`;

// SidebarGroupLabel's own classes at the base and head of #16125 (ui/sidebar.tsx).
const LABEL = "flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0 group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0";
// After #16127 the label's own classes are on the role scale.
const LABEL4 = "flex h-8 shrink-0 items-center rounded-md px-2 text-caption font-medium leading-4 text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0 group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0";

const expertKids = `<span class="relative inline-flex shrink-0 rounded-full" style="width:32px;height:32px"><span class="absolute inset-0 flex items-center justify-center rounded-full bg-transparent text-lg text-neutral-600"><span class="text-body leading-5">M</span></span></span><span class="flex min-w-0 flex-col text-left gap-0"><span class="flex min-w-0 gap-2 items-center"><span class="${text("body-medium", "primary", "min-w-0 truncate leading-4.5")}">Maya</span><span class="shrink-0 rounded-full bg-surface-active/70 px-1.5 text-caption-sm font-medium tabular-nums leading-4.5 text-foreground-secondary">2</span></span></span>`;

const CASES: Record<number, { name: string; old: string; new: string }[]> = {
  2: [
    {
      name: "TourSidebar.tsx Workspace label (SidebarGroupLabel > CollapsibleTrigger)",
      old: `<button class="${cn(LABEL, "text-[13px] font-medium")}">Workspace${svg("ml-auto size-4")}</button>`,
      new: `<button class="${cn(LABEL, "leading-inherit")}"><span class="${text("body-sm-medium-inherit", "inherit")}">Workspace</span>${svg("ml-auto size-4")}</button>`,
    },
    {
      name: "CollapsibleNavGroup.tsx label (SidebarGroupLabel > CollapsibleTrigger), incl. max-md",
      old: `<button class="${cn(LABEL, "text-body-sm font-medium leading-inherit text-foreground-tertiary group-data-[collapsible=icon]:hidden max-md:h-11 max-md:text-sm")}">Workflows${svg("ml-auto size-4 text-sidebar-foreground/90 max-md:size-5")}</button>`,
      new: `<button class="${cn(LABEL, "leading-inherit text-foreground-tertiary group-data-[collapsible=icon]:hidden max-md:h-11")}"><span class="${text("body-sm-medium-inherit-touch", "inherit")}">Workflows</span>${svg("ml-auto size-4 text-sidebar-foreground/90 max-md:size-5")}</button>`,
    },
    {
      name: "ExpertChatGroup.tsx trigger (avatar initial, name, count), incl. max-md",
      old: `<button class="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 text-left text-sm font-medium text-foreground-strong max-md:py-2 max-md:text-base">${expertKids}</button>`,
      new: `<button class="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 text-left font-medium max-md:py-2">${expertKids}</button>`,
    },
    {
      name: "ExpertChatGroup.tsx Load all / Load more button, incl. max-md",
      old: `<button class="mt-0.5 w-full rounded-md px-2 py-1 text-left text-xs font-medium text-foreground-tertiary hover:bg-surface-hover hover:text-foreground-emphasis max-md:py-2.5 max-md:text-sm">Load more</button>`,
      new: `<button class="mt-0.5 w-full rounded-md px-2 py-1 text-left text-foreground-tertiary hover:bg-surface-hover hover:text-foreground-emphasis max-md:py-2.5"><span class="${text("small-medium-tight-touch", "inherit", "block")}">Load more</span></button>`,
    },
  ],
  3: [
    {
      name: "WalletFullPanel.tsx header row (Earn credits pill with semibold amount, close button)",
      old: `<div class="flex shrink-0 items-center text-sm text-accent-strong"><div class="rounded-lg bg-violet-100 px-3 py-2">Earn credits <span class="font-semibold">1,250</span></div><button aria-label="Close wallet">${svg("ml-2 h-5 w-5 text-foreground-emphasis hover:text-foreground")}</button></div>`,
      new: `<div class="flex shrink-0 items-center text-body leading-5 text-accent-strong"><div class="${text("body-tight", "inherit", "rounded-lg bg-violet-100 px-3 py-2")}">Earn credits <span class="${text("body-semibold-tight", "inherit")}">1,250</span></div><button aria-label="Close wallet">${svg("ml-2 h-5 w-5 text-foreground-emphasis hover:text-foreground")}</button></div>`,
    },
  ],
  4: [
    {
      name: "TourSidebar.tsx Workspace label on the SidebarGroupLabel base (text-caption leading-4 merged with the caller's leading-inherit)",
      old: `<button class="${cn(LABEL, "leading-inherit")}"><span class="${text("body-sm-medium-inherit", "inherit")}">Workspace</span>${svg("ml-auto size-4")}</button>`,
      new: `<button class="${cn(LABEL4, "leading-inherit")}"><span class="${text("body-sm-medium-inherit", "inherit")}">Workspace</span>${svg("ml-auto size-4")}</button>`,
    },
    {
      name: "CollapsibleNavGroup.tsx label on the SidebarGroupLabel base, incl. max-md",
      old: `<button class="${cn(LABEL, "leading-inherit text-foreground-tertiary group-data-[collapsible=icon]:hidden max-md:h-11")}"><span class="${text("body-sm-medium-inherit-touch", "inherit")}">Workflows</span>${svg("ml-auto size-4 text-sidebar-foreground/90 max-md:size-5")}</button>`,
      new: `<button class="${cn(LABEL4, "leading-inherit text-foreground-tertiary group-data-[collapsible=icon]:hidden max-md:h-11")}"><span class="${text("body-sm-medium-inherit-touch", "inherit")}">Workflows</span>${svg("ml-auto size-4 text-sidebar-foreground/90 max-md:size-5")}</button>`,
    },
    {
      name: "ContextPanel.tsx mobile SheetTitle (in SheetHeader)",
      old: `<div class="${cn("flex flex-col space-y-2 text-center sm:text-left", "mt-12 px-6 pb-1 pt-2 text-left")}"><h2 class="${cn("text-lg font-semibold text-neutral-950 dark:text-neutral-50", "text-lg font-semibold text-foreground-strong")}">Workspace files</h2></div>`,
      new: `<div class="${cn("flex flex-col space-y-2 text-center sm:text-left", "mt-12 px-6 pb-1 pt-2 text-left")}"><h2 class="${cn("text-lg font-semibold text-neutral-950 dark:text-neutral-50")}"><span class="${text("lg-semibold", "primary", "dark:text-neutral-50")}">Workspace files</span></h2></div>`,
    },
    {
      name: "ContextPanel.tsx desktop title (padding to margin, in the flex column)",
      old: `<div class="flex min-h-0 flex-1 flex-col"><h2 class="shrink-0 px-6 pb-1 pt-6 text-base font-semibold text-foreground-strong">Workspace files</h2><div class="min-h-0 flex-1 p-3 pt-4">x</div></div>`,
      new: `<div class="flex min-h-0 flex-1 flex-col"><h2 class="${text("large-semibold-tight", "primary", "mx-6 mb-1 mt-6 shrink-0")}">Workspace files</h2><div class="min-h-0 flex-1 p-3 pt-4">x</div></div>`,
    },
    {
      name: "WorkOutputSheet.tsx table preview (header row, body rows incl. a wrapping cell)",
      old: `<div class="overflow-x-auto rounded-xl ring-1 ring-inset ring-border-base"><table class="w-full border-collapse text-sm"><thead><tr class="bg-surface-muted text-left"><th class="px-3 py-2 font-medium text-foreground-secondary">name</th><th class="px-3 py-2 font-medium text-foreground-secondary">status</th></tr></thead><tbody><tr class="border-t border-separator"><td class="px-3 py-2 text-foreground-body">Weekly report for the growth team</td><td class="px-3 py-2 text-foreground-body">done</td></tr><tr class="border-t border-separator"><td class="px-3 py-2 text-foreground-body">x</td><td class="px-3 py-2 text-foreground-body">42</td></tr></tbody></table></div>`,
      new: `<div class="overflow-x-auto rounded-xl ring-1 ring-inset ring-border-base"><table class="w-full border-collapse"><thead><tr class="bg-surface-muted text-left"><th class="px-3 py-2 text-foreground-secondary"><div class="${text("body-medium-tight", "secondary")}">name</div></th><th class="px-3 py-2 text-foreground-secondary"><div class="${text("body-medium-tight", "secondary")}">status</div></th></tr></thead><tbody><tr class="border-t border-separator"><td class="px-3 py-2"><div class="${text("body-tight", "body")}">Weekly report for the growth team</div></td><td class="px-3 py-2"><div class="${text("body-tight", "body")}">done</div></td></tr><tr class="border-t border-separator"><td class="px-3 py-2"><div class="${text("body-tight", "body")}">x</div></td><td class="px-3 py-2"><div class="${text("body-tight", "body")}">42</div></td></tr></tbody></table></div>`,
    },
  ],
  5: [
    {
      name: "RecentChats.tsx Pinned row (icon + label; the row's 12px medium moves onto the label)",
      old: `<div class="flex items-center gap-1.5 px-2 pb-1.5 text-xs font-medium text-foreground-tertiary">${svg("size-3.5")}<span class="truncate">Pinned</span></div>`,
      new: `<div class="flex items-center gap-1.5 px-2 pb-1.5 text-foreground-tertiary">${svg("size-3.5")}<span class="${text("small-medium-tight", "muted", "truncate")}">Pinned</span></div>`,
    },
    {
      name: "AccountMenuFeedbackRow.tsx row (Give feedback)",
      old: `<button class="group relative flex w-full items-center gap-3 rounded-lg py-2 pl-3 pr-2 text-left text-sm font-normal text-neutral-700 outline-none transition-colors duration-200 ease-out hover:bg-neutral-100 focus-visible:bg-neutral-100 focus-visible:outline-none"><span class="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-neutral-900 opacity-0" aria-hidden="true"></span><span class="relative z-10 flex shrink-0 items-center">${svg("h-[18px] w-[18px] shrink-0")}</span><span class="relative z-10 flex-1 truncate">Give feedback</span></button>`,
      new: `<button class="group relative flex w-full items-center gap-3 rounded-lg py-2 pl-3 pr-2 text-left text-neutral-700 outline-none transition-colors duration-200 ease-out hover:bg-neutral-100 focus-visible:bg-neutral-100 focus-visible:outline-none"><span class="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-neutral-900 opacity-0" aria-hidden="true"></span><span class="relative z-10 flex shrink-0 items-center">${svg("h-[18px] w-[18px] shrink-0")}</span><span class="${text("body-tight", "inherit", "relative z-10 flex-1 truncate")}">Give feedback</span></button>`,
    },
    {
      name: "RecentChats.tsx Load more button, incl. max-md",
      old: `<button class="mt-1 flex w-full items-center justify-center gap-2 rounded-md bg-surface-active px-2 py-1.5 text-sm text-foreground-emphasis hover:bg-zinc-300 disabled:opacity-60 max-md:py-3 max-md:text-base">Load more</button>`,
      new: `<button class="mt-1 flex w-full items-center justify-center gap-2 rounded-md bg-surface-active px-2 py-1.5 text-foreground-emphasis hover:bg-zinc-300 disabled:opacity-60 max-md:py-3"><span class="${text("body-tight-touch", "inherit")}">Load more</span></button>`,
    },
    {
      name: "RecentChats.tsx Load more button while loading (spinner + Loading…), incl. max-md",
      old: `<button class="mt-1 flex w-full items-center justify-center gap-2 rounded-md bg-surface-active px-2 py-1.5 text-sm text-foreground-emphasis hover:bg-zinc-300 disabled:opacity-60 max-md:py-3 max-md:text-base"><span class="size-4 text-foreground-tertiary" style="display:inline-block"></span>Loading…</button>`,
      new: `<button class="mt-1 flex w-full items-center justify-center gap-2 rounded-md bg-surface-active px-2 py-1.5 text-foreground-emphasis hover:bg-zinc-300 disabled:opacity-60 max-md:py-3"><span class="size-4 text-foreground-tertiary" style="display:inline-block"></span><span class="${text("body-tight-touch", "inherit")}">Loading…</span></button>`,
    },
  ],
};
export { LABEL4 };
writeFileSync(process.argv[3], JSON.stringify(CASES[pr] || [], null, 1));
console.log(`PR${pr}: ${(CASES[pr] || []).length} restructures`);
