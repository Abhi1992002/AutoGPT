#!/bin/bash
# Usage: capture.sh <frontendDir> <outDir>
set -a; . /home/vercel-sandbox/autogpt/.context/run-stack/user.env; set +a
export SCREENSHOT_EMAIL=$PR_TEST_USER_EMAIL SCREENSHOT_PASSWORD=$PR_TEST_USER_PASSWORD
cd "$1" && npx tsx scripts/screenshot-pages.ts capture --out "$2" \
  --base-url http://localhost:3000 \
  --routes /login,/signup,/reset-password,/marketplace,/library,/home,/copilot,/team,/team/autopilot,/build,/settings/profile,/settings/account,/settings/api-keys,/settings/integrations,/settings/memory,/settings/billing,/raise \
  --storybook-url http://localhost:6006 \
  --stories tokens-,atoms-button--,atoms-text--,organisms- \
  --skip atoms-progress--live
