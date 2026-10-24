#!/bin/bash
# usage: publish.sh <k>  -> evidence for PR k on the fork's evidence branch; writes evsha
set -e
k=$1; E=/home/vercel-sandbox/autogpt/.context/ev; S=/home/vercel-sandbox/shots; R=/home/vercel-sandbox/evrepo; D=$R/ds3a-1
FE=/home/vercel-sandbox/autogpt/autogpt_platform/frontend
L=(base p1 p2 p3 p4 p5 p6 p7 p8); prev=${L[$((k-1))]}; curr=${L[$k]}
mkdir -p $D/compare $D/tools $D/equivalence $D/counts
run() { awk -v l=$1 '$1==l{print $2}' $E/runs.txt; }
for l in $prev $curr; do
  r=$(run $l); [ -n "$r" ] || { echo "no run chosen for $l"; exit 1; }
  rm -rf $D/$l $D/$l-sb; cp -r $S/$l-run$r $D/$l; cp -r $S/$l-sb-run1 $D/$l-sb
  for o in $S/$l-run[0-9]; do n=${o##*-run}; [ "$n" = "$r" ] && continue; [ "$l" = base ] && continue; rm -rf $D/$l-take$n; cp -r $o $D/$l-take$n; done
done
for t in $E/cmp/$prev-vs-$curr-take*.md; do [ -f "$t" ] || continue; b=$(basename $t .md); cp $t $D/compare/; rm -rf $D/diff-$b; cp -r $S/diff-$b $D/diff-$b; python3 -I $E/../evtools/classify.py $b > $D/compare/$b.causes.txt || true; done
for t in $prev-vs-$curr $prev-sb-vs-$curr-sb base-determinism base-sb-determinism; do
  [ -f $E/cmp/$t.md ] && cp $E/cmp/$t.md $D/compare/; rm -rf $D/diff-$t; [ -d $S/diff-$t ] && cp -r $S/diff-$t $D/diff-$t
done
rm -rf $D/base-run2 $D/base-sb-run2; cp -r $S/base-run2 $D/base-run2; cp -r $S/base-sb-run2 $D/base-sb-run2
python3 -I $E/../evtools/classify.py $prev-vs-$curr > $D/compare/$prev-vs-$curr.causes.txt
python3 -I $E/../evtools/classify.py base-determinism > $D/compare/base-determinism.causes.txt
cp $E/eq/*.md $E/eq/pairs-pr*.json $E/eq/ds1-check-token-equivalence.txt $D/equivalence/ 2>/dev/null || true
cp $E/glyph/*.md $D/equivalence/ 2>/dev/null || true
cp $E/counts.txt $E/rules.txt $D/counts/
cp $E/{mkwt,buildsR2,pipeR,capture2,sbcap,cmp,count,count_all,rules,publish}.sh $E/{assemble.py,body_static.py,gen_pairs.mts,portpids.py,assemble_cfg.json} $E/eq/pr-string-equivalence.mts $E/../evtools/{classify,diffbox}.py $D/tools/
cp $FE/.ign-interact.mts $D/tools/interact.mts; cp $FE/.ign-glyph.tsx $D/tools/glyph.tsx; cp $FE/.ign-glyph-raster.mts $D/tools/glyph-raster.mts
cd $R; git add -A ds3a-1; git -c commit.gpgsign=false commit -qm "evidence: DS3a-1 PR $k ($prev -> $curr, base dev 0d5ac323f)" || true
git push -q fork HEAD:evidence/ds3a-1-small-primitives
git rev-parse HEAD > $E/evsha; echo "published PR $k at $(cat $E/evsha)"
