# usage: python3 -I grep3132.py <base> <head>  (v2: every JSX element, the whole opening tag incl. cn() and classNames={{...}}, comments stripped)
#  -> rule-31 and rule-32 hits on the lines a PR adds
#   rule 32: a <Text> whose className holds typography (size, line height, weight, family, tracking)
#   rule 31: a raw text element (span/p/div/h1-6/label) whose className holds typography (should be <Text>)
# JSX opening tags are read across lines; a tag counts when any of its lines is added in the diff.
import re, subprocess, sys
R = "/home/vercel-sandbox/autogpt"
base, head = sys.argv[1], sys.argv[2]
TYPO = re.compile(r"(?<![\w-])(text-(xs|sm|base|lg|[2-9]?xl|body(-lg|-md|-sm)?|caption|lead|label|\[[^\]]+\])|leading-[\w\[\].-]+|font-(sans|mono|serif|poppins|normal|medium|semibold|bold|light|thin|extrabold|black|\[[^\]]+\])|tracking-[\w\[\].-]+|\[font-[\w-]+:[^\]]+\])(?![\w-])")
files = [f for f in subprocess.run(["git", "-C", R, "diff", "--name-only", "--diff-filter=AMR", base, head, "--", "autogpt_platform/frontend/src"], capture_output=True, text=True).stdout.split()
         if f.endswith(".tsx") and not any(x in f for x in (".test.", "__tests__", ".stories."))]
hits = {"31": [], "32": []}
for f in files:
    added = set()
    diff = subprocess.run(["git", "-C", R, "diff", "-U0", base, head, "--", f], capture_output=True, text=True).stdout
    for m in re.finditer(r"^@@ -\S+ \+(\d+)(?:,(\d+))? @@", diff, flags=re.M):
        start, n = int(m.group(1)), int(m.group(2) or 1)
        added.update(range(start, start + n))
    src = subprocess.run(["git", "-C", R, "show", f"{head}:{f}"], capture_output=True, text=True).stdout.splitlines()
    i = 0
    while i < len(src):
        m = re.search(r"<([A-Za-z][\w.]*)\b", src[i])
        if not m or src[i].lstrip().startswith(("//", "*", "{/*")): i += 1; continue
        tag = m.group(1); j = i; text = src[i][m.start():]
        # read the whole opening tag (across lines), comments stripped, until its closing ">" at brace depth 0
        depth, done = 0, False
        while True:
            for ch in re.sub(r"=>", "", re.sub(r"//.*", "", text)):
                pass
            body = re.sub(r"//.*", "", text)
            d = 0; end = None
            for ci, ch in enumerate(body):
                if ch == "{": d += 1
                elif ch == "}": d -= 1
                elif ch == ">" and d == 0 and body[ci - 1] != "=": end = ci; break
            if end is not None or j + 1 >= len(src) or j - i > 40: break
            j += 1; text += "\n" + src[j]
        body = re.sub(r"//.*", "", text)
        cls = body[body.find("className"):] if "className" in body else ""
        if cls and any(k + 1 in added for k in range(i, j + 1)):
            found = [t.group(0) for t in TYPO.finditer(" ".join(re.findall(r'"([^"]*)"|`([^`]*)`', cls) and [a or b for a, b in re.findall(r'"([^"]*)"|`([^`]*)`', cls)]))]
            if found:
                rule = "32" if tag == "Text" else "31"
                hits[rule].append(f"{f.replace('autogpt_platform/frontend/', '')}:{i + 1}  <{tag}> {' '.join(found)}")
        i = j + 1 if j > i else i + 1
for rule in ("31", "32"):
    print(f"rule {rule}: {len(hits[rule])} hit(s)")
    for h in hits[rule]: print("  " + h)
