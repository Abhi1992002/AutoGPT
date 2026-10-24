#!/bin/bash
S=/home/vercel-sandbox/autogpt/.context
. $S/run-stack/user.env
export SCREENSHOT_EMAIL=$PR_TEST_USER_EMAIL SCREENSHOT_PASSWORD=$PR_TEST_USER_PASSWORD
start_app() {
  for pid in $(pgrep next-server); do [ "$(readlink /proc/$pid/cwd)" != "/var/lib/falkordb/browser" ] && kill $pid; done
  sleep 2
  (cd /home/vercel-sandbox/wt-$1/autogpt_platform/frontend && nohup setsid bash -c 'PORT=3000 pnpm start' > /tmp/start-$1-f.log 2>&1 &)
  for i in $(seq 1 60); do [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login)" = "200" ] && break; sleep 2; done
  echo "app $1 up cwd=$(readlink /proc/$(pgrep next-server | tail -1)/cwd)"
}
for c in dev pr1 pr2; do
  start_app $c
  for i in 1 2 3; do
    (cd /home/vercel-sandbox/autogpt/autogpt_platform/frontend && npx tsx scripts/screenshot-pages.ts capture --out $S/shots/flaky-$c-$i --base-url http://localhost:3000 --routes /copilot,/home,/team --stories > /dev/null 2>&1)
    echo "$c $i $(ls $S/shots/flaky-$c-$i | wc -l)"
  done
done
echo ALLDONE
