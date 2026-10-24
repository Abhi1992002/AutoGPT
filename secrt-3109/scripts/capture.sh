#!/bin/bash
# capture.sh <frontend dir to run the harness from> <out dir>
# Three passes against http://localhost:3000 (whatever build is running there).
set -u
FE=$1; OUT=$2; S=/home/vercel-sandbox/autogpt/.context/run-stack
cd "$FE"
ROUTES_MAIN="/login,/signup,/reset-password,/marketplace,/library,/home,/copilot,/team,/team/autopilot,/build,/settings/profile,/settings/account,/settings/api-keys,/settings/integrations,/artifacts,/library/followups,/library/skills,/library/agents/9d367bbb-5c49-449f-ab5f-10a8bfe5ecd4?activeTab=runs&activeItem=c1b15e05-53fd-4e0b-98f0-a9d994cf798b,/library/agents/9d367bbb-5c49-449f-ab5f-10a8bfe5ecd4?activeTab=scheduled&activeItem=0f4fd455-207b-402a-853b-3842655b154a,/library/agents/8fc7a770-52da-486e-b23d-261b81b6b15e?activeTab=runs&activeItem=d0c2bd7f-dc0d-48eb-ac3b-2c3acd321fc1"
run() { local env=$1 out=$2; shift 2; ( set -a; . "$env"; set +a; SCREENSHOT_EMAIL=${PR_TEST_USER_EMAIL:-$EMAIL} SCREENSHOT_PASSWORD=${PR_TEST_USER_PASSWORD:-$PASSWORD} npx tsx scripts/screenshot-pages.ts capture --out "$out" "$@" ); }
run $S/user.env "$OUT/main" --routes "$ROUTES_MAIN"; echo "main exit $?"
run $S/user-intro.env "$OUT/intro" --routes "/library,/marketplace,/build" --dismiss ""; echo "intro exit $?"
run $S/user-moved.env "$OUT/moved" --routes "/team,/library" --dismiss ""; echo "moved exit $?"
run $S/user-empty.env "$OUT/empty" --routes "/library,/artifacts"; echo "empty exit $?"
