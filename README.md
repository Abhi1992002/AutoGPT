# Evidence for SECRT-3113 DS3b part 2 (stack of 7 PRs)

Never merged; nothing here is in the PR branches. Visual check: batch diff after merge, per Abhimanyu 25 Oct.

Heads (base dev first): 0d5ac323f → 6d82822a4 (#16124 accordion) → c1e4eb891 (#16125 collapsible) → b76fec870 (#16126 scroll-area) → 6cab9ece3 (#16127 sheet) → 9f9098f00 (#16128 sidebar) → 4a341aaa6 (#16129 input-group) → 9c18047e8 (#16130 effects).

- `counts/`: `oxlint -c .oxlintrc.strict.json -f unix` output per SHA and directory, with DS4's config from #16022 @ 1ee6580dc (never committed to the PRs).
- `equivalence/`: per-PR class pairs (`pairs-prN.json`) and results (`result-prN.md`) from `harness/eq/compare.ts`.
- `harness/textscan.py`: multi-line scan for typography on `<Text className>`; `harness/xprscan.py`: cross-PR `Text` variant check.
