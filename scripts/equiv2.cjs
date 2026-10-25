// Equivalence table for #16134 at the wrapper + Text head. Each pair is the
// dev markup and the head markup of one element (class strings as React
// renders them, Text classes as cn(variant, tone) gives them), mounted in the
// running app inside its real parent's classes. Dev markup is mounted inside
// `[data-profile-tabs] [role=tabpanel]` when it sat in a profile tab (where
// the deleted rule applied); head markup never is. Per pair it records the
// outer box, the target text's box relative to it, the computed type of the
// element holding the text, and whether that text is cut off (ellipsis).
// Measured at 1280px and 390px, with the panel at line-height 1.5, 30px and
// normal.
// usage: E=.. P=.. node equiv2.cjs <old|new> <outJson>
const fs = require("node:fs");
const { chromium, ARGS, newPage, settle } = require("./det.cjs");
const [side, out] = process.argv.slice(2);

const T = {
  "body-md": "font-sans text-body-md font-normal text-foreground-base",
  "body-md|muted": "font-sans text-body-md font-normal text-foreground-tertiary",
  "body-md|secondary": "font-sans text-body-md font-normal text-foreground-secondary",
  "body-md|subtle": "font-sans text-body-md font-normal text-foreground-subtle",
  "body-md|disabled": "font-sans text-body-md font-normal text-foreground-disabled",
  "body-md-medium": "font-sans text-body-md font-medium text-foreground-base",
  "body-md-medium|primary": "font-sans text-body-md font-medium text-foreground-strong",
  "body-md-medium|body": "font-sans text-body-md font-medium text-foreground-body",
  "body-tight|subtle": "font-sans text-body font-normal leading-5 text-foreground-subtle",
  "body-medium-tight|body": "font-sans text-body font-medium leading-5 text-foreground-body",
  "small-tight|secondary": "font-sans text-caption font-normal leading-4 text-foreground-secondary",
  "small-tight|muted": "font-sans text-caption font-normal leading-4 text-foreground-tertiary",
  "small-tight|warning-strong": "font-sans text-caption font-normal leading-4 text-amber-800",
  "small-tight|success-strong": "font-sans text-caption font-normal leading-4 text-emerald-700",
  "small-medium-tight|warning": "font-sans text-caption font-medium leading-4 text-warning-foreground",
  "small-medium-tight|success-strong": "font-sans text-caption font-medium leading-4 text-emerald-700",
  "small-medium-tight|success-light": "font-sans text-caption font-medium leading-4 text-emerald-300",
  "small-medium-tight|disabled": "font-sans text-caption font-medium leading-4 text-foreground-disabled",
  "small-medium-tight|body": "font-sans text-caption font-medium leading-4 text-foreground-body",
  "small-uppercase-tight|secondary": "font-sans text-caption font-normal uppercase leading-4 text-foreground-secondary",
  "small-mono-tight|emphasis": "font-mono text-caption font-normal leading-4 text-foreground-emphasis",
  "small-mono-tight|subtle": "font-mono text-caption font-normal leading-4 text-foreground-subtle",
};
const text = (tag, key, body, extra = "") =>
  `<${tag} data-slot="text" class="${T[key]}${extra ? " " + extra : ""}">${body}</${tag}>`;
const svg = (n) => `<svg width="${n}" height="${n}" viewBox="0 0 24 24"></svg>`;
const S = "Sample copy";
const LONG = "Quarterly vendor renewal checklist and scorecard";
const FOOT = "Only the owner of this chat can view the live desktop. The AI works on this desktop with full access, so anything signed in here is visible to it. Do not sign into personal accounts.";
const OWNER = "The live desktop is only visible to the owner of this chat.";
const BTN = "inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors px-3 py-2 gap-1.5 h-9 min-w-[5.5rem]";

// [name, panel?, parent classes, dev markup, head markup, target text, outer selector]
const P = [];
const add = (name, panel, parent, oldH, newH, target = S, outer = ":scope > *", width = "") =>
  P.push({ name, panel, parent, oldH, newH, target, outer, width });

