#!/bin/bash
# usage: resume.sh <label> <run> <slot>  -> re-runs the captures that failed in ~/shots/h-<label>-run<run> (recorded as reruns)
E=/home/vercel-sandbox/autogpt/.context/ev; L=$1; R=$2
ids=$(python3 -I -c "
import json; r=json.load(open('/home/vercel-sandbox/shots/h-$L-run$R/results.json'))
print(','.join(sorted({x['id'] for x in r if not x['ok']})))")
[ -z "$ids" ] && { echo "$L run$R: nothing to resume"; exit 0; }
echo "$L run$R: resuming $ids"
RESUME=1 SLOT=$3 $E/hrun.sh $L $R "$ids"
