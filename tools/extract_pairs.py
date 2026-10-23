"""Every class string the PR writes, paired with what it replaced.
old = dev SHA, new = head. Output JSON: [{file, kind, old, new, oldStyle?, newStyle?}]
kind: literal (a class string literal, paired by alignment), text (effective
<Text> class list: variant + tone + className, as Text renders it)."""
import difflib, json, re, subprocess, sys
BASE, HEAD = sys.argv[1], sys.argv[2]
DIR = "autogpt_platform/frontend/src/components/organisms"
files = subprocess.check_output(["git", "diff", "--name-only", BASE, HEAD, "--", DIR], text=True).split()
def show(rev, f):
    try: return subprocess.check_output(["git", "show", f"{rev}:{f}"], text=True)
    except subprocess.CalledProcessError: return ""
LIT = re.compile(r'"((?:[^"\\\n]|\\.)*)"')
CLASSY = re.compile(r"^[!a-zA-Z0-9:\-\[\]\.\/_&%(),#>*=@'~+ ]+$")
def strip_comments(s):
    s = re.sub(r"\{/\*.*?\*/\}", "", s, flags=re.S)
    return re.sub(r"^\s*//.*$", "", s, flags=re.M)
def literals(s):
    return [m.group(1) for m in LIT.finditer(strip_comments(s))]
TEXT = re.compile(r"<Text\b((?:[^<>]|=>|\{[^{}]*\})*?)/?>", re.S)
def texts(s):
    out = []
    for m in TEXT.finditer(strip_comments(s)):
        a = m.group(1)
        v = re.search(r'\bvariant="([\w-]+)"', a); sz = re.search(r'\bsize="([\w-]+)"', a)
        t = re.search(r'\btone="([\w-]+)"', a)
        cm = re.search(r'className=(\{(?:[^{}]|\{[^{}]*\})*\}|"[^"]*")', a)
        cls = " ".join(LIT.findall(cm.group(1))) if cm else ""
        dyn = bool(cm and cm.group(1).startswith("{") and not cm.group(1).startswith("{cn("))
        out.append({"variant": (sz or v).group(1) if (sz or v) else None, "tone": t.group(1) if t else None, "cls": cls, "dyn": dyn})
    return out
pairs, unmatched = [], []
for f in files:
    o, n = show(BASE, f), show(HEAD, f)
    lo, ln = literals(o), literals(n)
    sm = difflib.SequenceMatcher(None, lo, ln, autojunk=False)
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal": continue
        if op == "replace" and i2 - i1 == j2 - j1:
            for a, b in zip(lo[i1:i2], ln[j1:j2]):
                pairs.append({"file": f, "kind": "literal", "old": a, "new": b})
        else:
            unmatched.append({"file": f, "op": op, "old": lo[i1:i2], "new": ln[j1:j2]})
    to, tn = texts(o), texts(n)
    if len(to) != len(tn):
        unmatched.append({"file": f, "op": "text-count", "old": len(to), "new": len(tn)})
    for a, b in zip(to, tn):
        if a != b:
            pairs.append({"file": f, "kind": "text", "old": a, "new": b})
json.dump({"pairs": pairs, "unmatched": unmatched}, sys.stdout, indent=1)
