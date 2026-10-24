"""Regenerate every TODO(tokens) comment in scope from the line it annotates.

    python3 regen_todos.py strip  <files...>   # remove all TODO(tokens) comments
    python3 regen_todos.py add    <files...>   # add role-aware comments

Wording (orchestrator rule 13): "no exact role" only when no globals.css role
holds the hex; otherwise "no fitting role for <tok> #HEX; #HEX is <role>, a
<kind>". A same-kind match is printed as SAME-KIND so it gets swapped instead.
"""
import json
import re
import sys

PALETTE = json.load(open("/home/vercel-sandbox/tools/palette.json"))
CSS = open("/home/vercel-sandbox/autogpt/autogpt_platform/frontend/src/app/globals.css").read()
LIGHT = CSS[: CSS.index(".dark")]
ROLES = {}
for m in re.finditer(r"--color-([\w-]+):\s*(\d+) (\d+) (\d+);", LIGHT):
    ROLES.setdefault(m.group(1), "#%02X%02X%02X" % tuple(int(x) for x in m.groups()[1:]))

BUILDER = {
    "builder-canvas": "the builder canvas fill",
    "builder-grid": "the builder grid dots",
    "node-surface": "the builder node card fill",
    "node-border": "the builder node ring",
    "node-selected": "the selected builder node ring",
    "edge": "the builder edge stroke",
    "handle": "the builder node handle",
}

def role_kind(r):
    if r in BUILDER:
        return BUILDER[r]
    if r in ("action-hover", "brand-hover", "error-hover"):
        return "hover fill"
    if r in ("action", "primary", "sidebar-primary", "brand", "accent", "destructive"):
        return "button fill"
    if r in ("error", "warning", "success", "info"):
        return "status colour"
    if r in ("focus", "ring", "sidebar-ring"):
        return "focus ring colour"
    if r in ("separator", "border-base", "border-strong", "warning-border", "border", "input", "sidebar-border"):
        return "border colour"
    if r.startswith("foreground") or r.endswith("foreground") or r in ("placeholder", "accent-strong"):
        return "text colour"
    return "surface fill"

def holders(hexv):
    hexv = hexv.upper()
    return [r for r, v in ROLES.items() if v == hexv]

def norm_hex(h):
    h = h.strip().lstrip("#").upper()
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return "#" + h[:6]

FAMS = "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose"
UTIL = "text|bg|border|ring|from|to|via|fill|stroke|divide|outline|decoration|placeholder|accent|caret|ring-offset"
PAL_TOK = re.compile(r"(?<![\w\[-])((?:[\w\-\[\]&>:=_.*()]+:)?!?(" + UTIL + r")-((?:" + FAMS + r")-\d+|white|black)(?:/\d+)?)(?![\w-])")
ARB = re.compile(r"(?<![\w-])((?:[\w\-\[\]&>:=_.*()]+:)?!?([a-z-]+)-\[[^\]\s\"'`]*\])")
COLOR_IN = re.compile(r"#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-zA-Z])|rgba?\((\d+),\s*(\d+),\s*(\d+)")
JS_HEX = re.compile(r"(?<![\w\[-])#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-zA-Z])")
WHITE_KW = re.compile(r"%,\s*white\)")
RARE_SIZE = re.compile(r"(?<![\w-])((?:[\w-]+:)?!?text-\[(?:\d+(?:\.\d+)?(?:px|rem|em))\])")
RAW_TYPO = re.compile(r"(?<![\w-])((?:[\w-]+:)?!?(?:leading|tracking|font)-\[[^\]]+\])")
TODO_LINE = re.compile(r"^\s*//\s*TODO\(tokens\).*$")
TODO_TRAIL = re.compile(r"\s*//\s*TODO\(tokens\).*$")
TODO_JSX = re.compile(r"^\s*\{/\*\s*TODO\(tokens\).*\*/\}\s*$")

