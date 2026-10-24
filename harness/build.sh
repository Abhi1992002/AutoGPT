#!/bin/bash
# usage: build.sh <sha>...  builds Next (PW_TEST) + Storybook for each sha in its own worktree
set -u
ROOT=/home/vercel-sandbox/autogpt
for sha in "$@"; do
  WT=$ROOT/.context/wt/$sha
  LOG=$ROOT/.context/evidence/build-$sha.log
  [ -f $WT/autogpt_platform/frontend/.done ] && { echo "$sha already built"; continue; }
  if [ ! -d $WT ]; then git -C $ROOT worktree add -q --detach $WT $sha; fi
  cd $WT/autogpt_platform/frontend
  cp $ROOT/autogpt_platform/frontend/.env .env
  echo "[$(date +%T)] $sha install" >> $LOG
  pnpm install --frozen-lockfile --prefer-offline >> $LOG 2>&1
  pnpm exec orval --config ./orval.config.ts >> $LOG 2>&1
  echo "[$(date +%T)] $sha next build" >> $LOG
  NEXT_SKIP_BUILD_CHECKS=true NEXT_PUBLIC_PW_TEST=true pnpm build >> $LOG 2>&1 || { echo "[$(date +%T)] $sha NEXT BUILD FAILED" >> $LOG; continue; }
  echo "[$(date +%T)] $sha storybook build" >> $LOG
  pnpm build-storybook -o storybook-static --quiet >> $LOG 2>&1 || { echo "[$(date +%T)] $sha SB BUILD FAILED" >> $LOG; continue; }
  rm -rf .next/cache node_modules/.cache
  touch .done
  echo "[$(date +%T)] $sha done" >> $LOG
done
