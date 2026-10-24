/**
 * Equivalence check for SECRT-3113 (ai-elements token pass). Uncommitted.
 *
 *   npx tsx .ign-harness/check-ai-elements.ts <base frontend dir> <head frontend dir> <out.md>
 *
 * Every class string the PR writes is rendered inside the DOM that really
 * receives it (Streamdown's own th/td/code classes included, the composer's
 * send-button merges included). Old strings compile against the base
 * tailwind.config.ts + globals.css, new strings against the head's. Every
 * computed property of every node is compared, in parents at leading-[1.5],
 * leading-[30px], leading-normal and inside the profile-tabs panel, at 1280px
 * and 390px, as written and through cn(), at rest and with hover.
 */
import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { cn } from "../src/lib/utils";
import { buttonVariants } from "../src/components/ui/button";

const localRequire = createRequire(join(process.cwd(), "package.json"));
const postcss = localRequire("postcss");
const tailwindcss = localRequire("tailwindcss");
const loadConfig = localRequire("tailwindcss/loadConfig");

const [baseDir, headDir, outFile] = process.argv.slice(2);

// ---- the strings, old (dev) and new (head) ----
const RESPONSE_OLD = [
  "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_pre]:!bg-white",
  "[&_a]:text-blue-500 [&_a]:no-underline hover:[&_a]:underline",
  "[&_table]:w-full [&_table]:border-separate [&_table]:border-spacing-0 [&_table]:border-0 [&_table]:text-[13px] [&_table]:tabular-nums",
  "[&_tbody]:bg-transparent [&_thead]:bg-message-table-header",
  "[&_th]:h-9 [&_th]:whitespace-nowrap [&_th]:border-b [&_th]:border-zinc-200 [&_th]:px-4 [&_th]:py-0 [&_th]:text-left [&_th]:text-[11px] [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-[0.06em] [&_th]:text-indigo-950/70",
  "[&_th:first-child]:text-shadow-message-table-violet [&_th:last-child]:text-shadow-message-table-blue [&_th]:text-shadow-message-table-indigo",
  "[&_td]:border-b [&_td]:border-zinc-100 [&_td]:px-4 [&_td]:py-2 [&_td]:align-top [&_td]:text-[13px] [&_td]:leading-5 [&_td]:text-zinc-700 [&_td]:transition-colors",
  "[&_td_strong]:font-medium [&_td_strong]:text-zinc-950",
  "[&_td_code]:whitespace-nowrap [&_td_code]:rounded [&_td_code]:bg-zinc-100 [&_td_code]:px-1 [&_td_code]:py-px [&_td_code]:text-[12px] [&_td_code]:text-zinc-700",
  "[&_tbody_tr:last-child_td]:border-b-0",
  "[&_tbody_tr:hover_td]:bg-zinc-50",
];
const RESPONSE_NEW = [
  "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_pre]:!bg-surface",
  "[&_a]:text-info [&_a]:no-underline hover:[&_a]:underline",
  "[&_table]:w-full [&_table]:border-separate [&_table]:border-spacing-0 [&_table]:border-0 [&_table]:text-body-sm [&_table]:tabular-nums [&_table]:leading-inherit",
  "[&_tbody]:bg-transparent [&_thead]:bg-message-table-header",
  "[&_th]:h-9 [&_th]:whitespace-nowrap [&_th]:border-b [&_th]:border-border-base [&_th]:px-4 [&_th]:py-0 [&_th]:text-left [&_th]:text-[11px] [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-eyebrow [&_th]:text-indigo-950/70",
  "[&_th:first-child]:text-shadow-message-table-violet [&_th:last-child]:text-shadow-message-table-blue [&_th]:text-shadow-message-table-indigo",
  "[&_td]:border-b [&_td]:border-separator [&_td]:px-4 [&_td]:py-2 [&_td]:align-top [&_td]:text-[13px] [&_td]:leading-5 [&_td]:text-foreground-body [&_td]:transition-colors",
  "[&_td_strong]:font-medium [&_td_strong]:text-foreground",
  "[&_td_code]:whitespace-nowrap [&_td_code]:rounded [&_td_code]:bg-surface-hover [&_td_code]:px-1 [&_td_code]:py-px [&_td_code]:text-[12px] [&_td_code]:text-foreground-body",
  "[&_tbody_tr:last-child_td]:border-b-0",
  "[&_tbody_tr:hover_td]:bg-surface-muted",
];
const TABLE_OLD =
  "my-4 max-w-full overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-message-table";
