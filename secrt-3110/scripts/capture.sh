#!/bin/bash
# Runs DS1's screenshot-pages.ts capture in route batches (fresh sign-in per
# batch, so no batch outlives Better Auth's 5-minute session cookie cache).
# usage: capture.sh <out dir>
set -e
OUT=$1
cd /home/vercel-sandbox/autogpt/autogpt_platform/frontend
set -a; . /home/vercel-sandbox/autogpt/.context/run-stack/user.env; set +a
export SCREENSHOT_EMAIL=$PR_TEST_USER_EMAIL SCREENSHOT_PASSWORD=$PR_TEST_USER_PASSWORD
mapfile -t R < <(tr ',' '\n' < /home/vercel-sandbox/autogpt/.context/routes.txt)
rm -rf "$OUT"; mkdir -p "$OUT"
for ((i=0; i<${#R[@]}; i+=5)); do
  batch=$(IFS=,; echo "${R[*]:i:5}")
  echo "batch: $batch"
  NODE_OPTIONS="--require /home/vercel-sandbox/autogpt/.context/freeze-server-timestamps.cjs" npx tsx scripts/screenshot-pages.ts capture --out "$OUT" --routes "$batch" 2>&1 | grep -v "npm warn"
done
ls "$OUT" | wc -l
cd "$OUT" && md5sum *.png | sort | uniq -w32 -D || true
