#!/bin/sh
# Strict counts for build/** at each SHA, in the throwaway worktree wt-count
# (DS4 1ee6580dc's .oxlintrc.strict.json, package.json and lockfile overlaid,
# never committed). The SHA's frontend src replaces the worktree's, then
#   pnpm exec oxlint -c .oxlintrc.strict.json "src/app/(platform)/build"
# is counted with | wc -l and -f unix.
#   sh count.sh <out dir> <sha>...
OUT=$1; shift
W=/home/vercel-sandbox/wt-count/autogpt_platform/frontend
for r in "$@"; do
  (cd "$W" && rm -rf src && git checkout -q "$r" -- src tailwind.config.ts components.json 2>/dev/null || git checkout -q "$r" -- src tailwind.config.ts) 
  (cd "$W" && pnpm exec oxlint -c .oxlintrc.strict.json "src/app/(platform)/build" > "$OUT/head-$r.txt" 2>&1; pnpm exec oxlint -c .oxlintrc.strict.json -f unix "src/app/(platform)/build" > "$OUT/head-$r.unix.txt" 2>&1)
  echo "$r: $(wc -l < "$OUT/head-$r.txt") lines | $(tail -1 "$OUT/head-$r.unix.txt")"
done
