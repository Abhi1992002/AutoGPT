# Evidence for SECRT-3118 (DS5h): the flow editor (`build/**`) onto colour and text tokens

Evidence-only branch: never merged, not part of any PR branch.

Current set, on the PR heads:
- base: dev `4bf85fe86` (#16099 merged it)
- #16099 `bb3184951`
- #16103 `e118cc10b`

Rule 43 (25 Oct 09:42 IST): every `dark:` class is kept, and every colour swap's token renders the same `.dark` value as the old class.

Screenshots: per Abhimanyu (25 Oct 08:57 IST), the visual check is the orchestrator's batch diff of dev before vs after the merges, so no per-PR screenshots are kept here. Earlier capture sets remain in this branch's history.

| path | what |
| --- | --- |
| `counts/` | `pnpm exec oxlint -c .oxlintrc.strict.json "src/app/(platform)/build"` (`| wc -l`, `-f unix`) per SHA; the strict config is DS4's head `1ee6580dc`, overlaid in a throwaway worktree |
| `equivalence/` | every exact class string per PR (`pr1-equivalence.md`, `pr2-equivalence.md`), the new Text variants (`pr1-text-variants.md`), `cn()`-merged rows on the real Button/Badge/Label/Sheet, `flow.css`/`tutorial.css` computed styles, negative controls, DS1's `check-token-equivalence.ts` (head and dev), compiled-output checks, and the pair lists they ran |
| `rule15-pr*.txt` | raw-size grep (incl. inline `font-size`) over every file each PR touches |
| `rule32-all-pr*.txt` | typography classes on any `<Text>` in `build/**` (empty) |
| `todo-token-search-pr*.md` | every hex a `TODO(tokens)` names, searched in DS1's `:root` roles |
| `todo-audit.txt` | raw colours without a `TODO(tokens)` |
| `atom-overrides-*.md` | every atom `className` override at each head (strict `no-restyle`) |
| `dark-check-pr*.txt` | `git diff <base>...<head> \| grep -E '^-.*dark:'`, and whether each removed `dark:` class is back on an added code line |
| `dark-multiset-*.txt` | every `dark:` class in `build/**` code at dev and at each head (identical) |
| `swap-dark-pr*.md` | every colour swap, with the new token's `:root` and `.dark` values |
| `equivalence/pr1-markup-equivalence.md` | copy moved into a `<Text>` inside its element, rendered as dev and as head inside its real ancestors (`tools/markup_eq.mts`, cases in `tools/gen_markup_cases.mts`), and its negative control |
| `removed-tokens-pr1.md` | QUALITY 46: every class token the last push removed, and where it comes from now |
| `text-variants-xpr-pr*.txt` | rules 34/35: Text variants against dev and every open `abhi/*` PR head |
| `rule31-non-text-pr*.txt` | every non-`<Text>` element in `build/**` whose className carries type |
| `text-table-pr1.md` | every `<Text>` element: dev string, merged string, computed values, result |
| `parity-pr*.md` | exports and prop types, rendered DOM tags and non-styling attributes, base vs head |
| `logs/` | lint, types and full vitest on `e118cc10b`; patch coverage |
| `tools/` | every script used |
