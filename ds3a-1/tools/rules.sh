#!/bin/bash
# per-rule counts of the PR's touched files at base and head
W=/home/vercel-sandbox/wt/count; FE=$W/autogpt_platform/frontend
b=$1; h=$2
files=$(git -C /home/vercel-sandbox/autogpt diff --name-only $b $h -- autogpt_platform/frontend/src | sed 's#autogpt_platform/frontend/##')
for side in $b $h; do
  cd $W && git checkout -q -f --detach $side && git clean -qfd autogpt_platform/frontend/src && git checkout -q 1ee6580dc -- autogpt_platform/frontend/.oxlintrc.strict.json; cd $FE
  ex=$(for f in $files; do [ -e "$f" ] && echo "$f"; done)
  echo "== $side"; pnpm exec oxlint -c .oxlintrc.strict.json -f unix $ex 2>/dev/null | grep -oE '[a-z]+\([a-z-]+\)\]$' | sort | uniq -c | sort -rn | head -8
done
