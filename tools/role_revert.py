"""QUALITY 41(c): a hover, active or brand role must not fill a static (or
toggled, or pressed) surface or colour copy. Puts the raw class back and names
the role in a TODO(tokens): appended to the TODO right above the line, or a new
comment line (same placement rules as dark_todos.py).
  python3 role_revert.py <map.json: [[token, raw, todo], ...]> <file...>"""
import json, re, sys
M = json.load(open(sys.argv[1]))
manual = []; n = 0
for f in sys.argv[2:]:
    lines = open(f).read().split("\n"); out = []; changed = False
    for i, l in enumerate(lines):
        notes = []
        for tok, raw, todo in M:
            pat = re.compile(r"(?<![\w:!\[-])" + re.escape(tok) + r"(?![\w-])")
            if pat.search(l):
                k = len(pat.findall(l)); l = pat.sub(raw, l); n += k; notes.append(todo)
        if not notes:
            out.append(l); continue
        body = "; ".join(dict.fromkeys(notes))
        prev = out[-1] if out else ""
        if "TODO(tokens)" in prev and (prev.strip().startswith("//") or prev.strip().startswith("{/*")):
            if prev.rstrip().endswith("*/}"): out[-1] = prev.rstrip()[:-3].rstrip() + "; " + body + " */}"
            else: out[-1] = prev.rstrip() + "; " + body
            out.append(l); changed = True; continue
        ind = re.match(r"\s*", l).group(0); s = l.strip()
        if s.startswith(("className=", '"', "'", "?", ":", "`", "cn(")) or re.match(r"^[\w\"-]+:\s", s) or re.match(r"^\w+\s*&&", s):
            out.append(f"{ind}// TODO(tokens): {body}"); out.append(l); changed = True; continue
        m = re.search(r"^(\s*<[\w.]+)\s+className=", l)
        if m:
            out.append(m.group(1)); out.append(f"{ind}  // TODO(tokens): {body}"); out.append(f"{ind}  " + l[m.end() - len("className="):]); changed = True; continue
        manual.append(f"{f}:{i+1}: {s[:140]}"); out.append(l); changed = True
    if changed: open(f, "w").write("\n".join(out))
print(n, "classes put back;", len(manual), "lines need a TODO by hand"); [print("MANUAL", m) for m in manual]
