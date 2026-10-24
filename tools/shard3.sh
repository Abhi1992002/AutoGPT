#!/bin/bash
# usage: shard3.sh <frontend dir> <label> <n>
cd "$1"
for i in $(seq 1 $3); do
  timeout 1800 pnpm exec vitest run --coverage --coverage.reportOnFailure --shard=3/4 --reporter=verbose > /tmp/shard3-$2-$i.log 2>&1; e=$?
  d=$(sed 's/\x1b\[[0-9;]*m//g' /tmp/shard3-$2-$i.log | grep "stays in a new thread" | grep -oE "[0-9]+ms|Test timed out[^)]*" | tr '\n' ' ')
  echo "$2 run$i exit=$e $(sed 's/\x1b\[[0-9;]*m//g' /tmp/shard3-$2-$i.log | grep -E '^\s+Tests ' | tail -1 | xargs) | stays-in-new-thread: $d"
done