// Copy that only changes variant (body → body-md) inside the panels.
add("Text body", true, "", `<p data-slot="text" class="font-sans text-body font-normal text-foreground-base">${S}</p>`, text("p", "body-md", S));
add("Text body tone muted", true, "", `<p data-slot="text" class="font-sans text-body font-normal text-foreground-tertiary">${S}</p>`, text("p", "body-md|muted", S));
add("Text body-medium tone primary", true, "", `<p data-slot="text" class="font-sans text-body font-medium text-foreground-strong">${S}</p>`, text("p", "body-md-medium|primary", S));
add("ProfileEntry dd", true, "", `<dd data-slot="text" class="font-sans text-body font-normal text-foreground-secondary mt-1 whitespace-pre-line">${S}</dd>`, `<dd data-slot="text" class="${T["body-md|secondary"]} mt-1 whitespace-pre-line">${S}</dd>`);
add("Workflow card description (drops leading-5)", true, "", `<p data-slot="text" class="font-sans text-body font-normal text-foreground-tertiary mt-1.5 line-clamp-2 leading-5">${S}</p>`, text("p", "body-md|muted", S, "mt-1.5 line-clamp-2"));
add("Run count (drops leading-5)", true, "", `<p data-slot="text" class="font-sans text-body font-normal text-foreground-tertiary flex items-center gap-1.5 leading-5">${svg(14)}${S}</p>`, text("p", "body-md|muted", `${svg(14)}${S}`, "flex items-center gap-1.5"));
T["body-md-medium|inherit"] = "font-sans text-body-md font-medium text-inherit";
T["small-mono-tight-tracking|secondary"] = "font-mono text-caption font-normal leading-4 tracking-tight text-foreground-secondary";
T["body-sm-medium-inherit|emphasis"] = "font-sans text-body-sm font-medium leading-inherit text-foreground-emphasis";
const RETRY_OLD = `<button type="button" class="mt-1 text-sm font-medium text-foreground-body underline underline-offset-2 hover:text-foreground">Retry</button>`;
const RETRY_NEW = `<button type="button" class="mt-1 inline-flex text-foreground-body underline underline-offset-2 hover:text-foreground">${text("span", "body-md-medium|inherit", "Retry")}</button>`;
// Inside Consequence's body column, after its header row, as in the app.
const RETRY_PARENT = "min-w-0 flex-1 pt-1";
P.push({ name: "Settings Retry button", panel: true, parent: RETRY_PARENT, oldH: `<div class="flex items-center justify-between gap-3"><p data-slot="text" class="font-sans text-body font-normal text-foreground-base !text-foreground-emphasis">Title</p></div>${RETRY_OLD}`, newH: `<div class="flex items-center justify-between gap-3"><p data-slot="text" class="font-sans text-body-md font-normal text-foreground-base !text-foreground-emphasis">Title</p></div>${RETRY_NEW}`, target: "Retry", outer: ":scope > button", width: "", hover: true });
add("Button small (textSize body-md)", true, "", `<button class="${BTN} text-body leading-5">${S}</button>`, `<button class="${BTN} text-body-md">${S}</button>`);
add("Input small (ToolbarSearch)", true, "", `<input placeholder="${S}" class="flex h-9 w-full rounded-full pl-10 py-2 text-body placeholder:text-body">`, `<input placeholder="${S}" class="flex h-9 w-full rounded-full pl-10 py-2 text-body-md placeholder:text-body">`);
add("Integration accordion trigger", true, "flex", `<button class="flex flex-1 items-center justify-between py-4 text-left text-sm font-medium transition-all px-3 py-2.5 pr-4">${S}</button>`, `<button class="flex flex-1 items-center justify-between py-4 text-left font-medium transition-all px-3 py-2.5 pr-4 text-body-md">${S}</button>`);
P.push({
  name: "Integration accordion panel (call-site wrapper)",
  panel: true,
  parent: "",
  oldH: `<div><div data-slot="accordion-panel" class="overflow-hidden text-sm"><div class="pb-4 pt-0">${S}</div></div></div>`,
  newH: `<div class="[&_[data-slot=accordion-panel]]:text-body-md"><div data-slot="accordion-panel" class="overflow-hidden text-sm"><div class="pb-4 pt-0">${S}</div></div></div>`,
  target: S,
  outer: "[data-slot=accordion-panel]",
});
add("Mode option label", true, "flex flex-col gap-0.5", `<span class="text-sm font-medium text-foreground-strong">${S}</span>`, text("span", "body-md-medium|primary", S));
add("Mode option description", true, "flex flex-col gap-0.5", `<span class="text-xs text-foreground-tertiary">${S}</span>`, text("span", "small-tight|muted", S));

