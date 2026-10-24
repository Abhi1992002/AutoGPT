// Equivalence table for #16134: every exact class string the PR replaces,
// measured in the running app that ships it. Old strings are measured in the
// base app inside `[data-profile-tabs] [role=tabpanel]` (where the deleted
// rule applied) or plainly (the default branches outside a profile tab); new
// strings are measured in the head app with no wrapper. Each sits inside
// parents at line-height 1.5, 30px and normal, at 1280px and 390px.
// usage: E=.. P=.. node equiv.cjs <old|new> <outJson>
const fs = require("node:fs");
const req = require("node:module").createRequire(
  "/home/vercel-sandbox/autogpt/autogpt_platform/frontend/package.json",
);
const { chromium } = req("@playwright/test");
const [side, out] = process.argv.slice(2);

const BUTTON_SMALL =
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors px-3 py-2 gap-1.5 h-9 min-w-[5.5rem]";
// [name, context, tag, old class string, new class string]
const PAIRS = [
  ["Text body", "panel", "p", "font-sans text-body font-normal text-foreground-base", "font-sans text-body-md font-normal text-foreground-base"],
  ["Text body tone muted", "panel", "p", "font-sans text-body font-normal text-foreground-tertiary", "font-sans text-body-md font-normal text-foreground-tertiary"],
  ["Text body-medium", "panel", "p", "font-sans text-body font-medium text-foreground-base", "font-sans text-body-md font-medium text-foreground-base"],
  ["Text body-medium tone primary", "panel", "p", "font-sans text-body font-medium text-foreground-strong", "font-sans text-body-md font-medium text-foreground-strong"],
  ["ProfileEntry dd", "panel", "dd", "font-sans text-body font-normal text-foreground-secondary mt-1 whitespace-pre-line", "font-sans text-body-md font-normal text-foreground-secondary mt-1 whitespace-pre-line"],
  ["Workflow card description", "panel", "p", "font-sans text-body font-normal text-foreground-tertiary mt-1.5 line-clamp-2 leading-5", "font-sans text-body-md font-normal text-foreground-tertiary mt-1.5 line-clamp-2"],
  ["Run count (leading-5)", "panel", "p", "font-sans text-body font-normal text-foreground-tertiary flex items-center gap-1.5 leading-5", "font-sans text-body-md font-normal text-foreground-tertiary flex items-center gap-1.5"],
  ["Workflow meta row", "panel", "div", "mt-1 flex flex-wrap items-center gap-2 text-sm leading-5 text-foreground-secondary", "font-sans text-body-md font-normal text-foreground-secondary mt-1 flex flex-wrap items-center gap-2"],
  ["Mode option label", "panel", "span", "text-sm font-medium text-foreground-strong", "font-sans text-body-md font-medium text-foreground-strong"],
  ["Settings Retry link", "panel", "button", "mt-1 text-sm font-medium text-foreground-body underline underline-offset-2", "mt-1 text-body-md font-medium text-foreground-body underline underline-offset-2"],
  ["Button small (secondary)", "panel", "button", `${BUTTON_SMALL} text-body leading-5`, `${BUTTON_SMALL} text-body-md`],
  ["Input small (ToolbarSearch)", "panel", "input", "flex h-9 w-full rounded-full pl-10 py-2 text-body placeholder:text-body", "flex h-9 w-full rounded-full pl-10 py-2 text-body-md placeholder:text-body"],
  ["Stream header (profile tab)", "panel", "div", "flex items-center gap-2 text-sm text-foreground-body", "font-sans text-body-md font-normal text-foreground-body flex items-center gap-2"],
  ["Stream header (default)", "plain", "div", "flex items-center gap-2 text-sm text-foreground-body", "font-sans text-body font-normal text-foreground-body flex items-center gap-2 leading-5"],
  ["Owner-only notice (profile tab)", "panel", "div", "flex aspect-video w-full items-center justify-center bg-action-hover px-6 text-center text-sm text-foreground-subtle", "font-sans text-body-md font-normal text-foreground-subtle flex aspect-video w-full items-center justify-center bg-action-hover px-6 text-center"],
  ["Owner-only notice (default)", "plain", "div", "flex aspect-video w-full items-center justify-center bg-action-hover px-6 text-center text-sm text-foreground-subtle", "font-sans text-body font-normal text-foreground-subtle flex aspect-video w-full items-center justify-center bg-action-hover px-6 text-center leading-5"],
  ["Stream provider badge", "panel", "span", "rounded bg-surface-active px-1.5 py-0.5 text-xs uppercase text-foreground-secondary", "font-sans text-caption font-normal text-foreground-secondary rounded bg-surface-active px-1.5 py-0.5 uppercase leading-4"],
  ["Stream fullscreen button / new-tab link", "plain", "button", "flex items-center gap-1 rounded px-2 py-1 text-xs text-foreground-secondary", "flex items-center gap-1 rounded px-2 py-1 text-caption leading-4 text-foreground-secondary"],
  ["Stream footer", "plain", "p", "border-t border-border-base bg-surface-muted px-3 py-2 text-xs font-medium text-foreground-body", "font-sans text-caption font-medium text-foreground-body border-t border-border-base bg-surface-muted px-3 py-2 leading-4"],
  ["Computer status pill", "panel", "span", "relative flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-surface/10 text-foreground-disabled", "font-sans text-caption font-medium relative flex items-center gap-1.5 rounded-full px-2.5 py-1 leading-4 bg-surface/10 text-foreground-disabled"],
  ["Computer volume path <code>", "panel", "code", "text-xs text-foreground-emphasis", "text-caption font-normal text-foreground-emphasis font-mono leading-4"],
  ["Computer volume name", "panel", "span", "font-mono text-xs text-foreground-subtle", "text-caption font-normal text-foreground-subtle font-mono leading-4"],
  ["Mode option description", "panel", "span", "text-xs text-foreground-tertiary", "font-sans text-caption font-normal text-foreground-tertiary leading-4"],
  ["Settings pause pill", "panel", "span", "max-w-full truncate rounded-full border border-warning-border bg-warning-surface px-2.5 py-0.5 text-xs text-amber-800", "font-sans text-caption font-normal max-w-full truncate rounded-full border border-warning-border bg-warning-surface px-2.5 py-0.5 leading-4 text-amber-800"],
  ["Settings +N more", "panel", "span", "px-1 py-0.5 text-xs text-foreground-tertiary", "font-sans text-caption font-normal text-foreground-tertiary px-1 py-0.5 leading-4"],
  ["Settings consequence tag", "panel", "span", "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium bg-warning-surface text-warning-foreground", "font-sans text-caption font-medium shrink-0 rounded-full px-2 py-0.5 leading-4 bg-warning-surface text-warning-foreground"],
  ["Skill trigger pill", "panel", "span", "max-w-full truncate rounded-full border border-border-base bg-surface-muted px-2.5 py-0.5 text-xs text-foreground-secondary", "font-sans text-caption font-normal text-foreground-secondary max-w-full truncate rounded-full border border-border-base bg-surface-muted px-2.5 py-0.5 leading-4"],
  ["Skill +N", "panel", "span", "rounded-full px-1.5 py-0.5 text-xs text-foreground-tertiary", "font-sans text-caption font-normal text-foreground-tertiary rounded-full px-1.5 py-0.5 leading-4"],
  ["Schedule kind badge", "plain", "span", "rounded-md bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700", "font-sans text-caption font-normal rounded-md bg-emerald-100 px-2 py-0.5 leading-4 text-emerald-700"],
  ["Schedule dialog mono <dd>", "plain", "dd", "min-w-0 truncate text-right font-mono text-xs font-normal tracking-tight text-foreground-secondary", "min-w-0 truncate text-right font-mono text-caption font-normal leading-4 tracking-tight text-foreground-secondary"],
  ["Integration accordion trigger", "panel", "button", "flex flex-1 items-center justify-between py-4 text-left text-sm font-medium transition-all px-3 py-2.5 pr-4", "flex flex-1 items-center justify-between py-4 text-left font-medium transition-all px-3 py-2.5 pr-4 text-body-md"],
];
// The desktop stream label/notice inherited their size from a text-sm div
// before; that parent is part of the old markup.
const OLD_PARENT_UNUSED = {
  "Desktop stream label (profile)": "flex items-center gap-2 text-sm text-foreground-body",
  "Desktop stream label (default)": "flex items-center gap-2 text-sm text-foreground-body",
  "Owner-only notice (default)": "flex items-center justify-center px-6 text-center text-sm text-foreground-subtle",
};
const NEW_PARENT_UNUSED = {
  "Desktop stream label (profile)": "flex items-center gap-2 text-foreground-body",
  "Desktop stream label (default)": "flex items-center gap-2 text-foreground-body",
  "Owner-only notice (default)": "flex items-center justify-center px-6 text-center",
};

