#!/bin/bash
# usage: capture.sh <label> <run>   serve ~/wt/<label> app on :3000 + storybook on :6006, capture into ~/shots/<label>-run<run>
L=$1; R=$2; FE=/home/vercel-sandbox/wt/$L/autogpt_platform/frontend; OUT=/home/vercel-sandbox/shots/$L-run$R
MAINFE=/home/vercel-sandbox/autogpt/autogpt_platform/frontend
set -a; . /home/vercel-sandbox/autogpt/.context/run-stack/user.env; set +a
export SCREENSHOT_EMAIL=$PR_TEST_USER_EMAIL SCREENSHOT_PASSWORD=$PR_TEST_USER_PASSWORD
for p in 3000 6006; do pids=$(lsof -ti :$p -sTCP:LISTEN 2>/dev/null); [ -n "$pids" ] && kill -9 $pids; done
cd $FE && (nohup setsid npx next start -p 3000 > /tmp/serve-$L.log 2>&1 &)
(cd $FE && nohup setsid npx http-server storybook-static -p 6006 -s > /tmp/sb-$L.log 2>&1 &)
for i in $(seq 1 60); do [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login)" = "200" ] && break; sleep 2; done
for i in $(seq 1 30); do [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:6006/index.json)" = "200" ] && break; sleep 1; done
rm -rf $OUT; mkdir -p $OUT
cd $MAINFE
npx tsx scripts/screenshot-pages.ts capture --out $OUT --routes "$(cat /home/vercel-sandbox/autogpt/.context/ev/routes.txt)" --stories > $OUT.app.log 2>&1
npx tsx scripts/screenshot-pages.ts capture --out $OUT --routes --storybook-url http://localhost:6006 --stories "$(cat /home/vercel-sandbox/autogpt/.context/ev/stories.txt)" > $OUT.sb.log 2>&1
npx tsx .ign-interact.mts $OUT http://localhost:3000 http://localhost:6006 > $OUT.interact.log 2>&1
echo "$L run$R: $(ls $OUT | wc -l) files; unstable: $(grep -c 'not stable' $OUT.app.log $OUT.sb.log | tr '\n' ' '); interact: $(grep -c ' ok' $OUT.interact.log) ok, $(grep -c 'SKIP\|NOT STABLE' $OUT.interact.log) skip/unstable"
