#!/bin/bash
# usage: publish3.sh  -> batch mode (no per-PR captures): tools, equivalence and counts for parts 1-4 on the fork's evidence branch; writes evsha
set -e
E=/home/vercel-sandbox/autogpt/.context/ev; R=/home/vercel-sandbox/evrepo; D=$R/ds3a-1; T=$E/../evtools
read _ B P1 P2 P3 P4 < $E/shas.txt
mkdir -p $D/tools $D/equivalence $D/counts
cp $T/harness/hcompare.py $D/tools/
cp $E/{count,count_all,rules,countsN,publish3}.sh $E/{assemble3.py,body_static.py,body_r0616.py,cfg0616.py,assemble2_cfg.json,gen_pairs.mts,grep3132.py,ci_line.py,tokensearch.py,lint37.py,lint37.json,darkcheck.py} $E/eq/pr-string-equivalence.mts $D/tools/
cp $E/eq/pr[1-4]-equivalence*.md $E/eq/pairs-pr[1-4].json $E/eq/ds1-check-token-equivalence.txt $D/equivalence/; cp $E/glyph/*.md $D/equivalence/
cp $E/counts.txt $E/rules.txt $D/counts/
cd $R; git add -A ds3a-1; git -c commit.gpgsign=false commit -qm "evidence: DS3a-1 parts 1-4 counts and equivalence on heads $P1 $P2 $P3 $P4 (batch visual mode, QUALITY rule 43)" || true
git push -q fork HEAD:evidence/ds3a-1-small-primitives
git rev-parse HEAD > $E/evsha; echo "published at $(cat $E/evsha)"
