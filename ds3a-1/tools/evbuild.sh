#!/bin/bash
# usage: evbuild.sh <label>  -> copies the evidence-only stories into ~/wt/<label> (untracked, git-excluded) and builds them into storybook-ev
E=/home/vercel-sandbox/autogpt/.context/ev; L=$1; FE=/home/vercel-sandbox/wt/$L/autogpt_platform/frontend; D=$FE/src/components/organisms/__evidence__
rm -rf $D; mkdir -p $D; cp $E/evstories/*.stories.tsx $E/evstories/*.json $D/
# before DS3a-1 part 3 the multiselect is the legacy file: the same component, at its old path
[ -f $FE/src/components/molecules/MultiSelect/MultiSelect.tsx ] || sed -i 's#@/components/molecules/MultiSelect/MultiSelect#@/components/__legacy__/ui/multiselect#' $D/FormMultiSelect.stories.tsx
mkdir -p $D/stubs && cp $E/evstories/stubs/*.ts $D/stubs/
# evidence build only (restored below): swap the reset-password page's server actions for the stub, as main.ts does for lib/auth/actions
cd $FE && python3 -I - <<'PY'
p=".storybook/main.ts"; s=open(p).read()
a='        path.resolve(__dirname, "mocks/auth-actions.ts"),\n      ),\n'
assert s.count(a)==1
s=s.replace(a, a+'      new webpack.NormalModuleReplacementPlugin(\n        /reset-password[\\\\/]actions(\\.ts)?$/,\n        path.resolve(__dirname, "../src/components/organisms/__evidence__/stubs/reset-password-actions.ts"),\n      ),\n')
open(p,"w").write(s)
PY
rm -rf storybook-ev && pnpm build-storybook --quiet -o storybook-ev > /tmp/wt-$L-sbev.log 2>&1; rc=$?
git checkout -q .storybook/main.ts
[ $rc = 0 ] || { echo "EVBUILD FAIL $L"; exit 1; }
rm -rf node_modules/.cache/storybook
echo "$L evbuilt: $(python3 -I -c "import json; d=json.load(open('storybook-ev/index.json')); print(sum(1 for k in d['entries'] if k.startswith('evidence-')))") evidence stories"
