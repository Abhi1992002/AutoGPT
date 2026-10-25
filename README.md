# Evidence for SECRT-3118 (DS5h): the flow editor (`build/**`) onto colour and text tokens

Evidence-only branch: never merged, not part of any PR branch.

Current set, on the PR heads:
- base: dev `4bf85fe86` (#16099 merged it)
- #16099 `88ed81a79`
- #16103 `0e7c0ccda`

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
| `parity-pr*.md` | exports and prop types, rendered DOM tags and non-styling attributes, base vs head |
| `logs/` | lint, types and full vitest on `0e7c0ccda`; patch coverage |
| `tools/` | every script used |
