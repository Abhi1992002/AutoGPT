#!/bin/bash
cd /home/vercel-sandbox/autogpt/autogpt_platform/frontend
E=/home/vercel-sandbox/autogpt/.context/evidence
S=($(cat $E/shas.txt))
pairs=("0 1" "1 2" "2 3" "3 4" "4 5" "5 6" "6 7")
for i in 0 1 2 3 4 5 6; do
  set -- ${pairs[$i]}; b=${S[$1]}; h=${S[$2]}; n=$((i+1))
  [ -d $E/shots/run1-$b ] && [ -f $E/shots/run1-$h/keyboard-stories.json ] || continue
  npx tsx scripts/screenshot-pages.ts compare $E/shots/run1-$b $E/shots/run1-$h --diff $E/shots/diff-pr$n > $E/compare-pr$n.md 2>/dev/null
  for k in keyboard-app.json keyboard-stories.json; do
    if diff -q $E/shots/run1-$b/$k $E/shots/run1-$h/$k >/dev/null; then echo "$k identical" >> $E/compare-pr$n.md; else echo "$k DIFFERS" >> $E/compare-pr$n.md; fi
  done
  echo "PR$n $b..$h: $(grep 'compared' $E/compare-pr$n.md) | $(grep keyboard $E/compare-pr$n.md | tr '\n' ' ')"
done
if [ -f $E/shots/run2-${S[0]}/keyboard-stories.json ]; then
  npx tsx scripts/screenshot-pages.ts compare $E/shots/run1-${S[0]} $E/shots/run2-${S[0]} --diff $E/shots/diff-determinism > $E/compare-determinism.md 2>/dev/null
  for k in keyboard-app.json keyboard-stories.json; do diff -q $E/shots/run1-${S[0]}/$k $E/shots/run2-${S[0]}/$k >/dev/null && echo "$k identical" >> $E/compare-determinism.md || echo "$k DIFFERS" >> $E/compare-determinism.md; done
  echo "determinism ${S[0]} x2: $(grep 'compared' $E/compare-determinism.md) | $(grep keyboard $E/compare-determinism.md | tr '\n' ' ')"
fi
