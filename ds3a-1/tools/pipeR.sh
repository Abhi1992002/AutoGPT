#!/bin/bash
E=/home/vercel-sandbox/autogpt/.context/ev
waitb() { until grep -qE "^$1 [0-9a-f]+ built" $E/buildsR.log; do grep -q "ALL BUILT" $E/buildsR.log && ! grep -qE "^$1 [0-9a-f]+ built" $E/buildsR.log && { echo "NO BUILD $1"; return 1; }; sleep 20; done; }
(for x in "base 1" "base 2" "p1 1" "p2 1" "p3 1" "p4 1" "p5 1" "p6 1" "p7 1" "p8 1"; do set -- $x; waitb $1 && $E/capture2.sh $1 $2; done; echo "APP QUEUE DONE") &
(for x in "base 1" "base 2" "p1 1" "p2 1" "p3 1" "p4 1" "p5 1" "p6 1" "p7 1" "p8 1"; do set -- $x; waitb $1 && $E/sbcap.sh $1 $2 6101; done; echo "SB QUEUE DONE") &
wait
