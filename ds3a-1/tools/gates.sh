#!/bin/bash
# usage: gates.sh  -> every hcompare gate on the fixed pairing: run1 vs run2 of each build, then run1 vs run1 along the stack
E=/home/vercel-sandbox/autogpt/.context/ev; S=/home/vercel-sandbox/shots; H=$E/../evtools/harness/hcompare.py
mkdir -p $E/cmp $S/h-diffs
for l in base p1 p2 p3 p4; do python3 -I $H $S/h-$l-run1 $S/h-$l-run2 h-$l-det $S/h-diffs $E/cmp/h-$l-det.md; done
prev=base; for l in p1 p2 p3 p4; do x=$E/expected-$l.json; python3 -I $H $S/h-$prev-run1 $S/h-$l-run1 h-$prev-vs-$l $S/h-diffs $E/cmp/h-$prev-vs-$l.md $([ -f $x ] && echo $x); prev=$l; done
echo GATES DONE
