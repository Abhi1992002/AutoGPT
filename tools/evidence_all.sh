#!/bin/bash
# Every #16099/#16103 evidence file, regenerated on the given heads.
#   bash evidence_all.sh <p1 head> <p2 head>     (dev base 4bf85fe86)
# Checkouts: wt-base = dev, wt-p1 = #16099 head, main checkout = #16103 head.
set -u
P1=$1 P2=$2 DEV=${DEV:-4bf85fe86}
R=/home/vercel-sandbox/autogpt E=/home/vercel-sandbox/evidence T=/home/vercel-sandbox/tools
F1=/home/vercel-sandbox/wt-p1/autogpt_platform/frontend F2=$R/autogpt_platform/frontend
log() { echo "[$(date -u +%T)] $*"; }
log counts; sh $T/count.sh $E/counts $DEV $P1 $P2
cd $R
log pairs
python3 $T/ev/extract_pairs.py /tmp/pairs-p1.json $DEV $P1 > /tmp/ev-extract-p1.log 2>&1
python3 $T/ev/extract_pairs.py /tmp/pairs-p2.json $P1 $P2 > /tmp/ev-extract-p2.log 2>&1
python3 $T/ev/tag_of_pairs.py /tmp/pairs-p1.json $P1 > /dev/null; python3 $T/ev/tag_of_pairs.py /tmp/pairs-p2.json $P2 > /dev/null
cd $F2
npx tsx $T/text_pairs.mts $DEV $P1 /tmp/text-pairs-p1.json > /tmp/ev-text-p1.log 2>&1
npx tsx $T/text_pairs.mts $P1 $P2 /tmp/text-pairs-p2.json > /tmp/ev-text-p2.log 2>&1
npx tsx $T/text_pairs.mts 772559324 $P1 /tmp/text-pairs-push.json > /tmp/ev-text-push.log 2>&1
(cd $F1 && cp /tmp/dyn_pairs.mts .dyn.mts && npx tsx .dyn.mts > /dev/null 2>&1; rm -f .dyn.mts; cp /tmp/variant_pairs.mts .vp.mts && npx tsx .vp.mts > /dev/null 2>&1; rm -f .vp.mts)
python3 - <<'PY'
import json
push=json.load(open("/tmp/text-pairs-push.json"))["pairs"]
# A Text pair this push changed only by putting a state-role fill back to raw
# stays in the string check; every other one moved copy and is measured by
# markup_eq.
FILLS={"bg-surface-hover","bg-zinc-100","bg-surface-active","bg-zinc-200"}
colour_only=lambda p: set(p["old"].split())^set(p["new"].split())<=FILLS and set(p["old"].split())!=set(p["new"].split())
struct={(p["file"],p["line"]) for p in push if not colour_only(p)}
t=json.load(open("/tmp/text-pairs-p1.json")); dyn=json.load(open("/tmp/dyn-pairs.json"))["pairs"]
dl={(p["file"],p["line"]) for p in dyn}
keep=[p for p in t["pairs"] if (p["file"],p["line"]) not in struct and (p["file"],p["line"]) not in dl]+dyn
moved=[dict(p, structural=True) for p in t["pairs"] if (p["file"],p["line"]) in struct]
json.dump({"pairs":keep+moved,"unpaired":[]},open("/tmp/text-pairs-p1-cov.json","w"),indent=1)
json.dump({"pairs":moved},open("/tmp/structural-p1.json","w"),indent=1)
print(len(push),"pairs changed by the push;",len(moved),"structural (markup_eq);",len(keep),"Text rows")
PY
npx tsx $T/merge_pairs.mts /tmp/pairs-p1.json /tmp/text-pairs-p1-cov.json /tmp/all-pairs-p1.json $P1 > /tmp/ev-merge-p1.log 2>&1
npx tsx $T/merge_pairs.mts /tmp/pairs-p2.json /tmp/text-pairs-p2.json /tmp/all-pairs-p2.json $P2 > /tmp/ev-merge-p2.log 2>&1
python3 -c "
import json
d=json.load(open('/tmp/all-pairs-p1.json')); d['pairs']=[p for p in d['pairs'] if not p.get('structural')]; json.dump(d,open('/tmp/all-pairs-p1.json','w'))"
python3 $T/post_pairs.py /tmp/all-pairs-p1.json /tmp/all-pairs-p2.json > /tmp/ev-post.log 2>&1
python3 $T/drop_misaligned.py /tmp/all-pairs-p1.json $E/equivalence/excluded-misaligned-pr1.json >> /tmp/ev-post.log 2>&1
python3 $T/template_pairs.py $P1 $P2 /tmp/all-pairs-p2.json >> /tmp/ev-post.log 2>&1
python3 -c "
import json
d=json.load(open('/tmp/all-pairs-p2.json')); n=[p for p in d['pairs'] if not p.get('template')]
st=[{'file':f,'old':'text-sm','new':'text-body leading-5','tag':'div','template-static':True} for f in ('src/app/(platform)/build/components/FlowEditor/tutorial/styles.ts','src/app/(platform)/build/components/FlowEditor/tutorial/steps/connections.ts')]
json.dump({'pairs':n+st,'unpaired':[]},open('/tmp/all-pairs-p2-swaps.json','w'))"
cp /tmp/pairs-p1.json $E/equivalence/pairs-pr1.json; cp /tmp/pairs-p2.json $E/equivalence/pairs-pr2.json
cp /tmp/structural-p1.json $E/equivalence/structural-pr1.json; cp /tmp/dyn-pairs.json /tmp/variant-pairs.json /tmp/ao-pairs.json /tmp/badge-pairs.json /tmp/neg-pairs.json /tmp/neg-parent-pairs.json /tmp/markup-neg.json $E/equivalence/
cp /tmp/all-pairs-p1.json $E/equivalence/all-pairs-pr1.json; cp /tmp/all-pairs-p2.json $E/equivalence/all-pairs-pr2.json; cp /tmp/all-pairs-p2-swaps.json $E/equivalence/all-pairs-pr2-swaps.json
log "swaps, dark"
python3 -c "
import json
a=json.load(open('/tmp/all-pairs-p1.json')); s=json.load(open('/tmp/struct-colour-p1.json'))['pairs']
json.dump({'pairs':a['pairs']+s,'unpaired':[]},open('/tmp/all-pairs-p1-swaps.json','w'))"
cp /tmp/struct-colour-p1.json $E/equivalence/structural-colour-swaps-pr1.json
python3 $T/swap_dark_table.py /tmp/all-pairs-p1-swaps.json $P1 $E/swap-dark-pr1.md; python3 $T/swap_dark_table.py /tmp/all-pairs-p2-swaps.json $P2 $E/swap-dark-pr2.md
python3 $T/swap_summary.py /tmp/all-pairs-p1.json > /home/vercel-sandbox/prbody/swaps-p1.md; python3 $T/swap_summary.py /tmp/all-pairs-p2-swaps.json > /home/vercel-sandbox/prbody/swaps-p2.md
python3 $T/dark_check.py $DEV $P1 > $E/dark-check-pr1.txt; python3 $T/dark_check.py $P1 $P2 > $E/dark-check-pr2.txt
cd $R && rm -f $E/dark-multiset-*.txt && sh $T/dark_multiset.sh $DEV $P1 $P2 && mv dark-multiset-*.txt $E/
log "todo, atoms, xpr"
python3 $T/todo_token_search.py $P1 $E/todo-token-search-pr1.md; python3 $T/todo_token_search.py $P2 $E/todo-token-search-pr2.md
rm -f $E/atom-overrides-*.md
python3 $T/atom_overrides.py $E/counts/head-$P1.unix.txt $E/counts/head-$DEV.unix.txt $E/atom-overrides-$P1.md > /dev/null
python3 $T/atom_overrides.py $E/counts/head-$P2.unix.txt $E/counts/head-$DEV.unix.txt $E/atom-overrides-$P2.md > /dev/null
python3 $T/text_variants_xpr.py $(git rev-parse $P1) $(git rev-parse $DEV) /tmp/abhi-prs.txt > $E/text-variants-xpr-pr1.txt
python3 $T/text_variants_xpr.py $(git rev-parse $P2) $(git rev-parse $DEV) /tmp/abhi-prs.txt > $E/text-variants-xpr-pr2.txt
python3 $T/audit_todos.py $(git ls-files 'autogpt_platform/frontend/src/app/(platform)/build' | grep -E '\.(ts|tsx|css)$' | grep -v __tests__) > $E/todo-audit.txt 2>&1
log "per-PR sweeps"
for spec in "pr1 $F1 $DEV $P1" "pr2 $F2 $P1 $P2"; do
  set -- $spec; cd $2
  git diff --name-only --relative $3 $4 -- src | grep -E '\.(ts|tsx)$' > /tmp/files-$1.txt
  npx tsx $T/todo_inert.mts /tmp/files-$1.txt 2>&1 | grep -v "npm warn" > $E/equivalence/todo-inert-$1.txt
  (cd $R && git diff --name-only $3 $4 -- autogpt_platform/frontend/src | while read f; do git show $4:"$f" 2>/dev/null | grep -nE 'text-(xs|sm|base|lg|xl|[2-9]xl)\b|text-\[[0-9.]+(px|rem|em)\]|font-size\s*:|fontSize\s*:' | sed "s|^|$f:|"; done) > $E/rule15-$1.txt
  npx tsx $T/text_typo.mts $3 $(find "src/app/(platform)/build" -name "*.tsx") 2>/dev/null | grep -v "npm warn" > $E/rule32-all-$1.txt
  npx tsx $T/non_text_typo.mts $(find "src/app/(platform)/build" -name "*.tsx" -not -path "*__tests__*" -not -name "*.stories.tsx") 2>/dev/null | grep -v "npm warn" > $E/rule31-non-text-$1.txt
  HEAD_SHA=$4 npx tsx $T/same_output.mts $3 'autogpt_platform/frontend/src' > $E/equivalence/same-output-$1.txt 2>&1
  npx tsx $T/parity.mts $3 $4 'autogpt_platform/frontend/src' $E/parity-$1.md > /dev/null 2>&1
done
cd $F1 && RT_SPEC="src/app/(platform)/build src/components/atoms/Text src/components/contextual/MCPAuthSchemeField" npx tsx $T/removed_tokens.mts 772559324 $P1 $E/removed-tokens-pr1.md > /dev/null 2>&1
log "ds1 on dev"
(cd /home/vercel-sandbox/wt-base/autogpt_platform/frontend && timeout 1500 npx tsx scripts/check-token-equivalence.ts > $E/equivalence/ds1-check-on-dev-$DEV.txt 2>&1)
log equivalence
bash $T/eq6.sh
log done