def util_kind(util, line):
    if util in ("text", "placeholder", "caret"):
        return "text colour"
    if util in ("bg", "from", "to", "via", "fill"):
        return "fill"
    if util in ("border", "divide", "ring", "outline", "ring-offset"):
        return "border colour"
    if util == "shadow":
        return "shadow"
    if util == "decoration":
        return "underline"
    if util == "stroke":
        return "stroke"
    return util

def same_kind(ukind, rkind):
    if ukind == "fill":
        return rkind in ("surface fill", "button fill", "status colour", "hover fill")
    if ukind == "text colour":
        return rkind in ("text colour", "status colour")
    if ukind == "border colour":
        return rkind in ("border colour", "focus ring colour", "status colour")
    return False

def short(tok):
    m = re.match(r"(.*?-)\[(.*)\]$", tok)
    return m.group(1) + "[…]" if m and len(tok) > 28 else tok

def analyse(line):
    """Returns (no_role list, mismatch list, same_kind list, sizes, typo)."""
    no_role, mismatch, same = [], [], []
    seen = set()

    def classify(label, hexv, ukind):
        key = (label, hexv)
        if key in seen:
            return
        seen.add(key)
        hs = holders(hexv)
        if label.upper() == hexv:
            label = "literal"
        if not hs:
            no_role.append(f"{label} {hexv}")
            return
        kinds = [(r, role_kind(r)) for r in hs]
        if any(same_kind(ukind, k) for _, k in kinds):
            same.append(f"{label} {hexv} -> {', '.join(r for r, k in kinds if same_kind(ukind, k))}")
        desc = ", ".join(f"{r} ({k})" if r in BUILDER else f"{r} (a {k})" for r, k in kinds[:4])
        mismatch.append(f"no fitting role for {label} {hexv}; {hexv} is {desc}")

    for m in PAL_TOK.finditer(line):
        tok, util, name = m.group(1), m.group(2), m.group(3)
        hexv = PALETTE.get(name)
        if hexv:
            classify(tok, norm_hex(hexv), util_kind(util, line))
    for m in ARB.finditer(line):
        tok, util = m.group(1), m.group(2)
        inner = tok[tok.index("[") :]
        for c in COLOR_IN.finditer(inner):
            hexv = norm_hex(c.group(1)) if c.group(1) else "#%02X%02X%02X" % tuple(int(x) for x in c.groups()[1:])
            classify(short(tok), hexv, util_kind(util.split("-")[0] if util.startswith("shadow") else util, line))
    arb_spans = [m.span() for m in ARB.finditer(line)]
    in_arb = lambda i: any(a <= i < b for a, b in arb_spans)
    for c in COLOR_IN.finditer(line):
        if in_arb(c.start()):
            continue
        hexv = norm_hex(c.group(1)) if c.group(1) else "#%02X%02X%02X" % tuple(int(x) for x in c.groups()[1:])
        lab = c.group(0) if c.group(1) else f"rgba({','.join(c.groups()[1:])})"
        ukind = "fill" if re.search(r"background|backgroundColor|--meter-track|cursor", line) else (
            "border colour" if "borderColor" in line else (
            "shadow" if re.search(r"[Ss]hadow", line) else (
            "text colour" if re.search(r"\bcolor:|fill:|tick=", line) else (
            "stroke" if "stroke" in line else "colour"))))
        classify(lab, hexv, ukind)
    if WHITE_KW.search(line):
        ukind = "border colour" if "borderColor" in line else "fill"
        classify("white", "#FFFFFF", ukind)
    sizes = list(dict.fromkeys(m.group(1) for m in RARE_SIZE.finditer(line)))
    typo = list(dict.fromkeys(m.group(1) for m in RAW_TYPO.finditer(line)))
    return no_role, mismatch, same, sizes, typo

