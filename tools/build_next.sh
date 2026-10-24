#!/bin/bash
# wait for any running next build, then build each worktree in turn
while pgrep -f "next/dist/bin/next build" >/dev/null; do sleep 5; done
for w in "$@"; do
  F=/home/vercel-sandbox/$w/autogpt_platform/frontend; cd $F; start=$(date +%s)
  NEXT_PUBLIC_PW_TEST=true pnpm build > /tmp/build-$w.log 2>&1; b=$?
  rm -rf $F/.next/cache
  echo "$w next build exit=$b $(( $(date +%s) - start ))s $(git rev-parse --short HEAD)" >> /tmp/build-status.txt
done
