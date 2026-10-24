#!/bin/bash
# usage: count.sh <sha>  (run in the count worktree's frontend dir)
set -e
cd /home/vercel-sandbox/autogpt/.context/count/autogpt_platform/frontend
rm -rf src/components/organisms/AttentionCard
git checkout -q "$1" -- src
git rm -rq --cached src/components/organisms/AttentionCard 2>/dev/null || true
CONSUMERS=(src/components/organisms/NeedsAttentionList src/components/organisms/PendingReviewCard src/components/organisms/PendingReviewsList src/components/organisms/BriefingCard src/components/organisms/TrialCard "src/app/(platform)/copilot/components/CredentialRejectionNotice" "src/app/(platform)/copilot/components/ChatContainer/components/ArchivedExpertNotice.tsx" "src/app/(platform)/copilot/components/ChatContainer/components/SharedChatNotice.tsx" "src/app/(platform)/copilot/components/ChatInput/components/AttachmentCapNotice.tsx" "src/app/(platform)/copilot/components/ChatInput/components/AtResetFilesNotice.tsx" "src/app/(platform)/copilot/components/ChatInput/components/NoAIConnectionNotice" "src/app/(platform)/copilot/components/ScheduledChatNoticeCard")
echo "== $1"
for set in dir consumers; do
  if [ $set = dir ]; then T=(src/components/organisms/AttentionCard); else T=("${CONSUMERS[@]}"); fi
  if [ $set = dir ] && [ ! -d src/components/organisms/AttentionCard ]; then echo "$set: directory absent (0)"; continue; fi
  L=$(pnpm exec oxlint -c .oxlintrc.strict.json "${T[@]}" 2>/dev/null | wc -l)
  U=$(pnpm exec oxlint -c .oxlintrc.strict.json -f unix "${T[@]}" 2>/dev/null | grep -c '^src/' || true)
  echo "$set: wc -l=$L  -f unix problems=$U"
done