const TABLE_NEW =
  "my-4 max-w-full overflow-x-auto rounded-xl border border-border-base bg-surface shadow-message-table";
const SCROLL_OLD =
  "overscroll-y-contain scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-300";
const SCROLL_NEW =
  "overscroll-y-contain scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border-strong";
const SUBMIT_OLD =
  "size-[2.625rem] rounded-full border-zinc-800 bg-zinc-800 text-white hover:border-zinc-900 hover:bg-zinc-900 disabled:border-zinc-200 disabled:bg-zinc-200 disabled:text-white disabled:opacity-100";
const SUBMIT_NEW =
  "size-[2.625rem] rounded-full border-action bg-action text-action-foreground hover:border-action-hover hover:bg-action-hover disabled:border-border-base disabled:bg-surface-active disabled:text-action-foreground disabled:opacity-100";

// Negative controls: the codemod's own output for th / td code, which drops
// the 20px line-height Streamdown's `text-sm` gives those cells.
const RESPONSE_CONTROL = RESPONSE_NEW.map((s) =>
  s
    .replace(
      "[&_th]:text-[11px]",
      "[&_th]:text-caption-sm [&_th]:leading-inherit",
    )
    .replace(
      "[&_td_code]:text-[12px]",
      "[&_td_code]:text-caption [&_td_code]:leading-inherit",
    ),
);
// The first push of this PR: token sizes on th/td/td code, which Streamdown's
// own tailwind-merge drops (it reads them as colours).
const RESPONSE_CONTROL_2 = RESPONSE_NEW.map((s) =>
  s
    .replace("[&_th]:text-[11px]", "[&_th]:text-caption-sm [&_th]:leading-5")
    .replace("[&_td]:text-[13px]", "[&_td]:text-body-sm")
    .replace(
      "[&_td_code]:text-[12px]",
      "[&_td_code]:text-caption [&_td_code]:leading-5",
    ),
);
// Streamdown's root: twMerge(clsx("space-y-4 whitespace-normal *:first:mt-0
// *:last:mb-0", className)) with its own tailwind-merge (3.4.0, default
// config), from node_modules/streamdown/dist/chunk-5FQGJX7Z.js.
const sdRequire = createRequire(
  join(
    realpathSync(join(process.cwd(), "node_modules/streamdown")),
    "package.json",
  ),
);
const sdTwMerge = sdRequire("tailwind-merge").twMerge as (
  ...c: string[]
) => string;
const SD_ROOT = "space-y-4 whitespace-normal *:first:mt-0 *:last:mb-0";
const sd = (xs: string[]) => sdTwMerge(SD_ROOT, cn(...xs));

function assertIn(file: string, strings: string[]) {
  const src = readFileSync(file, "utf8");
  for (const s of strings)
    if (!src.includes(s)) throw new Error(`not in ${file}: ${s}`);
}
const AE = "src/components/ai-elements";
assertIn(join(baseDir, AE, "message.tsx"), [...RESPONSE_OLD, TABLE_OLD]);
assertIn(join(headDir, AE, "message.tsx"), [...RESPONSE_NEW, TABLE_NEW]);
assertIn(join(baseDir, AE, "conversation.tsx"), [SCROLL_OLD]);
assertIn(join(headDir, AE, "conversation.tsx"), [SCROLL_NEW]);
assertIn(join(baseDir, AE, "prompt-input.tsx"), [SUBMIT_OLD]);
assertIn(join(headDir, AE, "prompt-input.tsx"), [SUBMIT_NEW]);