// Workflow list meta row: the row drops its size; the separator is Text.
const META_OLD = (sep) => `<div class="mt-1 flex flex-wrap items-center gap-2 text-sm leading-5 text-foreground-secondary"><p data-slot="text" class="font-sans text-body font-normal text-foreground-secondary flex items-center gap-1.5 leading-5">${svg(14)}3 runs · 2 days ago</p><span class="text-foreground-disabled">${sep}</span><div class="flex items-center"><span class="flex size-7"></span></div></div>`;
const META_NEW = (sep) => `<div class="mt-1 flex flex-wrap items-center gap-2"><p data-slot="text" class="${T["body-md|secondary"]} flex items-center gap-1.5">${svg(14)}3 runs · 2 days ago</p>${text("span", "body-md|disabled", sep)}<div class="flex items-center"><span class="flex size-7"></span></div></div>`;
add("Workflow meta row", true, "", META_OLD("•"), META_NEW("•"), "•");
add("Workflow meta row: separator", true, "", META_OLD("•"), META_NEW("•"), "•", ":scope > * > :nth-child(2)");

// DesktopStreamPreview: header bar, provider badge, buttons, notice, footer.
for (const [ctx, panel] of [["profile tab", true], ["default", false]]) {
  const label = panel ? "body-md-medium|body" : "body-medium-tight|body";
  const notice = panel ? "body-md|subtle" : "body-tight|subtle";
  const barOld = `<div class="flex items-center gap-2 text-sm text-foreground-body">${svg(16)}<span class="font-medium">${S}</span><span class="rounded bg-surface-active px-1.5 py-0.5 text-xs uppercase text-foreground-secondary">e2b</span></div>`;
  const barNew = `<div class="flex items-center gap-2 text-foreground-body">${svg(16)}${text("span", label, S)}<span class="flex rounded bg-surface-active px-1.5 py-0.5">${text("span", "small-uppercase-tight|secondary", "e2b")}</span></div>`;
  add(`Stream header bar (${ctx})`, panel, "", barOld, barNew);
  add(`Stream provider badge (${ctx})`, panel, "", barOld, barNew, "e2b", ":scope > * > :nth-child(3)");
  add(`Stream fullscreen button (${ctx})`, panel, "flex items-center gap-2", `<button class="flex items-center gap-1 rounded px-2 py-1 text-xs text-foreground-secondary hover:bg-surface-active">${svg(14)}Fullscreen</button>`, `<button class="flex items-center gap-1 rounded px-2 py-1 text-foreground-secondary hover:bg-surface-active">${svg(14)}${text("span", "small-tight|secondary", "Fullscreen")}</button>`, "Fullscreen");
  add(`Stream new-tab link (${ctx})`, panel, "flex items-center gap-2", `<a href="#" class="flex items-center gap-1 rounded px-2 py-1 text-xs text-foreground-secondary hover:bg-surface-active">${svg(14)}Open in new tab</a>`, `<a href="#" class="flex items-center gap-1 rounded px-2 py-1 text-foreground-secondary hover:bg-surface-active">${svg(14)}${text("span", "small-tight|secondary", "Open in new tab")}</a>`, "Open in new tab");
  add(`Stream owner-only notice (${ctx})`, panel, "", `<div class="flex aspect-video w-full items-center justify-center bg-action-hover px-6 text-center text-sm text-foreground-subtle">${OWNER}</div>`, `<div class="flex aspect-video w-full items-center justify-center bg-action-hover px-6">${text("p", notice, OWNER, "text-center")}</div>`, OWNER);
  add(`Stream footer (${ctx})`, panel, "", `<p class="border-t border-border-base bg-surface-muted px-3 py-2 text-xs font-medium text-foreground-body">${FOOT}</p>`, `<div class="border-t border-border-base bg-surface-muted px-3 py-2">${text("p", "small-medium-tight|body", FOOT)}</div>`, FOOT);
}

