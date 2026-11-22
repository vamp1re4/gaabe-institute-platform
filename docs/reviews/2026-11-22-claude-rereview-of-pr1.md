# Claude re-review of PR #1 (after `f552b01`) — security, accessibility, RTL, QA

Reviewed: `origin/codex/review-and-hardening` @ `f552b01`, **merged locally** with `claude/initial-platform` @ `4cee5b3` in a throwaway worktree (merge was conflict-free; the merge was not pushed). Reviewer: Claude · 2026-11-22.

**Method.** Unlike the first review, this one was run: `npm ci`, typecheck, vitest, both production builds, then the admin preview in headless Chromium with axe-core 4.14.1 (wcag2a/aa/21aa + best-practice) on 7 routes × 2 languages, an RTL-isolation scan, a 375px overflow check and targeted probes. Limits: no screen reader, no real devices, no keyboard-only walkthrough beyond the probes below.

## Confirmed working

| Check | Result |
| --- | --- |
| `tsc --noEmit` | clean |
| `vitest run` | 3 files, 26 tests pass |
| `npm run build` (student **and admin**) | both pass — the admin build failure is resolved |
| Console errors, 7 routes × 2 languages | none |
| Mobile horizontal overflow at 375px, 7 routes | 0px on all |
| axe (14 page loads) | only `region` (see Finding A, which is **my** bug, not Codex's) |
| Table semantics (`caption`, `scope="col"`) | fixed as requested |
| Duplicate notices | fixed |
| Undefined `grid-2`/`grid-3` | fixed |

## Findings against PR #1 (ordered by severity)

### Security / privacy

**S1 — Admin app is indexable.** `apps/admin-web/index.html` has no `<meta name="robots" content="noindex, nofollow">` (`robotsMeta: null` in the browser). It also must be served with `X-Robots-Tag: noindex` once deployed. Low effort; high value for an admin surface. *(My WIP branch had it.)*

**S2 — Answer keys are bundled into the admin JS.** `Worksheets` imports the full `worksheets` objects (including `correct`/`accepted`/`pairs`/`order`) just to show title and count. Acceptable for a labelled demo, but record it: the production admin must fetch metadata from an authorised API, and keys must never be in any client bundle.

### QA

**Q1 — Dashboard contradicts the page it links to.** It shows "Sample students: **24**" and "Pending review: **3**" as hard-coded literals while `/students` renders **3** rows. The first review asked for derived values; only the table was fixed. Derive from `demoStudents` / worksheet data, or delete the metrics.

**Q2 — Still two student lists.** `demo-data` already exported `students` (4 × `Demo Student 0N`, with plan/progress/join date). PR #1 adds a second `demoStudents` (3 × `Demo learner A/B/C`, different shape). Please merge them into one source of truth (extend the existing record with `courseId`, and `trial`/`payment-pending` statuses) rather than adding a parallel list.

**Q3 — `eyebrow` is still undefined.** `Metric` uses `className="eyebrow"`; computed style is unstyled (`text-transform: none`). Either add it to `packages/ui/src/styles.css` or remove it.

### Accessibility

**A-1 — Disabled buttons explain themselves only via `title`.** "Edit (not connected)" and "Upload document (not connected)" are `disabled` with the reason in `title` only (`aria-describedby`/`aria-label` absent in the probe). Disabled controls are not focusable and `title` is not reliably exposed on touch or by keyboard/screen reader, so the reason is effectively invisible to those users. Use `aria-disabled="true"` (keeps focus) plus a visible or `aria-describedby` hint, and make it a no-op.

### RTL

**R1 — English page bodies are not isolated in Dhivehi mode (item 3 only partly fixed).** Data cells now use `<Lang>`, but an automated scan of `main` in `dv` mode still finds un-isolated English runs: Dashboard 11, Students 6, Courses 21, Worksheets 7, Content 5, Subscriptions 5. Examples: "Sample students", "Show unpublished sample courses", "Secure document processing", every paragraph and list item. Punctuation in these will reorder. Smallest fix: wrap the admin page body in `<div lang="en" dir="ltr">` and show a notice that admin is English-only (this is what `claude/admin-wip`'s `AdminBody` does); or wrap each string in `<Lang>`.

## Findings against my own code (fixed in this push)

**A (mine) — Demo banner outside any landmark.** axe `region` on every page of both apps: `.demo-banner` was a `<div role="note">` before the header. Now an `<aside aria-label>`. Re-scan: 13 student routes, 0 violations.

**B (mine) — Skipped heading level.** `/courses` and the worksheet list went `h1 → h3`. Card titles are now `h2` (styled at card scale).

Retracted: five "no `<h1>`" hits were a scan-timing artifact on lazy-loaded routes, not defects. The committed script waits for the `h1` for this reason.

## Verdict

**Not yet ready to merge; no blocking security defect for a demo that is not deployed.** Required before merge: Q1, Q2, S1, R1. Recommended: A-1, Q3, S2 (document). After those I will re-run the same suite and, if clean, recommend merging PR #1 into `claude/initial-platform` (never `main`) for owner approval.

## Reproduce

```bash
npm ci && npm run build
npm run preview -w @gaabe/admin-web &            # :4174
NODE_PATH=$(npm root -g) node scripts/axe-check.cjs http://127.0.0.1:4174 / /students /courses /worksheets /content /subscriptions
```

---

## Update: re-run on `25a812c` ("fix(admin): resolve rereview findings")

Codex rebased its branch onto `claude/initial-platform` and force-updated it. I merged `25a812c` with `claude/initial-platform` @ `cbf2b41` in a throwaway worktree (not pushed) and re-ran the same suite.

| Finding | Result |
| --- | --- |
| Typecheck / 26 tests / both builds | pass |
| S1 `noindex` | **fixed** (`<meta name="robots" content="noindex, nofollow">`; still add `X-Robots-Tag` at the server when deployed) |
| S2 answer keys bundled | **recorded** by Codex in `AI_COLLABORATION.md`; unchanged by design for the demo |
| Q1 dashboard vs. students | **fixed** — dashboard shows 4, `/students` shows 4 rows, both derived |
| Q2 two student lists | **fixed** — one list, no `demoStudents` left |
| Q3 `eyebrow` undefined | **fixed** — now styled (uppercase, 12.8px) |
| A-1 disabled buttons | **fixed** — `aria-disabled="true"` + `aria-describedby`, focusable |
| R1 un-isolated English in `dv` mode | **fixed** — 0 un-isolated runs on all 7 routes (was 5–21 per page) |
| axe, 14 page loads (7 routes × 2 languages) | no violations |
| Console errors / 375px horizontal scroll | none / 0px on all routes |

Remaining nit (non-blocking): the dashboard note "7 sample lessons" counts the lesson in the unpublished draft course; the figure for published courses is 6. Compute it from published courses only.

**Verdict: no blocking findings.** I recommend merging PR #1 into `claude/initial-platform` (never `main`) once the project owner approves. I have not merged it.

Limits unchanged: no screen-reader or real-device testing; axe covers only part of WCAG.
