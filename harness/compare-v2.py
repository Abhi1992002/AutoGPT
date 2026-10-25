#!/usr/bin/env python3
"""Base/head comparison for the v2 evidence (QUALITY rules 17, 26-28).

usage: compare-v2.py <label> <base_dir> <head_dir> <out.md>

- Screenshots: every PNG in either dir; exact pixel comparison (any differing
  pixel counts, no threshold). A file present on one side only is a failure.
- Steps (steps-*.json): base vs head actual. Same actual and pass = ok; same
  actual and fail on both = pre-existing on base (listed with base/head side
  by side); different actual = regression; missing on one side = failure.
- Misses (failures-*.json): any scenario that could not complete fails.
- Computed styles (styles/*.json): element-by-element comparison of every
  computed property; class attributes are listed where they differ (expected
  for the role swaps) but only style differences fail.
Exit 0 only when everything matches.
"""
import json, os, re, sys
from PIL import Image, ImageChops

label, bdir, hdir, out = sys.argv[1:5]


def pngs(d):
    r = {}
    for root, _, files in os.walk(d):
        for f in files:
            if f.endswith(".png"):
                r[os.path.relpath(os.path.join(root, f), d)] = os.path.join(root, f)
    return r


def load(d, prefix):
    r = {}
    found = []
    for root, _, files in os.walk(d):
        if os.path.basename(root) == "styles":
            continue
        found += [os.path.join(root, f) for f in files if f.startswith(prefix) and f.endswith(".json")]
    for path in sorted(found):
        if True:
            v = json.load(open(path))
            if isinstance(v, dict):
                r.update(v)
            else:
                r.setdefault("__list__", []).extend(v)
    return r


fail = 0
L = [f"## {label}", ""]

# screenshots
B, H = pngs(bdir), pngs(hdir)
rows, diffs = [], 0
for k in sorted(set(B) | set(H)):
    if k not in B or k not in H:
        fail += 1
        diffs += 1
        rows.append(f"| {k} | only in {'head' if k in H else 'base'} | FAIL |")
        continue
    a, b = Image.open(B[k]).convert("RGB"), Image.open(H[k]).convert("RGB")
    if a.size != b.size:
        fail += 1
        diffs += 1
        rows.append(f"| {k} | size {a.size} vs {b.size} | FAIL |")
        continue
    # RGB, not RGBA: Pillow's getbbox() on RGBA only looks at alpha, which is
    # equal for opaque screenshots and hides every colour difference.
    if a.tobytes() == b.tobytes():
        n = 0
    else:
        n = sum(1 for p in ImageChops.difference(a, b).getdata() if p != (0, 0, 0))
    if n:
        fail += 1
        diffs += 1
    rows.append(f"| {k} | {a.size[0]}x{a.size[1]} | {n} |")
L += [f"**Screenshots: {len(set(B) | set(H))} compared, {diffs} with differences.**", "", "| screenshot | size | differing px |", "| --- | --- | --- |"] + rows + [""]

# steps
bs, hs = load(bdir, "steps-"), load(hdir, "steps-")
pre, reg, miss, ok = [], [], [], 0
for k in sorted(set(bs) | set(hs)):
    if k not in bs or k not in hs:
        miss.append(k)
        continue
    a, b = bs[k], hs[k]
    if json.dumps(a["actual"]) != json.dumps(b["actual"]):
        reg.append((k, a, b))
    elif not a["pass"]:
        pre.append((k, a, b))
    else:
        ok += 1
fail += len(reg) + len(miss)
L += [f"**Asserted steps: {len(set(bs) | set(hs))}; {ok} pass on base and head, {len(pre)} fail identically on base and head (pre-existing on base), {len(reg)} differ, {len(miss)} missing on one side.**", ""]
if pre:
    L += ["Pre-existing on base (same result on base and head; not changed by this PR):", "", "| step | expected | base | head |", "| --- | --- | --- | --- |"]
    L += [f"| {k} | `{json.dumps(a['expected'])}` | `{json.dumps(a['actual'])}` | `{json.dumps(b['actual'])}` |" for k, a, b in pre] + [""]
