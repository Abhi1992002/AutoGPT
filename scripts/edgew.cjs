const { chromium, ARGS } = require("/home/vercel-sandbox/autogpt/.context/pr3/det.cjs");
const T = (c, t) => `<span data-slot="text" class="font-sans text-caption font-normal leading-4 ${c} truncate">${t}</span>`;
const W = "max-w-full rounded-full border border-warning-border bg-warning-surface px-2.5 py-0.5", W2 = "max-w-full rounded-full border border-border-base bg-surface-muted px-2.5 py-0.5";
const V = {
  old: (t) => `<span class="${W} truncate text-xs text-amber-800">${t}</span><span class="${W2} truncate text-xs text-foreground-secondary">${t}</span>`,
  flexClip: (t) => `<span class="flex overflow-hidden ${W}">${T("text-amber-800", t)}</span><span class="flex overflow-hidden ${W2}">${T("text-foreground-secondary", t)}</span>`,
  flexClipXs: (t) => `<span class="flex overflow-hidden ${W} text-xs">${T("text-amber-800", t)}</span><span class="flex overflow-hidden ${W2} text-xs">${T("text-foreground-secondary", t)}</span>`,
  flexTrunc: (t) => `<span class="flex truncate ${W}">${T("text-amber-800", t)}</span><span class="flex truncate ${W2}">${T("text-foreground-secondary", t)}</span>`,
  flexTruncXs: (t) => `<span class="flex truncate ${W} text-xs">${T("text-amber-800", t)}</span><span class="flex truncate ${W2} text-xs">${T("text-foreground-secondary", t)}</span>`,
  blockTruncXsLead: (t) => `<span class="${W} truncate text-xs leading-4">${T("text-amber-800", t)}</span><span class="${W2} truncate text-xs leading-4">${T("text-foreground-secondary", t)}</span>`,
};
(async () => {
  const b = await chromium.launch({ args: ARGS });
  const p = await (await b.newContext({ viewport: { width: 600, height: 300 } })).newPage();
  await p.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  for (const k of ["old", "flexClip"]) {
    const r = await p.evaluate((html) => {
      const d = document.createElement("div"); d.style.cssText = "position:fixed;left:10px;top:10px;width:300px";
      d.innerHTML = `<div class="flex flex-wrap gap-1.5">${html}</div>`; document.body.appendChild(d);
      const out = [...d.firstChild.children].map((e) => { const r = e.getBoundingClientRect(); const c = e.firstElementChild?.getBoundingClientRect(); return [r.x, r.width, r.height, c && c.width]; });
      d.remove(); return out;
    }, V[k]("Vendor sync"));
    console.log(k, JSON.stringify(r));
  }
  await b.close();
})();
