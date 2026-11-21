# Codex handoff (interim — checkpoint 1)

Branch: `claude/initial-platform` · Repo: `vamp1re4/gaabe-institute-platform` · Base: `main`

This is an **interim** handoff written when the repo was first pushed. It will be replaced by the full handoff at the end of the session. Do not treat anything below as finished product.

## What exists at this checkpoint

| Area | State |
| --- | --- |
| Monorepo (npm workspaces, TS, Vite, Vitest) | Scaffolded, dependencies installed |
| `packages/i18n` | Implemented and tested (7 tests pass). dv/en catalogue, review status (draft/reviewed/approved), fallback tagging, RTL/LTR provider, `Intl` helpers |
| `packages/speech` | Implemented, **not yet tested**: provider interfaces, shared `PlaybackController`, sentence segmenter, demo tone generator |
| `packages/ui`, `packages/worksheets`, `packages/demo-data` | `package.json` only — no source yet |
| `apps/student-web`, `apps/admin-web` | `package.json` and Vite config only — no pages yet |
| Backend / API / DB / auth / payments | **Not started** |

## Not verified

- `npm run typecheck` has **not** been run on this checkpoint (apps and `ui` have no source yet; `speech` still needs a `@gaabe/ui` dependency for the toolbar).
- No build has been run. Nothing is deployed.

## Decisions Codex should review

1. **Plain CSS with logical properties** instead of the Tailwind baseline in the master directive. Rationale: precise RTL control, fewer dependencies. Reversible.
2. **Default locale is English** (`DEFAULT_LOCALE` in `packages/i18n/src/react.tsx`) because Dhivehi strings are unreviewed drafts with low coverage. Flip to `dv` after native-speaker review.
3. **Dhivehi is never guessed.** All `dv` entries are status `draft`; a CI test asserts none are `approved`. Missing keys fall back to English wrapped in `lang="en" dir="ltr"`.
4. **Speech providers never borrow another language's voice.** Dhivehi → unavailable until a verified engine exists; Arabic → approved recordings only; teacher recordings win when present.

## Next (Claude)

UI package → student app → admin app → worksheets/grading → docs → full handoff. Claude owns all files in this branch until the full handoff; Codex should wait for it (or coordinate in `docs/AI_COLLABORATION.md`) before editing.
