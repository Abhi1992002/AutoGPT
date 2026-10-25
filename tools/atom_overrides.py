"""Atom className overrides at a head, from DS4's strict no-restyle hits
(-f unix output): one row per element, the atom, and every class it overrides.
  python3 atom_overrides.py <head.unix.txt> <base.unix.txt> <out.md>"""
import re, sys, collections
def rows(f):
    out = collections.OrderedDict()
    for l in open(f):
        m = re.match(r"^src/app/\(platform\)/build/(.+?):(\d+):\d+: \"(.+?)\" is not allowed on <(\w+)>.*no-restyle", l)
        if m: out.setdefault((m.group(1), int(m.group(2)), m.group(4)), []).append(m.group(3))
    return out
head, base = rows(sys.argv[1]), rows(sys.argv[2])
by_atom = collections.Counter(k[2] for k in head)
cls = collections.Counter(c for v in head.values() for c in v)
lines = [f"{sum(len(v) for v in head.values())} overriding classes on {len(head)} atom elements (base: {sum(len(v) for v in base.values())} on {len(base)})", "",
         "| atom | elements |", "| --- | --- |"] + [f"| `<{a}>` | {n} |" for a, n in by_atom.most_common()] + ["",
         "| class | uses |", "| --- | --- |"] + [f"| `{c}` | {n} |" for c, n in cls.most_common()] + ["",
         "| element | atom | classes it overrides |", "| --- | --- | --- |"] + [f"| `{f}:{l}` | `<{a}>` | {' '.join(f'`{c}`' for c in v)} |" for (f, l, a), v in sorted(head.items())]
open(sys.argv[3], "w").write("\n".join(lines) + "\n")
print(lines[0]); print(by_atom.most_common())
