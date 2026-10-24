#!/bin/bash
# extra runs of the captures that move between runs of one commit (sidebar entrance, Otto orb,
# library card entrance, diagnostics wall-clock timestamp, TabsLine underline measured in JS)
T=/home/vercel-sandbox/autogpt/.context/tools; S=/home/vercel-sandbox/shots
while pgrep -f "tools/story_run[s].sh" >/dev/null; do sleep 15; done
set -a; . /home/vercel-sandbox/autogpt/.context/run-stack/user.env; set +a
export SCREENSHOT_EMAIL=$PR_TEST_USER_EMAIL SCREENSHOT_PASSWORD=$PR_TEST_USER_PASSWORD
cd /home/vercel-sandbox/autogpt/autogpt_platform/frontend
i=0
for w in wt-base wt-h1 wt-h2 wt-h3 wt-h4 wt-h5; do
  label=${w#wt-}; port=620$i; i=$((i+1))
  for r in 4 5 6; do
    CONCURRENCY=4 npx tsx $T/capture-states.mts capture /home/vercel-sandbox/autogpt/.context/spec-noisy.json $S/$label-run$r-stories --sb http://localhost:$port > /dev/null 2>&1
  done
  $T/serve_app.sh $w > /dev/null 2>&1
  for r in 4 5 6; do
    npx tsx scripts/screenshot-pages.ts capture --out $S/$label-run$r-app --routes /profile/settings,/admin/diagnostics,/home,/library,/marketplace,/build --stories > /dev/null 2>&1
  done
  echo "$label noisy done" >> /tmp/noisy_runs.log
done
echo ALLDONE >> /tmp/noisy_runs.log
