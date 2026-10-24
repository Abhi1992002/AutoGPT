const fs = require("fs"), path = require("path");
const root = path.resolve("src");
const importers = JSON.parse(fs.readFileSync("/home/vercel-sandbox/autogpt/.context/importers.json","utf8"));
function resolve(from, spec) {
  let base;
  if (spec.startsWith("@/")) base = path.join(root, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
  else return null;
  for (const c of [base, base+".tsx", base+".ts", path.join(base,"index.tsx"), path.join(base,"index.ts")]) if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  return null;
}
const cache = new Map();
function deps(f) {
  if (cache.has(f)) return cache.get(f);
  const t = fs.readFileSync(f,"utf8"); const out = [];
  for (const m of t.matchAll(/(?:import|export)[^'"]*?from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g)) { const r = resolve(f, m[1]||m[2]); if (r) out.push(r); }
  cache.set(f, out); return out;
}
function closure(entry) { const seen = new Set([entry]); const st=[entry]; while (st.length) { for (const d of deps(st.pop())) if (!seen.has(d)) { seen.add(d); st.push(d);} } return seen; }
const entries = [];
(function walk(d){ for (const f of fs.readdirSync(d)) { const p = path.join(d,f); if (fs.statSync(p).isDirectory()) walk(p); else if (/\.stories\.tsx$/.test(f)) entries.push(["story", p]); } })(root);
const routes = fs.readFileSync("/home/vercel-sandbox/tools/routes.txt","utf8").trim().split(",").map(r=>r.split("?")[0]);
function findPage(r){ const segs=r.split("/").filter(Boolean); const cands=[]; (function walk(d,i){ if(i===segs.length){ for (const n of ["page.tsx"]) if (fs.existsSync(path.join(d,n))) cands.push(path.join(d,n)); }
  for (const f of fs.readdirSync(d)) { const p=path.join(d,f); if(!fs.statSync(p).isDirectory()) continue; if (/^\(.*\)$/.test(f)) walk(p,i); else if (i<segs.length && (f===segs[i] || /^\[[^.]*\]$/.test(f))) walk(p,i+1); } })(path.join(root,"app"),0); return cands; }
for (const r of routes) for (const p of findPage(r)) { entries.push(["route "+r, p]); for (const l of ["layout.tsx"]) { let d=path.dirname(p); while (d.startsWith(path.join(root,"app"))) { const lf=path.join(d,l); if (fs.existsSync(lf)) entries.push(["route "+r+" (layout)", lf]); d=path.dirname(d);} } }
const cl = entries.map(([k,p]) => [k, p, closure(p)]);
const result = {}; let uncovered = 0;
for (const [comp, files] of Object.entries(importers)) for (const f of files) {
  const abs = path.resolve(f); const hits = cl.filter(([,,s]) => s.has(abs)).map(([k,p]) => k.startsWith("route") ? k : path.relative(root,p));
  const routesHit = [...new Set(hits.filter(h=>h.startsWith("route")).map(h=>h.replace(" (layout)","")))];
  const storiesHit = hits.filter(h=>!h.startsWith("route"));
  result[f] = result[f] || { comps: new Set(), routes: routesHit, stories: storiesHit.length }; result[f].comps.add(comp);
}
const rows = Object.entries(result).sort();
for (const [f, r] of rows) { if (!r.routes.length && !r.stories) uncovered++; console.log(`| \`${f.replace(/^src\//,"")}\` | ${[...r.comps].join(", ")} | ${r.routes.map(x=>x.replace("route ","")).join(" ") || "-"} | ${r.stories} |`); }
console.error(`${rows.length} importer files, ${uncovered} reached by no captured route or story`);
