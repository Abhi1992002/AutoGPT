// The markup_eq cases for #16099's structural <Text> moves: each element as
// dev (the PR's base) renders it and as this head renders it, inside its real
// ancestors. Head class strings come from the real cn(), Text variants and
// Button cva at head; dev's from the same cva/cn over dev's class strings
// (the Button and legacy Button helpers are unchanged in this PR).
//   npx tsx gen_markup_cases.mts <out.json>   (cwd: the head's frontend)
import { writeFileSync } from "node:fs";
import { join } from "node:path";
const D = process.cwd();
const { cn } = await import(join(D, "src/lib/utils.ts"));
const { variants, tones } = await import(join(D, "src/components/atoms/Text/helpers.ts"));
const { extendedButtonVariants } = await import(join(D, "src/components/atoms/Button/helpers.ts"));
const { buttonVariants } = await import(join(D, "src/components/__legacy__/ui/button.tsx"));
const T = (v: string, tone?: string, cls?: string) => cn(variants[v], tone ? tones[tone] : undefined, cls);
const tag = (t: string, cls: string, inner: string, root = false, attrs = "") => `<${t}${root ? " data-eq-root" : ""}${cls ? ` class="${cls}"` : ""}${attrs}>${inner}</${t}>`;
const atomBtn = (o: { variant?: string; size?: string; className?: string }) => cn(extendedButtonVariants(o));
const ICON = (cls: string) => `<svg width="1em" height="1em" viewBox="0 0 24 24" class="${cls}"><path d="M2 2h20v20H2z"/></svg>`;
const BODY = (x: string) => `<div class="bg-canvas font-sans text-foreground">${x}</div>`;
const cases: { name: string; where: string; ctx: string; old: string; new: string }[] = [];
const add = (name: string, where: string, ctx: string, o: string, n: string) => cases.push({ name, where, ctx, old: o, new: n });
const lbl = (x: string) => `<span data-slot="button-label" class="contents">${x}</span>`;

// 1. BuilderChatPanel error state
add("chat error: title, copy, Retry", "BuilderChatPanel.tsx:84", BODY(`<div class="flex h-[400px] w-[360px] flex-col">{X}</div>`),
  tag("div", "flex flex-1 flex-col items-center justify-center gap-3 px-4 py-6 text-center text-sm text-slate-600", tag("p", "font-medium text-slate-800", "Something failed") + tag("p", "text-slate-500", "Something went wrong. Retry to try again.") + tag("button", "rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400", "Retry", false, ' type="button"'), true),
  tag("div", T("body-tight", undefined, "flex flex-1 flex-col items-center justify-center gap-3 px-4 py-6 text-center text-slate-600"), tag("p", T("body-medium-tight", undefined, "text-slate-800"), "Something failed") + tag("p", T("body-tight", undefined, "text-slate-500"), "Something went wrong. Retry to try again.") + tag("button", "rounded-md border border-slate-300 bg-surface px-3 py-1.5 text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400", tag("span", T("body-medium-tight", "inherit"), "Retry"), false, ' type="button"'), true));

// 2-4. MCPToolDialog manual credential
const dlg = (x: string) => BODY(`<div class="w-[512px] bg-surface p-6"><div class="flex flex-col gap-4 py-2">${x}</div></div>`);
add("MCP: enter a credential manually", "MCPToolDialog.tsx:433", dlg("{X}"),
  tag("button", "text-xs text-gray-500 underline hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200", "or enter an API credential manually", true),
  tag("button", "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200", tag("span", T("small-tight-underline", "inherit", "block"), "or enter an API credential manually"), true));
const selOld = `<select class="h-10 rounded-md border border-input bg-background px-3 text-sm"><option>API token (Bearer)</option></select>`;
const selNew = `<select class="h-10 rounded-md border border-input bg-background px-3 text-body leading-5"><option>API token (Bearer)</option></select>`;
add("MCP: auth scheme label (MCPAuthSchemeField)", "MCPToolDialog.tsx:446", dlg(`<div class="flex flex-col gap-2">{X}</div>`),
  tag("div", "flex flex-col gap-2", tag("label", "text-sm font-medium", "Authentication type") + selOld, true),
  tag("div", "flex flex-col gap-2", tag("label", T("body-medium-tight", "inherit"), "Authentication type") + selNew, true));
