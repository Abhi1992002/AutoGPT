#!/bin/bash
for w in dev pr1 pr2; do
  cd /home/vercel-sandbox/wt-$w/autogpt_platform/frontend
  echo "== $w app $(date +%T)"
  NEXT_PUBLIC_PW_TEST=true pnpm build > /tmp/build-$w.log 2>&1; echo "app exit $?"
  echo "== $w storybook $(date +%T)"
  pnpm build-storybook -o storybook-static > /tmp/sb-$w.log 2>&1; echo "sb exit $?"
done
echo DONE $(date +%T)
