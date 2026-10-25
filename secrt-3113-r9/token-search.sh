#!/bin/bash
# DS1 token search for every hex a TODO(tokens) names (QUALITY 13/40): RGB triplets in
# globals.css (every --color-* role, light and dark) and every literal in tailwind.config.ts
# and src/components/styles/colors.ts (the registered palette names).
F=autogpt_platform/frontend
for hex in 737373 F5F5F5 0A0A0A 1E1B4B E5E5E5; do
  r=$((16#${hex:0:2})); g=$((16#${hex:2:2})); b=$((16#${hex:4:2}))
  roles=$(git show HEAD:$F/src/app/globals.css | grep -nE -- "--color-[a-z-]+: *$r $g $b;" | sed -E 's/^([0-9]+):\s*(--color-[a-z-]+).*/\2 (globals.css:\1)/' | tr '\n' ' ')
  lits=$( (git show HEAD:$F/tailwind.config.ts; git show HEAD:$F/src/components/styles/colors.ts) | grep -niE "#$hex\b" | tr '\n' ' ')
  echo "#$hex (rgb $r $g $b): roles=[${roles:-none}] literals=[${lits:-none}]"
done