const legacyLabel = "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";
add("MCP: token label (legacy Label kept)", "MCPToolDialog.tsx:461", dlg(`<div class="flex flex-col gap-2">{X}<input class="h-10"></div>`),
  tag("label", cn(legacyLabel, "text-sm"), "API token", true),
  tag("label", cn(legacyLabel), tag("span", T("body-medium-tight", "inherit"), "API token"), true));

// 5-6. MCP tool card: parameter table and the details toggle
const card = "group flex flex-col rounded-lg border text-left transition-colors border-gray-200 hover:border-gray-300 hover:bg-gray-50";
const cardCtx = (x: string) => BODY(`<div class="w-[480px]"><div class="flex flex-col gap-2 pr-3"><button class="${card}">${x}</button></div></div>`);
const rows = (tdName: (n: string, req: boolean) => string) => ["query", "limit"].map((n, i) => tag("tr", "border-b border-gray-50 last:border-0", tdName(n, i === 0) + tag("td", "px-2 py-1 text-gray-500", "string") + tag("td", "max-w-[200px] truncate px-2 py-1 text-gray-500", "The search query to run against the index, which is long"))).join("");
const star = tag("span", "ml-0.5 text-red-400", "*");
const boxCls = "mx-3 mb-2 rounded border border-gray-100 bg-gray-50/50 dark:border-slate-700 dark:bg-slate-800/50";
const head = (f: (c: string) => string) => tag("thead", "", tag("tr", "border-b border-gray-100", ["Parameter", "Type", "Description"].map(f).join("")));
add("MCP: parameter table", "MCPToolDialog.tsx:685", cardCtx("{X}"),
  tag("div", boxCls, tag("table", "w-full text-xs", head((c) => tag("th", "px-2 py-1 text-left font-medium text-gray-500", c)) + tag("tbody", "", rows((n, r) => tag("td", "px-2 py-1 font-mono text-[11px] text-gray-700", n + (r ? star : ""))))), true),
  tag("div", T("small-tight", "inherit", boxCls), tag("table", "w-full", head((c) => tag("th", "px-2 py-1 text-left text-gray-500", tag("span", T("small-medium-tight", "inherit"), c))) + tag("tbody", "", rows((n, r) => tag("td", "px-2 py-1 text-gray-700", tag("span", T("caption-sm-mono-inherit", "inherit", "block"), n + (r ? star : "")))))), true));
const tgl = "flex w-full items-center justify-center gap-1 border-t border-gray-100 py-1.5";
const tglC = "text-gray-400 hover:text-gray-600 dark:border-slate-700 dark:text-gray-500 dark:hover:text-gray-300";
add("MCP: show details toggle", "MCPToolDialog.tsx:775", cardCtx("{X}"),
  tag("button", `${tgl} text-[10px] ${tglC}`, "Show details" + ICON("h-3 w-3 transition-transform"), true, ' type="button"'),
  tag("button", `${tgl} ${tglC}`, tag("span", T("tiny-inherit", "inherit"), "Show details") + ICON("h-3 w-3 transition-transform"), true, ' type="button"'));

// 7-8. Atom Buttons whose type override moved onto <Text>
for (const compatible of [true, false]) {
  const extraOld = compatible ? "" : "border-amber-500 text-amber-600 hover:bg-amber-50";
  const extraNew = compatible ? "" : "border-warning text-amber-600 hover:bg-warning-surface";
  add(`SubAgentUpdate: Update (${compatible ? "compatible" : "incompatible"})`, "SubAgentUpdateFeature.tsx:128", BODY(`<div class="flex items-center justify-between gap-2 px-4 py-2">{X}</div>`),
    tag("button", atomBtn({ variant: compatible ? "primary" : "outline", size: "small", className: cn("h-7 text-xs", extraOld) }), lbl("Update"), true),
    tag("button", atomBtn({ variant: compatible ? "primary" : "outline", size: "small", className: cn("h-7", extraNew) }), lbl(tag("span", T("small-medium-tight", "inherit"), "Update")), true));
}
add("ViewMoreData: View More", "ViewMoreData.tsx:60", BODY(`<div class="flex items-center gap-2">{X}</div>`),
  tag("button", atomBtn({ variant: "secondary", size: "small", className: "h-fit w-fit min-w-0 !text-xs" }), lbl("View More"), true),
  tag("button", atomBtn({ variant: "secondary", size: "small", className: "h-fit w-fit min-w-0" }), lbl(tag("span", T("small-medium-tight", "inherit"), "View More")), true));
