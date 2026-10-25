#!/bin/bash
E=/home/vercel-sandbox/autogpt/.context/ev
$E/count_all.sh > $E/counts.txt 2>&1
S=($(cut -d' ' -f2- $E/shas.txt)); : > $E/rules.txt
for k in 1 2 3 4; do echo "### PR$k" >> $E/rules.txt; $E/rules.sh ${S[$((k-1))]} ${S[$k]} >> $E/rules.txt 2>&1; done
echo COUNTS DONE >> $E/counts.txt
