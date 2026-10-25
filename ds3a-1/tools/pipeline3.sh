#!/bin/bash
# all ten harness runs on the built worktrees after pinning the test data's timestamps (no builds), then one resume pass, then the gates
E=/home/vercel-sandbox/autogpt/.context/ev
: > $E/pipeline3.log; sleep 330   # the store's shared cache TTL is 300s
w() { local slot=$1; shift; for x in "$@"; do SLOT=$slot $E/hrun.sh ${x%%:*} ${x##*:} >> $E/pipeline3.log 2>&1; done; echo "SLOT $slot DONE" >> $E/pipeline3.log; }
w 0 base:1 base:2 p3:1 p3:2 & w 1 p1:1 p1:2 p4:1 & w 2 p2:1 p2:2 p4:2 &
wait
for lr in base:1 base:2 p1:1 p1:2 p2:1 p2:2 p3:1 p3:2 p4:1 p4:2; do $E/resume.sh ${lr%%:*} ${lr##*:} 0 >> $E/pipeline3.log 2>&1; done
echo "RUNS DONE" >> $E/pipeline3.log
$E/gates.sh >> $E/pipeline3.log 2>&1
echo "PIPELINE3 DONE" >> $E/pipeline3.log