for (const [name, where, copy] of [["RunInputDialog: Manual Run", "RunInputDialog.tsx:148", "Manual Run"], ["RunInputDialog: Schedule Run", "RunInputDialog.tsx:165", "Schedule Run"]]) {
  const b = atomBtn({ variant: "primary", size: "large", className: "group h-fit min-w-0 gap-2 px-10" });
  add(name, where, BODY(`<div class="flex flex-col items-end justify-start">{X}</div>`),
    tag("button", b, ICON("size-5 transition-transform group-hover:scale-110") + lbl(tag("span", "font-semibold", copy)), true),
    tag("button", b, ICON("size-5 transition-transform group-hover:scale-110") + lbl(tag("span", T("body-semibold-tight", "inherit"), copy)), true));
}
// AllBlocksContent and IntegrationBlocks use the legacy Button, whose link
// variant only underlines on hover; FilterSheet uses the atom's, which always
// underlines. The atom wraps children in a display:contents label span.
const atomLink = (c: string) => cn(extendedButtonVariants({ variant: "link", className: c }));
const legacyLink = (c: string) => cn(buttonVariants({ variant: "link", className: c }));
for (const [name, where, mk, wrap, o, n, copy] of [
  ["Block menu: see all (legacy Button)", "AllBlocksContent.tsx:108", legacyLink, false, "px-0 font-sans text-sm leading-[1.375rem] text-zinc-600 underline hover:text-zinc-800", "px-0 text-foreground-secondary underline hover:text-foreground-emphasis", "see all"],
  ["FilterSheet: More/Less (atom Button)", "FilterSheet.tsx:131", atomLink, true, "m-0 p-0 font-sans text-sm font-medium leading-[1.375rem] text-zinc-800 underline hover:text-zinc-600", "m-0 p-0 text-foreground-emphasis hover:text-foreground-secondary", "More"],
  ["IntegrationBlocks: Integrations (legacy Button)", "IntegrationBlocks.tsx:80", legacyLink, false, "p-0 font-sans text-sm font-medium leading-[1.375rem] text-zinc-800", "p-0 text-foreground-emphasis", "Integrations"],
] as [string, string, (c: string) => string, boolean, string, string, string][]) add(name, where, BODY(`<div class="flex w-[360px] items-center justify-between gap-1">{X}<span>/</span></div>`),
  tag("button", mk(o), wrap ? lbl(copy) : copy, true),
  tag("button", mk(n), wrap ? lbl(tag("span", T("body-medium", "inherit"), copy)) : tag("span", T("body-medium", "inherit"), copy), true));

// 9. AgentOutputs sheet header and group labels
const sheetTitle = "text-lg font-semibold text-neutral-950 dark:text-neutral-50";
const sheetDescOld = "text-body leading-5 text-neutral-500 dark:text-neutral-400";
const hdr = (x: string) => BODY(`<div class="w-[600px]"><div class="flex flex-col space-y-2 text-center sm:text-left px-2 py-2"><div class="flex items-center justify-between">${x}</div></div></div>`);
add("AgentOutputs: sheet title and description", "AgentOutputs.tsx:115", hdr("{X}"),
  tag("div", "", tag("h2", cn(sheetTitle, "text-xl"), "Run Outputs") + tag("p", cn(sheetDescOld, "mt-1 text-sm text-muted-foreground"), tag("span", "inline-flex items-center gap-1.5", tag("span", "rounded-md bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", "Beta") + "<span>This feature is in beta and may contain bugs</span>")), true),
  tag("div", "", tag("h2", cn(sheetTitle), tag("span", T("lead-semibold", "inherit", "block"), "Run Outputs")) + tag("p", cn(sheetDescOld, "mt-1 text-muted-foreground"), tag("span", "inline-flex items-center gap-1.5", tag("span", T("small-medium-tight", undefined, "rounded-md bg-yellow-100 px-2 py-0.5 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"), "Beta") + tag("span", T("body-tight", "inherit"), "This feature is in beta and may contain bugs"))), true));
