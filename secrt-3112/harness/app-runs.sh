#!/bin/bash
# Sequential app-side captures: routes + interactions per commit, same data.
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
run() { # <worktree> <label> <sb port>
  $S/capture-routes.sh $S/shots/$2-routes > $S/shots/$2-routes.log 2>&1; echo "routes $2 $(tail -1 $S/shots/$2-routes.log)"
  (cd /home/vercel-sandbox/autogpt/autogpt_platform/frontend && npx tsx $S/harness/interactions.ts --out $S/shots/$2-int --storybook-url http://localhost:$3 > $S/shots/$2-int.log 2>&1); echo "int $2 $(grep -c ' ok$' $S/shots/$2-int.log) ok, $(grep -c 'ERROR\|not stable' $S/shots/$2-int.log) bad"
}
start_app dev; run dev dev-a 6007
start_app pr1; run pr1 pr1-a 6006; run pr1 pr1-b 6006
start_app pr2; run pr2 pr2-a 6008; run pr2 pr2-b 6008
echo ALLDONE $(date -u +%T)
