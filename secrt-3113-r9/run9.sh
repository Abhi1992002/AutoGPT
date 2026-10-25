#!/bin/bash
cd /home/vercel-sandbox/harness
export SHOTS=shots9
ok() { for i in $(seq 1 30); do [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8006/docs)" = "200" ] && return 0; sleep 10; done; echo "BACKEND DOWN $(date -u +%H:%M)" >> run9.log; exit 9; }
side() { ok; ./capture.sh $1 /home/vercel-sandbox/harness/shots9/$2 > cap9-$2.log 2>&1; echo "cap $2 $(date -u +%H:%M) $(grep 'states2 exit' cap9-$2.log)" >> run9.log
  ok; ./supp.sh $1 $2; echo "supp $2 $(date -u +%H:%M) $(tail -1 supp-$2.log)" >> run9.log; }
side before before; side before before2; side after after; side after after2
for s in before after; do ok; ./dom-run.sh $s > dom9-$s.log 2>&1; cp dom-$s.json dom9-$s.json; done
for p in $(pgrep -f "next-serve[r]|next star[t]"); do kill $p; done
docker stop autogpt_platform-clamav-1 autogpt_platform-executor-1 autogpt_platform-copilot_executor-1 autogpt_platform-scheduler_server-1 >/dev/null 2>&1
git -C /home/vercel-sandbox/move-wt checkout -q -f 9ed4e220c; echo "move-wt $(git -C /home/vercel-sandbox/move-wt log -1 --format=%h)" >> run9.log
cd /home/vercel-sandbox/move-wt/autogpt_platform/frontend
pnpm install --frozen-lockfile > /tmp/move-install.log 2>&1
NEXT_PUBLIC_SOURCEMAPS=false NEXT_PUBLIC_PW_TEST=true pnpm build > /tmp/move-build.log 2>&1; echo "build exit $?" >> /home/vercel-sandbox/harness/run9.log
rm -rf /tmp/sb-move; pnpm build-storybook -o /tmp/sb-move > /tmp/sb-move.log 2>&1; echo "sb exit $?" >> /home/vercel-sandbox/harness/run9.log
cd /home/vercel-sandbox/harness
docker start autogpt_platform-clamav-1 autogpt_platform-executor-1 autogpt_platform-copilot_executor-1 autogpt_platform-scheduler_server-1 >/dev/null 2>&1; sleep 30
side move move; side move move2
ok; ./dom-run.sh move > dom9-move.log 2>&1; cp dom-move.json dom9-move.json
echo done > /tmp/run9.done