add("AgentOutputs: output group name and description (legacy Label kept)", "AgentOutputs.tsx:150/162", BODY(`<div class="w-[560px] space-y-2">{X}</div>`),
  tag("div", "", tag("label", cn(legacyLabel, "text-base font-semibold"), "Unnamed Output") + tag("label", cn(legacyLabel, "mt-1 block text-sm text-gray-600"), "What this output holds"), true),
  tag("div", "", tag("label", cn(legacyLabel), tag("span", T("large-semibold-tight", "inherit"), "Unnamed Output")) + tag("label", cn(legacyLabel, "mt-1 block text-gray-600"), tag("span", T("body-medium-tight", "inherit"), "What this output holds")), true));

// 10. Tooltips (TooltipContent's own classes are unchanged by this PR)
const tip = "z-50 max-w-xs overflow-hidden rounded-md bg-action-hover px-3 py-1.5 text-caption font-normal leading-normal text-surface-muted";
const tipCtx = (cls: string) => BODY(`<div class="${cn(tip, cls)}">{X}</div>`);
const inc = (wrap: string, s: (x: string) => string, c: (x: string) => string) => tag("div", wrap, tag("div", "mb-1", s("Missing inputs: ") + c("query") + ", " + c("limit")) + tag("div", "mb-1", s("Type changed: ") + c("count") + " (number → string)"));
add("ResolutionModeBar: tooltip title and list", "ResolutionModeBar.tsx:27-131", tipCtx("max-w-sm"),
  tag("div", "", tag("p", "mb-2 font-semibold", "Incompatible changes:") + inc("text-xs", (x) => tag("span", "font-semibold", x), (x) => tag("code", "font-mono", x)) + tag("p", "mt-2 text-xs text-gray-400", "Delete the red connections to continue"), true),
  tag("div", "", tag("p", T("small-semibold-lh-normal", "inherit", "mb-2"), "Incompatible changes:") + inc(T("small-tight", "inherit"), (x) => tag("span", T("small-semibold-tight", "inherit"), x), (x) => tag("code", T("small-mono-tight", "inherit"), x)) + tag("p", T("small-tight", undefined, "mt-2 text-gray-400"), "Delete the red connections to continue"), true));
add("SubAgentUpdate: tooltip title", "SubAgentUpdateFeature.tsx:111", tipCtx("max-w-xs"),
  tag("div", "", tag("p", "font-medium", "Incompatible changes detected") + tag("p", "text-xs text-gray-400", "Click Update to see details"), true),
  tag("div", "", tag("p", T("small-medium-lh-normal", "inherit"), "Incompatible changes detected") + tag("p", T("small-tight", undefined, "text-gray-400"), "Click Update to see details"), true));
add("Safe mode: tooltip title", "FloatingSafeModeToogle.tsx:74", tipCtx(""),
  tag("div", "text-center", tag("div", "font-medium", "Safe mode: ON") + tag("div", "mt-1 text-xs text-muted-foreground", "Blocks that change data ask first"), true),
  tag("div", "text-center", tag("div", T("small-medium-lh-normal", "inherit"), "Safe mode: ON") + tag("div", T("small-tight", undefined, "mt-1 text-muted-foreground"), "Blocks that change data ask first"), true));

// 11. Inline emphasis whose parent sets the type
add("NodeDataViewer: pin name", "NodeDataViewer.tsx:151/184", BODY(`<div class="w-[400px]">{X}</div>`),
  tag("div", "text-sm text-gray-600", tag("div", "", "Pin: " + tag("span", "font-semibold", "Result Value")) + tag("div", "mt-2", "Pin: " + tag("span", "font-semibold", "Result Value")), true),
  tag("div", T("body-tight", undefined, "text-gray-600"), tag("div", "", "Pin: " + tag("span", T("body-semibold-tight", "inherit"), "Result Value")) + tag("div", "mt-2", "Pin: " + tag("span", T("body-semibold-tight", "inherit"), "Result Value")), true));
