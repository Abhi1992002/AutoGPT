#!/bin/bash
# Run 10: heads #16083 3cbe095dc, #16097 86c1ba3da, base dev 0d5ac323f.
cd /home/vercel-sandbox/harness
export SHOTS=shots10
L=/home/vercel-sandbox/harness/run10.log
FE=/home/vercel-sandbox/autogpt/autogpt_platform/frontend
ok() { for i in $(seq 1 30); do [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8006/docs)" = "200" ] && return 0; sleep 10; done; echo "BACKEND DOWN $(date -u +%H:%M)" >> $L; exit 9; }
side() { ok; ./capture.sh $1 /home/vercel-sandbox/harness/shots10/$2 > cap10-$2.log 2>&1; echo "cap $2 $(date -u +%H:%M) $(grep 'states2 exit' cap10-$2.log)" >> $L
  ok; ./supp.sh $1 $2; echo "supp $2 $(date -u +%H:%M) $(tail -1 supp-$2.log)" >> $L; }
build() { git -C /home/vercel-sandbox/$1-wt checkout -q -f $2; echo "$1-wt $(git -C /home/vercel-sandbox/$1-wt log -1 --format=%h)" >> $L
  cd /home/vercel-sandbox/$1-wt/autogpt_platform/frontend
  pnpm install --frozen-lockfile > /tmp/$1-install.log 2>&1
  NEXT_PUBLIC_SOURCEMAPS=false NEXT_PUBLIC_PW_TEST=true pnpm build > /tmp/$1-build.log 2>&1; echo "$1 build exit $?" >> $L
  rm -rf /tmp/sb-$1; pnpm build-storybook -o /tmp/sb-$1 > /tmp/sb-$1.log 2>&1; echo "$1 sb exit $?" >> $L
  cd /home/vercel-sandbox/harness; }
for p in $(pgrep -f "next-serve[r]|next star[t]"); do kill $p; done
docker stop autogpt_platform-clamav-1 autogpt_platform-executor-1 autogpt_platform-copilot_executor-1 autogpt_platform-scheduler_server-1 >/dev/null 2>&1
build after 3cbe095dc
build move 86c1ba3da
docker start autogpt_platform-clamav-1 autogpt_platform-executor-1 autogpt_platform-copilot_executor-1 autogpt_platform-scheduler_server-1 >/dev/null 2>&1
# equivalence on the head worktree
cd $FE; timeout 3500 npx tsx .ign-harness/check-ai-elements.ts /home/vercel-sandbox/before-wt/autogpt_platform/frontend /home/vercel-sandbox/after-wt/autogpt_platform/frontend /home/vercel-sandbox/harness/equivalence.md > /tmp/eq10.log 2>&1; echo "eq exit $? $(tail -1 /home/vercel-sandbox/harness/equivalence.md | cut -c1-200)" >> $L
# all-tones per entry: base-vs-head, base-vs-base, head-vs-head
for p in $(pgrep -f "http.server 600[78]"); do kill $p; done; sleep 1
(cd /tmp/sb-before; exec nohup setsid python3 -m http.server 6007 > /dev/null 2>&1 < /dev/null) > /dev/null 2>&1 &
(cd /tmp/sb-after; exec nohup setsid python3 -m http.server 6008 > /dev/null 2>&1 < /dev/null) > /dev/null 2>&1 &
sleep 2
A=/home/vercel-sandbox/harness/alltones-shots
for r in "ba 6007 6008 alltones-shots.json" "bb 6007 6007 alltones-shots-base-vs-base.json" "hh 6008 6008 alltones-shots-head-vs-head.json"; do set -- $r
  rm -rf /tmp/at10-$1; timeout 2400 npx tsx .ign-harness/alltones-shots.ts /tmp/at10-$1 $2 $3 > /tmp/at10-$1.log 2>&1; echo "alltones $1 exit $? $(grep -v 'npm warn' /tmp/at10-$1.log | tail -1 | cut -c1-160)" >> $L
  cp /tmp/at10-$1/alltones-shots.json $A/$4; [ "$1" = ba ] && for d in base-desktop base-desktop-isolated base-mobile base-mobile-isolated head-desktop head-desktop-isolated head-mobile head-mobile-isolated; do rm -rf $A/$d; cp -r /tmp/at10-ba/$d $A/$d; done
done
for p in $(pgrep -f "http.server 600[78]"); do kill $p; done
cd /home/vercel-sandbox/harness
side before before; side before before2; side after after; side after after2; side move move; side move move2
for s in before after move; do ok; ./dom-run.sh $s > dom10-$s.log 2>&1; cp dom-$s.json dom10-$s.json; done
./cmp10.sh > cmp10-all.txt 2>&1
echo done > /tmp/run10.done
