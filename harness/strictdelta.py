# Exact strict-hit delta between two SHAs (DS4 oxlint, -f unix output in
# .context/counts): hits removed from the base and added at the head, by
# file:line, matched by (file, rule, message) with renames followed, so a hit
# whose line merely shifted is neither. Removed hits on a file the head moved
# into molecules/** (where DS4 turns no-restyle off) are labelled as hidden by
# the move. usage: strictdelta.py <base> <head>
import collections, re, subprocess, sys

ROOT = "/home/vercel-sandbox/autogpt"
COUNTS = ROOT + "/.context/counts"
FE = "autogpt_platform/frontend/"
LINE = re.compile(r"^(src/[^:]+):(\d+):(\d+): (.*) \[(\w+)/([^\]]+)\]$")


def hits(sha):
    out = []
    for l in open(f"{COUNTS}/{sha}-src.unix.txt"):
        m = LINE.match(l.strip())
        if m:
            out.append((m[1], int(m[2]), m[4], m[6]))
    return out


def renames(base, head):
    r = {}
    txt = subprocess.run(["git", "diff", "-B", "-M", "--name-status", base, head, "--", FE + "src"], capture_output=True, text=True, cwd=ROOT).stdout
    for l in txt.splitlines():
        p = l.split("\t")
        if p[0].startswith("R"):
            r[p[1][len(FE):]] = p[2][len(FE):]
    return r


def delta(base, head):
    ren = renames(base, head)
    b, h = hits(base), hits(head)
    # The message names the primitive's own file, which moves in this stack;
    # a hit is the same hit when the file, rule, class and element match.
    key = lambda f, msg, rule: (f, rule, tuple(re.findall(r'"[^"]*"|<[\w.]+>', msg)[:2]))
    hb = collections.defaultdict(list)
    for f, ln, msg, rule in h:
        hb[key(f, msg, rule)].append((ln, msg))
    removed, added = [], []
    for f, ln, msg, rule in b:
        k = key(ren.get(f, f), msg, rule)
        if hb[k]:
            hb[k].pop(0)
        else:
            removed.append((f, ln, rule, msg, ren.get(f)))
    for (f, rule, _), rest in hb.items():
        for ln, msg in rest:
            added.append((f, ln, rule, msg))
    return removed, added, len(b), len(h)


def short(msg):
    m = re.match(r'("[^"]*") (?:is not allowed on|uses|hardcodes)', msg)
    el = re.search(r"on (<[\w.]+>)", msg)
    if m:
        return m[1] + (f" on {el[1]}" if el else "")
    sz = re.match(r"Use a (\w+) size", msg)
    if sz:
        return f"spacing class (padding/size) on <{sz[1]}>"
    return msg[:90]


if __name__ == "__main__":
    base, head = sys.argv[1:3]
    removed, added, nb, nh = delta(base, head)
    hidden = [r for r in removed if r[4] and "/molecules/" in r[4] and r[2] == "shadcn(no-restyle)"]
    print(f"src {nb} -> {nh} ({nh - nb:+d}): {len(removed)} removed ({len(hidden)} of them hidden by a move into molecules/**), {len(added)} added")
    for f, ln, rule, msg, to in sorted(removed):
        why = f"  [hidden: file moved to {to}, where no-restyle is off]" if (f, ln, rule, msg, to) in hidden else (f"  [file moved to {to}]" if to else "")
        print(f"- {f}:{ln} {rule.replace('shadcn(', '').rstrip(')')}: {short(msg)}{why}")
    for f, ln, rule, msg in sorted(added):
        print(f"+ {f}:{ln} {rule.replace('shadcn(', '').rstrip(')')}: {short(msg)}")