// ---- the DOM each string lands on (Streamdown 's own classes copied from
// node_modules/streamdown/dist/chunk-5FQGJX7Z.js) ----
const TH = "whitespace-nowrap px-4 py-2 text-left font-semibold text-sm";
const TD = "px-4 py-2 text-sm";
const CODE = "rounded bg-muted px-1.5 py-0.5 font-mono text-sm";
function cell(text: string) {
  return `<td data-n class="${TD}" data-streamdown="table-cell">${text} <strong data-n>strong</strong> <span data-n class="font-semibold" data-streamdown="strong">semi</span> <code data-n class="${CODE}" data-streamdown="inline-code">code_x</code> <a data-n href="#x">link</a></td>`;
}
function responseHtml(wrap: string, table: string, wrapped: boolean) {
  const t = `<div data-n class="${table}"><table data-n><thead data-n class="bg-muted/80" data-streamdown="table-header"><tr data-n class="border-border border-b" data-streamdown="table-row"><th data-n class="${TH}" data-streamdown="table-header-cell">Name</th><th data-n class="${TH}">Status</th><th data-n class="${TH}">Cost</th></tr></thead><tbody data-n class="divide-y divide-border bg-muted/40" data-streamdown="table-body"><tr data-n id="row1" class="border-border border-b">${cell("a")}${cell("b")}${cell("1.20")}</tr><tr data-n class="border-border border-b">${cell("c")}${cell("d")}${cell("3.60")}</tr></tbody></table></div>`;
  return `<div data-n class="${wrap}"><p data-n>Para <a data-n href="#y">a link</a> <strong data-n>b</strong> <code data-n class="${CODE}">c</code></p><pre data-n>pre</pre>${wrapped ? `<div data-n data-streamdown="table-wrapper">${t}</div>` : t}<p data-n>last</p></div>`;
}
const BTN_IG =
  "text-sm shadow-none flex min-w-0 gap-2 items-center size-8 rounded-md p-0 has-[>svg]:p-0";
function submitClass(own: string, caller?: string) {
  return cn(
    buttonVariants({
      variant: "default",
      className: cn(BTN_IG, cn(own, caller)),
    }),
  );
}
function buttonHtml(cls: string, disabled: boolean, label?: string) {
  return `<button data-n id="btn" class="${cls}"${disabled ? " disabled" : ""}>${label ?? `<svg data-n class="size-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 4v16"/></svg>`}</button>`;
}

