#!/bin/bash
# usage: cmp9.sh <key...>  (default: all); writes cmp9-<key>.md, diffs into shots9/<diffdir>
H=/home/vercel-sandbox/harness; S=$H/shots9
declare -A P=(
 [ba]="before after diff-before-after" [bb]="before before2 diff-base-base" [hh]="after after2 diff-determinism"
 [move]="after move diff-move" [mm]="move move2 diff-move-move"
 [hsba]="before-hsec after-hsec diff-hsec" [hsbb]="before-hsec before2-hsec diff-hsec-base-base" [hshh]="after-hsec after2-hsec diff-hsec-det"
 [hsmove]="after-hsec move-hsec diff-hsec-move" [hsmm]="move-hsec move2-hsec diff-hsec-mm"
 [st]="before-states after-states diff-states" [stbb]="before-states before2-states diff-states-base-base" [sthh]="after-states after2-states diff-states-det"
 [stmove]="after-states move-states diff-move-states" [stmm]="move-states move2-states diff-states-mm")
keys="$@"; [ -n "$keys" ] || keys="ba bb hh move mm hsba hsbb hshh hsmove hsmm st stbb sthh stmove stmm"
cd /home/vercel-sandbox/autogpt/autogpt_platform/frontend
for k in $keys; do set -- ${P[$k]}
  [ -d $S/$1 ] && [ -d $S/$2 ] || { echo "== $k: missing $1 or $2"; continue; }
  rm -rf $S/$3; npx tsx scripts/screenshot-pages.ts compare $S/$1 $S/$2 --diff $S/$3 2>&1 | grep -v "npm warn" > $H/cmp9-$k.md
  echo "== $k ($1 vs $2): $(tail -n1 $H/cmp9-$k.md) | n=$(grep -c '\.png |' $H/cmp9-$k.md)"; awk -F'|' '$4+0>0' $H/cmp9-$k.md
done
