#!/bin/bash
# builds Storybook with the evidence story for each SHA into storybook-evidence/ (throwaway worktree only)
for sha in "$@"; do
  F=/home/vercel-sandbox/autogpt/.context/wt/$sha/autogpt_platform/frontend
  mkdir -p $F/src/components/molecules/__evidence__
  cp /home/vercel-sandbox/autogpt/.context/evidence/evstory/Ds3bEvidence.stories.tsx $F/src/components/molecules/__evidence__/
  (cd $F && nice -n 19 pnpm build-storybook -o storybook-evidence --quiet > /home/vercel-sandbox/autogpt/.context/evidence/evsb-$sha.log 2>&1 && echo "[$(date +%T)] evsb $sha ok" >> /home/vercel-sandbox/autogpt/.context/evidence/evsb.log || echo "[$(date +%T)] evsb $sha FAILED" >> /home/vercel-sandbox/autogpt/.context/evidence/evsb.log)
  rm -rf $F/src/components/molecules/__evidence__
done
