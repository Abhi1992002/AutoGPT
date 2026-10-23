import difflib, json, sys, collections, re
d = json.load(open(sys.argv[1]))["pairs"]
SIZE = re.compile(r"^(?:[\w-]+:)?!?text-(tiny|caption-sm|caption|body-sm|body-md|body-lg|body|lead|heading-sm|heading|title|display)$")
cnt = collections.Counter()
for p in d:
    a = p["old"].split()
    b_all = p["new"].split()
    added_inherit = b_all.count("leading-inherit") - a.count("leading-inherit")
    b = [w for w in b_all if w != "leading-inherit"] + ["leading-inherit"] * a.count("leading-inherit")
    b = [w for w in b_all if w != "leading-inherit" or a.count("leading-inherit")]
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if tag == "equal": continue
        olds, news = a[i1:i2], b[j1:j2]
        for o in [w for w in olds if w.startswith("dark:")]:
            cnt[(o, "(removed)")] += 1
        olds = [w for w in olds if not w.startswith("dark:")]
        if not olds and not news: continue
        if len(olds) == len(news):
            for o, n in zip(olds, news):
                if SIZE.match(n) and added_inherit > 0:
                    n += " leading-inherit"; added_inherit -= 1
                elif SIZE.match(n):
                    # The size kept an explicit leading that follows it: the swap is exact only with it.
                    pre = n[: len(n) - len(n.lstrip("!").split("text-")[-1]) - 5] if False else ""
                    words = p["new"].split()
                    k = words.index(n)
                    lead = next(w for w in words[k + 1:] if w.lstrip("!").startswith("leading-") and ":" not in w)
                    o, n = f"{o} {lead}", f"{n} {lead}"
                cnt[(o, n)] += 1
        elif not news:
            for o in olds: cnt[(o, "(removed)")] += 1
        else:
            raise SystemExit(f"unaligned {olds} -> {news} in {p}")
    assert added_inherit == 0, p
pairs = [{"file": f"x{n}", "old": o, "new": n2, "tag": None} for (o, n2), n in sorted(cnt.items(), key=lambda kv: (-kv[1], kv[0]))]
json.dump({"pairs": pairs, "unpaired": []}, open(sys.argv[2], "w"), indent=1)
print(len(pairs), "token swaps,", sum(cnt.values()), "occurrences")
