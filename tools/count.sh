#!/bin/bash
# usage: count.sh <sha> <label> <file-list>   (run in wt-lint frontend; DS4 1ee6580dc strict config overlay)
cd /home/vercel-sandbox/wt-lint/autogpt_platform/frontend
rm -rf src && git checkout -q $1 -- src
O=/home/vercel-sandbox/autogpt/.context/evidence/counts
dir_wc=$(pnpm exec oxlint -c .oxlintrc.strict.json src/components/__legacy__/ui 2>/dev/null | wc -l)
dir_unix=$(pnpm exec oxlint -c .oxlintrc.strict.json -f unix src/components/__legacy__/ui 2>/dev/null | grep -cE '^[^ ]+:[0-9]+:[0-9]+:')
files=$(cat "$3" | while read f; do [ -f "$f" ] && echo "$f"; done)
pnpm exec oxlint -c .oxlintrc.strict.json -f unix $files > $O/$2-files.unix.txt 2>/dev/null
f_wc=$(pnpm exec oxlint -c .oxlintrc.strict.json $files 2>/dev/null | wc -l)
f_unix=$(grep -cE '^[^ ]+:[0-9]+:[0-9]+:' $O/$2-files.unix.txt)
echo "$2 $1 legacy-ui-dir wc=$dir_wc unix=$dir_unix | touched-files($(echo $files | wc -w)) wc=$f_wc unix=$f_unix"
