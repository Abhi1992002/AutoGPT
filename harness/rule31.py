# QUALITY 31: lines a PR adds outside atoms/Text that carry role typography
# (role sizes, leading-*, font weights). Each must be a Text element or listed
# under Deviations. Comment lines are skipped (they name classes, set none).
# usage: rule31.py <base> <head>
import re, subprocess, sys

b, h = sys.argv[1:3]
ROLE = re.compile(r"(?<![\w-])((?:[\w-]+:)*(?:text-(?:display|title|heading|heading-sm|lead|body-lg|body-md|body|body-sm|caption|caption-sm)|leading-[\w.\[\]]+|font-(?:normal|medium|semibold|bold)))(?![\w-])")
d = subprocess.run(["git", "diff", "-U0", "-M", b, h, "--", "autogpt_platform/frontend/src", ":(exclude)autogpt_platform/frontend/src/components/atoms/Text"], capture_output=True, text=True, cwd="/home/vercel-sandbox/autogpt").stdout
f = ln = None
n = 0
for line in d.splitlines():
    if line.startswith("+++ "):
        f = line[6:].replace("autogpt_platform/frontend/", "")
    elif line.startswith("@@"):
        ln = int(re.search(r"\+(\d+)", line)[1])
    elif line.startswith("+"):
        code = line[1:].strip()
        hits = [] if code.startswith(("//", "*", "/*", "{/*")) else ROLE.findall(line)
        if hits:
            n += 1
            print(f"{f}:{ln}: {' '.join(hits)}")
        ln += 1
print(f"({n} added lines with role typography outside atoms/Text)")
