#!/bin/bash
# usage: capture-all.sh <outdir> <storybook-url>   (run from the frontend dir of the checkout whose scripts to use)
set -a; . /home/vercel-sandbox/autogpt/.context/run-stack/user.env; set +a
export SCREENSHOT_EMAIL=$PR_TEST_USER_EMAIL SCREENSHOT_PASSWORD=$PR_TEST_USER_PASSWORD
OUT=$1; SB=$2
STORIES="tokens-,atoms-button--,atoms-text--,renderers-formrenderer-,molecules-dialog--"
npx --yes tsx scripts/screenshot-pages.ts capture --out "$OUT" --base-url http://localhost:3000 --storybook-url "$SB" --stories "$STORIES" 2>&1 | grep -v 'npm warn' | tail -5
npx --yes tsx /home/vercel-sandbox/autogpt/.context/radius/capture-dialogs.ts --out "$OUT" --base-url http://localhost:3000 --storybook-url "$SB" \
  --expander-stories renderers-formrenderer-primitive-fields--string-field,renderers-formrenderer-primitive-fields--string-with-default 2>&1 | grep -v 'npm warn' | grep -v '^ok '
ls "$OUT"/*.png | wc -l
