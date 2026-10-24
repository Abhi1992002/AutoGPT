import { writeFileSync } from "node:fs";
import { cn } from "/home/vercel-sandbox/autogpt/autogpt_platform/frontend/src/lib/utils.ts";
// legacy badge (origin/dev), copied verbatim
const LB = "inline-flex items-center rounded-md border border-neutral-200 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 dark:border-neutral-800 dark:focus:ring-neutral-300 cursor-default";
const LV: Record<string,string> = {
  default: "border-transparent bg-neutral-900 text-neutral-50 shadow dark:bg-neutral-50 dark:text-neutral-900",
  secondary: "border-transparent bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50",
  destructive: "border-transparent bg-red-500 text-neutral-50 shadow dark:bg-red-900 dark:text-neutral-50",
  outline: "text-neutral-950 dark:text-neutral-50",
};
const NB = "inline-flex cursor-default items-center rounded-md border px-2.5 py-0.5 text-caption font-semibold leading-4 transition-colors focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2";
const NV: Record<string,string> = {
  solid: "border-transparent bg-neutral-900 text-primary-foreground shadow",
  secondary: "border-transparent bg-neutral-100 text-neutral-900",
  destructive: "border-transparent bg-destructive text-destructive-foreground shadow",
  outline: "border-neutral-200 text-neutral-950",
};
const old = (v: string, c = "") => cn(`${LB} ${LV[v]}`, c);
const neu = (v: string, c = "") => cn(NB, NV[v], c);
const ST = ["text-slate-700 border-slate-400","text-blue-700 border-blue-400","text-amber-700 border-amber-400","text-yellow-700 border-yellow-400 bg-yellow-50","text-green-700 border-green-400","text-orange-700 border-orange-400","text-red-700  border-red-400"];
const sites: [string,string,string,string,string][] = [
  ["bare variant","default","","solid",""],
  ["bare variant","secondary","","secondary",""],
  ["bare variant","destructive","","destructive",""],
  ["bare variant","outline","","outline",""],
  ...["bg-warning","bg-green-500","bg-error","bg-gray-500","ml-2 bg-info"].map(c=>["ExpandleRow","default",c,"solid",c] as [string,string,string,string,string]),
  ["MCPToolDialog","secondary","text-[10px]","secondary","text-tiny leading-inherit"],
  ["MCPToolDialog","outline","text-[10px] font-normal","outline","text-tiny font-normal leading-inherit"],
  ...ST.map(s=>["NodeExecutionBadge","default",cn(s,"gap-2 rounded-full bg-white"),"solid",cn(s,"gap-2 rounded-full bg-white")] as [string,string,string,string,string]),
  ["NodeBadges","default","rounded-full border border-slate-500 bg-slate-100 text-black shadow-none","solid","rounded-full border border-slate-500 bg-slate-100 text-black shadow-none"],
  ["APIKeySection","default","border-success bg-green-100 text-green-800","solid","border-success bg-green-100 text-green-800"],
  ["APIKeySection","destructive","border-error-hover bg-red-100 text-red-800","destructive","border-error-hover bg-red-100 text-red-800"],
  ["multiselect","secondary","flex items-center gap-1 rounded-xl px-1 pl-2","secondary","flex items-center gap-1 rounded-xl px-1 pl-2"],
  ["multiselect","secondary","flex items-center gap-1 rounded-xl px-1 pl-2 ring-2 ring-muted-foreground","secondary","flex items-center gap-1 rounded-xl px-1 pl-2 ring-2 ring-muted-foreground"],
];
const pairs = sites.map(([file,ov,oc,nv,nc]) => ({ file: ` ${file} (${ov}→${nv}${oc?`, className "${oc}"`:""})`, old: old(ov,oc), new: neu(nv,nc), tag: null }));
writeFileSync(process.argv[2], JSON.stringify({ pairs }, null, 1));
for (const p of pairs) console.log(p.file, "\n  OLD", p.old, "\n  NEW", p.new);
