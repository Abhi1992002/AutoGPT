#!/bin/bash
# usage: supp.sh <side-build> <outname>
side=$1; name=$2
H=/home/vercel-sandbox/harness
R=""
for id in cmc-owned cmc-owned-compact cmc-readonly cmc-submitted cmc-submitted-compact cmc-pending chatinput-default chatinput-reset chatinput-compact chatinput-turn-starting empty-state conversation-scroll branch-toolbar pending-upload mention-markdown work-output; do R="$R,/ds3b3-harness?only=$id"; done
R=${R#,}
cd $H && SKIP_STATES=1 ROUTES_OVERRIDE="$R" STORIES_OVERRIDE=" " ./capture.sh $side $H/${SHOTS:-shots8}/$name-hsec > supp-$name.log 2>&1
echo "exit $?" >> supp-$name.log