async function main() {
  const browser = await chromium.launch();
  const results = {};
  for (const width of [1280, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    await ctx.request.post("http://localhost:3000/api/auth/sign-in/email", { data: { email: process.env.E, password: process.env.P } });
    const page = await ctx.newPage();
    await page.goto("http://localhost:3000/team/autopilot", { waitUntil: "networkidle" });
    for (const lh of ["1.5", "30px", "normal"]) {
      const rows = await page.evaluate(
        ({ PAIRS, side, lh }) => {
          const OLD_PARENT = {}, NEW_PARENT = {};
          const host = document.createElement("div");
          document.body.appendChild(host);
          const out = [];
          for (const [name, context, tag, oldCls, newCls] of PAIRS) {
            const cls = side === "old" ? oldCls : newCls;
            const wrap = document.createElement("div");
            if (side === "old" && context === "panel") wrap.setAttribute("data-profile-tabs", "");
            const panel = document.createElement("div");
            if (side === "old" && context === "panel") panel.setAttribute("role", "tabpanel");
            panel.style.lineHeight = lh;
            const parentCls = (side === "old" ? OLD_PARENT : NEW_PARENT)[name];
            let mount = panel;
            if (parentCls !== undefined) {
              const p = document.createElement("div");
              p.className = parentCls;
              panel.appendChild(p);
              mount = p;
            }
            const el = document.createElement(tag);
            el.className = cls;
            if (tag === "input") el.placeholder = "Search"; else el.textContent = "Sample copy";
            mount.appendChild(el);
            wrap.appendChild(panel);
            host.appendChild(wrap);
            const cs = getComputedStyle(el);
            const ph = tag === "input" ? getComputedStyle(el, "::placeholder") : null;
            out.push([name, cls, cs.fontSize, cs.lineHeight, cs.fontWeight, cs.fontFamily.split(",")[0], cs.letterSpacing, cs.textTransform, cs.color, ph ? `${ph.fontSize}/${ph.lineHeight}` : ""]);
          }
          host.remove();
          return out;
        },
        { PAIRS, side, lh },
      );
      results[`${width}@${lh}`] = rows;
    }
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(out, JSON.stringify(results, null, 1));
  console.log("measured", Object.keys(results).length, "contexts x", PAIRS.length, "pairs");
}
main().catch((e) => { console.error(e); process.exit(1); });