// Computer tab.
const PILL_PARENT = "flex flex-col items-center justify-center gap-4 text-center";
const DOT = (c) => `<span aria-hidden="" class="size-1.5 rounded-full ${c}"></span>`;
add("Computer status pill (stopped)", true, PILL_PARENT, `<span class="relative flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-surface/10 text-foreground-disabled">${DOT("bg-zinc-400")}${S}</span>`, `<span class="relative flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-surface/10">${DOT("bg-zinc-400")}${text("span", "small-medium-tight|disabled", S)}</span>`);
add("Computer status pill (running)", true, PILL_PARENT, `<span class="relative flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-500/15 text-emerald-300">${DOT("bg-emerald-400")}${S}</span>`, `<span class="relative flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-emerald-500/15">${DOT("bg-emerald-400")}${text("span", "small-medium-tight|success-light", S)}</span>`);
add("Computer volume path <code>", true, "flex min-w-0 flex-col gap-0.5", `<code class="text-xs text-foreground-emphasis">/home/user/${S}</code>`, text("code", "small-mono-tight|emphasis", `/home/user/${S}`), `/home/user/${S}`);
const MOUNT = "font-sans text-caption font-normal text-foreground-base !text-foreground-tertiary";
add("Computer volume name (inside the Text small line)", true, "flex min-w-0 flex-col gap-0.5", `<p data-slot="text" class="${MOUNT}">Persistent volume <span class="font-mono text-xs text-foreground-subtle">${S}</span></p>`, `<p data-slot="text" class="${MOUNT}">Persistent volume ${text("span", "small-mono-tight|subtle", S)}</p>`);
add("Computer volume name: the line", true, "flex min-w-0 flex-col gap-0.5", `<p data-slot="text" class="${MOUNT}">Persistent volume <span class="font-mono text-xs text-foreground-subtle">${S}</span></p>`, `<p data-slot="text" class="${MOUNT}">Persistent volume ${text("span", "small-mono-tight|subtle", S)}</p>`, "Persistent volume");

// Settings tab.
const PAUSE_OLD = (t) => `<span class="max-w-full truncate rounded-full border border-warning-border bg-warning-surface px-2.5 py-0.5 text-xs text-amber-800">${t}</span>`;
const PAUSE_NEW = (t) => `<span class="flex min-w-0 max-w-full rounded-full border border-warning-border bg-warning-surface px-2.5 py-0.5">${text("span", "small-tight|warning-strong", t, "truncate")}</span>`;
add("Settings pause pill", true, "mt-1.5 flex flex-wrap gap-1.5", PAUSE_OLD(S) + PAUSE_OLD("Other"), PAUSE_NEW(S) + PAUSE_NEW("Other"));
add("Settings pause pill (long, truncated at 160px)", true, "mt-1.5 flex flex-wrap gap-1.5", PAUSE_OLD(LONG), PAUSE_NEW(LONG), LONG, ":scope > *", "160px");
add("Settings +N more", true, "mt-1.5 flex flex-wrap gap-1.5", PAUSE_OLD("Other") + `<span class="px-1 py-0.5 text-xs text-foreground-tertiary">+3 more</span>`, PAUSE_NEW("Other") + `<span class="flex px-1 py-0.5">${text("span", "small-tight|muted", "+3 more")}</span>`, "+3 more", ":scope > :nth-child(2)");
const CONSEQ = (tag) => `<p data-slot="text" class="font-sans text-body-md font-normal text-foreground-base !text-foreground-emphasis">Title</p>${tag}`;
add("Settings consequence tag (warn)", true, "flex items-center justify-between gap-3", CONSEQ(`<span class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium bg-warning-surface text-warning-foreground">${S}</span>`).replace("text-body-md", "text-body"), CONSEQ(`<span class="flex shrink-0 rounded-full px-2 py-0.5 bg-warning-surface">${text("span", "small-medium-tight|warning", S)}</span>`), S, ":scope > :nth-child(2)");
add("Settings consequence tag (kept)", true, "flex items-center justify-between gap-3", CONSEQ(`<span class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700">${S}</span>`).replace("text-body-md", "text-body"), CONSEQ(`<span class="flex shrink-0 rounded-full px-2 py-0.5 bg-emerald-50">${text("span", "small-medium-tight|success-strong", S)}</span>`), S, ":scope > :nth-child(2)");

// Skills tab.
const TRIG_OLD = (t) => `<span class="max-w-full truncate rounded-full border border-border-base bg-surface-muted px-2.5 py-0.5 text-xs text-foreground-secondary">${t}</span>`;
const TRIG_NEW = (t) => `<span class="flex min-w-0 max-w-full rounded-full border border-border-base bg-surface-muted px-2.5 py-0.5">${text("span", "small-tight|secondary", t, "truncate")}</span>`;
add("Skill trigger pill", true, "mt-auto flex flex-wrap gap-1.5", TRIG_OLD(S) + TRIG_OLD("weekly"), TRIG_NEW(S) + TRIG_NEW("weekly"));
add("Skill trigger pill (long, truncated at 160px)", true, "mt-auto flex flex-wrap gap-1.5", TRIG_OLD(LONG), TRIG_NEW(LONG), LONG, ":scope > *", "160px");
add("Skill +N", true, "mt-auto flex flex-wrap gap-1.5", TRIG_OLD("weekly") + `<span class="rounded-full px-1.5 py-0.5 text-xs text-foreground-tertiary">+2</span>`, TRIG_NEW("weekly") + `<span class="flex rounded-full px-1.5 py-0.5">${text("span", "small-tight|muted", "+2")}</span>`, "+2", ":scope > :nth-child(2)");

