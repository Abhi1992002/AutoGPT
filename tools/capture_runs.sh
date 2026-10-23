#!/bin/bash
# usage: capture_runs.sh <label> <runs>   (app on :3000 and Storybook on :6006 already serving that commit)
set -u
FE=/home/vercel-sandbox/autogpt/autogpt_platform/frontend
S=/home/vercel-sandbox/shots
set -a; . /home/vercel-sandbox/autogpt/.context/run-stack/user.env; set +a
export SCREENSHOT_EMAIL=$PR_TEST_USER_EMAIL SCREENSHOT_PASSWORD=$PR_TEST_USER_PASSWORD
cd $FE
for n in $(seq 1 $2); do
  out=$S/$1-run$n
  rm -rf $out
  npx tsx scripts/screenshot-pages.ts capture --out $out --routes "$(cat /tmp/routes.txt)" --stories > /tmp/cap-$1-$n-app.log 2>&1; a=$?
  npx tsx scripts/screenshot-pages.ts capture --out $out --routes --storybook-url http://localhost:6006 --stories tokens-,atoms-button--,atoms-text--,marketplace- > /tmp/cap-$1-$n-sb.log 2>&1; b=$?
  echo "$1 run$n: app exit=$a stories exit=$b, $(ls $out | wc -l) files"
done
