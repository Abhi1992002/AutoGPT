#!/bin/bash
# usage: capture-all.sh <out dir>   (app on :3000, storybook on :6006)
set -euo pipefail
OUT=$1
set -a; . /home/vercel-sandbox/autogpt/.context/run-stack/user.env; . /home/vercel-sandbox/autogpt/.context/run-stack/seed.env; set +a
ROUTES="/login,/signup,/reset-password,/marketplace,/library,/home,/copilot,/team,/team/autopilot,/build,/settings/profile,/settings/account,/settings/api-keys,/settings/integrations,/library/followups,/library/skills,/settings/creator-dashboard,/library/agents/$LIBRARY_AGENT_ID?activeItem=$EXECUTION_ID,/build?flowID=$GRAPH_ID&flowVersion=1"
cd /home/vercel-sandbox/autogpt/autogpt_platform/frontend
npx tsx scripts/screenshot-pages.ts capture --out "$OUT" --routes "$ROUTES" \
  --storybook-url http://localhost:6006 --stories "tokens-,atoms-button--,atoms-text--,renderers-" 2>&1 | grep -v "npm warn"
npx tsx /home/vercel-sandbox/autogpt/.context/ds5c/capture-extra.ts --out "$OUT" 2>&1 | grep -v "npm warn"
ls "$OUT" | wc -l
