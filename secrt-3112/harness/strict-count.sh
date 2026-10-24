#!/bin/bash
# usage: strict-count.sh <sha> <outdir>
set -e
cd /home/vercel-sandbox/wt-strict/autogpt_platform/frontend
rm -rf src && git checkout $1 -- src 2>/dev/null && git reset -q -- src
mkdir -p $2
INPUT_FILES=$(git diff --name-only 995df0dee 6b5a42e36 --relative -- src | grep -v "atoms/Input\|__legacy__" | while read f; do [ -e "$f" ] && echo "$f"; done)
BUTTON_FILES=$(git diff --name-only 6b5a42e36 15a14198a --relative -- src | grep -v "atoms/Button\|__legacy__" | while read f; do [ -e "$f" ] && echo "$f"; done)
for t in "atoms-Input:src/components/atoms/Input" "atoms-Button:src/components/atoms/Button" "legacy-ui:src/components/__legacy__/ui" "src:src"; do
  n=${t%%:*}; d=${t#*:}
  pnpm exec oxlint -c .oxlintrc.strict.json $d > $2/$n.txt 2>&1 || true
  pnpm exec oxlint -c .oxlintrc.strict.json -f unix $d > $2/$n.unix.txt 2>&1 || true
  echo "$n wc=$(wc -l < $2/$n.txt) unix=$(grep -cE '^[^ ]+:[0-9]+:[0-9]+:' $2/$n.unix.txt)"
done
for t in input button; do
  if [ $t = input ]; then F="$INPUT_FILES"; else F="$BUTTON_FILES"; fi
  pnpm exec oxlint -c .oxlintrc.strict.json $F > $2/importers-$t.txt 2>&1 || true
  pnpm exec oxlint -c .oxlintrc.strict.json -f unix $F > $2/importers-$t.unix.txt 2>&1 || true
  echo "importers-$t ($(echo $F | wc -w) files) wc=$(wc -l < $2/importers-$t.txt) unix=$(grep -cE '^[^ ]+:[0-9]+:[0-9]+:' $2/importers-$t.unix.txt)"
done
