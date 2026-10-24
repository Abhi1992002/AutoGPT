# usage: python3 -I classify.py <tag>  -> every non-zero capture in cmp/<tag>.md with its cause, or UNEXPLAINED
import sys, re, subprocess
tag = sys.argv[1]; E = "/home/vercel-sandbox/autogpt/.context/ev"; D = f"/home/vercel-sandbox/shots/diff-{tag}"
rows = [l for l in open(f"{E}/cmp/{tag}.md") if l.startswith("| ") and not l.startswith(("| screenshot", "| ---"))]
nz = [l.split("|")[1].strip().strip("`") for l in rows if not l.rstrip().endswith("| 0 |")]
CAUSES = {
 "T": "the diagnostics page's \"Last updated\" time, which the server stamps from the real clock",
 "O": "Otto's animated orb on `/copilot` and `/home`, caught at a different point of its drift",
 "S": "the sidebar's entrance animation caught mid-fade or settled (a timing race)",
}
out = []; bad = 0
for name in nz:
    o = subprocess.run(["python3", "-I", f"{E}/../evtools/diffbox.py", f"{D}/{name}"], capture_output=True, text=True).stdout
    m = re.search(r"n=(\d+) box=\((\d+),(\d+),(\d+),(\d+)\)", o); n, x0, y0, x1, y1 = map(int, m.groups())
    mobile = "__mobile" in name; c = None
    if "diagnostics" in name and ((not mobile and 534 <= x0 and x1 <= 955 and 591 <= y0 and y1 <= 652) or (mobile and 240 <= x0 and x1 <= 312 and 639 <= y0 and y1 <= 1200)): c = "T"
    elif re.search(r"__(copilot|home)__", name) and y1 - y0 <= 200: c = "O"
    elif not mobile and x1 <= 46: c = "S"
    if not c: bad += 1
    out.append((name, n, (x0, y0, x1, y1), c))
for name, n, box, c in out: print(f"{name}\t{n}\t{box}\t{c or 'UNEXPLAINED'}")
print(f"SUMMARY {tag}: {len(rows)} compared, {len(nz)} non-zero, {bad} unexplained")
