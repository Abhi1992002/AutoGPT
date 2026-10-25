#!/bin/bash
# usage: chainSlot.sh <slot> <label>...  -> one full harness run per label on its own ports, after its evidence storybook is built
E=/home/vercel-sandbox/autogpt/.context/ev; SLOT=$1; shift
for l in "$@"; do
  until grep -q "^$l evbuilt" $E/chainA.log; do sleep 20; done
  SLOT=$SLOT $E/hrun.sh $l 1 >> $E/chainS$SLOT.log 2>&1
done
echo "SLOT $SLOT DONE" >> $E/chainS$SLOT.log
