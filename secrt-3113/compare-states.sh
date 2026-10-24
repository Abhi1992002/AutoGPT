#!/bin/bash
cd /home/vercel-sandbox/autogpt/autogpt_platform/frontend
H=/home/vercel-sandbox/harness/shots2
for pair in "before-states after-states diff-states" "after-states after2-states diff-states-determinism" "after-states move-states diff-move-states"; do
  set -- $pair
  npx tsx scripts/screenshot-pages.ts compare $H/$1 $H/$2 --diff $H/$3 2>&1 | grep -v "npm warn" > /home/vercel-sandbox/harness/compare-$3.md
  echo "== $1 vs $2: $(tail -n1 /home/vercel-sandbox/harness/compare-$3.md)"; awk -F'|' '$4+0>0' /home/vercel-sandbox/harness/compare-$3.md
done
for s in before after after2 move; do diff <(python3 -c "import json;d=json.load(open('$H/before-states/keyboard.json'));print(json.dumps(d,indent=1))") <(python3 -c "import json;d=json.load(open('$H/$s-states/keyboard.json'));print(json.dumps(d,indent=1))") > /dev/null && echo "keyboard $s == before" || echo "keyboard $s DIFFERS"; done
