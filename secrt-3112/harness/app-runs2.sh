#!/bin/bash
S=/home/vercel-sandbox/autogpt/.context
. $S/run-stack/user.env
export SCREENSHOT_EMAIL=$PR_TEST_USER_EMAIL SCREENSHOT_PASSWORD=$PR_TEST_USER_PASSWORD
start_app() {
  for pid in $(pgrep -f "next-server"); do [ "$(readlink /proc/$pid/cwd)" != "/var/lib/falkordb/browser" ] && kill $pid; done
  sleep 2
  (cd /home/vercel-sandbox/wt-$1/autogpt_platform/frontend && nohup setsid bash -c 'PORT=3000 pnpm start' > /tmp/start-$1.log 2>&1 &)
  for i in $(seq 1 60); do [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login)" = "200" ] && break; sleep 2; done
  echo "app $1 up $(date -u +%T) cwd=$(readlink /proc/$(pgrep -f next-server | tail -1)/cwd)"
}
probe() { # <label>
  for i in 1 2 3 4 5; do (cd /home/vercel-sandbox/autogpt/autogpt_platform/frontend && E=$PR_TEST_USER_EMAIL P=$PR_TEST_USER_PASSWORD FIXED=1 npx tsx $S/harness/probe-sidebar.ts 2>&1 | grep '^4000' | sed "s/^/probe $1 #$i /"); done
}
int() { # <label> <sb port> <only>
  (cd /home/vercel-sandbox/autogpt/autogpt_platform/frontend && npx tsx $S/harness/interactions.ts --out $S/shots/$1 --storybook-url http://localhost:$2 --only $3 > $S/shots/$1.log 2>&1); echo "int $1 $(grep -c ' ok$' $S/shots/$1.log) ok, $(grep -c 'ERROR\|not stable' $S/shots/$1.log) bad"
}
start_app dev; probe dev; int dev-b2 6007 build2-; int dev-fix 6007 admin-marketplace-reject-open,admin-spending-add-open
start_app pr1; probe pr1; int pr1-b2a 6006 build2-; int pr1-b2b 6006 build2-
start_app pr2; probe pr2; int pr2-b2a 6008 build2-; int pr2-b2b 6008 build2-
echo ALLDONE $(date -u +%T)
