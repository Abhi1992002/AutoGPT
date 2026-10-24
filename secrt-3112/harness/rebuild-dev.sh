#!/bin/bash
until grep -q "ALLDONE" /home/vercel-sandbox/autogpt/.context/shots/app-runs2.log; do sleep 5; done
for pid in $(pgrep -x next-server); do [ "$(readlink /proc/$pid/cwd)" != "/var/lib/falkordb/browser" ] && kill $pid; done
cd /home/vercel-sandbox/wt-dev/autogpt_platform/frontend && rm -rf .next
NEXT_PUBLIC_PW_TEST=true pnpm build > /tmp/build-dev2.log 2>&1; echo "exit $?" >> /tmp/build-dev2.log