interface Case {
  label: string;
  oldHtml: string;
  newHtml: string;
  hover?: string[];
  control?: boolean;
  oldClass: string;
  newClass: string;
}
const cases: Case[] = [];
const joinAll = (xs: string[]) => xs.join(" ");
for (const [mode, f] of [
  ["as written", (xs: string[]) => joinAll(xs)],
  ["cn()", (xs: string[]) => cn(...xs)],
  ["cn() then Streamdown's root merge (what renders)", sd],
] as const) {
  for (const wrapped of [false, true]) {
    cases.push({
      label: `MessageResponse + MessageTable, ${mode}${wrapped ? ", inside [data-streamdown=table-wrapper]" : ""}`,
      oldHtml: responseHtml(f(RESPONSE_OLD), TABLE_OLD, wrapped),
      newHtml: responseHtml(f(RESPONSE_NEW), TABLE_NEW, wrapped),
      hover: ["#row1", "a[href='#y']"],
      oldClass: f(RESPONSE_OLD) + " || table: " + TABLE_OLD,
      newClass: f(RESPONSE_NEW) + " || table: " + TABLE_NEW,
    });
  }
  if (mode.startsWith("cn() then")) continue;
  const so = mode === "cn()" ? cn(SCROLL_OLD) : SCROLL_OLD;
  const sn = mode === "cn()" ? cn(SCROLL_NEW) : SCROLL_NEW;
  cases.push({
    label: `ConversationContent scroll, ${mode}`,
    oldHtml: `<div data-n class="${so}" style="height:60px;overflow-y:auto"><div style="height:400px">x</div></div>`,
    newHtml: `<div data-n class="${sn}" style="height:60px;overflow-y:auto"><div style="height:400px">x</div></div>`,
    oldClass: so,
    newClass: sn,
  });
}
cases.push({
  label:
    "NEGATIVE CONTROL 1: codemod output (text-caption-sm/text-caption + leading-inherit) on th / td code, cn() only",
  oldHtml: responseHtml(cn(...RESPONSE_OLD), TABLE_OLD, false),
  newHtml: responseHtml(cn(...RESPONSE_CONTROL), TABLE_NEW, false),
  control: true,
  oldClass: "(as above)",
  newClass:
    "[&_th]:text-caption-sm [&_th]:leading-inherit, [&_td_code]:text-caption [&_td_code]:leading-inherit",
});
cases.push({
  label:
    "NEGATIVE CONTROL 2: token sizes on th / td / td code through Streamdown's root merge",
  oldHtml: responseHtml(sd(RESPONSE_OLD), TABLE_OLD, false),
  newHtml: responseHtml(sd(RESPONSE_CONTROL_2), TABLE_NEW, false),
  control: true,
  oldClass: "(as above)",
  newClass:
    "[&_th]:text-caption-sm [&_th]:leading-5, [&_td]:text-body-sm, [&_td_code]:text-caption [&_td_code]:leading-5",
});
const callers: [string, string | undefined][] = [
  ["no caller class", undefined],
  ["MOBILE_SEND_BUTTON_CLASS", "max-md:size-10"],
  [
    "COMPACT_SEND_BUTTON_CLASS",
    "size-8 rounded-lg border-action-hover bg-action-hover text-action-foreground hover:border-action hover:bg-action disabled:border-border-base disabled:bg-surface-active disabled:text-action-foreground disabled:opacity-100",
  ],
  [
    "CARD_SEND_BUTTON_CLASS",
    "size-9 rounded-full border-transparent bg-zinc-950 text-action-foreground transition-[background-color,transform] hover:border-transparent hover:bg-action active:scale-[0.98] disabled:border-transparent disabled:bg-zinc-950/[0.06] disabled:text-foreground-subtle",
  ],
  [
    "atReset: cn(MOBILE, '!w-auto px-4 font-medium')",
    cn("max-md:size-10", "!w-auto px-4 font-medium"),
  ],
];
for (const [name, caller] of callers) {
  for (const disabled of [false, true]) {
    const o = submitClass(SUBMIT_OLD, caller);
    const n = submitClass(SUBMIT_NEW, caller);
    cases.push({
      label: `PromptInputSubmit (InputGroupButton > Button default) + ${name}${disabled ? ", disabled" : ""}`,
      oldHtml: buttonHtml(
        o,
        disabled,
        name.startsWith("atReset") ? "Send" : undefined,
      ),
      newHtml: buttonHtml(
        n,
        disabled,
        name.startsWith("atReset") ? "Send" : undefined,
      ),
      hover: ["#btn"],
      oldClass: o,
      newClass: n,
    });
  }
}

// ---- MessageContent, ConversationEmptyState, story, composer textarea ----
const MC = (size: string) => [
  `is-user:dark flex w-full min-w-0 max-w-full flex-col gap-2 overflow-hidden ${size}`,
  "group-[.is-user]:w-fit",
  "group-[.is-user]:ml-auto group-[.is-user]:rounded-lg group-[.is-user]:bg-neutral-100 group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-user]:text-neutral-950",
  "group-[.is-assistant]:text-neutral-950",
];
assertIn(join(baseDir, AE, "message.tsx"), [MC("text-sm")[0]]);
assertIn(join(headDir, AE, "message.tsx"), [MC("text-body leading-5")[0]]);
const MR =
  "src/app/(platform)/copilot/components/ChatMessagesContainer/components/MessageRow/helpers.ts";
