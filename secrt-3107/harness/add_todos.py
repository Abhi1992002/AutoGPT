import json, re, sys, collections
hexes = json.load(open('/tmp/hexes.json'))
ROLE_SAME = {  # value equals a role whose meaning does not fit
  '#D93636': 'error-hover, a hover fill',
  '#6c2edf': 'brand-hover, a hover fill',
  '#3E3E43': 'action, the button fill',
  '#2C2C30': 'action-hover, the button fill',
  '#505057': 'foreground-body, a text colour',
  '#EFEFF0': 'surface-hover, a fill',
  '#e5e7eb': 'sidebar-border, the sidebar only',
}
sites = collections.defaultdict(list)
for line in open('/tmp/todo-sites.txt'):
    f, ln, cls, _ = line.rstrip('\n').split('\t', 3)
    sites[f].append((int(ln), cls.split()))

def describe(cls):
    colours, notes, typo = [], [], []
    for c in cls:
        if 'tracking-[' in c:
            typo.append(c); continue
        h = hexes.get(c)
        m = re.search(r'\[(#[0-9A-Fa-f]{3,8})\]', c)
        if h:
            colours.append(f'{c} {h}')
            if h in ROLE_SAME: notes.append(f'{h} is {ROLE_SAME[h]}')
        elif m:
            colours.append(c)
        else:
            colours.append(c)
    parts = []
    if colours: parts.append('no exact role for ' + ', '.join(colours))
    if notes: parts.append('; '.join(dict.fromkeys(notes)))
    if typo: parts.append('no exact text token for ' + ', '.join(typo))
    return 'TODO(tokens): ' + '; '.join(parts)

for f, entries in sites.items():
    lines = open(f).read().split('\n')
    for ln, cls in sorted(entries, reverse=True):
        i = ln - 1
        text = lines[i]
        indent = re.match(r'\s*', text).group(0)
        s = text.strip()
        msg = describe(cls)
        m = re.match(r'<([A-Za-z][\w.]*)(\s)', s)
        if m and not s.startswith('<>'):
            # comment inside the opening tag, right after its name
            tag = m.group(1)
            rest = s[len(tag) + 1:].lstrip()
            lines[i:i+1] = [f'{indent}<{tag}', f'{indent}  // {msg}', f'{indent}  {rest}']
        else:
            lines.insert(i, f'{indent}// {msg}')
    open(f, 'w').write('\n'.join(lines))
    print('edited', f, len(entries))
