import { writeFileSync } from "node:fs";
import { cn } from "/home/vercel-sandbox/autogpt/autogpt_platform/frontend/src/lib/utils.ts";
// legacy (origin/dev) form.tsx + label.tsx, verbatim
const LABEL = "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";
const oldLabel = (err: boolean, c?: string) => cn(LABEL, cn(err && "text-red-500 dark:text-red-900", c));
const oldDesc = (c?: string) => cn("text-[0.8rem] text-neutral-500 dark:text-neutral-400", c);
const oldMsg = (c?: string) => cn("text-[0.8rem] font-medium text-red-500 dark:text-red-900", c);
// molecules/Form (head), verbatim
const newLabel = (err: boolean, c?: string) => cn(err && "text-error", c);
const newDesc = (c?: string) => cn("font-sans text-caption font-normal leading-4.5 text-neutral-500", c);
const newMsg = (c?: string) => cn("font-sans text-caption font-medium leading-4.5 text-error", c);
const LBL = "text-body font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";
const BODY = "font-sans font-normal"; // what <body> passes down (globals.css `body { @apply font-sans }`, weight 400)
const HINT = "font-sans text-caption font-normal text-foreground-base text-foreground-subtle"; // Input's hint: <Text variant="small" tone="subtle" as="span">
const pairs = [
  { file: " FormLabel (TimezoneForm, HotScopedCredentialsModal), no error", old: oldLabel(false), new: newLabel(false, LBL), tag: null, parent: BODY },
  { file: " FormLabel (TimezoneForm), field error", old: oldLabel(true), new: newLabel(true, LBL), tag: null, parent: BODY },
  { file: " FormDescription (HotScopedCredentialsModal)", old: oldDesc("max-w-md"), new: newDesc("max-w-md text-[0.8rem] leading-inherit"), tag: null, parent: BODY , final: true },
  { file: " FormDescription (CredentialTypeSelector, APIKeyCredentialsModal: inside Input's hint)", old: oldDesc(), new: newDesc("text-[0.8rem] leading-inherit"), tag: null, parent: HINT , final: true },
  { file: " FormMessage (TimezoneForm)", old: oldMsg(), new: newMsg("text-[0.8rem] leading-inherit"), tag: null, parent: BODY , final: true },
];
writeFileSync(process.argv[2], JSON.stringify({ pairs }, null, 1));
for (const p of pairs) console.log(p.file, "\n  OLD", p.old, "\n  NEW", p.new);
