import json, re, subprocess, collections, sys
FE = "autogpt_platform/frontend/"
d = json.load(open(sys.argv[1]))
cache = {}
cnt = collections.Counter()
for p in d["pairs"]:
    f = p["file"]
    if f not in cache:
        cache[f] = subprocess.run(["git", "show", f"{sys.argv[2]}:{FE}{f}"], capture_output=True, text=True).stdout
    src = cache[f]
    i = src.find(p["new"])
    # nearest unclosed JSX tag start before the string
    head = src[:i]
    m = list(re.finditer(r"<([A-Za-z][\w.]*)", head))
    tag = None
    if m:
        last = m[-1]
        between = head[last.end():]
        if ">" not in re.sub(r"=>|\{[^{}]*\}", "", between):
            tag = last.group(1)
    p["tag"] = tag
    if tag and tag[0].isupper():
        vm = re.search(r"variant=\"([\w-]+)\"", src[last.start(): i + len(p["new"]) + 200]) if tag == "Text" else None
        p["variant"] = vm.group(1) if vm else None
    cnt[tag] += 1
json.dump(d, open(sys.argv[1], "w"), indent=1)
print(cnt.most_common())
