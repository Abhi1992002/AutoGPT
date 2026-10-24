// Old hand-written / lucide SVGs (from the base checkout) vs the new Icon-atom renders (head),
// rasterised in Chromium at several sizes and colours; pixel diff must be 0.
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { writeFileSync } from "node:fs";
const BASE = "/home/vercel-sandbox/wt/base/autogpt_platform/frontend/src";
const HEAD = "/home/vercel-sandbox/autogpt/autogpt_platform/frontend/src";
async function main() {
  (globalThis as unknown as { React: typeof React }).React = React;
const legacy = await import(`${BASE}/components/__legacy__/ui/icons.tsx`);
const legacyLoading = await import(`${BASE}/components/__legacy__/ui/loading.tsx`);
const { Icon } = await import(`${HEAD}/components/atoms/Icon/Icon.tsx`);
const g = await import(`${HEAD}/components/atoms/Icon/drawnIcons.ts`);
const { LoadingSpinner } = await import(`${HEAD}/components/atoms/LoadingSpinner/LoadingSpinner.tsx`);
const { cn } = await import(`${HEAD}/lib/utils.ts`);
type Row = { name: string; old: React.ReactElement; new: React.ReactElement };
const rows: Row[] = [];
const sizes = ["size-4", "size-10", "h-5 w-5", "h-6 w-6", "size-16"];
for (const s of sizes) {
  rows.push({ name: `CircleAlert ${s}`, old: <legacy.IconCircleAlert className={s} />, new: <Icon aria-label="Icon" icon={g.CircleAlertGlyph} className={s} /> });
  rows.push({ name: `Star ${s}`, old: <legacy.IconStar className={s} />, new: <Icon aria-label="Icon" icon={g.StarGlyph} className={s} /> });
  rows.push({ name: `StarFilled ${s}`, old: <legacy.IconStarFilled className={s} />, new: <Icon aria-label="Icon" icon={g.StarFilledGlyph} className={s} /> });
  rows.push({ name: `More ${s}`, old: <legacy.IconMore className={s} />, new: <Icon aria-label="Icon" icon={g.MoreVerticalGlyph} viewBox="0 0 20 20" strokeWidth={1.5} className={s} /> });
  rows.push({ name: `DashboardLayout ${s}`, old: <legacy.IconDashboardLayout className={s} />, new: <Icon aria-label="Icon" icon={g.DashboardLayoutGlyph} strokeWidth={1.25} className={s} /> });
  rows.push({ name: `LoaderCircle ${s}`, old: <legacyLoading.LoadingSpinner className={s} />, new: <LoadingSpinner aria-hidden="true" variant="circle" className={s} /> });
}
// The real call sites, exactly as each renders.
const stars = (r: number) => legacy.StarRatingIcons(r);
rows.push({ name: "StoreCard stars 3.5", old: <span className="inline-flex items-center gap-1">{stars(3.5)}</span>, new: <span className="inline-flex items-center gap-1">{[1,2,3,4,5].map((s) => <Icon key={s} aria-label="Icon" icon={s <= 3.5 ? g.StarFilledGlyph : g.StarGlyph} className="size-4 text-foreground-base" />)}</span> });
rows.push({ name: "AgentTableCard more", old: <legacy.IconMore className="h-5 w-5 text-neutral-800 dark:text-neutral-200" />, new: <Icon aria-label="Icon" icon={g.MoreVerticalGlyph} viewBox="0 0 20 20" strokeWidth={1.5} className="h-5 w-5 text-neutral-800 dark:text-neutral-200" /> });
rows.push({ name: "AgentTableCard star", old: <legacy.IconStarFilled className="h-4 w-4 text-neutral-800 dark:text-neutral-200" />, new: <Icon aria-label="Icon" icon={g.StarFilledGlyph} className="h-4 w-4 text-neutral-800 dark:text-neutral-200" /> });
rows.push({ name: "RunSummary alert", old: <legacy.IconCircleAlert className="size-4 cursor-help text-neutral-400 hover:text-neutral-600" />, new: <Icon aria-label="Icon" icon={g.CircleAlertGlyph} className="size-4 cursor-help text-neutral-400 hover:text-neutral-600" /> });
rows.push({ name: "error.tsx alert", old: <legacy.IconCircleAlert className="size-10" />, new: <Icon aria-label="Icon" icon={g.CircleAlertGlyph} className="size-10" /> });
rows.push({ name: "Sidebar dashboard", old: <legacy.IconDashboardLayout className="h-6 w-6" />, new: <Icon aria-label="Icon" icon={g.DashboardLayoutGlyph} strokeWidth={1.25} className="h-6 w-6" /> });
rows.push({ name: "spinner size-4 (MCP, NodeExecutionBadge)", old: <legacyLoading.LoadingSpinner className="size-4" />, new: <LoadingSpinner aria-hidden="true" variant="circle" className="size-4" /> });
rows.push({ name: "LoadingBox (reset-password)", old: <legacyLoading.default className="h-[80vh]" />, new: <div className="flex h-[80vh] items-center justify-center"><LoadingSpinner aria-hidden="true" variant="circle" className="size-16" /></div> });
const out = { rows: rows.map((r) => ({ name: r.name, old: renderToStaticMarkup(r.old), new: renderToStaticMarkup(r.new) })) };
writeFileSync("/home/vercel-sandbox/autogpt/.context/ev/glyph/markup.json", JSON.stringify(out, null, 1));
console.log(rows.length, "rows");
}
main();
