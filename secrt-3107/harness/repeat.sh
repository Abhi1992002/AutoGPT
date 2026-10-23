#!/bin/bash
# 5 captures each on base and head of the three shots that vary run to run.
set -u
D=/home/vercel-sandbox/autogpt/.context/ds5c
source <(sed -n '/^serve()/,/^}/p' $D/run-all.sh)
for side in base head; do
  if [ $side = base ]; then serve /home/vercel-sandbox/base-wt/autogpt_platform/frontend /home/vercel-sandbox/sb-base
  else serve /home/vercel-sandbox/autogpt/autogpt_platform/frontend /home/vercel-sandbox/sb-head; fi
  for i in 1 2 3; do
    OUT=/home/vercel-sandbox/shots/repeat2/$side-$i; rm -rf $OUT
    bash $D/reset.sh
    set -a; . /home/vercel-sandbox/autogpt/.context/run-stack/user.env; . /home/vercel-sandbox/autogpt/.context/run-stack/seed.env; set +a
    cd /home/vercel-sandbox/autogpt/autogpt_platform/frontend
    true
    npx tsx $D/capture-extra.ts --out $OUT --only build-run-dialog-only,library-card-pinned 2>&1 | grep -v "npm warn" | grep -v "^ok" 
    echo "$side-$i: $(ls $OUT | wc -l)"
  done
done
