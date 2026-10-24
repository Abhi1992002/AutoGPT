// Every exact class string this PR writes, as the element renders it after
// cn() and Slot merging, against the string it replaces. A card that moved
// onto Root > Row is a two-level chain; each check names the level of each
// side and the properties compared there.
export interface Check {
  label: string;
  old: string[]; // chain, outermost first
  new: string[];
  // [old level, new level, property group]
  compare: [number, number, "box" | "flex" | "text" | "all"][];
}

const ROW = "flex";

export const CHECKS: Check[] = [
  {
    label: "NeedsAttentionRow card",
    old: ["flex items-center gap-3 rounded-xl border border-border-base bg-surface p-3"],
    new: ["rounded-xl border border-border-base bg-surface p-3", `${ROW} items-center gap-3`],
    compare: [[0, 0, "box"], [0, 1, "flex"]],
  },
  { label: "NeedsAttentionRow link (Content asChild)", old: ["min-w-0 flex-1"], new: ["min-w-0 flex-1"], compare: [[0, 0, "all"]] },
  { label: "NeedsAttentionRow actions", old: ["flex shrink-0 items-center gap-2"], new: ["flex gap-2 shrink-0 items-center"], compare: [[0, 0, "all"]] },
  { label: "NeedsAttentionRow avatar (Icon slot)", old: ["relative inline-flex shrink-0"], new: ["relative inline-flex shrink-0"], compare: [[0, 0, "all"]] },
  {
    label: "AttachmentCapNotice / AtResetFilesNotice card",
    old: ["flex w-full items-center gap-1.5 rounded-2xl bg-warning-surface px-3 py-1.5 text-sm text-amber-800"],
    new: ["rounded-2xl bg-warning-surface text-body leading-5 text-amber-800 px-3 py-1.5 w-full", `${ROW} items-center gap-1.5`],
    compare: [[0, 0, "box"], [0, 0, "text"], [0, 1, "flex"], [0, 1, "text"]],
  },
  {
    label: "AtResetFilesNotice card + ChatInput mt-1.5",
    old: ["flex w-full items-center gap-1.5 rounded-2xl bg-warning-surface px-3 py-1.5 text-sm text-amber-800 mt-1.5"],
    new: ["rounded-2xl bg-warning-surface text-body leading-5 text-amber-800 px-3 py-1.5 w-full mt-1.5", `${ROW} items-center gap-1.5`],
    compare: [[0, 0, "box"], [0, 0, "text"], [0, 1, "flex"]],
  },
  { label: "notice icon h-4 w-4 (Icon slot)", old: ["h-4 w-4 shrink-0"], new: ["shrink-0 h-4 w-4"], compare: [[0, 0, "all"]] },
  { label: "notice text span (Content asChild)", old: ["min-w-0 flex-1"], new: ["min-w-0 flex-1"], compare: [[0, 0, "all"]] },
  { label: "AttachmentCapNotice dismiss icon", old: ["h-3.5 w-3.5"], new: ["h-3.5 w-3.5"], compare: [[0, 0, "all"]] },
  {
    label: "NoAIConnectionNotice card",
    old: ["mb-2 flex w-full items-start gap-2 rounded-2xl bg-warning-surface px-3 py-2 text-left text-sm text-amber-900"],
    new: ["rounded-2xl bg-warning-surface text-left text-body leading-5 text-amber-900 px-3 py-2 mb-2 w-full", `${ROW} items-start gap-2`],
    compare: [[0, 0, "box"], [0, 0, "text"], [0, 1, "flex"], [0, 1, "text"]],
  },
  { label: "NoAIConnectionNotice icon (Icon nudge)", old: ["mt-0.5 h-4 w-4 shrink-0"], new: ["mt-0.5 shrink-0 h-4 w-4"], compare: [[0, 0, "all"]] },
  {
    label: "SharedChatNotice card",
    old: ["mb-2 flex items-center justify-between gap-3 rounded-lg border border-warning-border bg-warning-surface px-3 py-2 text-sm text-amber-900"],
    new: ["rounded-lg border border-warning-border bg-warning-surface text-body leading-5 text-amber-900 px-3 py-2 mb-2", `${ROW} items-center justify-between gap-3`],
    compare: [[0, 0, "box"], [0, 0, "text"], [0, 1, "flex"], [0, 1, "text"]],
  },
  {
    label: "CredentialRejectionNotice card",
    old: ["rounded-lg border border-red-200 bg-error-surface px-3 py-2 text-xs text-error-foreground"],
    new: ["rounded-lg border border-red-200 bg-error-surface text-caption leading-4 text-error-foreground px-3 py-2"],
    compare: [[0, 0, "all"]],
  },
  {
    label: "ArchivedExpertNotice card",
    old: ["mx-auto flex w-full max-w-2xl items-center justify-center gap-2 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-center"],
    new: ["rounded-2xl border border-border bg-muted/40 px-4 py-3 mx-auto w-full max-w-2xl", `${ROW} items-center justify-center text-center gap-2`],
    compare: [[0, 0, "box"], [0, 1, "flex"], [0, 1, "text"]],
  },
  { label: "ArchivedExpertNotice icon (Icon slot, muted tint)", old: ["text-muted-foreground"], new: ["text-muted-foreground"], compare: [[0, 0, "all"]] },
  {
    label: "ScheduledChatNoticeCard card",
    old: ["max-w-md rounded-2xl bg-surface p-4 ring-1 ring-inset ring-border-base/60", "flex items-start gap-3"],
    new: ["rounded-2xl bg-surface ring-1 ring-inset ring-border-base/60 p-4 max-w-md", `${ROW} items-start gap-3`],
    compare: [[0, 0, "box"], [1, 1, "flex"]],
  },
  { label: "ScheduledChatNoticeCard icon (Icon nudge, outline tint)", old: ["mt-0.5 shrink-0 text-foreground-subtle"], new: ["mt-0.5 shrink-0 text-foreground-subtle"], compare: [[0, 0, "all"]] },
  { label: "ScheduledChatNoticeCard headline", old: ["text-sm font-medium text-foreground-strong"], new: ["font-sans text-body font-medium text-foreground-strong leading-5"], compare: [[0, 0, "all"]] },
  { label: "ScheduledChatNoticeCard body", old: ["mt-1 text-sm text-foreground-tertiary"], new: ["font-sans text-body font-normal text-foreground-tertiary mt-1 leading-5"], compare: [[0, 0, "all"]] },
  { label: "ScheduledChatNoticeCard actions (Actions below)", old: ["mt-3 flex flex-wrap gap-2"], new: ["flex gap-2 mt-3 flex-wrap"], compare: [[0, 0, "all"]] },
  {
    label: "PendingReviewsList card",
    old: ["space-y-7 rounded-xl border border-yellow-150 bg-yellow-25 p-6"],
    new: ["rounded-xl border border-yellow-150 bg-yellow-25 space-y-7 p-6"],
    compare: [[0, 0, "all"]],
  },
  {
    label: "PendingReviewsList header row",
    old: ["space-y-7 p-6", "flex items-start gap-2"],
    new: ["space-y-7 p-6", `${ROW} items-start gap-2`],
    compare: [[1, 1, "flex"]],
  },
  { label: "PendingReviewsList header icon (Icon slot, caution tint)", old: ["fill-yellow-600 text-action-foreground"], new: ["fill-yellow-600 text-action-foreground"], compare: [[0, 0, "all"]] },
  {
    label: "PendingReviewsList group header button (Row asChild)",
    old: ["space-y-7 p-6", "flex w-full items-center gap-2 text-left"],
    new: ["space-y-7 p-6", `${ROW} items-center gap-2 w-full text-left`],
    compare: [[1, 1, "all"]],
  },
  { label: "PendingReviewsList count (Count slot = Text small)", old: ["text-xs text-gray-600"], new: ["font-sans text-caption font-normal leading-4 text-gray-600"], compare: [[0, 0, "all"]] },
  { label: "PendingReviewsList decisions (Actions footer)", old: ["flex flex-wrap gap-2 pt-2"], new: ["flex gap-2 flex-wrap pt-2"], compare: [[0, 0, "all"]] },
  {
    label: "BriefingCard card",
    old: ["overflow-hidden rounded-3xl bg-surface shadow-zinc-950 smooth-shadow-ring-sm"],
    new: ["overflow-hidden rounded-3xl bg-surface shadow-zinc-950 smooth-shadow-ring-sm p-0"],
    compare: [[0, 0, "all"]],
  },
  {
    label: "BriefingCard show-all footer top line (Separator)",
    old: ["border-t border-separator"],
    new: ["border-t border-separator"],
    compare: [[0, 0, "all"]],
  },
  {
    label: "RunRow linked row (Row asChild inset interactive)",
    old: ["", "group flex items-start gap-3 px-5 py-4 transition-colors hover:bg-surface-muted"],
    new: ["p-0", `${ROW} items-start px-5 py-4 group transition-colors hover:bg-surface-muted gap-3`],
    compare: [[1, 1, "all"]],
  },
  {
    label: "RunRow plain row (Row inset)",
    old: ["", "group flex items-start gap-3 px-5 py-4"],
    new: ["p-0", `${ROW} items-start px-5 py-4 gap-3`],
    compare: [[1, 1, "all"]],
  },
  { label: "RunRow content (Content)", old: ["min-w-0 flex-1"], new: ["min-w-0 flex-1"], compare: [[0, 0, "all"]] },
  {
    label: "RunRow chevron (Icon trailing)",
    old: ["shrink-0 self-center text-foreground-disabled transition-colors group-hover:text-foreground-tertiary"],
    new: ["shrink-0 self-center text-foreground-disabled transition-colors group-hover:text-foreground-tertiary"],
    compare: [[0, 0, "all"]],
  },
  {
    label: "TrialCard onboarding border",
    old: ["w-full rounded-2xl bg-gradient-to-br from-zinc-300 via-zinc-400 to-zinc-500 p-px"],
    new: ["rounded-2xl bg-gradient-to-br from-zinc-300 via-zinc-400 to-zinc-500 p-px w-full"],
    compare: [[0, 0, "all"]],
  },
  {
    label: "TrialCard onboarding surface",
    old: ["relative overflow-hidden rounded-[15px] bg-surface p-5 md:p-6"],
    new: ["relative overflow-hidden rounded-[15px] bg-surface p-5 md:p-6"],
    compare: [[0, 0, "all"]],
  },
];
