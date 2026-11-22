# Implementation status

Last updated: 2026-11-22 · Branch `claude/initial-platform`. Nothing is deployed. There is **no backend**.

Legend: **Working** = behaves as described in a real browser · **Demo** = works but on fictional/in-browser data · **Partial** · **Not started**

## Verified evidence (this branch)

| Check | Result |
| --- | --- |
| `tsc --noEmit` (also confirmed to catch a deliberately planted error) | clean |
| `npx vitest run` | 3 files, 26 tests pass (i18n 7, speech 10, worksheet grading 9) |
| `npm run build -w @gaabe/student-web` | passes |
| `scripts/smoke-student.cjs` (headless Chromium) | 27/27 on repeated runs |
| Header overflow, 8 widths × 2 languages | 0 clipped, 0 overlapping, 0 horizontal scroll |
| Admin build on this branch | **no admin entry point yet** (see PR #1 / `claude/admin-wip`) |

Not verifiable in a headless browser and therefore **unconfirmed**: audible English speech, audible teacher-audio tone, real-device iOS/Android behaviour, screen-reader output, Thaana rendering on every OS.

## Phase 1 — Foundation

| Item | Status |
| --- | --- |
| TypeScript monorepo (npm workspaces, Vite, Vitest) | Working |
| Shared UI + responsive styling | Working (plain CSS, logical properties) |
| Emerald/gold/ivory tokens, light/dark/system theme | Working |
| Dhivehi RTL / English LTR | Working; Dhivehi text is **12.7% drafted (21/166 keys), all unreviewed**; missing keys fall back to tagged English |
| Routing, error boundary, 404 | Working |
| Test infrastructure | Working for logic; **no component/page tests yet** |

## Phase 2 — Student app (all Demo data)

| Screen | Status |
| --- | --- |
| Homepage, catalogue (search + filter), course detail | Demo |
| Lesson viewer (locked premium state, progress, prev/next) | Demo |
| Dashboard | Demo (progress stored in browser) |
| Interactive worksheets (7 question types) | Demo (grading in browser) |
| Exam preparation (timer + checklist + practice paper) | Demo (timer is not secure/server-authoritative) |
| Presentation viewer (keyboard, thumbnails, fullscreen) | Demo (hand-written slides; no PPTX conversion) |
| Subscription plans + simulated checkout | Demo (**no payment taken**; prices are placeholders) |
| Sign-in / register | Demo (**no account created, password discarded**) |

## Phase 3 — Admin app

| Item | Status |
| --- | --- |
| Dashboard, students, courses, worksheets (read-only), content, subscriptions | Codex PR #1 (draft, reviewed in `docs/reviews/`) |
| Lesson editor, worksheet builder, publishing gate, presentation editor, uploads | Partial — on `claude/admin-wip`, incomplete, does not typecheck |
| Real auth, roles, permissions, audit, file storage | **Not started** |

## Phase 4 — Learning experience

| Item | Status |
| --- | --- |
| Worksheet answers + grading | Demo |
| Presentation navigation | Working |
| PDF viewing | Partial — generated sample PDF in the browser's native viewer; no pdf.js, text layer, or access control |
| Lesson progress tracking | Demo (localStorage) |
| English Read Aloud | Logic implemented and unit-tested; **audio output unconfirmed** |
| Dhivehi Read Aloud provider interface | Working as an interface; reports "unavailable" truthfully (unit-tested and seen in browser). **No Dhivehi TTS exists.** |
| Arabic | Plays only approved recitation audio; none attached; no synthetic Quranic speech |
| Teacher audio playback | Demo — plays a generated tone, **not a recording** |
| Language switching, mobile navigation | Working |

## Known bugs / weaknesses

1. Ordering questions: an untouched list counts as *unanswered* even though a sequence is displayed. Authored item order must be scrambled so the display never reveals the key (demo data does this; nothing enforces it).
2. Answer keys ship to the browser (demo only). Production grading must be server-side.
3. Worksheet autosave is keyed by worksheet id, not by user.
4. A few English strings are hard-coded outside i18n (Documents page PDF notice, form error hints "≥ 8", "name@example.com").
5. `PlaybackController`: changing speed restarts the current *segment*; stale-handle/race behaviour under rapid clicks is only lightly tested.
6. `ErrorBoundary` logs to the console only; no reporting.
7. Thaana/Arabic font packages add many asset files (unicode-range subsets); bundle/perf not yet measured.
8. No accessibility audit beyond semantics and manual checks (no axe run).

## Recommended next tasks

See `docs/CODEX_HANDOFF.md`.
