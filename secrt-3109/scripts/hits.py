# Usage: python3 hits.py <unix-format oxlint output file> -> TSV: file line col rule token
import re, sys
pat = re.compile(r'^(src/[^:]+):(\d+):(\d+): (.*) \[Error/shadcn\(([a-z-]+)\)\]$')
for line in open(sys.argv[1]):
    m = pat.match(line.rstrip("\n"))
    if not m: continue
    f, l, c, msg, rule = m.groups()
    tok = ""
    t = re.match(r'^"(.+?)" ', msg) or re.match(r'^((?:fill|stroke|stopColor|stop-color|color)="[^"]*")', msg) or re.match(r'^(.{0,60})', msg)
    tok = t.group(1)
    print("\t".join([f, l, c, rule, tok]))
