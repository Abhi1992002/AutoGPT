#!/bin/bash
# usage: sites2.sh <label> <port>
set -a; . /home/vercel-sandbox/autogpt/.context/run-stack/user.env; set +a
export SCREENSHOT_EMAIL=$PR_TEST_USER_EMAIL SCREENSHOT_PASSWORD=$PR_TEST_USER_PASSWORD APP_URL=http://localhost:$2
cd /home/vercel-sandbox/autogpt/autogpt_platform/frontend
for r in 1 2 3; do npx tsx /home/vercel-sandbox/tools/capture-sites.mts /home/vercel-sandbox/shots/s$1-run$r > /tmp/sites-$1-$r.log 2>&1; echo "$1 sites run$r exit $? $(grep -c stable /home/vercel-sandbox/shots/s$1-run$r/sites-log.txt) scenes, $(grep -c 'failed\|NOT' /home/vercel-sandbox/shots/s$1-run$r/sites-log.txt) failed/unstable"; done
