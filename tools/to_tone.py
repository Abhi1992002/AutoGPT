"""On <Text variant=...> elements this PR created (to_text.mts), move a base
text colour that is a Text tone into the tone prop. Text applies
cn(variant, tone, className), so the tone lands where className did, before
the remaining className classes, and wins over the variant colour the same way."""
import re, sys
TONES = {"text-foreground-strong": "primary", "text-foreground-emphasis": "emphasis", "text-foreground-body": "body", "text-foreground-secondary": "secondary", "text-foreground-tertiary": "muted", "text-foreground-subtle": "subtle"}
OPEN = re.compile(r'<Text\s+variant="([\w-]+)"((?:\s+as="\w+")?)\s+className=(?:"([^"]*)"|\{cn\(\s*"([^"]*)")', re.S)
n = 0
for f in sys.argv[1:]:
    s = open(f).read()
    def fix(m):
        global n
        cls = m.group(3) if m.group(3) is not None else m.group(4)
        words = cls.split()
        tones = [w for w in words if w in TONES]
        if len(tones) != 1:
            return m.group(0)
        n += 1
        rest = " ".join(w for w in words if w != tones[0])
        head = f'<Text variant="{m.group(1)}"{" " + m.group(2).strip() if m.group(2) else ""} tone="{TONES[tones[0]]}"'
        if m.group(3) is not None:
            return head + (f' className="{rest}"' if rest else "")
        return head + f' className={{cn("{rest}"'
    s2 = OPEN.sub(fix, s)
    if s2 != s:
        open(f, "w").write(s2)
print(n, "tone moves")
