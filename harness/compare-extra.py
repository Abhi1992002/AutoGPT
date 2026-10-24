import subprocess, os
E = "/home/vercel-sandbox/autogpt/.context/evidence"; FE = "/home/vercel-sandbox/autogpt/autogpt_platform/frontend"
SETS = {
  1: [("misc", "0d5ac323f", "9bf3e4240")],
  2: [("misc", "9bf3e4240", "3be8ded01")],
  3: [("misc", "3be8ded01", "ea7601a36"), ("ev", "3be8ded01", "ea7601a36")],
  4: [("misc", "ea7601a36", "52af88a46")],
  5: [("misc", "52af88a46", "74b35c2b7"), ("ev", "52af88a46", "74b35c2b7")],
  6: [("misc", "74b35c2b7", "795a2dfac")],
  7: [("misc", "795a2dfac", "ac42a30d1"), ("ev", "795a2dfac", "ac42a30d1")],
  "determinism": [("misc", "0d5ac323f", "run2-0d5ac323f"), ("ev", "ac42a30d1", None)],
}
for n, sets in SETS.items():
    out = []
    for kind, b, h in sets:
        bd = f"{E}/shots/{kind}-{b}"; hd = f"{E}/shots/{kind}2-{b}" if h is None else f"{E}/shots/{kind}-{h}"
        r = subprocess.run(["npx", "tsx", "scripts/screenshot-pages.ts", "compare", bd, hd, "--diff", f"{E}/shots/diff-{kind}-{n}"], cwd=FE, capture_output=True, text=True).stdout
        kb = []
        for k in ("keyboard-app.json", "keyboard-stories.json"):
            if os.path.exists(f"{bd}/{k}") or os.path.exists(f"{hd}/{k}"):
                same = os.path.exists(f"{bd}/{k}") and os.path.exists(f"{hd}/{k}") and open(f"{bd}/{k}").read() == open(f"{hd}/{k}").read()
                kb.append(f"{k} {'identical' if same else 'DIFFERS'}")
        out.append(f"### {kind}: `{os.path.basename(bd)}` vs `{os.path.basename(hd)}`\n\n{r}\n{', '.join(kb)}\n")
        last = [l for l in r.splitlines() if "compared" in l]
        print(n, kind, last[0] if last else "?", ", ".join(kb))
    open(f"{E}/compare-{'pr'+str(n) if n != 'determinism' else 'determinism'}-extra.md", "w").write("\n".join(out))
