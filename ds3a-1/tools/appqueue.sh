#!/bin/bash
E=/home/vercel-sandbox/autogpt/.context/ev
while pgrep -f "[i]gn-interact.mts /home/vercel-sandbox/shots/base-run1" >/dev/null; do sleep 10; done
for x in "base 2 995df0dee" "p1 1 f36739fdb" "p2 1 b125d1a6a" "p3 1 60a9a2860" "p5 1 7c74dfc98" "p6 1 c1714b376" "p7 1 9c6653df5" "p8 1 d6c393d2d" "p4 1 65d63d043"; do
  set -- $x
  until cat $E/builds.log $E/builds2.log $E/builds3.log 2>/dev/null | grep -q "^$1 $3 built: app=ok sb=ok"; do sleep 15; done
  [ "$(git -C /home/vercel-sandbox/wt/$1 rev-parse --short=9 HEAD)" = "$3" ] || { echo "SHA MISMATCH $1"; continue; }
  $E/capture2.sh $1 $2
done
