// Every class string this stack changes (typography role swaps and Text
// conversions), as old -> new. A Text conversion's new string is what Text
// renders: variants[variant] + tones[tone] + className, merged with the head's
// cn(). Run with cwd = the PR's head checkout; writes pairs-pr<N>.json.
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const pr = Number(process.argv[2]);
const out = process.argv[3];
const H = require(join(process.cwd(), "src/components/atoms/Text/helpers"));
const { cn } = require(join(process.cwd(), "src/lib/utils"));
type T = { variant: string; tone?: string; className?: string };
const text = (t: T) => cn(H.variants[t.variant], t.tone && H.tones[t.tone], t.className);
type P = { file: string; tag: string; old: string; new?: string; text?: T };

const PAIRS: Record<number, P[]> = {
  1: [
    { file: "molecules/Accordion/Accordion.tsx (trigger)", tag: "button", old: "flex flex-1 items-center justify-between py-4 text-left text-sm font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180", new: "flex flex-1 items-center justify-between py-4 text-left text-body font-medium leading-5 transition-all hover:underline [&[data-state=open]>svg]:rotate-180" },
    { file: "molecules/Accordion/Accordion.tsx (content)", tag: "div", old: "overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down", new: "overflow-hidden text-body leading-5 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down" },
  ],
  2: [
    { file: "TourSidebar.tsx (Workspace label)", tag: "button", old: "text-[13px] font-medium", new: "text-body-sm font-medium leading-inherit" },
    { file: "CollapsibleNavGroup.tsx (label, max-md)", tag: "button", old: "text-body-sm font-medium leading-inherit text-foreground-tertiary group-data-[collapsible=icon]:hidden max-md:h-11 max-md:text-sm", new: "text-body-sm font-medium leading-inherit text-foreground-tertiary group-data-[collapsible=icon]:hidden max-md:h-11 max-md:text-body max-md:leading-5" },
    { file: "ExpertChatGroup.tsx (trigger)", tag: "button", old: "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 text-left text-sm font-medium text-foreground-strong max-md:py-2 max-md:text-base", new: "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 text-left text-body font-medium leading-5 text-foreground-strong max-md:py-2 max-md:text-body-lg max-md:leading-6" },
    { file: "ExpertChatGroup.tsx (show more)", tag: "button", old: "mt-0.5 w-full rounded-md px-2 py-1 text-left text-xs font-medium text-foreground-tertiary hover:bg-surface-hover hover:text-foreground-emphasis max-md:py-2.5 max-md:text-sm", new: "mt-0.5 w-full rounded-md px-2 py-1 text-left text-caption font-medium leading-4 text-foreground-tertiary hover:bg-surface-hover hover:text-foreground-emphasis max-md:py-2.5 max-md:text-body max-md:leading-5" },
    { file: "WalletEarnCredits.tsx (group + row amount)", tag: "span", old: "shrink-0 font-sans text-sm text-foreground-tertiary", text: { variant: "body-tight", tone: "muted", className: "shrink-0" } },
  ],
  3: [
    { file: "GraphContent.tsx (Found N nodes)", tag: "div", old: "px-4 pt-3 text-xs text-zinc-500", text: { variant: "small-tight", tone: "muted", className: "px-4 pt-3" } },
    { file: "GraphContent.tsx (empty state)", tag: "div", old: "flex h-32 items-center justify-center text-sm text-zinc-500", text: { variant: "body-tight", tone: "muted", className: "flex h-32 items-center justify-center" } },
    { file: "GraphContent.tsx (node title)", tag: "span", old: "line-clamp-1 font-sans text-sm font-medium leading-[1.375rem] text-zinc-800", text: { variant: "body-medium", tone: "emphasis", className: "line-clamp-1" } },
    { file: "GraphContent.tsx (type badge)", tag: "span", old: "shrink-0 rounded-[0.75rem] bg-zinc-200 px-2 font-sans text-xs leading-5 text-zinc-500", text: { variant: "small-loose", tone: "muted", className: "shrink-0 rounded-[0.75rem] bg-zinc-200 px-2" } },
    { file: "GraphContent.tsx (description)", tag: "span", old: "line-clamp-1 font-sans text-xs font-normal leading-5 text-zinc-500", text: { variant: "small-loose", tone: "muted", className: "line-clamp-1" } },
    { file: "ListView.tsx (search input)", tag: "input", old: "h-[46px] w-full rounded-3xl border border-border-base bg-surface pl-12 pr-4 text-sm leading-5.5 text-[#1F1F20] placeholder:text-placeholder focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400", new: "h-[46px] w-full rounded-3xl border border-border-base bg-surface pl-12 pr-4 text-body leading-5.5 text-[#1F1F20] placeholder:text-placeholder focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400" },
    { file: "WalletFullPanel.tsx (title)", tag: "span", old: "font-poppins text-base font-semibold text-foreground-strong", text: { variant: "h5-semibold", tone: "primary" } },
    { file: "WalletFullPanel.tsx (subtitle)", tag: "span", old: "font-sans text-xs text-foreground-tertiary", text: { variant: "small-tight", tone: "muted" } },
    { file: "WalletFullPanel.tsx (header row)", tag: "div", old: "flex shrink-0 items-center text-sm text-accent-strong", new: "flex shrink-0 items-center text-body leading-5 text-accent-strong" },
    { file: "WalletFullPanel.tsx (credits label, in the header row)", tag: "div", old: "rounded-lg bg-violet-100 px-3 py-2 text-sm text-accent-strong", text: { variant: "body-tight", className: "rounded-lg bg-violet-100 px-3 py-2 text-accent-strong" } },
    { file: "WalletFullPanel.tsx (tasks intro)", tag: "p", old: "mx-1 my-3 font-sans text-xs font-normal text-foreground-subtle", text: { variant: "small-tight", tone: "subtle", className: "mx-1 my-3" } },
  ],
  4: [
    { file: "ContextPanel.tsx (desktop title)", tag: "h2", old: "shrink-0 px-6 pb-1 pt-6 text-base font-semibold text-foreground-strong", text: { variant: "large-semibold-tight", tone: "primary", className: "shrink-0 px-6 pb-1 pt-6" } },
    { file: "Sheet.tsx (SheetDescription; no caller)", tag: "p", old: "text-sm text-neutral-500 dark:text-neutral-400", new: "text-body leading-5 text-neutral-500 dark:text-neutral-400" },
    { file: "WorkOutputSheet.tsx (table)", tag: "table", old: "w-full border-collapse text-sm", new: "w-full border-collapse text-body leading-5" },
    { file: "ui/sidebar.tsx (group label)", tag: "div", old: "flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0", new: "flex h-8 shrink-0 items-center rounded-md px-2 text-caption font-medium leading-4 text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0" },
    { file: "ui/sidebar.tsx (menu)", tag: "ul", old: "w-full text-sm", new: "w-full text-body leading-5" },
    { file: "ui/sidebar.tsx (menu button base + default size)", tag: "button", old: "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none h-8 text-sm", new: "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-body leading-5 outline-none h-8 text-body leading-5" },
    { file: "ui/sidebar.tsx (menu button sm size)", tag: "button", old: "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none h-7 text-xs", new: "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-body leading-5 outline-none h-7 text-caption leading-4" },
    { file: "ui/sidebar.tsx (menu button lg size)", tag: "button", old: "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none h-12 text-sm", new: "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-body leading-5 outline-none h-12 text-body leading-5" },
    { file: "ui/sidebar.tsx (menu badge)", tag: "div", old: "pointer-events-none absolute right-1 flex h-5 min-w-5 select-none items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground", new: "pointer-events-none absolute right-1 flex h-5 min-w-5 select-none items-center justify-center rounded-md px-1 text-caption font-medium tabular-nums leading-4 text-sidebar-foreground" },
    { file: "ui/sidebar.tsx (sub-button sm)", tag: "a", old: "flex h-7 min-w-0 items-center gap-2 rounded-md px-2 text-xs", new: "flex h-7 min-w-0 items-center gap-2 rounded-md px-2 text-caption leading-4" },
    { file: "ui/sidebar.tsx (sub-button md)", tag: "a", old: "flex h-7 min-w-0 items-center gap-2 rounded-md px-2 text-sm", new: "flex h-7 min-w-0 items-center gap-2 rounded-md px-2 text-body leading-5" },
  ],
  5: [
    { file: "RecentChats.tsx (empty state)", tag: "p", old: "px-2 py-2 text-sm text-neutral-500", text: { variant: "body-tight", className: "px-2 py-2 text-neutral-500" } },
    { file: "RecentChats.tsx (Pinned label; its row used to set 12px medium)", tag: "span", old: "truncate text-xs font-medium text-foreground-tertiary", text: { variant: "small-medium-tight", tone: "muted", className: "truncate" } },
    { file: "RecentChats.tsx (Load all)", tag: "button", old: "mt-1 flex w-full items-center justify-center gap-2 rounded-md bg-surface-active px-2 py-1.5 text-sm text-foreground-emphasis hover:bg-zinc-300 disabled:opacity-60 max-md:py-3 max-md:text-base", new: "mt-1 flex w-full items-center justify-center gap-2 rounded-md bg-surface-active px-2 py-1.5 text-body leading-5 text-foreground-emphasis hover:bg-zinc-300 disabled:opacity-60 max-md:py-3 max-md:text-body-lg max-md:leading-6" },
    { file: "RecentChatItem.tsx (rename input)", tag: "input", old: "w-full rounded-md border border-border-strong bg-surface px-2 py-1 text-sm text-foreground-emphasis outline-none focus:border-brand focus:ring-1 focus:ring-brand max-md:py-2 max-md:text-base", new: "w-full rounded-md border border-border-strong bg-surface px-2 py-1 text-body leading-5 text-foreground-emphasis outline-none focus:border-brand focus:ring-1 focus:ring-brand max-md:py-2 max-md:text-body-lg max-md:leading-6" },
    { file: "AccountMenuFeedbackRow.tsx (row)", tag: "button", old: "group relative flex w-full items-center gap-3 rounded-lg py-2 pl-3 pr-2 text-left text-sm font-normal text-neutral-700 outline-none", new: "group relative flex w-full items-center gap-3 rounded-lg py-2 pl-3 pr-2 text-left text-body font-normal leading-5 text-neutral-700 outline-none" },
  ],
  6: [
    { file: "InputGroup (root)", tag: "div", old: "group/input-group relative flex w-full items-center rounded-xlarge border border-neutral-200 bg-white shadow-sm outline-none transition-[color,box-shadow] min-w-0 has-[>textarea]:h-auto has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[[data-slot=input-group-control]:focus-visible]:border-zinc-400 has-[[data-slot=input-group-control]:focus-visible]:ring-1 has-[[data-slot=input-group-control]:focus-visible]:ring-zinc-400", new: "group/input-group relative flex w-full items-center rounded-xlarge border border-neutral-200 bg-surface shadow-sm outline-none transition-[color,box-shadow] min-w-0 has-[>textarea]:h-auto has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[[data-slot=input-group-control]:focus-visible]:border-zinc-400 has-[[data-slot=input-group-control]:focus-visible]:ring-1 has-[[data-slot=input-group-control]:focus-visible]:ring-zinc-400" },
    { file: "InputGroupAddon align=inline-start", tag: "div", old: "text-muted-foreground flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium select-none group-data-[disabled=true]/input-group:opacity-50 order-first pl-3", new: "text-muted-foreground flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-body font-medium leading-5 select-none group-data-[disabled=true]/input-group:opacity-50 order-first pl-3" },
    { file: "InputGroupAddon align=inline-end", tag: "div", old: "text-muted-foreground flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium select-none group-data-[disabled=true]/input-group:opacity-50 order-last pr-3", new: "text-muted-foreground flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-body font-medium leading-5 select-none group-data-[disabled=true]/input-group:opacity-50 order-last pr-3" },
    { file: "InputGroupAddon align=block-start", tag: "div", old: "text-muted-foreground flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium select-none group-data-[disabled=true]/input-group:opacity-50 order-first w-full justify-start px-3 pt-3", new: "text-muted-foreground flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-body font-medium leading-5 select-none group-data-[disabled=true]/input-group:opacity-50 order-first w-full justify-start px-3 pt-3" },
    { file: "InputGroupAddon align=block-end", tag: "div", old: "text-muted-foreground flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium select-none group-data-[disabled=true]/input-group:opacity-50 order-last w-full justify-start px-3 pb-3", new: "text-muted-foreground flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-body font-medium leading-5 select-none group-data-[disabled=true]/input-group:opacity-50 order-last w-full justify-start px-3 pb-3" },
    { file: "InputGroupButton size=xs", tag: "button", old: "text-sm shadow-none flex min-w-0 gap-2 items-center h-6 gap-1 px-2 rounded-md has-[>svg]:px-2", new: "text-body leading-5 shadow-none flex min-w-0 gap-2 items-center h-6 gap-1 px-2 rounded-md has-[>svg]:px-2" },
    { file: "InputGroupButton size=sm", tag: "button", old: "text-sm shadow-none flex min-w-0 gap-2 items-center h-8 px-2.5 gap-1.5 rounded-md has-[>svg]:px-2.5", new: "text-body leading-5 shadow-none flex min-w-0 gap-2 items-center h-8 px-2.5 gap-1.5 rounded-md has-[>svg]:px-2.5" },
    { file: "InputGroupButton size=icon-xs", tag: "button", old: "text-sm shadow-none flex min-w-0 gap-2 items-center size-6 rounded-md p-0 has-[>svg]:p-0", new: "text-body leading-5 shadow-none flex min-w-0 gap-2 items-center size-6 rounded-md p-0 has-[>svg]:p-0" },
    { file: "InputGroupButton size=icon-sm", tag: "button", old: "text-sm shadow-none flex min-w-0 gap-2 items-center size-8 rounded-md p-0 has-[>svg]:p-0", new: "text-body leading-5 shadow-none flex min-w-0 gap-2 items-center size-8 rounded-md p-0 has-[>svg]:p-0" },
    { file: "ChatInput.tsx (compact textarea)", tag: "textarea", old: "text-sm leading-5 md:text-sm", new: "text-body leading-5 md:text-body md:leading-5" },
    { file: "MentionDropdown.stories.tsx (sent bubble)", tag: "div", old: "max-w-full whitespace-pre-wrap rounded-3xl bg-surface-hover px-4 py-2.5 text-base leading-8 text-foreground-strong", new: "max-w-full whitespace-pre-wrap rounded-3xl bg-surface-hover px-4 py-2.5 text-body-lg leading-8 text-foreground-strong" },
    { file: "MentionDropdown.stories.tsx (attachment chip)", tag: "span", old: "rounded-lg bg-surface-hover px-2 py-1 text-sm", text: { variant: "body-tight", className: "rounded-lg bg-surface-hover px-2 py-1 text-foreground" } },
  ],
  7: [],
};

// Both sides go through cn() (tailwind-merge with the role sizes registered),
// as the components merge a cva base with its variant and a caller className.
const list = (PAIRS[pr] || []).map((p) => ({ file: p.file, old: `${p.tag}|${cn(p.old)}`, new: `${p.tag}|${p.text ? text(p.text) : cn(p.new)}` }));
writeFileSync(out, JSON.stringify(list, null, 1));
console.log(`PR${pr}: ${list.length} pairs`);
