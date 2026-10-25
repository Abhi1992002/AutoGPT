# Equivalence inputs generated from source: every class-string literal a PR
# changes, read from `git diff -U0 -M <base> <head>` (tests and atoms/Text
# excluded), paired in order within each hunk with what replaces it: another
# literal, or a <Text> element (variant, tone, className), resolved later with
# the head's helpers and cn() by resolve.ts. The element tag comes from the JSX
# the literal sits on in its own file. A hunk whose literals don't pair one to
# one is a restructure (copy moved into a child); it must be covered by a case
# in nested-cases.ts, which this script checks token by token, or it fails.
# usage: gen-pairs.py <pr> <base> <head> <out.json>
import collections, json, re, subprocess, sys

pr, base, head, out = int(sys.argv[1]), sys.argv[2], sys.argv[3], sys.argv[4]
ROOT = "/home/vercel-sandbox/autogpt"
FE = "autogpt_platform/frontend/"
TW = re.compile(r"^!?(?:[\w\-\[\]=&>:.()/%,#@*]+:)*-?(?:text|leading|font|tracking|bg|p[xytblr]?|m[xytblr]?|gap|flex|grid|rounded|border|ring|shadow|w|h|size|min|max|items|justify|shrink|grow|truncate|line-clamp|whitespace|overflow|outline|opacity|transition|duration|ease|animate|relative|absolute|inline|block|hidden|z|top|left|right|bottom|translate|space|select|touch|cursor|pointer|peer|group|data|aria|dark|hover|focus|sr|underline|uppercase|tabular|align|resize|placeholder)(?:-|$|\b)")
TAG_MAP = {"SidebarGroupLabel": "div", "CollapsibleTrigger": "button", "SheetTitle": "h2", "SheetDescription": "p", "SheetPrimitive.Title": "h2",
           "SheetPrimitive.Description": "p", "AccordionPrimitive.Trigger": "button", "AccordionPrimitive.Content": "div", "Textarea": "textarea",
           "Input": "input", "Button": "button", "CredentialMentionEditor": "div", "ScrollAreaPrimitive.ScrollAreaThumb": "div", "PopoverClose": "button"}
# cva/cn literals defined outside JSX: the element they end up on.
CVA_TAG = {"sidebarMenuButtonVariants": "button", "inputGroupAddonVariants": "div", "inputGroupButtonVariants": "button", "rowClasses": "button"}


def git(*a):
    return subprocess.run(["git", *a], capture_output=True, text=True, cwd=ROOT).stdout