const sec = "rounded-md border border-gray-200 p-3 dark:border-gray-700";
add("IncompatibleUpdateDialog: section titles", "IncompatibleUpdateDialog.tsx:192/308", BODY(`<div class="w-[560px] bg-surface p-6"><div class="space-y-4">{X}</div></div>`),
  tag("div", "", tag("div", sec, tag("span", "font-medium", "Input Changes") + tag("div", "mt-2", "body")) + tag("div", sec, tag("div", "flex items-center gap-2", ICON("h-4 w-4") + tag("span", "font-medium", "New required inputs"))), true),
  tag("div", "", tag("div", sec, tag("span", T("large-medium-tight", "inherit"), "Input Changes") + tag("div", "mt-2", "body")) + tag("div", sec, tag("div", "flex items-center gap-2", ICON("h-4 w-4") + tag("span", T("large-medium-tight", "inherit"), "New required inputs"))), true));
const metaOld = tag("div", "flex flex-1 flex-col items-start gap-0.5", tag("span", "line-clamp-1 font-sans text-sm font-medium leading-[1.375rem] text-zinc-800", "Agent title") + tag("div", "flex items-center space-x-2.5", tag("span", "truncate font-sans text-xs font-normal leading-5 text-zinc-500", "By someone") + tag("span", "font-sans text-zinc-400", "•") + tag("span", "truncate font-sans text-xs font-normal leading-5 text-zinc-500", "12 runs")));
const metaNew = tag("div", "flex flex-1 flex-col items-start gap-0.5", tag("span", T("body-medium", "emphasis", "line-clamp-1"), "Agent title") + tag("div", "flex items-center space-x-2.5", tag("span", T("small-loose", "muted", "truncate"), "By someone") + tag("span", T("body-medium-tight", "subtle"), "•") + tag("span", T("small-loose", "muted", "truncate"), "12 runs")));
const lb = (bg: string) => cn(buttonVariants({}), `group flex h-[4.375rem] w-full min-w-[7.5rem] items-center justify-start gap-3 whitespace-normal rounded-[0.75rem] ${bg} p-[0.625rem] pr-[0.875rem] text-start shadow-none`);
add("Block menu: • separators", "MarketplaceAgentBlock.tsx:89/101, UGCAgentBlock.tsx:87", BODY(`<div class="w-[400px]">{X}</div>`),
  tag("button", lb("bg-zinc-50"), metaOld, true),
  tag("button", lb("bg-surface-muted"), metaNew, true));
// 13. Links and the search match: decoration stays on the owning element, the
// copy moves into a <Text> matching the sentence around it. NodeCost's flex
// rows lose type that styles no text of their own. Dev's own Text variants.
const devV = (await import("/home/vercel-sandbox/wt-base/autogpt_platform/frontend/src/components/atoms/Text/helpers.ts")).variants;
const Tdev = (v: string, cls?: string) => cn(devV[v], cls);
add("NoModelNotice: setup guide link", "NoModelNotice.tsx:27", BODY(`<div class="flex w-[360px] flex-1 items-center justify-center px-4 py-6">{X}</div>`),
  tag("div", "flex w-full items-start gap-2 rounded-2xl bg-amber-50 px-3 py-2 text-left text-sm text-amber-900", ICON("mt-0.5 h-4 w-4 shrink-0") + tag("span", "min-w-0 flex-1", "No AI model is connected, so the builder chat can't answer yet. Whoever runs this server can add a model API key or a local model " + tag("a", "font-medium underline underline-offset-2", "(setup guide)", false, ' href="#"') + "."), true),
  tag("div", T("body-tight", undefined, "flex w-full items-start gap-2 rounded-2xl bg-warning-surface px-3 py-2 text-left text-amber-900"), ICON("mt-0.5 h-4 w-4 shrink-0") + tag("span", "min-w-0 flex-1", "No AI model is connected, so the builder chat can't answer yet. Whoever runs this server can add a model API key or a local model " + tag("a", "underline underline-offset-2", tag("span", T("body-medium-tight", "inherit"), "(setup guide)"), false, ' href="#"') + "."), true));
add("CronSchedulerDialog: set your timezone", "CronSchedulerDialog.tsx:81", BODY(`<div class="w-[420px]"><div class="flex items-center gap-2">{X}</div></div>`),
  tag("p", Tdev("body", "text-amber-800"), "No timezone set. Schedule will run in UTC." + tag("a", "ml-1 underline", "Set your timezone", false, ' href="#"'), true),
  tag("p", T("body", undefined, "text-amber-800"), "No timezone set. Schedule will run in UTC." + tag("a", "ml-1 underline", tag("span", T("body", "inherit"), "Set your timezone"), false, ' href="#"'), true));
