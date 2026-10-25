#!/bin/bash
E=/home/vercel-sandbox/autogpt/.context/ev
: > $E/chainA.log
$E/evbuild.sh base >> $E/chainA.log 2>&1 || $E/evbuild.sh base >> $E/chainA.log 2>&1
( for l in p1 p2 p3 p4; do for t in 1 2; do $E/evbuild.sh $l >> $E/chainA.log 2>&1 && break; done; done; echo "EV BUILDS DONE" >> $E/chainA.log ) &
$E/hrun.sh base 1 >> $E/chainA.log 2>&1
$E/hrun.sh base 2 >> $E/chainA.log 2>&1
wait; echo "CHAIN A DONE" >> $E/chainA.log
