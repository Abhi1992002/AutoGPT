#!/bin/bash
# usage: retake.sh <sha> <outname> <routes-csv>  (DS1 script, seeded, same as capture.sh)
ROOT=/home/vercel-sandbox/autogpt; sha=$1; name=$2; routes=$3
WT=$ROOT/.context/wt/$sha/autogpt_platform/frontend; OUT=$ROOT/.context/evidence/shots/$name
mkdir -p $OUT
(cd $WT && PORT=3000 nohup pnpm start -p 3000 > /tmp/retake-$name.log 2>&1 &)
for i in $(seq 1 90); do curl -sf -o /dev/null http://localhost:3000/login && break; sleep 2; done
cd $ROOT/autogpt_platform/frontend
SCREENSHOT_EMAIL=screens@example.com SCREENSHOT_PASSWORD='ScreensPass123!' NODE_OPTIONS="--require $ROOT/.context/evidence/seed-preload.cjs" npx tsx scripts/screenshot-pages.ts capture --out $OUT --base-url http://localhost:3000 --routes $routes --stories > /dev/null 2>&1
ps -eo pid,args | grep -E "[n]ext start|[n]ext-server" | awk '{print $1}' | xargs -r kill; sleep 3
echo "retake $name done"
