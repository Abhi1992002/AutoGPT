# Evidence for SECRT-3113 DS3b part 2 (stack of 7 PRs)

Never merged; nothing here is in the PR branches. Visual check: batch diff after merge, per Abhimanyu 25 Oct.

Heads (base dev first): 0d5ac323f → 6d82822a4 (#16124 accordion) → c05cf66c6 (#16125 collapsible) → f0c1db5de (#16126 scroll-area) → 617b28b08 (#16127 sheet) → b634aaf11 (#16128 sidebar) → c39f1b02e (#16129 input-group) → c6f432e6b (#16130 effects).

- `counts/`: `oxlint -c .oxlintrc.strict.json -f unix` output per SHA and directory, with DS4's config from #16022 @ 1ee6580dc (never committed to the PRs). `harness/strictdelta.py <base> <head>` lists every hit removed and added between two SHAs by file:line (matched by file, rule, class and element, renames followed), marking hits hidden by a move into `molecules/**`.
- `equivalence/` (all from `harness/eq/eqall.sh`, log in `eqall.log`):
  - `gen-prN.json`: equivalence inputs generated from source by `harness/eq/gen-pairs.py` (every class-string literal the PR's diff changes, paired hunk by hunk with its replacement literal or `<Text>` element; `cva()`/`cn()` calls expanded into every string they render; restructure hunks must be covered by a nested case, checked token by token).
  - `pairs-prN.json`: the same, resolved by `harness/eq/resolve.ts` with the head's `Text` helpers and `cn()`; `result-prN.md`: `harness/eq/compare.ts` (every computed property, three parents whose line-heights are compiled into the CSS and asserted to be 24px, 30px and `normal`, at 1280 and 390px).
  - `nested-cases-prN.json` / `nested-prN.md`: restructures (copy moved into a `Text` child) measured as DOM fragments by `harness/eq/nested.ts` (glyph boxes, font, weight, colour, letter-spacing, fragment box), cases from `harness/eq/nested-cases.ts`.
  - Negative controls: `neg-prN.*` (each PR's pairs with the added `leading-*` removed) and `nested-negative.*` (restructures with a wrong variant or colour); results in `negatives.log`.
- `harness/textscan.py`: multi-line scan for typography on `<Text className>`; `harness/xprscan.py`: cross-PR `Text` variant check; `harness/rule31.py`: added lines with role typography outside `atoms/Text`; `harness/darkcheck.py`: QUALITY 43.
