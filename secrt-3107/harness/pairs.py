"""Pairs every class string this branch changed with its dev original.

usage: python3 pairs.py <base sha> > pairs.json   (cwd: frontend dir)
"""
import difflib, json, re, subprocess, sys

base = sys.argv[1]
SEG = re.compile(r'[^"\'`{}]+')
TODO_LINE = re.compile(r"^[ \t]*//[^\n]*TODO\(tokens\)[^\n]*\n", re.M)
CLASSY = re.compile(r'^[!\w\-:\[\]/.#&>*+(),%=@]+$')

files = subprocess.check_output(
    ["git", "diff", "--relative", "--name-only", f"{base}", "--", "src/components/contextual", "src/components/renderers"],
    text=True).split()

def segments(src):
    return [(m.group(0), m.start()) for m in SEG.finditer(src)]

def norm(s):
    return " ".join(s.split())

def component_context(src, offset):
    """Nearest opening JSX tag before offset, with its variant/tone if it is <Text>."""
    start = src.rfind("<", 0, offset)
    while start >= 0 and not re.match(r"<[A-Za-z]", src[start:start + 2]):
        start = src.rfind("<", 0, start)
    if start < 0:
        return None
    tag_m = re.match(r"<([A-Za-z][\w.]*)", src[start:])
    between = src[start:offset]
    if re.search(r"(?<![=\-])>", between.replace("=>", "")):  # tag already closed
        return None
    tag = tag_m.group(1)
    end = src.find(">", offset)
    whole = src[start:end if end > 0 else offset]
    variant = re.search(r'\bvariant="([\w-]+)"', whole)
    size = re.search(r'\bsize="([\w-]+)"', whole)
    tone = re.search(r'\btone="([\w-]+)"', whole)
    return {
        "tag": tag,
        "variant": variant.group(1) if variant else None,
        "size": size.group(1) if size else None,
        "tone": tone.group(1) if tone else None,
    }

pairs, odd = [], []
for f in files:
    try:
        old = subprocess.check_output(["git", "show", f"{base}:autogpt_platform/frontend/{f}"], text=True)
    except subprocess.CalledProcessError:
        continue
    new_raw = open(f).read()
    new = TODO_LINE.sub("", new_raw)
    a, b = segments(old), segments(new)
    sm = difflib.SequenceMatcher(None, [norm(s) for s, _ in a], [norm(s) for s, _ in b], autojunk=False)
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal":
            continue
        if op != "replace" or (i2 - i1) != (j2 - j1):
            odd.append({"file": f, "op": op, "old": [norm(s) for s, _ in a[i1:i2]], "new": [norm(s) for s, _ in b[j1:j2]]})
            continue
        for (os_, oo), (ns, no) in zip(a[i1:i2], b[j1:j2]):
            on, nn = norm(os_), norm(ns)
            if on == nn:
                continue
            if not all(CLASSY.match(t) for t in (on + " " + nn).split()):
                odd.append({"file": f, "op": "nonclass", "old": [on], "new": [nn]})
                continue
            line = new[:no].count("\n") + 1
            pairs.append({"file": f, "line": line, "old": on, "new": nn, "ctx": component_context(new, no)})

json.dump({"pairs": pairs, "odd": odd}, sys.stdout, indent=1)
