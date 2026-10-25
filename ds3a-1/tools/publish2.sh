#!/bin/bash
# usage: publish2.sh  -> the harness evidence for parts 1-4 on the fork's evidence branch; writes evsha
set -e
E=/home/vercel-sandbox/autogpt/.context/ev; S=/home/vercel-sandbox/shots; R=/home/vercel-sandbox/evrepo; D=$R/ds3a-1; T=$E/../evtools
read _ B P1 P2 P3 P4 < $E/shas.txt
declare -A SHA=([base]=$B [p1]=$P1 [p2]=$P2 [p3]=$P3 [p4]=$P4)
mkdir -p $D/h $D/compare $D/tools/evstories $D/equivalence $D/counts
for l in base p1 p2 p3 p4; do rm -rf $D/h/$l-${SHA[$l]}; cp -r $S/h-$l-run1 $D/h/$l-${SHA[$l]}; done
for l in base p1 p2 p3 p4; do rm -rf $D/h/$l-${SHA[$l]}-run2; cp -r $S/h-$l-run2 $D/h/$l-${SHA[$l]}-run2; done
for t in h-base-det h-p1-det h-p2-det h-p3-det h-p4-det h-base-vs-p1 h-p1-vs-p2 h-p2-vs-p3 h-p3-vs-p4; do cp $E/cmp/$t.md $D/compare/; rm -rf $D/h/diff-$t; [ -d $S/h-diffs/diff-$t ] && cp -r $S/h-diffs/diff-$t $D/h/diff-$t; done
cp $T/harness/{harness,specs}.mts $T/harness/sweep.json $T/harness/hcompare.py $D/tools/
cp $E/{hrun,chainA,chainSlot,evbuild,publish2,mkwt,count,count_all,rules,countsN,pipeline2,pipeline3,gates,resume}.sh $E/{assemble2.py,body_static.py,assemble2_cfg.json,gen_pairs.mts,portpids.py,grep3132.py,ci_line.py,body_r0616.py,cfg0616.py,tokensearch.py,lint37.py,lint37.json,expected-p1.json,expected-p3.json} $E/eq/pr-string-equivalence.mts $D/tools/
rm -rf $D/tools/evstories; mkdir -p $D/tools/evstories; cp -r $E/evstories/* $D/tools/evstories/
cp $E/eq/*.md $E/eq/pairs-pr*.json $E/eq/ds1-check-token-equivalence.txt $D/equivalence/; cp $E/glyph/*.md $D/equivalence/
cp $E/counts.txt $E/rules.txt $D/counts/
cd $R; git add -A ds3a-1; git -c commit.gpgsign=false commit -qm "evidence: DS3a-1 parts 1-4 call-site harness on base $B, heads $P1 $P2 $P3 $P4" || true
git push -q fork HEAD:evidence/ds3a-1-small-primitives
git rev-parse HEAD > $E/evsha; echo "published at $(cat $E/evsha)"