// Schedules: the kind badge in its meta line (both inside and outside a tab).
const SMALL_T = `<p data-slot="text" class="font-sans text-caption font-normal text-foreground-base !text-foreground-tertiary">Tomorrow 09:00</p><span class="text-foreground-disabled">•</span>`;
for (const [ctx, panel] of [["profile tab", true], ["schedules panel", false]])
  add(`Schedule kind badge (${ctx})`, panel, "flex flex-wrap items-center gap-x-2 gap-y-0.5", `${SMALL_T}<span class="rounded-md bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700" data-testid="schedule-kind-badge">${S}</span>`, `${SMALL_T}<span class="flex rounded-md bg-emerald-100 px-2 py-0.5" data-testid="schedule-kind-badge">${text("span", "small-tight|success-strong", S)}</span>`, S, ":scope > :nth-child(3)");
const DT = `<dt class="flex-shrink-0 text-body-sm leading-inherit text-foreground-tertiary">Schedule ID</dt>`;
const DD_BASE = "min-w-0 truncate text-right text-body-sm font-medium leading-inherit text-foreground-emphasis";
const ROW = "flex items-baseline justify-between gap-6 px-4 py-2.5";
add("Schedule dialog mono <dd>", false, ROW, `${DT}<dd class="min-w-0 truncate text-right font-mono text-xs font-normal tracking-tight text-foreground-secondary">${S}</dd>`, `${DT}<dd data-slot="text" class="${T["small-mono-tight-tracking|secondary"]} min-w-0 truncate text-right">${S}</dd>`, S, ":scope > :nth-child(2)");
add("Schedule dialog <dd> (not mono)", false, ROW, `${DT}<dd class="${DD_BASE}">${S}</dd>`, `${DT}<dd data-slot="text" class="${T["body-sm-medium-inherit|emphasis"]} min-w-0 truncate text-right">${S}</dd>`, S, ":scope > :nth-child(2)");
add("Schedule dialog mono <dd> (long, truncated at 200px)", false, ROW, `${DT}<dd class="min-w-0 truncate text-right font-mono text-xs font-normal tracking-tight text-foreground-secondary">${LONG}</dd>`, `${DT}<dd data-slot="text" class="${T["small-mono-tight-tracking|secondary"]} min-w-0 truncate text-right">${LONG}</dd>`, LONG, ":scope > :nth-child(2)", "200px");

const MEASURE = ({ rows, side, lh }) => {
  const host = document.createElement("div");
  host.style.width = "360px";
  document.body.appendChild(host);
  const out = [];
  const rd = (n) => Math.round(n * 100) / 100;
  for (const r of rows) {
    const wrap = document.createElement("div");
    const panel = document.createElement("div");
    if (side === "old" && r.panel) { wrap.setAttribute("data-profile-tabs", ""); panel.setAttribute("role", "tabpanel"); }
    panel.style.lineHeight = lh;
    const parent = document.createElement("div");
    parent.className = r.parent;
    if (r.width) parent.style.width = r.width;
    parent.innerHTML = side === "old" ? r.oldH : r.newH;
    panel.appendChild(parent); wrap.appendChild(panel); host.appendChild(wrap);
    const outer = parent.querySelector(r.outer);
    const walker = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT);
    let node = null;
    while (walker.nextNode()) if (walker.currentNode.textContent.includes(r.target)) { node = walker.currentNode; break; }
    let holder = node ? node.parentElement : parent.querySelector("input");
    const ob = outer.getBoundingClientRect();
    let tb = holder.getBoundingClientRect();
    if (node) { const range = document.createRange(); range.selectNodeContents(node); tb = range.getBoundingClientRect(); }
    const cs = getComputedStyle(holder);
    const ph = holder.tagName === "INPUT" ? getComputedStyle(holder, "::placeholder") : null;
    // Visible text: the text box clipped to the holder's content box (an
    // overflow-hidden element paints the ellipsis inside it).
    const hb = holder.getBoundingClientRect();
    const right = hb.right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth);
    const clipped = holder.scrollWidth > holder.clientWidth;
    const cut = clipped ? `cut, visible ${rd(Math.min(tb.right, right) - ob.x)}px from the box's left` : "whole";
    out.push({
      name: r.name,
      box: `${rd(ob.width)}x${rd(ob.height)}`,
      text: `@${rd(tb.x - ob.x)},${rd(tb.y - ob.y)} ${rd(tb.width)}x${rd(tb.height)}`,
      type: `${cs.fontSize}/${cs.lineHeight} ${cs.fontWeight} ${cs.fontFamily.split(",")[0]} ls=${cs.letterSpacing} ${cs.textTransform} ${cs.color}${ph ? ` ph=${ph.fontSize}/${ph.lineHeight}` : ""}`,
      cut,
    });
  }
  host.remove();
  return out;
};