const MR_STRINGS = [
  "group-[.is-user]:bg-action-hover group-[.is-user]:px-4 group-[.is-user]:py-2.5 group-[.is-user]:text-zinc-50",
  "group-[.is-user]:[&_[data-streamdown=link]]:break-all group-[.is-user]:[&_[data-streamdown=link]]:text-zinc-50 group-[.is-user]:[&_[data-streamdown=link]]:underline group-[.is-user]:[&_code]:bg-surface/10 group-[.is-user]:[&_code]:text-zinc-50",
  "group-[.is-user]:[&_h1]:text-lg group-[.is-user]:[&_h1]:font-semibold group-[.is-user]:[&_h2]:text-lg group-[.is-user]:[&_h2]:font-semibold group-[.is-user]:[&_h3]:text-lg group-[.is-user]:[&_h3]:font-semibold group-[.is-user]:[&_h4]:text-lg group-[.is-user]:[&_h4]:font-semibold group-[.is-user]:[&_h5]:text-lg group-[.is-user]:[&_h5]:font-semibold group-[.is-user]:[&_h6]:text-lg group-[.is-user]:[&_h6]:font-semibold",
  "group-[.is-assistant]:overflow-visible group-[.is-assistant]:bg-transparent group-[.is-assistant]:text-slate-900",
  "text-sm leading-6 group-[.is-user]:rounded-xl",
  "text-body-lg leading-relaxed group-[.is-user]:rounded-3xl",
];
assertIn(join(headDir, MR), MR_STRINGS);
function getMessageContentClassName(compact: boolean) {
  return cn(
    compact ? MR_STRINGS[4] : MR_STRINGS[5],
    MR_STRINGS[0],
    MR_STRINGS[1],
    MR_STRINGS[2],
    MR_STRINGS[3],
  );
}
const mcCallers: [string, string | undefined][] = [
  ["no caller class", undefined],
  ["MessageRow (tool rows)", "group-[.is-assistant]:bg-transparent"],
  [
    "MessageRow getMessageContentClassName(false)",
    getMessageContentClassName(false),
  ],
  [
    "MessageRow getMessageContentClassName(true)",
    getMessageContentClassName(true),
  ],
  ["ChatMessagesContainer status row", "text-body-lg leading-relaxed"],
  [
    "ChatMessagesContainer status row 2",
    "text-body-lg leading-relaxed text-slate-900",
  ],
  [
    "ChatMessagesContainer queued, compact",
    cn(
      "flex flex-col gap-1 border border-dashed border-border-strong bg-surface-hover px-4 py-2.5 text-foreground-strong opacity-60",
      "rounded-xl text-sm leading-6",
    ),
  ],
  [
    "ChatMessagesContainer queued",
    cn(
      "flex flex-col gap-1 border border-dashed border-border-strong bg-surface-hover px-4 py-2.5 text-foreground-strong opacity-60",
      "rounded-3xl text-body-lg leading-relaxed",
    ),
  ],
  [
    "PendingUploadMessage, compact",
    cn(
      "text-sm leading-6 group-[.is-user]:rounded-xl",
      "group-[.is-user]:bg-action-hover group-[.is-user]:px-4 group-[.is-user]:py-2.5 group-[.is-user]:text-zinc-50",
    ),
  ],
  [
    "PendingUploadMessage",
    cn(
      "text-body-lg leading-relaxed group-[.is-user]:rounded-3xl",
      "group-[.is-user]:bg-action-hover group-[.is-user]:px-4 group-[.is-user]:py-2.5 group-[.is-user]:text-zinc-50",
    ),
  ],
  [
    "TourMessageList",
    "text-base leading-relaxed group-[.is-user]:rounded-xl group-[.is-user]:bg-purple-100 group-[.is-user]:px-3 group-[.is-user]:py-2.5 group-[.is-user]:text-slate-900 group-[.is-user]:[border-bottom-right-radius:0] group-[.is-assistant]:bg-transparent group-[.is-assistant]:text-slate-900",
  ],
  [
    "styleguide user",
    "text-body-lg leading-relaxed group-[.is-user]:rounded-xl group-[.is-user]:bg-purple-100 group-[.is-user]:px-3 group-[.is-user]:py-2.5 group-[.is-user]:text-slate-900 group-[.is-user]:[border-bottom-right-radius:0]",
  ],
  [
    "styleguide assistant",
    "text-body-lg leading-relaxed group-[.is-assistant]:bg-transparent group-[.is-assistant]:text-slate-900",
  ],
  ["styleguide plain", "text-body-lg leading-relaxed"],
];
for (const [name, caller] of mcCallers) {
  for (const from of ["is-user", "is-assistant"]) {
    const o = cn(...MC("text-sm"), caller);
    const n = cn(...MC("text-body leading-5"), caller);
    const html = (c: string) =>
      `<div data-n class="group flex w-full max-w-[95%] flex-col gap-2 ${from}"><div data-n class="${c}">Plain text that wraps across the line <p data-n>para</p><span data-n class="text-sm">own size</span></div></div>`;
    cases.push({
      label: `MessageContent (${from}) + ${name}`,
      oldHtml: html(o),
      newHtml: html(n),
      oldClass: o,
      newClass: n,
    });
  }
}
const ES_H3_OLD = "text-sm font-medium";
const ES_H3_NEW = "text-body font-medium leading-5";
const ES_P_OLD = "text-sm text-neutral-500";
const ES_P_NEW = "text-body leading-5 text-neutral-500";
assertIn(join(baseDir, AE, "conversation.tsx"), [ES_H3_OLD, ES_P_OLD]);
assertIn(join(headDir, AE, "conversation.tsx"), [ES_H3_NEW, ES_P_NEW]);
const esHtml = (h: string, p: string) =>
  `<div data-n class="flex size-full flex-col items-center justify-center gap-3 p-8 text-center"><div data-n class="text-neutral-500">icon</div><div data-n class="space-y-1"><h3 data-n class="${h}">No messages yet</h3><p data-n class="${p}">Start a conversation to see messages here</p></div></div>`;
