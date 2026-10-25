#!/bin/bash
# Equivalence per PR against its own base head: class pairs (compare.ts) and
# DOM restructures (nested.ts). Pairs are generated from each PR's diff
# (gen-pairs.py) and resolved with the head's Text helpers and cn() (resolve.ts).
# usage: [PRS="1 2"] eqall.sh  (reads ../shas2.txt)
set -u
E=/home/vercel-sandbox/autogpt/.context/evidence/eq
W=/home/vercel-sandbox/autogpt/.context/wt
FE=/home/vercel-sandbox/autogpt/autogpt_platform/frontend
S=($(cat $E/../shas2.txt))
for i in ${PRS:-1 2 3 4 5 6 7}; do
  b=$W/${S[$((i-1))]}/autogpt_platform/frontend; h=$W/${S[$i]}/autogpt_platform/frontend
  (cd $h && npx tsx --tsconfig tsconfig.json $E/nested-cases.ts $i $E/nested-cases-pr$i.json >/dev/null 2>&1)
  g=$(python3 $E/gen-pairs.py $i ${S[$((i-1))]} ${S[$i]} $E/gen-pr$i.json | head -1) || { echo "PR$i generator failed: $g"; exit 1; }
  (cd $h && npx tsx --tsconfig tsconfig.json $E/resolve.ts $E/gen-pr$i.json $E/pairs-pr$i.json >/dev/null 2>&1)
  p=$(cd $FE && npx tsx $E/compare.ts $b $h $E/pairs-pr$i.json $E/result-pr$i.md 2>&1 | grep -v "npm warn" | tail -1)
  n=$(cd $FE && npx tsx $E/nested.ts $b $h $E/nested-cases-pr$i.json $E/nested-pr$i.md 2>&1 | grep -v "npm warn" | tail -1)
  echo "$g"; echo "PR$i ${S[$((i-1))]}..${S[$i]}: pairs: $p | nested: $n"
done
