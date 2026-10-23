#!/bin/bash
# usage: count.sh  (run in count-wt frontend)
cd /home/vercel-sandbox/count-wt/autogpt_platform/frontend
C="src/app/(platform)/copilot"
mapfile -d '' FILES < <(find "$C" -type f \( -name '*.ts' -o -name '*.tsx' \) -not -path "$C/components/*" -not -path "$C/tools/*" -print0)
echo "scope files: ${#FILES[@]}"
echo -n "wc -l (default fmt): "; pnpm exec oxlint -c .oxlintrc.strict.json "${FILES[@]}" 2>/dev/null | wc -l
pnpm exec oxlint -c .oxlintrc.strict.json -f unix "${FILES[@]}" 2>/dev/null > /tmp/unix.txt
echo -n "unix hits: "; grep -cE '^[^ ].*:[0-9]+:[0-9]+:' /tmp/unix.txt
grep -oE '\[(Error|Warning)/[^]]+\]' /tmp/unix.txt | sort | uniq -c
echo -n "whole copilot dir wc -l: "; pnpm exec oxlint -c .oxlintrc.strict.json "$C" 2>/dev/null | wc -l
