# usage: python3 -I kbcmp.py <before-dir> <after-dir> -> keyboard/ARIA differences, after setting aside two timing-only differences:
#   the diagnostics page's "Last updated" time, and Radix tooltip triggers read as data-state=instant-open vs closed while Tab passes them
import json, sys, re
a = json.load(open(f"{sys.argv[1]}/keyboard-aria.json")); b = json.load(open(f"{sys.argv[2]}/keyboard-aria.json"))
t = lambda v: re.sub(r"Last updated: [^\"\\]*", "Last updated: <time>", json.dumps(v, sort_keys=True))
tt = lambda v: re.sub(r"data-state=(instant-open|delayed-open|closed)", "data-state=<tooltip>", t(v))
keys = sorted(set(a) | set(b))
real = [k for k in keys if tt(a.get(k)) != tt(b.get(k))]
tip = [k for k in keys if t(a.get(k)) != t(b.get(k)) and k not in real]
print(f"{len(keys)} keyboard/ARIA records; {len(real)} differ" + (": " + ", ".join(real) if real else "") + f"; tooltip open-timing only: {len(tip)}" + (" (" + ", ".join(tip) + ")" if tip else ""))