if reg:
    L += ["DIFFERENT on head (regression):", "", "| step | base | head |", "| --- | --- | --- |"]
    L += [f"| {k} | `{json.dumps(a['actual'])}` | `{json.dumps(b['actual'])}` |" for k, a, b in reg] + [""]
if miss:
    L += ["Missing on one side: " + ", ".join(f"`{k}`" for k in miss), ""]

# misses
bm, hm = load(bdir, "failures-").get("__list__", []), load(hdir, "failures-").get("__list__", [])
if bm or hm:
    fail += len(bm) + len(hm)
    L += [f"**Scenarios that could not complete: base {bm or 'none'}, head {hm or 'none'}.**", ""]
else:
    L += ["**Every scenario completed on base and head.**", ""]

# computed styles
def style_files(d):
    out = {}
    for root, _, files in os.walk(d):
        if os.path.basename(root) == "styles":
            for f in files:
                out[os.path.relpath(os.path.join(root, f), d)] = os.path.join(root, f)
    return out
SB, SH = style_files(bdir), style_files(hdir)
files = sorted(set(SB) | set(SH))
els = sdiff = 0
cls_pairs = {}
srows = []
for f in files:
    pa, pb = SB.get(f, ""), SH.get(f, "")
    if not (pa and pb):
        fail += 1
        srows.append(f"| {f} | only on one side | FAIL |")
        continue
    A, Bv = json.load(open(pa)), json.load(open(pb))
    for ga, gb in zip(A, Bv):
        if len(ga) != len(gb):
            fail += 1
            sdiff += 1
            srows.append(f"| {f} | {len(ga)} vs {len(gb)} elements | FAIL |")
            continue
        for ea, eb in zip(ga, gb):
            els += 1
            # React useId values inside url(#...) references (SVG gradients,
            # clip paths, masks) depend on render order, not on styling.
            norm = lambda v: re.sub(r"_[rR]_[0-9a-zA-Z]+_", "_r_ID_", v or "")
            d = [p for p in ea["style"] if norm(ea["style"][p]) != norm(eb["style"].get(p))]
            if d or ea["tag"] != eb["tag"]:
                sdiff += 1
                fail += 1
                detail = ", ".join("%s: %s -> %s" % (p, ea["style"][p], eb["style"].get(p)) for p in d[:6])
                srows.append("| %s | `%s` %s | FAIL |" % (f, ea["tag"], detail))
            if ea["cls"] != eb["cls"]:
                cls_pairs[(ea["tag"], ea["cls"], eb["cls"])] = cls_pairs.get((ea["tag"], ea["cls"], eb["cls"]), 0) + 1
L += [f"**Computed styles: {els} rendered elements (each changed element and its descendants, every state captured) compared on every computed property (React-generated ids inside `url(#…)` references normalised); {sdiff} differ. {len(cls_pairs)} distinct class strings changed with identical computed style.**", ""]
if srows:
    L += ["| styles file | difference | |", "| --- | --- | --- |"] + srows + [""]
json.dump([{"tag": t, "old": o, "new": n, "count": c} for (t, o, n), c in cls_pairs.items()], open(out.replace(".md", "-classpairs.json"), "w"), indent=1)

open(out, "w").write("\n".join(L) + "\n")
print(f"{label}: screenshots {len(set(B) | set(H))} ({diffs} diff) | steps ok {ok} pre-existing {len(pre)} differ {len(reg)} missing {len(miss)} | misses {len(bm)}/{len(hm)} | styles {els} els, {sdiff} diff, {len(cls_pairs)} class pairs | {'PASS' if not fail else 'FAIL'}")
sys.exit(1 if fail else 0)
