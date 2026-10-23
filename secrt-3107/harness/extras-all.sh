#!/bin/bash
set -u
D=/home/vercel-sandbox/autogpt/.context/ds5c
source <(sed -n '/^serve()/,/^}/p' $D/run-all.sh)
for run in before after after-repeat; do
  if [ $run = before ]; then serve /home/vercel-sandbox/base-wt/autogpt_platform/frontend /home/vercel-sandbox/sb-base
  else serve /home/vercel-sandbox/autogpt/autogpt_platform/frontend /home/vercel-sandbox/sb-head; fi
  OUT=/home/vercel-sandbox/shots/$run
  rm -f $OUT/extra__*
  bash $D/reset.sh
  set -a; . /home/vercel-sandbox/autogpt/.context/run-stack/user.env; . /home/vercel-sandbox/autogpt/.context/run-stack/seed.env; set +a
  cd /home/vercel-sandbox/autogpt/autogpt_platform/frontend
  npx tsx $D/capture-extra.ts --out $OUT 2>&1 | grep -v "npm warn" | grep -v "^ok"
  echo "$run extras: $(ls $OUT/extra__* | wc -l); total $(ls $OUT | wc -l)"
done
