"""Raw Tailwind sizes -> text roles at the same computed size and line-height,
inside every quoted class list of the given files.
  text-xs  (12/16) -> text-caption (12/18): + leading-4 unless leading-4.5, which it absorbs
  text-sm  (14/20) -> text-body    (14/22): + leading-5 unless leading-5.5, which it absorbs
  text-base(16/24) -> text-body-lg (16/26): + leading-6 unless leading-6.5, which it absorbs
  text-xl  (20/28) -> text-lead    (20/28)
A leading-* that follows the size in the list is kept (it wins in CSS and in cn()).
Lists where a leading-* comes before the size, a variant prefix or ! is on the size,
or another leading follows are left unchanged and printed for a hand fix or TODO."""
import re, sys
RUN = re.compile(r'(["`])([^"`{}$]*?)\1')
MAP = {"text-xs": ("text-caption", "leading-4", "leading-4.5"), "text-sm": ("text-body", "leading-5", "leading-5.5"),
       "text-base": ("text-body-lg", "leading-6", "leading-6.5"), "text-xl": ("text-lead", None, "leading-7")}
SIZE = re.compile(r"^(?:[\w\[\]=&>:-]+:)?!?text-(xs|sm|base|lg|xl|[2-9]xl)$")
left, n = [], 0
def fix(m):
    global n
    q, body = m.group(1), m.group(2)
    words = body.split()
    sizes = [i for i, w in enumerate(words) if SIZE.match(w)]
    if not sizes:
        return m.group(0)
    if len(sizes) > 1 or words[sizes[0]] not in MAP:
        left.append(body); return m.group(0)
    i = sizes[0]; size = words[i]; role, own, absorbed = MAP[size]
    leads = [j for j, w in enumerate(words) if re.match(r"^(?:[\w-]+:)?!?leading-", w)]
    if any(j < i for j in leads) or any(":" in words[j] or "!" in words[j] for j in leads):
        left.append(body); return m.group(0)
    out = list(words)
    if not leads:
        out[i] = role if own is None else f"{role} {own}"
    elif len(leads) == 1 and words[leads[0]] == absorbed:
        out[i] = role; out[leads[0]] = None
    else:
        out[i] = role  # the explicit leading after it keeps today's line-height
    n += 1
    lead_ws = re.match(r"^\s*", body).group(0); trail = re.search(r"\s*$", body).group(0)
    return q + lead_ws + " ".join(w for w in out if w) + trail + q
for f in sys.argv[1:]:
    s = open(f).read()
    s2 = RUN.sub(fix, s)
    if s2 != s: open(f, "w").write(s2)
print(n, "sizes moved;", len(left), "left:")
for l in left: print("  ", l[:200])
