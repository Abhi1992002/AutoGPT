#!/bin/bash
# usage: grep3132.sh <base> <head>   (run in the repo root)
# Rule 32: typography inside an added <Text ...> className.
# Rule 31: typography classes on an added raw text tag (p/span/h1-6/label/div/li/a/strong/em/code) instead of <Text>.
B=$1; Hd=$2
TYPO='(text-(tiny|caption-sm|caption|body-sm|body-md|body-lg|body|lead|heading-sm|heading|title|display|xs|sm|base|lg|[0-9]?xl|\[[0-9.]+(px|rem)\])|leading-[a-z0-9\[]|font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black|sans|mono|poppins)|tracking-|uppercase)'
echo "\$ git diff -U0 $B $Hd -- 'autogpt_platform/frontend/src/**/*.tsx' | grep '^+' | <join each added JSX element> | rule 32: <Text … className=\"…$TYPO…\">"
git diff -U0 $B $Hd -- 'autogpt_platform/frontend/src/**/*.tsx' | python3 -c "
import sys,re
typo=re.compile(r'(?<![\w-])$TYPO')
added=[l[1:] for l in sys.stdin if l.startswith('+') and not l.startswith('+++')]
src=' '.join(x.strip() for x in added)
r32=[]; r31=[]
for m in re.finditer(r'<Text\b[^>]*?>', src):
    cm=re.search(r'className=\"([^\"]*)\"', m.group(0))
    if cm and typo.search(cm.group(1)): r32.append(m.group(0))
for m in re.finditer(r'<(p|span|h[1-6]|label|div|li|a|strong|em|code)\b[^>]*?className=\"([^\"]*)\"', src):
    if typo.search(m.group(2)): r31.append(m.group(0)[:200])
print('rule 32 hits:', len(r32)); [print('  ', x) for x in r32]
print('rule 31 hits:', len(r31)); [print('  ', x) for x in r31]
"
echo "rule 31 (any added string literal outside <Text>, incl. cn() arguments):"
git diff -U0 $B $Hd -- 'autogpt_platform/frontend/src/**/*.tsx' 'autogpt_platform/frontend/src/**/*.ts' | python3 -c "
import sys,re
typo=re.compile(r'(?<![\w\-:\]])$TYPO|(?<=\]:)$TYPO')
f=None
n=0
for l in sys.stdin:
    if l.startswith('+++ '): f=l[6:].strip(); continue
    if not l.startswith('+') or l.startswith('+++'): continue
    t=l[1:]
    if '<Text' in t or 'atoms/Text/helpers' in (f or ''): continue
    for s in re.findall(r'\"([^\"]*)\"', t):
        hits=[m.group(0) for m in re.finditer(r'(?:\[&[^\]]*\]:|md:)?'+r'$TYPO', s)]
        if hits: n+=1; print(f'   {f.replace(\"autogpt_platform/frontend/\",\"\")}: {\" \".join(sorted(set(hits)))}')
print(f'rule 31 string-literal rows: {n}' + ('' if n else ' (no added string literal carries a size, leading, weight, family or tracking class)'))
"
