#!/bin/bash
/home/vercel-sandbox/tools/cap2.sh f0 3000 /tmp/fsteps-base.json 3 > /tmp/f0.log 2>&1 &
/home/vercel-sandbox/tools/cap2.sh f1 3003 /tmp/fsteps-p1.json 3 > /tmp/f1.log 2>&1 &
/home/vercel-sandbox/tools/cap2.sh f2 3002 /tmp/fsteps-p2.json 3 > /tmp/f2.log 2>&1 &
wait
sed -i 's/for r in 1 2; do/for r in 1 2 3; do/' /tmp/sites2.sh
/tmp/sites2.sh f0 3000 > /tmp/sf0.log 2>&1 &
/tmp/sites2.sh f1 3003 > /tmp/sf1.log 2>&1 &
/tmp/sites2.sh f2 3002 > /tmp/sf2.log 2>&1 &
wait
echo done > /tmp/campaign.done
