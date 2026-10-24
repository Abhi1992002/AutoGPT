#!/bin/bash
# usage: capture-stories.sh <label> <port>
set -u
label=$1; port=$2
cd /home/vercel-sandbox/autogpt/autogpt_platform/frontend
out=/home/vercel-sandbox/autogpt/.context/shots/$label
groups=("atoms-" "molecules-" "copilot-" "renderers-,organisms-,tokens-,ai-,overview-,marketplace-")
pids=()
for i in "${!groups[@]}"; do
  npx tsx scripts/screenshot-pages.ts capture --out $out --routes --storybook-url http://localhost:$port --stories "${groups[$i]}" > $out.g$i.log 2>&1 &
  pids+=($!)
done
rc=0; for p in "${pids[@]}"; do wait $p || rc=1; done
echo "done $label rc=$rc"
