const ts = require("typescript"); const fs = require("fs"), path = require("path");
const names = ["DropdownMenuTrigger","DropdownMenuGroup","DropdownMenuRadioGroup","PopoverTrigger","PopoverAnchor","Accordion","AccordionItem","AccordionTrigger","AccordionContent","Dialog.Trigger"];
const src = { DropdownMenuTrigger:"molecules/DropdownMenu/DropdownMenu", DropdownMenuGroup:"molecules/DropdownMenu/DropdownMenu", DropdownMenuRadioGroup:"molecules/DropdownMenu/DropdownMenu", PopoverTrigger:"molecules/Popover/Popover", PopoverAnchor:"molecules/Popover/Popover", Accordion:"molecules/Accordion/Accordion", AccordionItem:"molecules/Accordion/Accordion", AccordionTrigger:"molecules/Accordion/Accordion", AccordionContent:"molecules/Accordion/Accordion", "Dialog.Trigger":"molecules/Dialog/Dialog" };
const usage = {}; const files = {};
(function walk(d){ for (const f of fs.readdirSync(d)) { const p = path.join(d,f); if (fs.statSync(p).isDirectory()) walk(p); else if (p.endsWith(".tsx")) scan(p);} })("src");
function scan(f) {
  const text = fs.readFileSync(f,"utf8");
  const sf = ts.createSourceFile(f, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  (function v(n){
    if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
      const tag = n.tagName.getText(sf);
      if (names.includes(tag) && text.includes(src[tag] + '"') && !f.includes(src[tag].split("/")[1] + "/" + src[tag].split("/")[1] + ".tsx")) {
        usage[tag] = usage[tag] || {}; files[tag] = files[tag] || new Set(); files[tag].add(f);
        for (const a of n.attributes.properties) { const k = ts.isJsxAttribute(a) ? a.name.getText(sf) : "{...spread}"; usage[tag][k] = (usage[tag][k]||0)+1; }
        if (!n.attributes.properties.length) usage[tag]["(none)"] = (usage[tag]["(none)"]||0)+1;
      }
    }
    ts.forEachChild(n, v);
  })(sf);
}
for (const t of names) console.log(`${t} | ${files[t] ? files[t].size : 0} files | ${Object.entries(usage[t]||{}).map(([k,c])=>`${k}×${c}`).join(", ")}`);
fs.writeFileSync("/home/vercel-sandbox/autogpt/.context/importers.json", JSON.stringify(Object.fromEntries(Object.entries(files).map(([k,s])=>[k,[...s].sort()])), null, 1));
