# Per-PR comparison: base run1 vs head run1, with the orb-race substitutions
# listed in SUBS (side, screenshot, retake dir), plus the determinism run.
import os, shutil, subprocess, json, hashlib
E = "/home/vercel-sandbox/autogpt/.context/evidence"
FE = "/home/vercel-sandbox/autogpt/autogpt_platform/frontend"
S = open(f"{E}/shas.txt").read().split()
SUBS = {}  # the greeting orb is masked in every capture (seed-preload.cjs), so no retakes
md5 = lambda p: hashlib.md5(open(p, "rb").read()).hexdigest()[:8]
summary = {}
def run(n, bdir, adir, subs):
    cb, ca = f"{E}/shots/cmp-pr{n}-before", f"{E}/shots/cmp-pr{n}-after"
    for d, src in ((cb, bdir), (ca, adir)):
        shutil.rmtree(d, ignore_errors=True); shutil.copytree(f"{E}/shots/{src}", d)
    notes = []
    for side, name, rdir in subs:
        dst = cb if side == "before" else ca
        orig = f"{E}/shots/{bdir if side=='before' else adir}/{name}"
        notes.append(f"{name}: {side} run1 `{md5(orig)}` (orb state) replaced by `{rdir}` `{md5(f'{E}/shots/{rdir}/{name}')}`")
        shutil.copy(f"{E}/shots/{rdir}/{name}", f"{dst}/{name}")
    out = subprocess.run(["npx", "tsx", "scripts/screenshot-pages.ts", "compare", cb, ca, "--diff", f"{E}/shots/diff-pr{n}" if isinstance(n, int) else f"{E}/shots/diff-{n}"], cwd=FE, capture_output=True, text=True).stdout
    kb = []
    for k in ("keyboard-app.json", "keyboard-stories.json"):
        same = open(f"{cb}/{k}").read() == open(f"{ca}/{k}").read()
        kb.append(f"{k} {'identical' if same else 'DIFFERS'}")
    fname = f"{E}/compare-pr{n}.md" if isinstance(n, int) else f"{E}/compare-{n}.md"
    open(fname, "w").write(out + "\n" + "\n".join(kb) + "\n" + ("\nOrb-race substitutions (both states also occur on dev run1 vs run2):\n" + "\n".join("- " + x for x in notes) if notes else "") + "\n")
    last = [l for l in out.splitlines() if "compared" in l]
    summary[n] = (last[0] if last else "?") + " | " + ", ".join(kb) + (f" | {len(notes)} orb retake(s)" if notes else "")
for n in range(1, 8):
    run(n, f"run1-{S[n-1]}", f"run1-{S[n]}", SUBS.get(n, []))
run("determinism", f"run1-{S[0]}", f"run2-{S[0]}", [])
for k, v in summary.items(): print(k, v)
