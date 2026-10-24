#!/bin/bash
cd /home/vercel-sandbox/autogpt/autogpt_platform/frontend
for spec in "$@"; do port=${spec%%:*}; label=${spec#*:}
  rm -rf /home/vercel-sandbox/shots/$label
  npx tsx /home/vercel-sandbox/autogpt/.context/tools/capture-states.mts capture /home/vercel-sandbox/autogpt/.context/spec-stories.json /home/vercel-sandbox/shots/$label --sb http://localhost:$port 2>&1 | grep -v "npm warn" > /tmp/$label.log
  # DS1 harness: default stories + every story of the atoms this stack touches
  npx tsx scripts/screenshot-pages.ts capture --out /home/vercel-sandbox/shots/$label-ds1 --routes --storybook-url http://localhost:$port --stories tokens-,atoms-button--,atoms-text--,atoms-badge--,atoms-skeleton--,atoms-checkbox--,atoms-textarea-- > /tmp/$label-ds1.log 2>&1
  echo "$label: $(head -1 /tmp/$label.log) ds1=$? $(ls /home/vercel-sandbox/shots/$label-ds1 | wc -l) files" >> /tmp/story_runs.log
done
echo ALLDONE >> /tmp/story_runs.log
