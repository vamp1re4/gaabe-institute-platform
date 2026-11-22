# Codex handoff — checkpoint 2

Repo `vamp1re4/gaabe-institute-platform` · Branch `claude/initial-platform` · Base `main` (do not merge without owner approval).
Status detail and evidence: `docs/IMPLEMENTATION_STATUS.md`. **My review of your PR #1: `docs/reviews/2026-11-22-claude-review-of-pr1.md`.**

## Commands

```bash
npm ci
npm run verify                 # typecheck + vitest + student build (admin build needs PR #1)
npm run dev:student            # :5173
npm run build -w @gaabe/student-web && npm run preview -w @gaabe/student-web   # :4173
NODE_PATH=$(npm root -g) node scripts/smoke-student.cjs                          # headless smoke, 27 checks
```

## Where things are

| Path | What it is | State |
| --- | --- | --- |
| `packages/i18n` | dv/en catalogue, review status, tagged English fallback, RTL/LTR provider | tested; Dhivehi 21/166 keys, all `draft` |
| `packages/speech` | provider abstraction, single shared `PlaybackController`, `ReadAloudToolbar` | tested; Dhivehi/Arabic report unavailable |
| `packages/worksheets` | 7 question types, pure `gradeWorksheet`, accessible player | tested (9) |
| `packages/ui` | tokens, themes, `SiteShell`, `Lang`, `useStored` | smoke-tested |
| `packages/demo-data` | fictional data, demo PDF/tone generators | demo only |
| `apps/student-web` | 12 pages | verified in headless browser |
| `apps/admin-web` | not on this branch | your PR #1; my unfinished version is on `claude/admin-wip` |

## Decisions to review (challenge with evidence if you disagree)

1. Plain CSS with logical properties instead of Tailwind (RTL precision, fewer dependencies).
2. Default locale is **English** until Dhivehi review raises coverage (`DEFAULT_LOCALE`).
3. Content carries an explicit language; never detect it. English content inside RTL pages must use `<Lang>`.
4. Speech never borrows another language's voice; teacher recordings outrank synthetic speech.
5. Grading is a pure function so it can move server-side unchanged.

## What I need from you (in order)

1. Apply review items 1–5 on PR #1, re-run `npm run verify` **including the admin build**, and record results in `AI_COLLABORATION.md`.
2. Review `speech/src/controller.ts` (race conditions on rapid next/previous/rate change) and `worksheets/src/grade.ts` partial-credit rules.
3. Add component tests for `WorksheetPlayer` and `ReadAloudToolbar` (jsdom + Testing Library are installed).
4. Propose the backend shape (auth, entitlements, server-side grading, private file storage) as a design note **before** writing code.

## Do not

Merge to `main`, deploy, connect payments, add Dhivehi/Arabic content or translations, or mark any `dv` string `reviewed`/`approved` without a named native-speaker reviewer.
