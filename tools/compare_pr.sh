#!/bin/bash
# usage: compare_pr.sh <pr> <before prefix> <after prefix>   e.g. badge base h1
S=/home/vercel-sandbox/shots; O=/home/vercel-sandbox/autogpt/.context/evidence/$1/screens; mkdir -p $O
T=/home/vercel-sandbox/autogpt/.context/tools
runs(){ ls -d $S/$1-run*-$2 2>/dev/null | paste -sd, ; }
cd /home/vercel-sandbox/autogpt/autogpt_platform/frontend
for kind in app live stories stories-ds1; do
  B=$(runs $2 $kind); A=$(runs $3 $kind)
  [ -z "$B" ] || [ -z "$A" ] && { echo "$1 $kind: missing runs ($B | $A)"; continue; }
  python3 $T/cross.py $O/cross-$kind.md "$B" "$A" | head -1 | sed "s/^/$1 $kind: /"
done
for kind in live stories; do
  npx tsx $T/capture-states.mts compare $S/$2-run1-$kind $S/$3-run1-$kind $S/diff-$2-$3-$kind 2>/dev/null | head -1 | sed "s/^/$1 $kind DOM+focus run1: /"
  cp $S/diff-$2-$3-$kind/compare.md $O/dom-$kind.md
done
