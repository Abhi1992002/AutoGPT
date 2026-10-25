# usage: python3 -I lint37.py  -> rule 37(b): every strict-lint hit the moved files carried on base, and what became of it
import json, re, subprocess
R = "/home/vercel-sandbox/autogpt"; W = "/home/vercel-sandbox/wt/count"; FE = W + "/autogpt_platform/frontend"
shas = open(R + "/.context/ev/shas.txt").read().split()[1:]
MOVES = {1: [("__legacy__/ui/carousel.tsx", "molecules/Carousel/Carousel.tsx"), ("__legacy__/ui/collapsible.tsx", None), ("__legacy__/ui/pagination-controls.tsx", "molecules/PaginationControls/PaginationControls.tsx")],
         2: [("__legacy__/ui/calendar.tsx", "atoms/Calendar/Calendar.tsx"), ("__legacy__/ui/loading.tsx", "atoms/LoadingSpinner/LoadingSpinner.tsx"), ("__legacy__/ui/scroll-area.tsx", "molecules/ScrollArea/ScrollArea.tsx")],
         3: [("__legacy__/ui/multiselect.tsx", "molecules/MultiSelect/MultiSelect.tsx"), ("__legacy__/ui/command.tsx", "molecules/MultiSelect/components/Command.tsx")],
         4: [("__legacy__/ui/popover.tsx", None)]}
def lint(sha, files):
    subprocess.run(f"cd {W} && git checkout -q -f --detach {sha} && git clean -qfd autogpt_platform/frontend/src && git checkout -q 1ee6580dc -- autogpt_platform/frontend/.oxlintrc.strict.json", shell=True, check=True)
    out = {}
    for f in files:
        p = f"src/components/{f}"
        r = subprocess.run(f"cd {FE} && pnpm exec oxlint -c .oxlintrc.strict.json -f unix {p}", shell=True, capture_output=True, text=True).stdout
        src = open(f"{FE}/{p}").read().splitlines() if subprocess.run(["test", "-f", f"{FE}/{p}"]).returncode == 0 else []
        hits = []
        for m in re.finditer(r"^[^:]+:(\d+):(\d+): (.*) \[\w+/([a-z-]+\([a-z-]+\))\]$", r, flags=re.M):
            ln = int(m.group(1)); q = re.search(r'"([^"]+)"', m.group(3))
            hits.append({"line": ln, "rule": m.group(4), "token": q.group(1) if q else m.group(3)[:60], "msg": m.group(3)[:90]})
        out[f] = hits
    return out
report = {}
for k, moves in MOVES.items():
    base = lint(shas[k - 1], [o for o, _ in moves]); head = lint(shas[k], [n for _, n in moves if n])
    rows = []
    for old, new in moves:
        for h in base[old]:
            match = [x for x in head.get(new, []) if x["rule"] == h["rule"] and x["token"] == h["token"] and not x.get("used")] if new else []
            if match: match[0]["used"] = True
            rows.append({"file": f"src/components/{old}:{h['line']}", "rule": h["rule"], "token": h["token"], "head": f"src/components/{new}:{match[0]['line']}" if match else None})
        if new:
            for x in head[new]:
                if not x.get("used"):
                    rows.append({"file": None, "rule": x["rule"], "token": x["token"], "head": f"src/components/{new}:{x['line']}"})
    report[k] = rows
    print(f"PR{k}: base hits {sum(len(v) for v in base.values())}, head hits {sum(len(v) for v in head.values())}, kept {sum(1 for r in rows if r['file'] and r['head'])}, fixed {sum(1 for r in rows if r['file'] and not r['head'])}, new at head {sum(1 for r in rows if not r['file'])}")
json.dump(report, open(R + "/.context/ev/lint37.json", "w"), indent=1)
