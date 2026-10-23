#!/bin/bash
# storybook-capture.sh <static storybook dir> <out dir>: serve it on :6006 and capture copilot-approvalqueue-- stories with DS1's harness.
SB=$1; OUT=$2
for p in $(ps -eo pid,args | grep "http.server 6006" | grep -v grep | awk '{print $1}'); do kill $p; done; sleep 1
(cd "$SB" && nohup setsid python3 -m http.server 6006 > /tmp/sb-serve.log 2>&1 &)
for i in $(seq 1 30); do curl -s -o /dev/null http://localhost:6006/index.json && break; sleep 1; done
rm -rf "$OUT"
cd /home/vercel-sandbox/autogpt/autogpt_platform/frontend && npx tsx scripts/screenshot-pages.ts capture --out "$OUT" --routes --storybook-url http://localhost:6006 --stories copilot-approvalqueue-- 2>&1 | grep -v "npm warn" | tail -4
