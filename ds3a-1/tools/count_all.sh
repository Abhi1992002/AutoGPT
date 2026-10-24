#!/bin/bash
E=/home/vercel-sandbox/autogpt/.context/ev
SHAS=(0d5ac323f f024901e3 e529500de d45ba7cbe 1ec2c4fba caa5c8e90 dedeb3ae9 e30a62786 88d8ad6de)
for i in "${!SHAS[@]}"; do
  $E/count.sh c$i ${SHAS[$i]} src/components/__legacy__/ui src/components/__legacy__ src/components/atoms src/components/molecules src
done
# per-PR touched files, counted at the PR's base and head
W=/home/vercel-sandbox/wt/count; FE=$W/autogpt_platform/frontend
for k in 1 2 3 4 5 6 7 8; do
  b=${SHAS[$((k-1))]}; h=${SHAS[$k]}
  files=$(git -C /home/vercel-sandbox/autogpt diff --name-only $b $h -- autogpt_platform/frontend/src | sed 's#autogpt_platform/frontend/##')
  for side in $b $h; do
    cd $W && git checkout -q -f --detach $side && git clean -qfd autogpt_platform/frontend/src && git checkout -q 1ee6580dc -- autogpt_platform/frontend/.oxlintrc.strict.json; cd $FE
    ex=$(for f in $files; do [ -e "$f" ] && echo "$f"; done)
    n=$( [ -n "$ex" ] && pnpm exec oxlint -c .oxlintrc.strict.json -f unix $ex 2>/dev/null | grep -cE '^[^ ].*:[0-9]+:[0-9]+:' || echo 0)
    echo "PR$k files@$side n=$n nfiles=$(echo "$ex" | grep -c .)"
  done
done
