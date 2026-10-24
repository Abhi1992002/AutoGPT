#!/bin/bash
# re-run the connect-dialog scenarios on every run with the fixed flow; patch images + keyboard keys into run dirs
cd /home/vercel-sandbox/autogpt/.context/evidence
ROOT=/home/vercel-sandbox/autogpt; FE=$ROOT/autogpt_platform/frontend; SEED="--require $ROOT/.context/evidence/seed-preload.cjs"
for job in "0d5ac323f run1-0d5ac323f" "9bf3e4240 run1-9bf3e4240" "3be8ded01 run1-3be8ded01" "ea7601a36 run1-ea7601a36" "52af88a46 run1-52af88a46" "74b35c2b7 run1-74b35c2b7" "795a2dfac run1-795a2dfac" "ac42a30d1 run1-ac42a30d1" "0d5ac323f run2-0d5ac323f"; do
  set -- $job; W=$ROOT/.context/wt/$1/autogpt_platform/frontend; T=/tmp/conn-$2; rm -rf $T
  (cd $W && PORT=3000 nohup pnpm start -p 3000 > /tmp/connsrv.log 2>&1 &)
  for i in $(seq 1 90); do curl -sf -o /dev/null http://localhost:3000/login && break; sleep 2; done
  extra=""
  (cd $FE && MISC=1 ONLY="copilot-connect:desktop,copilot-connect:mobile$extra" SCREENSHOT_EMAIL=screens@example.com SCREENSHOT_PASSWORD='ScreensPass123!' NODE_OPTIONS="$SEED" npx tsx $ROOT/.context/evidence/interact.ts --out $T --app-only > $T.log 2>&1)
  ps -eo pid,args | grep -E "[n]ext start|[n]ext-server" | awk '{print $1}' | xargs -r kill; sleep 3
  cp $T/interact__copilot-connect-dialog-open__*.png shots/$2/
  if [ "$2" = run1-74b35c2b7 ]; then
    (cd $W && PORT=3000 nohup pnpm start -p 3000 > /tmp/connsrv2.log 2>&1 &)
    for i in $(seq 1 90); do curl -sf -o /dev/null http://localhost:3000/login && break; sleep 2; done
    (cd $FE && ONLY="recent-chats:desktop" SCREENSHOT_EMAIL=screens@example.com SCREENSHOT_PASSWORD='ScreensPass123!' NODE_OPTIONS="$SEED" npx tsx $ROOT/.context/evidence/interact.ts --out /tmp/rc-$2 --app-only > /tmp/rc-$2.log 2>&1)
    ps -eo pid,args | grep -E "[n]ext start|[n]ext-server" | awk '{print $1}' | xargs -r kill; sleep 3
    cp /tmp/rc-$2/interact__recent-chat*.png /tmp/rc-$2/interact__otto-group-all-loaded*.png shots/$2/
  fi
  python3 - "$T/keyboard-app.json" "shots/$2/keyboard-app.json" "shots/misc-${2#run1-}" <<'PY'
import json, sys, os, shutil
new = json.load(open(sys.argv[1])); old = json.load(open(sys.argv[2]))
for k in [k for k in old if k.startswith("connect dialog")]: del old[k]
for k, v in new.items():
    if k.startswith("connect dialog"): old[k] = v
json.dump(old, open(sys.argv[2], "w"), indent=1)
miscdir = sys.argv[3]
if any(k.startswith("context panel") for k in new) and os.path.isdir(miscdir):
    mk = json.load(open(miscdir + "/keyboard-app.json"))
    for k in [k for k in mk if k.startswith("FAILED misc-context-esc")]: del mk[k]
    for k, v in new.items():
        if k.startswith("context panel"): mk[k] = v
    json.dump(mk, open(miscdir + "/keyboard-app.json", "w"), indent=1)
    src = os.path.dirname(sys.argv[1])
    for f in os.listdir(src):
        if f.startswith("interact__context-panel") or f.startswith("interact__copilot-session-workcard"): shutil.copy(os.path.join(src, f), miscdir)
PY
  echo "[$(date +%T)] conn $2" >> connfix.log
done
echo "[$(date +%T)] ALL DONE" >> connfix.log
