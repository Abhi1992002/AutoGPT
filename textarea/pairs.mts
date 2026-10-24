import { writeFileSync } from "node:fs";
import { cn } from "/home/vercel-sandbox/autogpt/autogpt_platform/frontend/src/lib/utils.ts";
const OLD = "agpt-border-input flex min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50";
const NEW = "agpt-border-input flex min-h-20 w-full rounded-md border bg-background px-3 py-2 text-body leading-5 ring-offset-background placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50";
const sites: [string, string][] = [["ApproveRejectButton (x3), AddMoneyButton, no className", ""], ["ExecutionAnalyticsForm (x2)", "resize-y"], ["RefundModal", "min-h-[100px]"]];
const pairs = sites.map(([f, c]) => ({ file: ` Textarea ${f}`, old: cn(OLD, c), new: cn(NEW, c), tag: null }));
pairs.push({ file: " Textarea, bare class tokens", old: "min-h-[80px]", new: "min-h-20", tag: null }, { file: " Textarea, bare class tokens", old: "text-sm", new: "text-body leading-5", tag: null });
writeFileSync(process.argv[2], JSON.stringify({ pairs }, null, 1));
