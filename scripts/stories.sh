#!/bin/bash
# usage: stories.sh <runName> <port> <shards> [prefixes]
S=/home/vercel-sandbox/autogpt/.context/shots4; C=/home/vercel-sandbox/autogpt/.context/pr3/capture-det.cjs
name=$1; port=$2; n=$3; list=${4:-all}
start=$(date +%s)
for i in $(seq 0 $((n-1))); do
  SHARD=$i/$n RESUME=$RESUME node $C stories http://localhost:$port $S/$name $list > $S/$name.$i.log 2>&1 &
done
wait
echo "$name done in $(( $(date +%s) - start ))s: $(cat $S/$name.*.log | grep -c written) shards written, $(ls $S/$name | wc -l) files; $(grep -h -A50 'never stabilised' $S/$name.*.log | grep png | tr '\n' ' ')" >> $S/runs.log
