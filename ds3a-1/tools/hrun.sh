#!/bin/bash
# usage: hrun.sh <label> <run> [only]  -> serves ~/wt/<label> (app :3000, storybook :6006, evidence storybook :6102 if built),
# runs the call-site harness into ~/shots/h-<label>-run<run>; exit code = harness's (non-zero on any failed capture)
E=/home/vercel-sandbox/autogpt/.context/ev; L=$1; R=$2; ONLY=${3:-pr,sweep}; SLOT=${SLOT:-0}
AP=$((3000+SLOT)); SP=$((6006+SLOT*10)); VP=$((6102+SLOT*10)) FE=/home/vercel-sandbox/wt/$L/autogpt_platform/frontend; OUT=/home/vercel-sandbox/shots/h-$L-run$R
MAIN=/home/vercel-sandbox/autogpt/autogpt_platform/frontend
serve() { local port=$1 dir=$2 cmd=$3; for pid in $(python3 -I $E/portpids.py $port); do kill -9 $pid; done; (cd $dir && setsid nohup $cmd > /tmp/hrun-$L-$port.log 2>&1 &); }
serve $AP $FE "npx next start -p $AP"
serve $SP $FE/storybook-static "npx http-server . -p $SP -s"
[ -d $FE/storybook-ev ] && serve $VP $FE/storybook-ev "npx http-server . -p $VP -s"
for i in $(seq 1 60); do [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:$AP/login)" = "200" ] && break; sleep 2; done
for i in $(seq 1 30); do [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:$SP/index.json)" = "200" ] && break; sleep 1; done
for port in $AP $SP; do for pid in $(python3 -I $E/portpids.py $port); do case "$(readlink /proc/$pid/cwd)" in "$FE"*) ;; *) echo "$L h-run$R: ABORT :$port served from $(readlink /proc/$pid/cwd)"; exit 2;; esac; done; done
H=$MAIN/.ign-harness-$SLOT; mkdir -p $H; cp $E/../evtools/harness/*.mts $E/../evtools/harness/*.json $H/
set -a; . /home/vercel-sandbox/autogpt/.context/run-stack/user.env; set +a; export SCREENSHOT_EMAIL=$PR_TEST_USER_EMAIL SCREENSHOT_PASSWORD=$PR_TEST_USER_PASSWORD
[ -n "$RESUME$CONTINUE" ] || rm -rf $OUT; mkdir -p $OUT; cd $MAIN
npx tsx $H/harness.mts --out $OUT --app http://localhost:$AP --sb http://localhost:$SP --ev http://localhost:$VP --only "$ONLY" ${RESUME:+--resume} ${CONTINUE:+--continue} > $OUT${RESUME:+.resume}.log 2>&1; rc=$?
echo "$L h-run$R${RESUME:+ (resume $ONLY)} ($(git -C $FE rev-parse --short HEAD)): $(tail -1 $OUT${RESUME:+.resume}.log) exit=$rc"; exit $rc
