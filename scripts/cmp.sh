#!/bin/bash
# usage: cmp.sh A B  → shots4/compare-A-B.md (+ diff images), prints summary line
S=/home/vercel-sandbox/autogpt/.context/shots4
cd /home/vercel-sandbox/autogpt/autogpt_platform/frontend
npx tsx scripts/screenshot-pages.ts compare $S/$1 $S/$2 --diff $S/diff-$1-$2 2>/dev/null > $S/compare-$1-$2.md
echo "$1 vs $2: $(tail -1 $S/compare-$1-$2.md) :: $(grep '^|' $S/compare-$1-$2.md | grep -v ' 0 |$' | grep -v 'changed pixels\|---' | awk -F'|' '{print $2 $4}' | tr -s ' ' | tr '\n' ';')"
