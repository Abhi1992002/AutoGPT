import { writeFileSync } from "node:fs";
import { cn } from "/home/vercel-sandbox/autogpt/autogpt_platform/frontend/src/lib/utils.ts";
const OLD = "peer h-4 w-4 shrink-0 rounded-sm border border-neutral-200 border-neutral-900 shadow data-[state=checked]:bg-neutral-900 data-[state=checked]:text-neutral-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-50 dark:border-neutral-800 dark:data-[state=checked]:bg-neutral-50 dark:data-[state=checked]:text-neutral-900 dark:focus-visible:ring-neutral-300";
const NEW = "peer h-4 w-4 shrink-0 rounded-sm border border-neutral-900 shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-neutral-900 data-[state=checked]:text-primary-foreground";
const sites: [string, string][] = [["8 callers, no className", ""], ["AlsoBlockList", "mt-1"], ["FilterSheet (x2)", "border border-[#D4D4D4] shadow-none data-[state=checked]:border-none data-[state=checked]:bg-violet-700 data-[state=checked]:text-white"]];
const checked = (s: string) => s.replaceAll("data-[state=checked]:", "data-[state=active]:");
const pairs = sites.flatMap(([f, c]) => [
  { file: ` Checkbox ${f}, unchecked`, old: cn(OLD, c), new: cn(NEW, c), tag: null },
  { file: ` Checkbox ${f}, checked (data-[state=checked] rendered as the host's data-state)`, old: checked(cn(OLD, c)), new: checked(cn(NEW, c)), tag: null },
]);
writeFileSync(process.argv[2], JSON.stringify({ pairs }, null, 1));
