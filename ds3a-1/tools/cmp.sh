#!/bin/bash
# usage: cmp.sh <before-dir-name> <after-dir-name> <tag>  -> DS1 compare at threshold 0, table + diff pngs
S=/home/vercel-sandbox/shots; O=/home/vercel-sandbox/autogpt/.context/ev/cmp; mkdir -p $O
cd /home/vercel-sandbox/autogpt/autogpt_platform/frontend
npx tsx scripts/screenshot-pages.ts compare $S/$1 $S/$2 --diff $S/diff-$3 > $O/$3.md 2>/dev/null; echo "$3: $(tail -1 $O/$3.md)"
