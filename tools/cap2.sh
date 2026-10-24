#!/bin/bash
# usage: cap2.sh <label> <port> <steps.json> <app runs>   (server already on <port>)
set -u
label=$1; port=$2; steps=$3; runs=$4
FLOW=fb6139fc-fa1c-4e42-a41a-28dbd2462089
S=/home/vercel-sandbox/shots
cd /home/vercel-sandbox/autogpt/autogpt_platform/frontend
set -a; . /home/vercel-sandbox/autogpt/.context/run-stack/user.env; set +a
export SCREENSHOT_EMAIL=$PR_TEST_USER_EMAIL SCREENSHOT_PASSWORD=$PR_TEST_USER_PASSWORD APP_URL=http://localhost:$port
for n in $(seq 1 $runs); do
  out=$S/$label-run$n; rm -rf $out; mkdir -p $out
  npx tsx scripts/screenshot-pages.ts capture --out $out --base-url http://localhost:$port --routes "$(cat /home/vercel-sandbox/tools/routes.txt)" --stories > /tmp/cap-$label-$n-app.log 2>&1; a=$?
  npx tsx /home/vercel-sandbox/tools/capture-extra.mts $out $FLOW > /tmp/cap-$label-$n-extra.log 2>&1; b=$?
  echo "$label run$n: app exit=$a extra exit=$b, $(ls $out/*.png | wc -l) png"
done
for r in 1 2 3; do npx tsx /home/vercel-sandbox/tools/capture-tutorial.mts $steps $S/t$label-run$r 2>&1 | grep -v "npm warn" | tail -1; done
