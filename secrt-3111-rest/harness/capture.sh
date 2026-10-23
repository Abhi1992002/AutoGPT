#!/bin/bash
# usage: capture.sh <frontend dir to serve> <out dir>
set -e
SERVE=$1; OUT=$2
pids=$(lsof -ti :3000 -sTCP:LISTEN 2>/dev/null || true); [ -n "$pids" ] && kill -9 $pids || true
sleep 1
cd "$SERVE" && (nohup setsid pnpm start -p 3000 > /tmp/start.log 2>&1 &)
for i in $(seq 1 60); do [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login)" = "200" ] && break; sleep 2; done
echo "serving $(git -C "$SERVE" rev-parse HEAD) from $SERVE"
. /home/vercel-sandbox/autogpt/.context/run-stack/user.env
. /home/vercel-sandbox/autogpt/.context/run-stack/sessions.env
cd /home/vercel-sandbox/autogpt/autogpt_platform/frontend
ROUTES="/login,/signup,/reset-password,/marketplace,/library,/home,/copilot,/team,/team/autopilot,/build,/settings/profile,/settings/account,/settings/api-keys,/settings/integrations,/copilot/styleguide,/home?sessionId=$S,/home?sessionId=$D"
SCREENSHOT_EMAIL=$PR_TEST_USER_EMAIL SCREENSHOT_PASSWORD=$PR_TEST_USER_PASSWORD \
  npx tsx scripts/screenshot-pages.ts capture --out "$OUT" --routes "$ROUTES" --dismiss "Got it,Dismiss changelog" 2>&1 | grep -v "npm warn"
SCREENSHOT_EMAIL=$PR_TEST_USER_EMAIL SCREENSHOT_PASSWORD=$PR_TEST_USER_PASSWORD SHARE_SESSION=$D \
  npx tsx /home/vercel-sandbox/tools/extra-states.ts "$OUT" 2>&1 | grep -v "npm warn"
ls "$OUT" | wc -l