async function main() {
  const browser = await chromium.launch({ args: ARGS });
  const results = {};
  for (const width of [1280, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, reducedMotion: "reduce", colorScheme: "light", locale: "en-US", timezoneId: "UTC" });
    const r = await ctx.request.post("http://localhost:3000/api/auth/sign-in/email", { data: { email: process.env.E, password: process.env.P } });
    if (!r.ok()) throw new Error(`sign-in ${r.status()}`);
    const page = await newPage(ctx);
    await page.goto("http://localhost:3000/team/autopilot", { waitUntil: "load" });
    await settle(page);
    for (const lh of ["1.5", "30px", "normal"])
      results[`${width}@${lh}`] = await page.evaluate(MEASURE, { rows: P, side, lh });
    // Per pair, a screenshot of the outer box (underline, ellipsis, glyphs),
    // and for hover pairs the text colour under the pointer.
    const shotDir = out.replace(/\.json$/, "") + "-shots";
    fs.mkdirSync(shotDir, { recursive: true });
    for (const [i, r] of P.entries()) {
      await page.evaluate(({ r, side }) => {
        document.getElementById("eq-host")?.remove();
        const wrap = document.createElement("div");
        wrap.id = "eq-host";
        wrap.style.cssText = "position:fixed;left:0;top:0;width:360px;background:#fff;z-index:2147483647;padding:8px";
        if (side === "old" && r.panel) wrap.setAttribute("data-profile-tabs", "");
        const panel = document.createElement("div");
        if (side === "old" && r.panel) panel.setAttribute("role", "tabpanel");
        panel.style.lineHeight = "1.5";
        const parent = document.createElement("div");
        parent.className = r.parent;
        if (r.width) parent.style.width = r.width;
        parent.innerHTML = side === "old" ? r.oldH : r.newH;
        panel.appendChild(parent); wrap.appendChild(panel); document.body.appendChild(wrap);
      }, { r, side });
      const outer = page.locator("#eq-host > div > div").locator(r.outer).first();
      fs.writeFileSync(`${shotDir}/${String(i).padStart(2, "0")}__${width}.png`, await outer.screenshot({ animations: "disabled", caret: "hide" }));
      if (r.hover) {
        await outer.hover();
        await page.waitForTimeout(300);
        const hovered = await page.evaluate((target) => {
          const w = document.createTreeWalker(document.getElementById("eq-host"), NodeFilter.SHOW_TEXT);
          while (w.nextNode()) if (w.currentNode.textContent.includes(target)) {
            const cs = getComputedStyle(w.currentNode.parentElement);
            return `${cs.color}; decoration ${cs.textDecorationLine} on the button: ${getComputedStyle(w.currentNode.parentElement.closest("button")).textDecorationLine}`;
          }
          return null;
        }, r.target);
        fs.writeFileSync(`${shotDir}/${String(i).padStart(2, "0")}__${width}__hover.png`, await outer.screenshot({ animations: "disabled", caret: "hide" }));
        results[`${width}@hover`] = (results[`${width}@hover`] || []).concat([{ name: r.name, hovered }]);
        await page.mouse.move(1000, 800);
      }
    }
    await page.evaluate(() => document.getElementById("eq-host")?.remove());
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(out, JSON.stringify(results, null, 1));
  console.log("measured", Object.keys(results).length, "contexts x", P.length, "pairs");
}
main().catch((e) => { console.error(e); process.exit(1); });
