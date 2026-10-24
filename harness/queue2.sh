#!/bin/bash
cd /home/vercel-sandbox/autogpt/.context/evidence
W=/home/vercel-sandbox/autogpt/.context/wt
wait_built() { until [ -f $W/$1/autogpt_platform/frontend/.done ]; do sleep 10; done; }
stories() { # run up to 2 story captures at once
  for job in "995df0dee run1-995df0dee" "cfc0bde3b run1-cfc0bde3b" "345297fa7 run1-345297fa7" "a9c2fec4d run1-a9c2fec4d" "a8483db66 run1-a8483db66" "13978761a run1-13978761a" "995df0dee run2-995df0dee"; do
    set -- $job; wait_built $1
    while [ $(ps -eo args | grep -c "[c]apture.sh .* stories") -ge 2 ]; do sleep 5; done
    (./capture.sh $1 $2 stories; echo "[$(date +%T)] stories $2" >> queue2.log) &
    sleep 5
  done
  wait
}
stories &
for job in "995df0dee run1-995df0dee" "cfc0bde3b run1-cfc0bde3b" "e07df3d27 run1-e07df3d27" "d2b1b0746 run1-d2b1b0746" "345297fa7 run1-345297fa7" "a9c2fec4d run1-a9c2fec4d" "a8483db66 run1-a8483db66" "13978761a run1-13978761a" "995df0dee run2-995df0dee"; do
  set -- $job; wait_built $1
  ./capture.sh $1 $2 routes; echo "[$(date +%T)] app $2" >> queue2.log
done
wait
echo "[$(date +%T)] ALL DONE" >> queue2.log
