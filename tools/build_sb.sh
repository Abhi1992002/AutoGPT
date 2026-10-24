#!/bin/bash
for w in "$@"; do
  F=/home/vercel-sandbox/$w/autogpt_platform/frontend; cd $F; start=$(date +%s)
  pnpm build-storybook -o /home/vercel-sandbox/sb-$w > /tmp/sb-$w.log 2>&1; s=$?
  echo "$w storybook exit=$s $(( $(date +%s) - start ))s $(git rev-parse --short HEAD)" >> /tmp/build-status.txt
done
