#!/bin/bash
E=/home/vercel-sandbox/autogpt/.context/ev
: > $E/pipeline2.log; echo "READY base" >> $E/pipeline2.log
( for x in "p1 c556d84da" "p2 764069394" "p3 847cb297f" "p4 af15a0446"; do set -- $x
    for t in 1 2; do $E/mkwt.sh $1 $2 >> $E/pipeline2.log 2>&1 && break; echo "retry build $1" >> $E/pipeline2.log; done
    for t in 1 2; do $E/evbuild.sh $1 >> $E/pipeline2.log 2>&1 && break; echo "retry evbuild $1" >> $E/pipeline2.log; done
    echo "READY $1" >> $E/pipeline2.log; done ) &
w() { local slot=$1; shift; for x in "$@"; do l=${x%%:*}; until grep -q "^READY $l$" $E/pipeline2.log; do sleep 20; done; SLOT=$slot $E/hrun.sh $l ${x##*:} >> $E/pipeline2.log 2>&1; done; echo "SLOT $slot DONE" >> $E/pipeline2.log; }
w 0 base:1 base:2 p3:1 p3:2 & w 1 p1:1 p1:2 p4:1 & w 2 p2:1 p2:2 p4:2 &
wait; echo "PIPELINE DONE" >> $E/pipeline2.log
