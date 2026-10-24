#!/bin/bash
# usage: cap_app.sh <label>   (app for that commit already on :3000)
set -a; . /home/vercel-sandbox/autogpt/.context/run-stack/user.env; set +a
export SCREENSHOT_EMAIL=$PR_TEST_USER_EMAIL SCREENSHOT_PASSWORD=$PR_TEST_USER_PASSWORD
S=/home/vercel-sandbox/shots; mkdir -p $S
cd /home/vercel-sandbox/autogpt/autogpt_platform/frontend
rm -rf $S/$1-app $S/$1-live
npx tsx scripts/screenshot-pages.ts capture --out $S/$1-app --routes "$(cat /home/vercel-sandbox/autogpt/.context/routes.txt)" --stories > /tmp/cap-$1-app.log 2>&1; a=$?
npx tsx /home/vercel-sandbox/autogpt/.context/tools/capture-states.mts capture /home/vercel-sandbox/autogpt/.context/spec-live.json $S/$1-live > /tmp/cap-$1-live.log 2>&1; b=$?
echo "$1: app exit=$a ($(ls $S/$1-app | wc -l) files) live exit=$b $(head -1 /tmp/cap-$1-live.log | grep -v warn; grep -v warn /tmp/cap-$1-live.log | head -1)"
