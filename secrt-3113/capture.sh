#!/bin/bash
# usage: capture.sh <side: before|after> <outdir>
set -e
side=$1; out=$2
F=/home/vercel-sandbox/$side-wt/autogpt_platform/frontend
pkill -f "next-server" || true; pkill -f "next start" || true; sleep 2
(cd $F; NEXT_PUBLIC_PW_TEST=true exec nohup setsid pnpm start -p 3000 > /tmp/start-$side.log 2>&1 < /dev/null) > /dev/null 2>&1 &
for i in $(seq 1 60); do [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login)" = "200" ] && break; sleep 2; done
pkill -f "http.server 6006" || true; sleep 1
(cd /tmp/sb-$side; exec nohup setsid python3 -m http.server 6006 > /tmp/sb-$side-serve.log 2>&1 < /dev/null) > /dev/null 2>&1 &
sleep 2
set -a; . /home/vercel-sandbox/autogpt/.context/run-stack/user.env; set +a
S=/copilot?sessionId=5eed7113-0000-4000-8000-00000000000
ROUTES_ALL="/login,/signup,/reset-password,/marketplace,/library,/home,/copilot,/team,/team/autopilot,/build,/settings/profile,/settings/account,/settings/api-keys,/settings/integrations,/copilot/styleguide,/tour/chat,${S}1,${S}2"
ROUTES=${ROUTES_OVERRIDE:-$ROUTES_ALL}
STORIES=${STORIES_OVERRIDE:-tokens-,atoms-button--,atoms-text--,ai-elements-,copilot-account-mentions--}
cd /home/vercel-sandbox/autogpt/autogpt_platform/frontend
SCREENSHOT_EMAIL=$PR_TEST_USER_EMAIL SCREENSHOT_PASSWORD=$PR_TEST_USER_PASSWORD \
  npx tsx scripts/screenshot-pages.ts capture --out $out --routes "$ROUTES" \
  --storybook-url http://localhost:6006 --stories "$STORIES" 2>&1 | grep -v 'npm warn'
SCREENSHOT_EMAIL=$PR_TEST_USER_EMAIL SCREENSHOT_PASSWORD=$PR_TEST_USER_PASSWORD \
  npx tsx .ign-harness/states.ts ${out}-states 2>&1 | grep -v 'npm warn'