const alertCls = "relative w-full rounded-lg border border-border-base px-4 py-3 text-body leading-5 bg-surface text-foreground-emphasis absolute bottom-4 left-1/2 z-20 w-auto -translate-x-1/2 select-none rounded-xlarge";
add("TriggerAgentBanner: Workflow Library link", "TriggerAgentBanner.tsx:37", BODY(`<div class="relative h-[200px] w-[900px]"><div class="${alertCls}"><h5 class="mb-1 font-medium leading-none tracking-tight">You are building a Trigger Workflow</h5>{X}</div></div>`),
  tag("div", "text-body leading-5 [&_p]:leading-relaxed", "Your workflow will listen for its trigger and will run when the time is right.<br>You can view its activity in your " + tag("a", "underline", "Workflow Library", false, ' href="#"') + ".", true),
  tag("div", "text-body leading-5 [&_p]:leading-relaxed", "Your workflow will listen for its trigger and will run when the time is right.<br>You can view its activity in your " + tag("a", "underline", tag("span", T("body-tight", "inherit"), "Workflow Library"), false, ' href="#"') + ".", true));
add("WebhookDisclaimer: Workflow Library link", "WebhookDisclaimer.tsx:37", BODY(`<div class="w-[300px] px-4 pt-4"><div class="relative w-full rounded-lg border border-border-base px-4 py-3 text-body leading-5 bg-surface text-foreground-emphasis mb-3 rounded-xlarge"><div class="text-body leading-5 [&_p]:leading-relaxed">{X}</div></div></div>`),
  tag("p", Tdev("small-medium"), "You can set up and manage this trigger in your " + tag("a", "underline", "Workflow Library", false, ' href="#"') + " (after saving the workflow).", true),
  tag("p", T("small-medium"), "You can set up and manage this trigger in your " + tag("a", "underline", tag("span", T("small-medium-inherit", "inherit"), "Workflow Library"), false, ' href="#"') + " (after saving the workflow).", true));
const nodeHead = (x: string) => BODY(`<div class="flex w-[350px] items-center justify-between rounded-t-xl bg-surface p-4">${x}</div>`);
add("NodeCost: free row", "NodeCost.tsx:133", nodeHead("{X}"),
  tag("div", "mr-3 flex items-center gap-1 text-base font-light", ICON("h-3 w-3") + tag("p", Tdev("small", "!font-medium"), "Free"), true),
  tag("div", "mr-3 flex items-center gap-1", ICON("h-3 w-3") + tag("p", T("small-medium"), "Free"), true));
add("NodeCost: amount and suffix row", "NodeCost.tsx:168", nodeHead("{X}"),
  tag("div", "mr-3 flex items-center gap-1 text-base font-light", ICON("h-3 w-3") + tag("p", Tdev("small", "!font-medium"), "12") + tag("p", Tdev("small"), " /run"), true),
  tag("div", "mr-3 flex items-center gap-1", ICON("h-3 w-3") + tag("p", T("small-medium"), "12") + tag("p", T("small"), " /run"), true));
const matchOld = (c: string) => `Calcu${tag("mark", "bg-transparent font-bold", "lat")}or ${c}`;
const matchNew = (v: string, c: string) => `Calcu${tag("mark", "bg-transparent", tag("span", T(v, "inherit"), "lat"))}or ${c}`;
add("Block menu: search match in a title and a description", "helpers.tsx:22 (Block, IntergrationBlock, MarketplaceAgentBlock, UGCAgentBlock)", BODY(`<div class="w-[400px]"><div class="flex flex-1 flex-col items-start gap-0.5">{X}</div></div>`),
  tag("div", "", tag("span", "line-clamp-1 font-sans text-sm font-medium leading-[1.375rem] text-zinc-800", matchOld("block")) + tag("span", "line-clamp-1 font-sans text-xs font-normal leading-5 text-zinc-500", matchOld("adds two numbers")), true),
  tag("div", "", tag("span", T("body-medium", "emphasis", "line-clamp-1"), matchNew("body-bold", "block")) + tag("span", T("small-loose", "muted", "line-clamp-1"), matchNew("small-bold-loose", "adds two numbers")), true));
writeFileSync(process.argv[2], JSON.stringify(cases, null, 1));
console.log(cases.length, "cases");
