#!/bin/bash
# usage: capture_runs.sh <label> <run numbers...>   (app on :3000 serving that commit)
set -u
FE=/home/vercel-sandbox/autogpt/autogpt_platform/frontend
S=/home/vercel-sandbox/shots
FLOW=fb6139fc-fa1c-4e42-a41a-28dbd2462089
set -a; . /home/vercel-sandbox/autogpt/.context/run-stack/user.env; set +a
export SCREENSHOT_EMAIL=$PR_TEST_USER_EMAIL SCREENSHOT_PASSWORD=$PR_TEST_USER_PASSWORD
cd $FE
label=$1; shift
for n in "$@"; do
  out=$S/$label-run$n
  rm -rf $out; mkdir -p $out
  npx tsx scripts/screenshot-pages.ts capture --out $out --routes "$(cat /home/vercel-sandbox/tools/routes.txt)" --stories > /tmp/cap-$label-$n-app.log 2>&1; a=$?
  npx tsx /home/vercel-sandbox/tools/capture-extra.mts $out $FLOW > /tmp/cap-$label-$n-extra.log 2>&1; b=$?
  echo "$label run$n: app exit=$a extra exit=$b, $(ls $out/*.png | wc -l) png"
done
