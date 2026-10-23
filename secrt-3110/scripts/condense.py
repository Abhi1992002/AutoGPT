# Condense eq-admin's value column to the colour and type properties, merging
# the four border sides. The pass/fail column already compares every property.
import re, sys
KEEP = ["font-size","line-height","font-weight","letter-spacing","font-family","color","background-color","border-color","box-shadow","--tw-ring-color"]
def condense(cell):
    vals = {}
    for part in cell.split("; "):
        if ": " not in part: continue
        k, v = part.split(": ", 1)
        vals[k] = v
    out = []
    prefixes = sorted({k.rsplit(":",1)[0]+":" if ":" in k else "" for k in vals})
    for pre in prefixes:
        sides = [vals.get(f"{pre}border-{s}-color") for s in ("top","right","bottom","left")]
        if all(sides) and len(set(sides)) == 1: vals[f"{pre}border-color"] = sides[0]
        elif sides[0]: vals[f"{pre}border-top-color"] = sides[0]
        for k in KEEP + ["border-top-color"]:
            if f"{pre}{k}" in vals and (k != "border-top-color" or f"{pre}border-color" not in vals):
                out.append(f"{pre}{k}: {vals[pre+k]}")
    return "; ".join(dict.fromkeys(out)) or "(layout only)"
for line in open(sys.argv[1]):
    line = line.rstrip("\n")
    if not line.startswith("| ") or line.startswith("| file") :
        print(line.replace("every property the string changes; `hover:` etc. = that variant's styles","colour and type properties; `hover:` etc. = that variant's styles") if line.startswith("| file") else line); continue
    cells = line.split(" | ")
    # cells: file, old, new, value, result
    cells[3] = condense(cells[3])
    print(" | ".join(cells))
