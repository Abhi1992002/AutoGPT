#!/bin/bash
# Sync admin dir from main checkout into the throwaway count worktree and count strict hits.
set -e
SRC="/home/vercel-sandbox/autogpt/autogpt_platform/frontend/src/app/(platform)/admin/"
DST="/home/vercel-sandbox/wt-count/autogpt_platform/frontend/src/app/(platform)/admin/"
rsync -a --delete "$SRC" "$DST"
cd /home/vercel-sandbox/wt-count/autogpt_platform/frontend
pnpm exec oxlint -c .oxlintrc.strict.json -f unix "src/app/(platform)/admin" 2>/dev/null > /tmp/head-unix.txt || true
tail -n 1 /tmp/head-unix.txt
grep -oE "shadcn\([a-z-]+\)" /tmp/head-unix.txt | sort | uniq -c
