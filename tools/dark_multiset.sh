#!/bin/sh
# QUALITY 43, whole tree: every dark: class in build/** code (comments and
# TODO lines excluded), sorted as a multiset, at each SHA given.
#   sh dark_multiset.sh <sha>...
for r in "$@"; do
  git grep -hE 'dark:' "$r" -- 'autogpt_platform/frontend/src/app/(platform)/build' \
    | grep -vE '^\s*(//|\*|/\*|\{/\*)' | grep -v TODO \
    | grep -oE '([a-z-]+:)*dark:[^ "`'"'"'}]+' | sort > "dark-multiset-$r.txt"
  echo "$r: $(wc -l < "dark-multiset-$r.txt") dark: classes"
done
