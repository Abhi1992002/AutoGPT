#!/bin/bash
cd /home/vercel-sandbox/autogpt/.context/evidence
ROOT=/home/vercel-sandbox/autogpt; FE=$ROOT/autogpt_platform/frontend; SEED="--require $ROOT/.context/evidence/seed-preload.cjs"
W=$ROOT/.context/wt
true
rm -f evsb.log
./build-evstory.sh 3be8ded01 ea7601a36 52af88a46 74b35c2b7 795a2dfac ac42a30d1
for job in "3be8ded01 ev-3be8ded01" "ea7601a36 ev-ea7601a36" "52af88a46 ev-52af88a46" "74b35c2b7 ev-74b35c2b7" "795a2dfac ev-795a2dfac" "ac42a30d1 ev-ac42a30d1" "ac42a30d1 ev2-ac42a30d1"; do
  set -- $job; D=$W/$1/autogpt_platform/frontend
  port=$((7100 + RANDOM % 700)); (cd $D/storybook-evidence && python3 -m http.server $port > /dev/null 2>&1 & echo $! > /tmp/ev-$2.pid); sleep 2
  (cd $FE && env -u SCREENSHOT_EMAIL -u SCREENSHOT_PASSWORD NODE_OPTIONS="$SEED" npx tsx scripts/screenshot-pages.ts capture --out $ROOT/.context/evidence/shots/$2 --routes --storybook-url http://localhost:$port --stories evidence-ds3b-- > $ROOT/.context/evidence/capture-$2.log 2>&1
   EVSTORY=1 NODE_OPTIONS="$SEED" npx tsx $ROOT/.context/evidence/interact.ts --out $ROOT/.context/evidence/shots/$2 --stories-only --storybook http://localhost:$port >> $ROOT/.context/evidence/capture-$2.log 2>&1)
  kill $(cat /tmp/ev-$2.pid); echo "[$(date +%T)] ev $2" >> qev3.log
done
echo "[$(date +%T)] ALL DONE" >> qev3.log
