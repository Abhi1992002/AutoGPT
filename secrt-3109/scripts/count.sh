#!/bin/bash
# count.sh <frontend dir with DS4 strict overlay>  -> per-directory counts (wc -l of default output, and the -f unix total)
cd "$1"
for d in library artifacts components; do
  p="src/app/(platform)/$d"
  wc=$(pnpm exec oxlint -c .oxlintrc.strict.json "$p" 2>/dev/null | wc -l)
  unix=$(pnpm exec oxlint -c .oxlintrc.strict.json -f unix "$p" 2>/dev/null | tail -1)
  echo "$d	wc-l=$wc	unix=$unix"
done
