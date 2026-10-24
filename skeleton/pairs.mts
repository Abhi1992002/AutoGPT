import { readFileSync, writeFileSync } from "node:fs";
import { cn } from "/home/vercel-sandbox/autogpt/autogpt_platform/frontend/src/lib/utils.ts";
const statics: string[] = JSON.parse(readFileSync("/home/vercel-sandbox/autogpt/.context/evidence/skel-classes.json", "utf8"));
const dyn = [
  "flex h-16 w-full min-w-[7.5rem] animate-pulse items-center justify-start space-x-3 rounded-[0.75rem] bg-zinc-100 px-[0.875rem] py-[0.625rem]",
  "flex h-16 w-full min-w-[7.5rem] animate-pulse items-center justify-start gap-3 rounded-[0.75rem] bg-zinc-100 px-[0.875rem] py-[0.625rem]",
  "flex h-[4.375rem] w-full min-w-[7.5rem] animate-pulse items-center justify-start gap-3 rounded-[0.75rem] bg-zinc-100 p-[0.625rem] pr-[0.875rem]",
  "h-[2.25rem] w-32 rounded-[1.5rem] bg-zinc-100",
];
const OLD = "animate-pulse rounded-md bg-zinc-100", NEW = "animate-pulse rounded-md bg-surface-hover";
const all = [...new Set([...statics, ...dyn])];
const pairs = all.map((c) => ({ file: ` Skeleton className "${c}"`, old: cn(OLD, c), new: cn(NEW, c), tag: null }));
writeFileSync(process.argv[2], JSON.stringify({ pairs }, null, 1));
console.log(pairs.length);
