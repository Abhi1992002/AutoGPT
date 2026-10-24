"""Remove every `dark:` class from the given files (darkMode is `.dark-mode`, never set)."""
import re, sys
RUN = re.compile(r'(["\'`])((?:(?!\1)[^{}\\])*?)\1', re.S)
def fix_run(m):
    q, body = m.group(1), m.group(2)
    if "dark:" not in body:
        return m.group(0)
    lead = re.match(r"^\s*", body).group(0)
    trail = re.search(r"\s*$", body).group(0)
    core = body[len(lead):len(body) - len(trail)] if trail else body[len(lead):]
    # keep internal whitespace (newlines) between surviving words
    parts = re.split(r"(\s+)", core)
    words = []
    for i in range(0, len(parts), 2):
        w = parts[i]
        sep = parts[i - 1] if i > 0 else ""
        if w.startswith("dark:"):
            continue
        words.append((sep, w))
    out = ""
    for k, (sep, w) in enumerate(words):
        out += ("" if k == 0 else (sep if "\n" in sep else " ")) + w
    return f"{q}{lead if out else ''}{out}{trail if out else ''}{q}"
total = 0
for f in sys.argv[1:]:
    src = open(f).read()
    n = len(re.findall(r"(?<![\w-])dark:[^\s\"'`]+", src))
    if not n:
        continue
    new = RUN.sub(fix_run, src)
    new = re.sub(r'\s+className=""', "", new)
    left = len(re.findall(r"(?<![\w-])dark:[^\s\"'`]+", new))
    total += n - left
    print(f"{f}: removed {n - left}, left {left}")
    open(f, "w").write(new)
print("total removed", total)
