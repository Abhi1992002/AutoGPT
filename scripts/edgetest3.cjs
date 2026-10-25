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
  const p = await (await b.newContext({ viewport: { width: 600, height: 300 }, deviceScaleFactor: 1 })).newPage();
  await p.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  const shots = {};
  for (const k of Object.keys(V)) {
    shots[k] = [];
    for (const off of [0, 0.25, 0.33, 0.5, 0.75]) {
      await p.evaluate(({ html, off }) => {
        document.getElementById("t")?.remove();
        const d = document.createElement("div"); d.id = "t";
        d.style.cssText = `position:fixed;left:${10 + off}px;top:${10 + off}px;width:300px;background:#fff;z-index:2147483647;padding:4px`;
        d.innerHTML = `<div class="flex flex-wrap gap-1.5">${html}</div><div class="flex flex-wrap gap-1.5" style="width:120px;margin-top:6px">${html.replace(/Vendor/g, "Quarterly vendor renewal checklist")}</div>`;
        document.body.appendChild(d);
      }, { html: V[k]("Vendor sync"), off });
      shots[k].push(await p.locator("#t").screenshot());
    }
  }
  const fs=require("fs"); for (const k of Object.keys(shots)) shots[k].forEach((s,i)=>fs.writeFileSync(`/tmp/edge-${k}-${i}.png`, s));
  for (const k of Object.keys(V).filter((k) => k !== "old")) console.log(k, shots[k].map((s, i) => s.equals(shots.old[i]) ? "same" : "DIFF").join(" "));
  await b.close();
})();
