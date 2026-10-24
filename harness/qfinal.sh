#!/bin/bash
cd /home/vercel-sandbox/autogpt/.context/evidence
W=/home/vercel-sandbox/autogpt/.context/wt
S=($(cat shas.txt))
wait_built() { until [ -f $W/$1/autogpt_platform/frontend/.done ]; do sleep 10; done; }
stories() {
  for job in "${S[0]} run1-${S[0]}" "${S[1]} run1-${S[1]}" "${S[2]} run1-${S[2]}" "${S[3]} run1-${S[3]}" "${S[4]} run1-${S[4]}" "${S[5]} run1-${S[5]}" "${S[6]} run1-${S[6]}" "${S[7]} run1-${S[7]}" "${S[0]} run2-${S[0]}"; do
    set -- $job; wait_built $1
    [ -f shots/$2/keyboard-stories.json ] && continue
    ps -eo args | grep -q "[c]apture.sh $1 $2 stories" && continue
    while [ $(ps -eo args | grep -c "[c]apture.sh .* stories") -ge 2 ]; do sleep 5; done
    (./capture.sh $1 $2 stories; echo "[$(date +%T)] stories $2" >> qfinal.log) &
    sleep 3
  done
  wait
}
stories &
for job in "${S[0]} run1-${S[0]}" "${S[1]} run1-${S[1]}" "${S[2]} run1-${S[2]}" "${S[3]} run1-${S[3]}" "${S[4]} run1-${S[4]}" "${S[5]} run1-${S[5]}" "${S[6]} run1-${S[6]}" "${S[7]} run1-${S[7]}" "${S[0]} run2-${S[0]}"; do
  set -- $job; wait_built $1
  if [ -f shots/$2/keyboard-app.json ] && [ -d shots/misc-${2#run1-} ]; then continue; fi
  while ps -eo args | grep -q "[c]apture.sh .* routes"; do sleep 5; done
  if [ -f shots/$2/keyboard-app.json ] && [ -d shots/misc-${2#run1-} ]; then continue; fi
  ./capture.sh $1 $2 routes; echo "[$(date +%T)] app $2" >> qfinal.log
done
wait
echo "[$(date +%T)] ALL DONE" >> qfinal.log
