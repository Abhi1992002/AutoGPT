# usage: python3 -I ci_line.py <pr> <expected-head-sha>  -> the "(d) checks on this head" sentence, from this head's CI
import json, subprocess, sys
pr, sha = sys.argv[1], sys.argv[2]
head = subprocess.run(["gh", "pr", "view", pr, "--repo", "Significant-Gravitas/AutoGPT", "--json", "headRefOid", "-q", ".headRefOid"], capture_output=True, text=True).stdout.strip()
if not head.startswith(sha): sys.exit(f"PR #{pr} head is {head[:9]}, not {sha}")
checks = json.loads(subprocess.run(["gh", "pr", "checks", pr, "--repo", "Significant-Gravitas/AutoGPT", "--json", "name,state,link"], capture_output=True, text=True).stdout)
by = {c["name"]: c for c in checks}
def item(label, names):
    cs = [by[n] for n in names if n in by]
    if not cs: return None
    ok = all(c["state"] in ("SUCCESS", "SKIPPED", "NEUTRAL") for c in cs)
    return f"{label} {'✓' if ok else '(' + ', '.join(sorted({c['state'].lower() for c in cs})) + ')'} ([run]({cs[0]['link']}))", ok
parts = [item("production build (Vercel preview of this head)", ["Vercel"]),
         item("lint (ESLint + oxlint + Prettier)", ["lint"]),
         item("type check", ["check API types", "Analyze (typescript)"]),
         item("full `vitest` suite (integration shards 1-4)", [f"integration_test (shard {i}/4)" for i in range(1, 5)]),
         item("end-to-end smoke and journeys", ["end-to-end tests (smoke)", "end-to-end tests (journeys)"]),
         item("frontend patch coverage", ["codecov/patch/platform-frontend"])]
parts = [p for p in parts if p]
pending = [p[0] for p in parts if not p[1]]
print(json.dumps({"text": f"CI on this head (`{sha}`): " + "; ".join(p[0] for p in parts) + ".", "pending": pending}))
