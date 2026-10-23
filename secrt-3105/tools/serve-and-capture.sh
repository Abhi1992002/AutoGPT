#!/bin/bash
# serve-and-capture.sh <frontend dir> <out dir>: serve that build on :3000, capture with DS1's harness, re-capture /raise with the frozen-clock companion.
set -u
DIR=$1; OUT=$2
for p in $(pgrep -f next-server); do case "$(readlink /proc/$p/cwd)" in */frontend) kill $p;; esac; done
for i in $(seq 1 30); do curl -s -o /dev/null http://localhost:3000 || break; sleep 1; done
# Server-side requests to the internet fail the same way in every run (the
# changelog popup fetches agpt.co and appears on a timer otherwise).
cd "$DIR" && (NODE_USE_ENV_PROXY=1 HTTPS_PROXY=http://127.0.0.1:9 HTTP_PROXY=http://127.0.0.1:9 NO_PROXY=localhost,127.0.0.1,::1 nohup setsid pnpm start > /tmp/serve.log 2>&1 &)
for i in $(seq 1 60); do [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login)" = "200" ] && break; sleep 2; done
echo "serving $(for p in $(pgrep -f next-server); do readlink /proc/$p/cwd; done | grep frontend | head -1) (changelog: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/changelog))"
set -a; . /home/vercel-sandbox/autogpt/.context/run-stack/user.env; set +a
export SCREENSHOT_EMAIL=$PR_TEST_USER_EMAIL SCREENSHOT_PASSWORD=$PR_TEST_USER_PASSWORD
H=/home/vercel-sandbox/autogpt/autogpt_platform/frontend
rm -rf "$OUT"
cd $H && npx tsx scripts/screenshot-pages.ts capture --out "$OUT" --routes "$(cat /home/vercel-sandbox/autogpt/.context/evidence/routes.txt)" 2>&1 | grep -v "npm warn" | tail -4
cd $H && npx tsx ../../.context/tools/capture-frozen.ts "$OUT" http://localhost:3000 /raise /copilot /profile/settings /home 2>&1 | grep -v "npm warn"
