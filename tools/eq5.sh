#!/bin/bash
cd /home/vercel-sandbox/autogpt/autogpt_platform/frontend
cp /tmp/pr-eq.mts .pr-eq.mts
B=/home/vercel-sandbox/wt-base/autogpt_platform/frontend; P=/home/vercel-sandbox/wt-p1/autogpt_platform/frontend; EQ=/home/vercel-sandbox/evidence/equivalence
npx tsx .pr-eq.mts /tmp/all-pairs-p1.json $B $EQ/pr1-equivalence.md > /tmp/eq5-1.log 2>&1
npx tsx .pr-eq.mts /tmp/btn-pairs.json $B $EQ/pr1-button-merged.md > /tmp/eq5-2.log 2>&1
npx tsx .pr-eq.mts /tmp/badge-pairs.json $B $EQ/pr1-badge-merged.md > /tmp/eq5-3.log 2>&1
npx tsx .pr-eq.mts /tmp/neg-pairs.json $B $EQ/negative-control.md > /tmp/eq5-4.log 2>&1
npx tsx .pr-eq.mts /tmp/ao-pairs.json $B $EQ/pr1-agentoutputs-merged.md > /tmp/eq5-5.log 2>&1
npx tsx .pr-eq.mts /tmp/all-pairs-p2.json $P $EQ/pr2-equivalence.md > /tmp/eq5-6.log 2>&1
npx tsx .pr-eq.mts /tmp/neg-parent-pairs.json $B $EQ/negative-control-parent.md > /tmp/eq5-8.log 2>&1
npx tsx .pr-eq.mts /tmp/variant-pairs.json $B $EQ/pr1-text-variants.md > /tmp/eq5-9.log 2>&1
rm -f .pr-eq.mts
npx tsx /home/vercel-sandbox/tools/css-equivalence.mts $P $EQ/css-equivalence-p2.md > /tmp/eq5-7.log 2>&1
timeout 1500 npx tsx scripts/check-token-equivalence.ts --base $B > $EQ/ds1-check-token-equivalence-pr1.txt 2>&1
echo done > /tmp/eq5.done
