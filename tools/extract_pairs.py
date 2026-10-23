"""Every class string this PR rewrites: (old, new) pairs aligned from origin/dev vs HEAD."""
import difflib, json, re, subprocess, sys
FE = "autogpt_platform/frontend/"
files = subprocess.run(["git", "diff", "--name-only", "447fd55be...HEAD", "--", FE + "src"], capture_output=True, text=True, check=True).stdout.split()
RUN = re.compile(r"[^\"'`{}\n]+")
WORD = re.compile(r"^[!\w:\-\[\]/.&>=_()%#,*@+]+$")
def class_runs(src):
    out = []
    for m in RUN.finditer(src):
        s = m.group(0).strip()
        words = s.split()
        # Inline style values (color-mix, gradients with spaces) are checked by
        # style-equivalence.mts, not as class lists.
        style_value = re.match(r"^\d*%", s) or "color-mix" in s or re.search(r"(gradient|rgba?)\([^)]* ", s) or re.search(r"\(var\(--color-[\w-]+\) /", s)
        if words and all(WORD.match(w) for w in words) and any("-" in w for w in words) and "//" not in s and "TODO" not in s and not style_value:
            out.append(s)
    return out
pairs, unpaired = [], []
for f in files:
    old = subprocess.run(["git", "show", f"447fd55be:{f}"], capture_output=True, text=True).stdout
    new = subprocess.run(["git", "show", f"HEAD:{f}"], capture_output=True, text=True).stdout
    a, b = class_runs(old), class_runs(new)
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if tag == "equal":
            continue
        if tag == "replace" and i2 - i1 == j2 - j1:
            for k in range(i2 - i1):
                pairs.append({"file": f[len(FE):], "old": a[i1 + k], "new": b[j1 + k]})
        else:
            unpaired.append({"file": f, "old": a[i1:i2], "new": b[j1:j2]})
json.dump({"pairs": pairs, "unpaired": unpaired}, open(sys.argv[1], "w"), indent=1)
print(len(pairs), "pairs;", len(unpaired), "unpaired groups")
for u in unpaired: print("UNPAIRED", u)
