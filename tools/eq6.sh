#!/bin/bash
# Value equivalence for both PRs, each against its own base, each run from its
# own head's checkout (the "new" CSS is that head's):
#   #16099: wt-p1 (head) vs wt-base (dev);  #16103: main checkout (head) vs wt-p1.
B=/home/vercel-sandbox/wt-base/autogpt_platform/frontend
P1=/home/vercel-sandbox/wt-p1/autogpt_platform/frontend
P2=/home/vercel-sandbox/autogpt/autogpt_platform/frontend
EQ=/home/vercel-sandbox/evidence/equivalence
T=/home/vercel-sandbox/tools
cd $P1 && cp $T/pr-eq.mts .pr-eq.mts
npx tsx .pr-eq.mts /tmp/all-pairs-p1.json $B $EQ/pr1-equivalence.md > /tmp/eq6-1.log 2>&1
npx tsx .pr-eq.mts /tmp/badge-pairs.json $B $EQ/pr1-badge-merged.md > /tmp/eq6-3.log 2>&1
npx tsx .pr-eq.mts /tmp/neg-pairs.json $B $EQ/negative-control.md > /tmp/eq6-4.log 2>&1
npx tsx .pr-eq.mts /tmp/ao-pairs.json $B $EQ/pr1-agentoutputs-merged.md > /tmp/eq6-5.log 2>&1
npx tsx .pr-eq.mts /tmp/neg-parent-pairs.json $B $EQ/negative-control-parent.md > /tmp/eq6-8.log 2>&1
npx tsx .pr-eq.mts /tmp/variant-pairs.json $B $EQ/pr1-text-variants.md > /tmp/eq6-9.log 2>&1
rm -f .pr-eq.mts
npx tsx $T/gen_markup_cases.mts /tmp/markup-cases-p1.json > /tmp/eq6-10.log 2>&1
npx tsx $T/markup_eq.mts /tmp/markup-cases-p1.json $EQ/pr1-markup-equivalence.md $B >> /tmp/eq6-10.log 2>&1
npx tsx $T/markup_eq.mts /tmp/markup-neg.json $EQ/pr1-markup-negative-control.md $B > /tmp/eq6-11.log 2>&1
npx tsx $T/merged_sets.mts $EQ/pr1-merged-sets.md > /tmp/eq6-12.log 2>&1
timeout 1500 npx tsx scripts/check-token-equivalence.ts --base $B > $EQ/ds1-check-token-equivalence-pr1.txt 2>&1
cd $P2 && cp $T/pr-eq.mts .pr-eq.mts
npx tsx .pr-eq.mts /tmp/all-pairs-p2.json $P1 $EQ/pr2-equivalence.md > /tmp/eq6-6.log 2>&1
rm -f .pr-eq.mts
npx tsx $T/css-equivalence.mts $P1 $EQ/css-equivalence-p2.md > /tmp/eq6-7.log 2>&1
echo done > /tmp/eq6.done