cases.push({
  label: "ConversationEmptyState h3 + p, as written",
  oldHtml: esHtml(ES_H3_OLD, ES_P_OLD),
  newHtml: esHtml(ES_H3_NEW, ES_P_NEW),
  oldClass: `${ES_H3_OLD} / ${ES_P_OLD}`,
  newClass: `${ES_H3_NEW} / ${ES_P_NEW}`,
});
cases.push({
  label: "ConversationEmptyState h3 + p, cn()",
  oldHtml: esHtml(cn(ES_H3_OLD), cn(ES_P_OLD)),
  newHtml: esHtml(cn(ES_H3_NEW), cn(ES_P_NEW)),
  oldClass: `${cn(ES_H3_OLD)} / ${cn(ES_P_OLD)}`,
  newClass: `${cn(ES_H3_NEW)} / ${cn(ES_P_NEW)}`,
});
const ST_OLD = "text-sm text-muted-foreground";
const ST_NEW = "text-body leading-5 text-muted-foreground";
assertIn(join(baseDir, AE, "message.stories.tsx"), [ST_OLD]);
assertIn(join(headDir, AE, "message.stories.tsx"), [ST_NEW]);
cases.push({
  label: "message.stories LinkSafetyModal caption p",
  oldHtml: `<p data-n class="${ST_OLD}">Click a link</p>`,
  newHtml: `<p data-n class="${ST_NEW}">Click a link</p>`,
  oldClass: ST_OLD,
  newClass: ST_NEW,
});
// Textarea (ui/textarea.tsx) > InputGroupTextarea > PromptInputTextarea > caller
const TA_BASE =
  "flex min-h-[60px] w-full rounded-md border border-neutral-200 bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300 md:text-sm";
