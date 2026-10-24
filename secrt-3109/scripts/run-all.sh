#!/bin/bash
# run-all.sh <frontend dir> <out dir>: reset the screenshot users' first-visit
# state, then every capture pass against whatever build serves :3000.
set -u
FE=$1; OUT=$2; D=/home/vercel-sandbox/autogpt/.context/ds5e
reset() {
  docker exec autogpt_platform-db-1 psql -U postgres -d postgres -qc "
    update platform.\"UserOnboarding\" o set \"completedSteps\" = case when u.email like 'evidence-empty-%' then '{ONBOARDING_COMPLETE,AGENTS_TAB_INTRO,MARKETPLACE_TAB_INTRO,BUILD_TAB_INTRO}'::text[] when u.email like 'evidence-1%' then '{ONBOARDING_COMPLETE,SCHEDULE_AGENT,AGENTS_TAB_INTRO,MARKETPLACE_TAB_INTRO,BUILD_TAB_INTRO}'::text[] else '{ONBOARDING_COMPLETE}'::text[] end
    from platform.\"User\" u where u.id = o.\"userId\" and u.email like 'evidence-%';"
}
if [ "${SKIP_DS1:-}" != "1" ]; then reset; $D/capture.sh "$FE" "$OUT"; fi
reset; (cd /home/vercel-sandbox/autogpt/autogpt_platform/frontend && npx tsx $D/capture-states.mts "$OUT/states"); echo "states exit $?"
reset
