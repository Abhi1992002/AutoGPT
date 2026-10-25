"""Final pass over the merged pair lists: drop CSS pairs (css-equivalence covers
those files) and any aligned pair whose element became a <Text>: a Text-merged
pair in the same file whose merged old and new class strings contain every
class of the aligned pair's old and new string (the aligned pair is just
that Text's className, without the variant it merges with)."""
import json, sys
for f in sys.argv[1:]:
    d = json.load(open(f))
    pairs = [p for p in d["pairs"] if not p["file"].endswith(".css")]
    texts = [p for p in pairs if p.get("tag") == "Text-merged"]
    keep, dropped = [], []
    for p in pairs:
        if p.get("tag") != "Text-merged" and any(t["file"] == p["file"] and set(p["old"].split()) <= set(t["old"].split()) and set(p["new"].split()) <= set(t["new"].split()) for t in texts):
            dropped.append(p); continue
        keep.append(p)
    d["pairs"] = keep
    json.dump(d, open(f, "w"))
    print(f, len(keep), "pairs;", len(dropped), "aligned pairs dropped (covered by a Text-merged row):", [(p["file"].split("build/")[-1], p["old"], p["new"]) for p in dropped])