TAGS = {"h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "div", "code", "label", "kbd", "li", "dt", "dd"}


def is_classes(lit):
    toks = lit.split()
    if lit in TAGS:
        return False
    return bool(toks) and sum(bool(TW.match(t)) for t in toks) >= max(1, len(toks) // 2) and not lit.startswith(("@/", "./", "../", "use "))


def literals(line):
    return [m for m in re.findall(r'"([^"\n]*)"', line) if is_classes(m)]


def tag_for(src, n):
    """Tag of the element a literal on line n (1-based) of src belongs to."""
    for k in range(n - 1, max(-1, n - 40), -1):
        l = src[k]
        m = re.search(r"\b(\w+)\s*=\s*cva\(|\bconst (\w+)\s*=\s*$|\bconst (\w+)\s*=", l)
        if m and (m[1] or m[2] or m[3]) in CVA_TAG:
            return CVA_TAG[m[1] or m[2] or m[3]]
        t = re.findall(r"<([A-Za-z][\w.]*)", l)
        if t:
            t = t[-1]
            if t == "Text":
                return "TEXT"
            return t if t[0].islower() else TAG_MAP.get(t, "div")
    return "div"


def text_tags(src):
    """Every <Text ...> opening tag in a file: (first line, last line, props)."""
    out, n = [], 0
    while n < len(src):
        if re.search(r"<Text\b", src[n]):
            start, buf = n, src[n].split("<Text", 1)[1]
            while not re.search(r"(?<![=])>", re.sub(r'"[^"]*"', '""', buf)) and n + 1 < len(src):
                n += 1
                buf += " " + src[n]
            props = dict(re.findall(r'\b(variant|tone|className|as)="([^"]*)"', buf))
            out.append((start + 1, n + 1, props))
        n += 1
    return out


def text_specs(src, plus):
    lines = {n for n, _ in plus}
    return [{"line": a, "end": b, "props": p} for a, b, p in text_tags(src) if any(a <= n <= b for n in lines)]


def variants_at(sha):
    t = git("show", f"{sha}:{FE}src/components/atoms/Text/helpers.ts")
    body = t[t.index("export const variants"): t.index("} as const")]
    return {m[0] or m[1]: m[2] for m in re.findall(r'^\s*(?:"([a-z0-9-]+)"|([a-z0-9]+)):\s*\n?\s*"([^"]+)"', body, re.M)}


diff = git("diff", "-U0", "-M", base, head, "--", FE + "src", f":(exclude){FE}src/components/atoms/Text", ":(exclude)**/__tests__/**", ":(exclude)**/*.test.*")
hunks, f = [], None
for line in diff.splitlines():
    if line.startswith("--- "):
        fo = line[6:] if line.startswith("--- a/") else None
    elif line.startswith("+++ "):
        f = line[6:] if line.startswith("+++ b/") else None
        cur_old = fo
    elif line.startswith("@@"):
        m = re.search(r"-(\d+)(?:,\d+)? \+(\d+)", line)
        hunks.append({"file": f, "old_file": cur_old, "o": int(m[1]), "n": int(m[2]), "minus": [], "plus": []})
    elif hunks and line.startswith("-"):
        h = hunks[-1]; h["minus"].append((h["o"] + len(h["minus"]), line[1:]))
    elif hunks and line.startswith("+"):
        h = hunks[-1]; h["plus"].append((h["n"] + len(h["plus"]), line[1:]))

src_cache = {}


def src(sha, path):
    k = (sha, path)
    if k not in src_cache:
        src_cache[k] = git("show", f"{sha}:{path}").splitlines()
    return src_cache[k]


def split_args(t):
    """Top-level comma split of a call's argument text (comment lines dropped)."""
    t = "\n".join(l for l in t.splitlines() if not l.strip().startswith(("//", "/*", "*", "{/*")))
    out, depth, cur, q = [], 0, "", None
    for ch in t:
        if q:
            cur += ch
            if ch == q:
                q = None
            continue
        if ch in "\"'`":
            q = ch
        elif ch in "([{":
            depth += 1
        elif ch in ")]}":
            depth -= 1
        if ch == "," and depth == 0:
            out.append(cur.strip()); cur = ""
        else:
            cur += ch
    if cur.strip():
        out.append(cur.strip())
    return out


def enclosing_call(srclines, n):
    """The cva(...) or cn(...) call around line n: (kind, start line, argument text)."""
    text = "\n".join(srclines)
    offs = [0]
    for l in srclines:
        offs.append(offs[-1] + len(l) + 1)
    pos = offs[n - 1]
    best = None
    for m in re.finditer(r"\b(cva|cn)\(", text[:pos + len(srclines[n - 1])]):
        i, depth, q = m.end(), 1, None
        while i < len(text) and depth:
            ch = text[i]
            if q:
                q = None if ch == q else q
            elif ch in "\"'`":
                q = ch
            elif ch == "(":
                depth += 1
            elif ch == ")":
                depth -= 1
            i += 1
        if i > pos:
            best = (m[1], text[:m.start()].count("\n") + 1, text[m.end():i - 1])
    return best


def combos(kind, args):
    """Every string the call renders: unconditional literals plus one option per
    dimension; each option is taken once with the other dimensions at their
    default (cva defaultVariants, or the first option)."""
    uncond, dims, defaults = [], {}, {}
    parts = split_args(args)
    if kind == "cva":
        uncond = re.findall(r'^"([^"]*)"$', parts[0])
        if len(parts) > 1:
            cfg = parts[1]
            vm = re.search(r"variants:\s*\{(.*?)\n\s{4}\},?\s*\n\s{4}defaultVariants", cfg, re.S) or re.search(r"variants:\s*\{(.*)\}", cfg, re.S)
            for dm in re.finditer(r'(\w+):\s*\{([^{}]*)\}', vm[1] if vm else ""):
                dims[dm[1]] = {k.strip('"'): [v] for k, v in re.findall(r'("[\w-]+"|[\w-]+):\s*"([^"]*)"', dm[2])}
            dv = re.search(r"defaultVariants:\s*\{([^}]*)\}", cfg)
            if dv:
                defaults = {k: v for k, v in re.findall(r'(\w+):\s*"([^"]*)"', dv[1])}
    else:
        for a in parts:
            if re.fullmatch(r'"[^"]*"', a):
                uncond.append(a[1:-1])
            else:
                m = re.fullmatch(r'(\w+)\s*===\s*"([^"]*)"\s*&&\s*"([^"]*)"', a)
                if m:
                    dims.setdefault(m[1], {}).setdefault(m[2], []).append(m[3])
    out = {}
    if not dims:
        out["(base)"] = list(uncond)
    for d, opts in dims.items():
        for v, lits in opts.items():
            pick = {e: defaults.get(e, next(iter(o))) for e, o in dims.items()}
            pick[d] = v
            key = ", ".join(f"{e}={pick[e]}" for e in dims)
            out[key] = list(uncond) + [x for e in dims for x in dims[e][pick[e]]]
    return out


# Callers that pass their own size to a composed primitive (read from source).
CALLERS = {4: [("components/layout/AppSidebar/useNavItemClassName.ts", "max-md:text-base", "sidebarMenuButtonVariants", "variant=default, size=default"),
               ("components/layout/AppSidebar/components/RecentChats/components/RecentChatItem/RecentChatItem.tsx", "max-md:text-body-md", "sidebarMenuButtonVariants", "variant=default, size=default")]}

import os
NESTED = f"/home/vercel-sandbox/autogpt/.context/evidence/eq/nested-cases-pr{pr}.json"
nested = json.load(open(NESTED)) if os.path.exists(NESTED) else []


def toks(frag):
    return set(" ".join(re.findall(r'class="([^"]*)"', frag)).split())


def covered(file, olds, news):
    """A nested.ts case for this file whose old fragment holds every old token
    and whose new fragment holds every new literal's tokens."""
    name = os.path.basename(file)
    for c in nested:
        if not c["name"].startswith(name):
            continue
        if all(set(l.split()) <= toks(c["old"]) for l in olds) and all(set(l.split()) <= toks(c["new"]) for l in news):
            return c["name"]
    return None


pairs, restructures, uncovered = [], [], []
# Literal-level detail of every restructure, per file, for the removed-class table.
rdetail = collections.defaultdict(lambda: {"old": [], "new": []})
composed = {}
seen_calls = set()
pool_old, pool_new = [], []
# A <Text> opening tag can span several hunks (its `<Text` line and its
# className line): it belongs to one, the one with removed literals if any.
owner = {}
for k, h in enumerate(hunks):
    if not h["file"]:
        continue
    for sp in text_specs(src(head, h["file"]), h["plus"]):
        key = (h["file"], sp["line"])
        has_old = any(literals(l) for _, l in h["minus"])
        if key not in owner or (has_old and not owner[key][1]):
            owner[key] = (k, has_old)
for k, h in enumerate(hunks):
    old_src = src(base, h["old_file"]) if h["old_file"] else []
    new_src = src(head, h["file"]) if h["file"] else []
    olds = [(n, lit) for n, l in h["minus"] if not l.strip().startswith(("//", "{/*", "*")) for lit in literals(l)]
    specs = [sp for sp in text_specs(new_src, h["plus"]) if owner.get((h["file"], sp["line"]), (None,))[0] == k] if h["file"] else []
    news = []
    for n, l in h["plus"]:
        if l.strip().startswith(("//", "{/*", "*")):
            continue
        for lit in literals(l):
            if any(a <= n <= b and pr_.get("className") == lit for a, b, pr_ in text_tags(new_src)):
                continue
            news.append((n, {"lit": lit}))
    for sp in specs:
        news.append((sp["line"], {"text": sp["props"]}))
    news.sort(key=lambda x: x[0])
    # literals unchanged in this hunk (a line re-wrapped or split by a comment)
    same = {lit for _, lit in olds} & {x["lit"] for _, x in news if "lit" in x}
    olds = [o for o in olds if o[1] not in same]
    news = [x for x in news if x[1].get("lit") not in same]
    if not olds and not news:
        continue
    rel = (h["file"] or h["old_file"]).replace(FE + "src/", "")
    # A file deleted here whose code lands in another file (not a git rename):
    # its literals and the other file's added literals are pooled below.
    if not news or not olds:
        for on, ol in olds:
            pool_old.append((rel, on, ol, tag_for(old_src, on)))
        for nn, nx in news:
            pool_new.append((rel, nn, nx))
        continue
    new_lits = [x.get("lit") or (x.get("text") or {}).get("className") or "" for _, x in news]
    cov = covered(rel, [o[1] for o in olds], [l for l in new_lits if l])
    if cov:
        restructures.append(f"{rel}:{h['n']} -> nested case \"{cov}\"")
        rdetail[rel]["old"] += [o[1] for o in olds]
        rdetail[rel]["new"] += [x for _, x in news]
        continue
    if len(olds) != len(news):
        uncovered.append(f"{rel}:{h['n']}: {len(olds)} old literal(s), {len(news)} new item(s), no nested case covers them")
        continue
    oc = {enclosing_call(old_src, on) for on, _ in olds} if old_src else set()
    nc = {enclosing_call(new_src, nn) for nn, _ in news} if new_src else set()
    if len(oc) == 1 and len(nc) == 1 and None not in oc and None not in nc:
        (ok_, ol_, oargs), (nk_, nl_, nargs) = oc.pop(), nc.pop()
        co, cnw = combos(ok_, oargs), combos(nk_, nargs)
        if (len(co) > 1 or len(split_args(oargs)) > 2 or ok_ == "cva") and set(co) == set(cnw) and all("text" not in x for _, x in news):
            if (rel, ok_, nl_) in seen_calls:
                continue
            seen_calls.add((rel, ok_, nl_))
            name = re.search(r"const (\w+)\s*=\s*$|const (\w+)\s*=\s*cva", old_src[ol_ - 1]) or re.search(r"const (\w+)", old_src[ol_ - 2] if ol_ > 1 else "")
            tag = tag_for(old_src, olds[0][0])
            for key in co:
                pairs.append({"file": f"{rel}:{nl_} {ok_}() {key}", "tag": tag if tag != "TEXT" else "div", "compose_old": co[key], "compose_new": cnw[key], "old": " ".join(co[key])})
                composed[(rel, ok_, key)] = (co[key], cnw[key])
            continue
    for (on, ol), (nn, nx) in zip(olds, news):
        tag = tag_for(old_src, on)
        item = {"file": f"{rel}:{nn}", "tag": tag if tag != "TEXT" else "span", "old": ol}
        if "text" in nx:
            t = nx["text"]
            item["text"] = {"variant": t.get("variant"), "tone": t.get("tone"), "className": t.get("className")}
            item["tag"] = t.get("as") or item["tag"]
        else:
            item["new"] = nx["lit"]
        pairs.append(item)

HV = variants_at(head)


def text_covered(rel, t):
    name = os.path.basename(rel)
    need = (set(HV.get(t.get("variant"), "?").split()) - {"text-foreground-base"}) | set((t.get("className") or "").split())
    for c in nested:
        if c["name"].startswith(name) and need <= toks(c["new"]):
            return c["name"]
    return None


for x in list(pool_new):
    if "text" in x[2] and not any(o[0] == x[0] for o in pool_old):
        cov = text_covered(x[0], x[2]["text"])
        if cov:
            restructures.append(f"{x[0]}:{x[1]} (new Text child) -> nested case \"{cov}\"")
            rdetail[x[0]]["new"].append(x[2])
            pool_new.remove(x)
for o in list(pool_old):
    if not any(x[0] == o[0] for x in pool_new):
        cov = covered(o[0], [o[2]], [])
        if cov:
            restructures.append(f"{o[0]}:{o[1]} (old literal, copy moved) -> nested case \"{cov}\"")
            rdetail[o[0]]["old"].append(o[2])
            pool_old.remove(o)
same = collections.Counter(o[2] for o in pool_old) & collections.Counter(x[2]["lit"] for x in pool_new if "lit" in x[2])
for lit, k in same.items():
    for _ in range(k):
        pool_old.remove(next(o for o in pool_old if o[2] == lit))
        pool_new.remove(next(x for x in pool_new if x[2].get("lit") == lit))
if len(pool_old) == len(pool_new):
    for (orel, on, ol, tag), (nrel, nn, nx) in zip(pool_old, pool_new):
        item = {"file": f"{nrel}:{nn} (was {orel}:{on})", "tag": tag if tag != "TEXT" else "span", "old": ol}
        if "text" in nx:
            item["text"] = {k: nx["text"].get(k) for k in ("variant", "tone", "className")}
            item["tag"] = nx["text"].get("as") or item["tag"]
        else:
            item["new"] = nx["lit"]
        pairs.append(item)
else:
    uncovered.append(f"pooled hunks: {len(pool_old)} old literal(s) vs {len(pool_new)} new item(s): " + "; ".join([f"-{o[0]}:{o[1]} {o[2]!r}" for o in pool_old] + [f"+{x[0]}:{x[1]} {x[2]}" for x in pool_new]))
for cfile, needle, cvaname, key in CALLERS.get(pr, []):
    lit = next((m for l in src(head, FE + "src/" + cfile) for m in re.findall(r'"([^"]*)"', l) if needle in m), None)
    base_ = next(((o, n) for (rel_, k_, key_), (o, n) in composed.items() if k_ == "cva" and key_ == key), None)
    if lit is None or base_ is None:
        uncovered.append(f"caller {cfile}: literal or composed base not found")
        continue
    pairs.append({"file": f"{cfile} className on SidebarMenuButton ({key})", "tag": "button", "compose_old": base_[0] + [lit], "compose_new": base_[1] + [lit], "old": " ".join(base_[0] + [lit])})
json.dump(pairs, open(out, "w"), indent=1)
json.dump(rdetail, open(out.replace(".json", "-restructures.json"), "w"), indent=1)
print(f"PR{pr} {base}..{head}: {len(pairs)} pairs generated; {len(restructures)} restructure hunks covered by nested cases; {len(uncovered)} uncovered")
for r in restructures:
    print("  restructure", r)
for u in uncovered:
    print("  UNCOVERED", u)
sys.exit(1 if uncovered else 0)
