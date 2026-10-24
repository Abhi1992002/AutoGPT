#!/bin/bash
# usage: capture.sh <sha> <outname> [routes|stories|both]
set -u
ROOT=/home/vercel-sandbox/autogpt
sha=$1; name=$2; mode=${3:-both}
WT=$ROOT/.context/wt/$sha/autogpt_platform/frontend
OUT=$ROOT/.context/evidence/shots/$name
SCRIPT=$ROOT/autogpt_platform/frontend/scripts/screenshot-pages.ts
LOG=$ROOT/.context/evidence/capture-$name.log
mkdir -p $OUT
source $ROOT/.context/run-stack/user.env 2>/dev/null
export SCREENSHOT_EMAIL=screens@example.com SCREENSHOT_PASSWORD='ScreensPass123!'
ROUTES="/login,/signup,/reset-password,/marketplace,/library,/home,/copilot,/team,/team/autopilot,/build,/settings/profile,/settings/account,/settings/api-keys,/settings/integrations,/tour,/tour/chat,/admin/users,/admin/memory"
STORIES="tokens-,atoms-button--,atoms-text--,molecules-accordion--,molecules-collapsible--,molecules-filetree--,copilot-account-mentions--,copilot-taskprogressbar--"
cd $ROOT/autogpt_platform/frontend
SEED="--require $ROOT/.context/evidence/seed-preload.cjs"
if [ "$mode" = interact ]; then
  (cd $WT && PORT=3000 nohup pnpm start -p 3000 > $LOG.server2 2>&1 &)
  for i in $(seq 1 90); do curl -sf -o /dev/null http://localhost:3000/login && break; sleep 2; done
  NODE_OPTIONS="$SEED" npx tsx $ROOT/.context/evidence/interact.ts --out $OUT --app-only >> $LOG 2>&1
  echo "[$(date +%T)] interactions (rerun) done" >> $LOG
  ps -eo pid,args | grep -E "[n]ext start|[n]ext-server" | awk '{print $1}' | xargs -r kill; sleep 3
  exit 0
fi
if [ "$mode" != stories ]; then
  (cd $WT && PORT=3000 nohup pnpm start -p 3000 > $LOG.server 2>&1 &)
  for i in $(seq 1 90); do curl -sf -o /dev/null http://localhost:3000/login && break; sleep 2; done
  echo "[$(date +%T)] routes start" >> $LOG
  NODE_OPTIONS="$SEED" npx tsx $SCRIPT capture --out $OUT --base-url http://localhost:3000 --routes $ROUTES --stories >> $LOG 2>&1
  echo "[$(date +%T)] routes done" >> $LOG
  NODE_OPTIONS="$SEED" npx tsx $ROOT/.context/evidence/interact.ts --out $OUT --app-only >> $LOG 2>&1
  echo "[$(date +%T)] interactions done" >> $LOG
  echo "[$(date +%T)] server errors: $(grep -cE "⨯|TypeError" $LOG.server)" >> $LOG
  ps -eo pid,args | grep -E "[n]ext start|[n]ext-server" | awk '{print $1}' | xargs -r kill; sleep 3
fi
if [ "$mode" != routes ]; then
  port=$((6100 + RANDOM % 800))
  (cd $WT/storybook-static && nohup python3 -m http.server $port > /dev/null 2>&1 & echo $! > $OUT.sbpid)
  sleep 2
  echo "[$(date +%T)] stories start port $port" >> $LOG
  env -u SCREENSHOT_EMAIL -u SCREENSHOT_PASSWORD NODE_OPTIONS="$SEED" npx tsx $SCRIPT capture --out $OUT --routes --storybook-url http://localhost:$port --stories $STORIES >> $LOG 2>&1
  echo "[$(date +%T)] stories done" >> $LOG
  NODE_OPTIONS="$SEED" npx tsx $ROOT/.context/evidence/interact.ts --out $OUT --stories-only --storybook http://localhost:$port >> $LOG 2>&1
  echo "[$(date +%T)] story interactions done" >> $LOG
  kill $(cat $OUT.sbpid); rm -f $OUT.sbpid
fi
