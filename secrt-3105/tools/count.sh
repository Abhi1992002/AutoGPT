#!/bin/bash
# Usage: count.sh <ref-or-WORKTREE>  — overlays the 4 scoped dirs from the main checkout's working tree (WORKTREE) or a ref onto the throwaway count worktree, then counts.
set -e
W=/home/vercel-sandbox/count-wt/autogpt_platform/frontend
M=/home/vercel-sandbox/autogpt/autogpt_platform/frontend
for d in settings home profile raise; do
  rm -rf "$W/src/app/(platform)/$d"
  if [ "$1" = WORKTREE ]; then cp -r "$M/src/app/(platform)/$d" "$W/src/app/(platform)/$d";
  else (cd /home/vercel-sandbox/count-wt && git archive "$1" "autogpt_platform/frontend/src/app/(platform)/$d" | tar -x -C /home/vercel-sandbox/count-wt); fi
done
cd "$W"
for d in settings home profile raise; do p="src/app/(platform)/$d"
  a=$(pnpm exec oxlint -c .oxlintrc.strict.json "$p" 2>/dev/null | wc -l)
  pnpm exec oxlint -c .oxlintrc.strict.json -f unix "$p" 2>/dev/null > /tmp/unix-$d.txt || true
  b=$(grep -c '^src/' /tmp/unix-$d.txt || true)
  echo "$d wc_l=$a unix=$b"
done
cat /tmp/unix-{settings,home,profile,raise}.txt | grep '^src/' > /tmp/unix-all.txt
grep -o 'shadcn([a-z-]*)' /tmp/unix-all.txt | sort | uniq -c