const TA_IG =
  "flex-1 resize-none rounded-none border-0 bg-transparent py-3 shadow-none focus-visible:ring-0";
const PI_OLD = "max-h-48 min-h-0 text-base leading-6 md:text-base";
const PI_NEW =
  "max-h-48 min-h-0 text-body-lg leading-6 md:text-body-lg md:leading-6";
assertIn(join(baseDir, AE, "prompt-input.tsx"), [PI_OLD]);
assertIn(join(headDir, AE, "prompt-input.tsx"), [PI_NEW]);
const editorCaller = (stacked: boolean, compact: boolean) =>
  cn(
    "text-left",
    cn(
      "max-md:max-h-32",
      stacked && "px-0.5 py-1",
      compact && "text-sm leading-5 md:text-sm",
    ),
  );
const taCallers: [string, string | undefined][] = [
  ["no caller class", undefined],
  ["CredentialMentionEditor (ChatInput, row)", editorCaller(false, false)],
  ["CredentialMentionEditor (ChatInput, stacked)", editorCaller(true, false)],
  ["CredentialMentionEditor (ChatInput, compact)", editorCaller(false, true)],
  [
    "CredentialMentionEditor (ChatInput, stacked + compact)",
    editorCaller(true, true),
  ],
  [
    "CredentialMentionEditor (story, w-full px-0.5 py-1)",
    cn("text-left", "w-full px-0.5 py-1"),
  ],
];
for (const [name, caller] of taCallers) {
  const o = cn(TA_BASE, cn(TA_IG, cn(PI_OLD, caller)));
  const n = cn(TA_BASE, cn(TA_IG, cn(PI_NEW, caller)));
  const html = (c: string) =>
    `<textarea data-n rows="1" class="${c}" placeholder="What else can I help with?">Line one of a message that is long enough to wrap onto a second line at 390px</textarea>`;
  cases.push({
    label: `PromptInputTextarea (Textarea > InputGroupTextarea) + ${name}`,
    oldHtml: html(o),
    newHtml: html(n),
    oldClass: o,
    newClass: n,
  });
}

const PARENTS = [
  {
    name: "leading-[1.5]",
    open: `<div class="leading-[1.5]" style="font-size:16px">`,
    close: "</div>",
  },
  {
    name: "leading-[30px]",
    open: `<div class="leading-[30px]" style="font-size:16px">`,
    close: "</div>",
  },
  {
    name: "leading-normal",
    open: `<div class="leading-normal" style="font-size:16px">`,
    close: "</div>",
  },
  {
    name: "profile-tabs panel",
    open: `<div data-profile-tabs><div role="tabpanel" class="text-sm">`,
    close: "</div></div>",
  },
];

async function compile(dir: string, html: string) {
  const config = loadConfig(join(dir, "tailwind.config.ts"));
  const globals = readFileSync(join(dir, "src/app/globals.css"), "utf8");
  const result = await postcss([
    tailwindcss({
      ...config,
      content: [
        {
          raw: html + " leading-[1.5] leading-[30px] leading-normal text-sm",
          extension: "html",
        },
      ],
    }),
  ]).process(globals, { from: join(dir, "src/app/globals.css") });
  return result.css as string;
}

