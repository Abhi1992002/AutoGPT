#!/bin/bash
# usage: sbcap.sh <label> <run> <port>   static storybook of ~/wt/<label> on <port>, stories into ~/shots/<label>-sb-run<run>
L=$1; R=$2; P=$3; FE=/home/vercel-sandbox/wt/$L/autogpt_platform/frontend; OUT=/home/vercel-sandbox/shots/$L-sb-run$R
pids=$(python3 -I /home/vercel-sandbox/autogpt/.context/ev/portpids.py $P); [ -n "$pids" ] && kill -9 $pids
(cd $FE && nohup setsid npx http-server storybook-static -p $P -s > /tmp/sbp-$L-$P.log 2>&1 &)
for i in $(seq 1 60); do [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:$P/index.json)" = "200" ] && break; sleep 1; done
for pid in $(python3 -I /home/vercel-sandbox/autogpt/.context/ev/portpids.py $P) none; do [ "$pid" = none ] && { echo "$L sb-run$R: ABORT nothing on port $P"; exit 1; }; c=$(readlink /proc/$pid/cwd); case "$c" in "$FE"*) break;; *) echo "$L sb-run$R: ABORT port $P served from $c"; exit 1;; esac; done
rm -rf $OUT; mkdir -p $OUT; cd /home/vercel-sandbox/autogpt/autogpt_platform/frontend
npx tsx scripts/screenshot-pages.ts capture --out $OUT --routes --storybook-url http://localhost:$P --stories "$(cat /home/vercel-sandbox/autogpt/.context/ev/stories.txt)" > $OUT.log 2>&1
pids=$(python3 -I /home/vercel-sandbox/autogpt/.context/ev/portpids.py $P); [ -n "$pids" ] && kill -9 $pids
echo "$L sb-run$R: $(ls $OUT | wc -l) files; unstable: $(grep -c 'not stable' $OUT.log)"
