#!/bin/bash
# usage: count.sh <label> <sha> <dir>...   (strict config from DS4 1ee6580dc overlaid, never committed)
W=/home/vercel-sandbox/wt/count; FE=$W/autogpt_platform/frontend
L=$1; S=$2; shift 2
cd $W && git checkout -q -f --detach $S && git clean -qfd autogpt_platform/frontend/src && git checkout -q 1ee6580dc -- autogpt_platform/frontend/.oxlintrc.strict.json
cd $FE
for d in "$@"; do
  if [ -e "$d" ]; then
    wc=$(pnpm exec oxlint -c .oxlintrc.strict.json "$d" 2>/dev/null | wc -l)
    ux=$(pnpm exec oxlint -c .oxlintrc.strict.json -f unix "$d" 2>/dev/null | grep -cE '^[^ ].*:[0-9]+:[0-9]+:')
  else wc="(absent)"; ux="(absent)"; fi
  echo "$L $S $d wc=$wc unix=$ux"
done