async function main() {
  const browser = await chromium.launch();
  const rows: string[] = [
    "| case | old class string | new class string | nodes | states | result |",
    "| --- | --- | --- | --- | --- | --- |",
  ];
  let failing = 0;
  let controlCaught = false;
  let controlSeen = 0;
  let comparisons = 0;
  for (const c of cases) {
    const oldCss = await compile(baseDir, c.oldHtml);
    const newCss = await compile(headDir, c.newHtml);
    const problems = new Set<string>();
    let nodes = 0;
    let states = 0;
    for (const width of [1280, 390]) {
      for (const parent of PARENTS) {
        const snap = async (css: string, html: string) => {
          const page = await browser.newPage({
            viewport: { width, height: 900 },
          });
          await page.setContent(
            `<!DOCTYPE html><html><head><style>${css}</style></head><body>${parent.open}${html}${parent.close}</body></html>`,
          );
          const read = () =>
            page.evaluate(() => {
              const out: Record<string, string>[] = [];
              for (const el of Array.from(
                document.querySelectorAll("[data-n]"),
              )) {
                const s = getComputedStyle(el);
                const all: Record<string, string> = {};
                for (let k = 0; k < s.length; k++)
                  if (
                    s[k] !== "--scrollbar-thumb" &&
                    s[k] !== "--scrollbar-track"
                  )
                    all[s[k]] = s.getPropertyValue(s[k]);
                // Custom properties compared as the colour they resolve to
                // (the text differs: #C5C5C9 vs rgb(197 197 201 / 1)).
                for (const v of ["--scrollbar-thumb", "--scrollbar-track"]) {
                  const probe = document.createElement("i");
                  probe.style.backgroundColor = `var(${v}, rgb(1, 2, 3))`;
                  el.appendChild(probe);
                  all[v + " (resolved)"] =
                    getComputedStyle(probe).backgroundColor;
                  probe.remove();
                }
                const th = getComputedStyle(el, "::-webkit-scrollbar-thumb");
                all["::-webkit-scrollbar-thumb background-color"] =
                  th.backgroundColor;
                const r = el.getBoundingClientRect();
                all["rect"] = `${r.x},${r.y},${r.width},${r.height}`;
                out.push(all);
              }
              if (
                getComputedStyle(document.documentElement).fontSize !== "16px"
              )
                throw new Error("root");
              return out;
            });
          const result: Record<string, string>[][] = [await read()];
          for (const sel of c.hover ?? []) {
            const settle = () =>
              page.waitForFunction(() => document.getAnimations().length === 0);
            await page.hover(sel, { force: true });
            await settle();
            result.push(await read());
            await page.mouse.move(1, 1);
            await settle();
          }
          await page.close();
          return result;
        };
        const o = await snap(oldCss, c.oldHtml);
        const n = await snap(newCss, c.newHtml);
        states = o.length;
        o.forEach((stateO, si) => {
          const stateN = n[si];
          if (stateO.length !== stateN.length) throw new Error("node count");
          nodes = stateO.length;
          stateO.forEach((po, ni) => {
            const pn = stateN[ni];
            for (const prop of new Set([
              ...Object.keys(po),
              ...Object.keys(pn),
            ])) {
              comparisons++;
              if (po[prop] !== pn[prop])
                problems.add(
                  `${width}px ${parent.name} state${si} node${ni} ${prop}: ${po[prop]} != ${pn[prop]}`,
                );
            }
          });
        });
      }
    }
    if (c.control)
      controlCaught =
        (controlSeen++ === 0 || controlCaught) && problems.size > 0;
    else if (problems.size) failing++;
    const res = c.control
      ? problems.size
        ? `control FAILS as expected (${problems.size} differences, e.g. ${[...problems].slice(0, 2).join("; ")})`
        : "control did NOT fail: harness broken"
      : problems.size
        ? "FAIL: " + [...problems].slice(0, 8).join("; ")
        : `identical (every computed property, ${PARENTS.length} parents x 2 viewports)`;
    rows.push(
      `| ${c.label} | \`${c.oldClass}\` | \`${c.newClass}\` | ${nodes} | ${states} | ${res} |`,
    );
  }
  await browser.close();
  const real = cases.filter((c) => !c.control).length;
  const controls = cases.length - real;
  const summary = `${real} cases (+${controls} negative controls) x ${PARENTS.length} parents x 2 viewports x rest/hover states, every computed property of every node (${comparisons} property comparisons): ${failing} failing; every negative control caught: ${controlCaught}`;
  writeFileSync(outFile, rows.join("\n") + "\n\n" + summary + "\n");
  console.log(rows.map((r) => r.slice(0, 400)).join("\n"));
  console.log(summary);
  process.exitCode = failing || !controlCaught ? 1 : 0;
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
