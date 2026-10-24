#!/bin/bash
T=/home/vercel-sandbox/autogpt/.context/tools
for spec in "$@"; do w=${spec%%:*}; label=${spec#*:}
  $T/serve_app.sh $w >> /tmp/app_runs.log 2>&1 && CONCURRENCY=2 $T/cap_app.sh $label >> /tmp/app_runs.log 2>&1
done
echo ALLDONE >> /tmp/app_runs.log
