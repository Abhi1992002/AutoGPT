#!/bin/bash
# usage: mkwt.sh <label> <commit>  -> worktree at ~/wt/<label>, deps installed, app + storybook built
set -u
L=$1; C=$2; W=/home/vercel-sandbox/wt/$L; MAIN=/home/vercel-sandbox/autogpt
if [ ! -d $W ]; then git -C $MAIN worktree add --detach $W $C >/dev/null; fi
git -C $W checkout -q --detach $C
FE=$W/autogpt_platform/frontend
cp $MAIN/autogpt_platform/frontend/.env $FE/.env
mkdir -p $FE/src/app/api/__generated__ && cp -r $MAIN/autogpt_platform/frontend/src/app/api/__generated__/. $FE/src/app/api/__generated__/
cd $FE
pnpm install --frozen-lockfile > /tmp/wt-$L-install.log 2>&1
rm -rf .next; NEXT_PUBLIC_PW_TEST=true pnpm build --no-lint > /tmp/wt-$L-build.log 2>&1 || { echo "BUILD FAIL $L"; exit 1; }
pnpm build-storybook --quiet -o storybook-static > /tmp/wt-$L-sb.log 2>&1
rm -rf .next/cache node_modules/.cache/storybook
echo "$L $C built: app=$(test -f .next/BUILD_ID && echo ok) sb=$(test -f storybook-static/index.html && echo ok)"