def compose(line):
    no_role, mismatch, same, sizes, typo = analyse(line)
    parts = []
    if no_role:
        parts.append("no exact role: " + ", ".join(no_role))
    parts.extend(mismatch)
    if re.search(r"tick=|cursor=|stroke=\"#|fill: \"#", line) and (no_role or mismatch):
        parts.append("recharts writes it as an SVG attribute, where var() does not resolve")
    if sizes:
        parts.append("SECRT-3152 rare size: " + ", ".join(sizes))
    if typo:
        parts.append("no exact text token: " + ", ".join(typo))
    return ("TODO(tokens): " + "; ".join(parts)) if parts else None, same

def strip(path):
    out = []
    for line in open(path).read().split("\n"):
        if TODO_LINE.match(line) or TODO_JSX.match(line):
            continue
        out.append(TODO_TRAIL.sub("", line) if "TODO(tokens)" in line else line)
    open(path, "w").write("\n".join(out))

def has_sibling_text(line):
    s = line.strip()
    # JSX text on the line: words then a tag ("for <span"), or text after a
    # closing tag ("</span> vision"). An attribute line (`className=`) is not.
    if re.match(r"^[A-Za-z][\w ,.'-]*\s<[A-Za-z]", s):
        return True
    return bool(re.search(r"</[\w.]+>\s*[A-Za-z]", s))

def template_spans(src):
    """(start_line, end_line, text) of every template literal (1 nesting level of ${})."""
    spans, i, n = [], 0, len(src)
    while i < n:
        c = src[i]
        if c in "\"'":
            j = i + 1
            while j < n and src[j] != c and src[j] != "\n":
                j += 2 if src[j] == "\\" else 1
            i = j + 1
            continue
        if src.startswith("//", i):
            i = src.find("\n", i)
            i = n if i < 0 else i
            continue
        if c == "`":
            j, depth = i + 1, 0
            while j < n:
                if src[j] == "\\":
                    j += 2
                    continue
                if src.startswith("${", j):
                    depth += 1
                    j += 2
                    continue
                if src[j] == "}" and depth:
                    depth -= 1
                elif src[j] == "`" and not depth:
                    break
                j += 1
            spans.append((src.count("\n", 0, i), src.count("\n", 0, j), src[i : j + 1]))
            i = j + 1
            continue
        i += 1
    return spans

def add(path):
    src = open(path).read()
    lines = src.split("\n")
    inside, head = set(), {}
    for a, b, text in template_spans(src):
        if b > a or "class=" in text:
            for k in range(a, b + 1):
                inside.add(k)
            msg, same = compose(text.replace("\n", " "))
            for x in same:
                print(f"SAME-KIND {path}:{a + 1}: {x}")
            if msg:
                head[a] = msg
    out = []
    for i, line in enumerate(lines):
        if i in head:
            indent = re.match(r"\s*", line).group(0)
            print(f"{path}:{i + 1}: (template) {head[i]}")
            out.append(indent + "// " + head[i])
        if i in inside:
            out.append(line)
            continue
        s = line.strip()
        if s.startswith(("//", "*", "/*", "{/*")) or "import " in line[:8]:
            out.append(line)
            continue
        text, same = compose(line)
        for x in same:
            print(f"SAME-KIND {path}:{i + 1}: {x}")
        if not text:
            out.append(line)
            continue
        print(f"{path}:{i + 1}: {text}")
        indent = re.match(r"\s*", line).group(0)
        if has_sibling_text(line):
            out.append(f"{indent}{{/* {text} */}}")
            out.append(line)
            continue
        first = min(m.start() for r in (PAL_TOK, ARB, COLOR_IN, RARE_SIZE, RAW_TYPO, WHITE_KW) for m in r.finditer(line))
        tags = [m for m in re.finditer(r"<([A-Za-z][\w.]*)(?=\s)", line) if m.end() <= first]
        if tags:
            t = tags[-1]
            out.append(line[: t.end()])
            out.append(indent + "  // " + text)
            out.append(indent + "  " + line[t.end():].lstrip())
        else:
            out.append(indent + "// " + text)
            out.append(line)
    open(path, "w").write("\n".join(out))

if __name__ == "__main__":
    mode, files = sys.argv[1], sys.argv[2:]
    for f in files:
        (strip if mode == "strip" else add)(f)
