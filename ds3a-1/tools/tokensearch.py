# usage: python3 -I tokensearch.py <base> <head>  -> for every raw colour named in a TODO(tokens) comment the PR adds,
# the DS1 token search at <head>: every --color-* in src/app/globals.css whose RGB equals it, and every
# scripts/codemod-tokens.ts mapping that replaces that exact class. "none" proves no token holds the value.
import re, subprocess, sys
R = "/home/vercel-sandbox/autogpt"; F = "autogpt_platform/frontend"
base, head = sys.argv[1:3]
show = lambda p: subprocess.run(["git", "-C", R, "show", f"{head}:{F}/{p}"], capture_output=True, text=True).stdout
css, codemod = show("src/app/globals.css"), show("scripts/codemod-tokens.ts")
tokens = {}
root = css[css.index(":root {"):css.index(".dark {")]  # the light theme; the app is forcedTheme="light"
for m in re.finditer(r"--color-([\w-]+):\s*(\d+) (\d+) (\d+);", root):
    tokens.setdefault("#%02X%02X%02X" % tuple(map(int, m.group(2, 3, 4))), []).append(f"--color-{m.group(1)}")
maps = re.findall(r'token: "([^"]+)", replaces: \[([^\]]*)\]', codemod)
diff = subprocess.run(["git", "-C", R, "diff", "-U0", base, head, "--", f"{F}/src"], capture_output=True, text=True).stdout
seen, rows, f, ln = set(), [], None, 0
lines = diff.splitlines()
for i, l in enumerate(lines):
    if l.startswith("+++ "): f = l[6:].replace(F + "/", ""); continue
    m = re.match(r"@@ -\S+ \+(\d+)", l)
    if m: ln = int(m.group(1)) - 1; continue
    if l.startswith("+"):
        ln += 1
        if "TODO(tokens)" not in l: continue
        text, j = l, i + 1
        block = not l[1:].strip().startswith("//") and "*/" not in l  # a /* */ block, the TODO on any of its lines
        while j < len(lines) and lines[j].startswith("+") and j - i < 6:
            nxt = lines[j][1:].strip()
            if block: text += " " + nxt; j += 1; block = "*/" not in nxt; continue
            if nxt.startswith("//") and "TODO(" not in nxt: text += " " + nxt[2:].strip(); j += 1; continue
            break
        for cls, hx in re.findall(r"([\w:\[\]=&\-().>/]*(?:neutral|zinc|gray|slate|stone)-\d+(?:/\d+)?),?\s*(?:is\s*)?\(?(#[0-9A-Fa-f]{6})", text):
            hx = hx.upper(); key = (f, ln, hx)
            if key in seen: continue
            seen.add(key)
            plain = cls.split(":")[-1]
            mapped = [t for t, rep in maps if f'"{plain}"' in rep]
            rows.append(f"| `{f}:{ln}` | `{cls}` | {hx} | {', '.join(tokens.get(hx, [])) or 'none'} | {', '.join(mapped) or 'none'} |")
print(f"DS1 token search at {head} (globals.css `--color-*` RGB equal to the value; codemod-tokens.ts mappings for the exact class):\n")
print("| TODO(tokens) at | raw class | value | `--color-*` with that RGB | codemod mapping |\n| --- | --- | --- | --- | --- |")
print("\n".join(rows) if rows else "| (no colour TODO(tokens) added) | | | | |")
