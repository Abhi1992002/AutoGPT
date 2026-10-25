#!/bin/bash
# usage: states-run.sh <side> <outdir>
side=$1; out=$2
F=/home/vercel-sandbox/$side-wt/autogpt_platform/frontend
for p in $(pgrep -f "next-serve[r]|next star[t]"); do kill $p; done; sleep 2
(cd $F; NEXT_PUBLIC_PW_TEST=true exec nohup setsid pnpm start -p 3000 > /tmp/start-$side.log 2>&1 < /dev/null) > /dev/null 2>&1 &
for i in $(seq 1 60); do [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login)" = "200" ] && break; sleep 2; done
for p in $(pgrep -f "http.server 600[6]"); do kill $p; done; sleep 1
(cd /tmp/sb-$side; exec nohup setsid python3 -m http.server 6006 > /tmp/sb-$side-serve.log 2>&1 < /dev/null) > /dev/null 2>&1 &
sleep 2
set -a; . /home/vercel-sandbox/autogpt/.context/run-stack/user.env; set +a
cd /home/vercel-sandbox/autogpt/autogpt_platform/frontend
rm -rf $out
SCREENSHOT_EMAIL=$PR_TEST_USER_EMAIL SCREENSHOT_PASSWORD=$PR_TEST_USER_PASSWORD npx tsx .ign-harness/states2.ts $out 2>&1 | grep --line-buffered -v 'npm warn'; echo "states2 exit ${PIPESTATUS[0]}"
