#!/bin/bash
# usage: capture.sh <outdir>
. /home/vercel-sandbox/autogpt/.context/run-stack/user.env
cd /home/vercel-sandbox/autogpt/autogpt_platform/frontend
ROUTES=/login,/signup,/reset-password,/marketplace,/library,/home,/copilot,/team,/team/autopilot,/build,/settings/profile,/settings/account,/settings/api-keys,/settings/integrations,/profile/credits,/admin/marketplace,/admin/spending,/admin/execution-analytics
SCREENSHOT_EMAIL=$PR_TEST_USER_EMAIL SCREENSHOT_PASSWORD=$PR_TEST_USER_PASSWORD \
  npx tsx scripts/screenshot-pages.ts capture --out $1 --base-url http://localhost:3000 \
  --routes $ROUTES --storybook-url http://localhost:6006 --stories tokens-,atoms-,molecules-dialog --skip atoms-progress--live
