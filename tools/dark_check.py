"""QUALITY 43 (1): every dark: class on a removed line of `git diff <base>...<head>`
reappears verbatim on an added code line (comment lines don't count).
  python3 dark_check.py <base> <head>"""
import re, subprocess, sys, collections
base, head = sys.argv[1:3]
d = subprocess.run(["git", "diff", f"{base}...{head}"], cwd="/home/vercel-sandbox/autogpt", capture_output=True, text=True).stdout
TOK = re.compile(r"[\w\-\[\]/.!]*(?:[\w\-\[\]]+:)*dark:[\w\-\[\]/:.!#]+")
iscomment = lambda l: re.match(r"^\s*(//|\{/\*|/\*|\*)", l) is not None
rem, add = collections.Counter(), collections.Counter()
nrem = 0
for l in d.splitlines():
    if l.startswith("---") or l.startswith("+++"): continue
    if l.startswith("-") and "dark:" in l:
        nrem += 1
        if not iscomment(l[1:]): rem.update(t.strip("\"'`,{}()") for t in TOK.findall(l[1:]))
    elif l.startswith("+") and "dark:" in l and not iscomment(l[1:]):
        add.update(t.strip("\"'`,{}()") for t in TOK.findall(l[1:]))
missing = {t: n - add[t] for t, n in rem.items() if add[t] < n}
print(f"$ git diff {base}...{head} | grep -E '^-.*dark:'  -> {nrem} lines, {sum(rem.values())} dark: classes ({len(rem)} distinct)")
print(f"each on an added code line: {sum(rem.values()) - sum(missing.values())} of {sum(rem.values())}; missing: {missing or 'none'}")
