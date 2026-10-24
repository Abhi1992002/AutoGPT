#!/bin/bash
E=/home/vercel-sandbox/autogpt/.context/ev
while ps -p 132809 >/dev/null 2>&1; do sleep 10; done
grep -qE "^p2 [0-9a-f]+ built" $E/buildsR.log || { echo "BUILD FAIL p2" >> $E/buildsR.log; }
for x in "p1 f024901e3" "p2 e529500de" "p3 d45ba7cbe" "p4 1ec2c4fba" "p5 caa5c8e90" "p6 dedeb3ae9" "p7 e30a62786" "p8 88d8ad6de"; do
  set -- $x; grep -qE "^$1 [0-9a-f]+ built" $E/buildsR.log && continue
  for t in 1 2; do $E/mkwt.sh $1 $2 >> $E/buildsR.log 2>&1 && break; echo "retry $1" >> $E/buildsR.log; done
done
echo "ALL BUILT $(date -u)" >> $E/buildsR.log
