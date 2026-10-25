"""QUALITY 43 + rule 13: every line holding a dark: class (kept as written) gets
its dark colours named in a TODO(tokens): appended to the TODO right above it,
or a new comment line. Wording from regen_todos.compose().
  python3 dark_todos.py <file...>"""
import re, sys
sys.path.insert(0, "/home/vercel-sandbox/tools")
from regen_todos import compose
LABEL = "dark-mode classes kept as written (QUALITY 43): "
manual = []
for f in sys.argv[1:]:
    lines = open(f).read().split("\n")
    out = []; changed = False
    for i, l in enumerate(lines):
        d = [t.strip("\"'`,{}()") for t in re.findall(r"[\w\-\[\]/:.!]*dark:[\w\-\[\]/:.!#]+", l)]
        d = [t for t in d if t]
        if not d:
            out.append(l); continue
        body, _ = compose('"' + " ".join(d) + '"')
        if not body:
            out.append(l); continue
        body = LABEL + body[len("TODO(tokens): "):]
        prev = out[-1] if out else ""
        if "TODO(tokens)" in prev and (prev.strip().startswith("//") or prev.strip().startswith("{/*")):
            if all(t in prev for t in d):
                out.append(l); continue
            if prev.rstrip().endswith("*/}"):
                out[-1] = prev.rstrip()[:-3].rstrip() + "; " + body + " */}"
            else:
                out[-1] = prev.rstrip() + "; " + body
            out.append(l); changed = True; continue
        ind = re.match(r"\s*", l).group(0)
        s = l.strip()
        if s.startswith(("className=", '"', "'", "?", ":", "`")) or re.match(r"^\w+[,)]?$", s) is None and s.startswith(("cn(",)):
            out.append(f"{ind}// TODO(tokens): {body}"); out.append(l); changed = True; continue
        m = re.search(r"^(\s*<[\w.]+)\s+className=", l)
        if m:
            out.append(m.group(1)); out.append(f"{ind}  // TODO(tokens): {body}"); out.append(f"{ind}  " + l[m.end() - len("className="):]); changed = True; continue
        manual.append(f"{f}:{i+1}: {s[:120]}"); out.append(l)
    if changed: open(f, "w").write("\n".join(out))
print(len(manual), "for hand work"); [print("MANUAL", m) for m in manual]
