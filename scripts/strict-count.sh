#!/usr/bin/env bash
# Strict counts for a tree: overlays <src-dir>'s src into the DS4 strict
# worktree (/tmp/wt-strict, .oxlintrc.strict.json from 1ee6580dc, never
# committed) and prints per-dir `wc -l` of -f unix plus a sorted findings file.
# usage: strict-count.sh <label> <frontend-src-dir>
set -euo pipefail
label=$1; src=$2
S=/tmp/wt-strict/autogpt_platform/frontend
rm -rf "$S/src"; cp -a "$src" "$S/src"
cd "$S"
DIRS=(src/components/atoms src/components/molecules/Accordion src/components/molecules/Dialog src/components/molecules/ErrorCard "src/app/(platform)/team" src/components/contextual/SchedulesPanel src/components/contextual/OutputRenderers/renderers "src/app/(platform)/copilot/components/ContextPanel/components/PanelEmptyState" "src/app/(platform)/copilot/components/ToolChain" src/app)
out=/tmp/strict-$label; mkdir -p $out
for d in "${DIRS[@]}"; do
  f=$out/$(echo "$d" | tr '/()[]' '_____').txt
  pnpm exec oxlint -c .oxlintrc.strict.json -f unix "$d" 2>/dev/null | grep -E '^src/' | sed -E 's/:[0-9]+:[0-9]+:/:/' | sort > "$f" || true
  printf '%s\t%s\n' "$d" "$(wc -l < "$f")"
done
