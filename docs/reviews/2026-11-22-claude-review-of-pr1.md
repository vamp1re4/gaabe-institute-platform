# Claude review of PR #1 — "admin demonstration operations portal" (Codex)

Branch reviewed: `codex/review-and-hardening` @ `1207d5d` · Reviewer: Claude · Date: 2026-11-22

**Method and limits.** I read `apps/admin-web/src/App.tsx` and `docs/AI_COLLABORATION.md` from the branch. I did **not** check the branch out, build it or run it, so Codex's reported results (typecheck, 26 tests, both builds) are unconfirmed by me. This is a code-reading review.

## What is good

- Honesty is consistent: every screen carries the demo notice, buttons that would imply a backend are `disabled` with an explanation, and the payments/entitlement page says plainly that nothing is enforced.
- Reuses the shared packages (`SiteShell`, `Lang`, `T`, `demo-data`) instead of forking UI.
- Restores the admin production-build entry point that was missing.
- Keeps the unverified Dhivehi word wrapped in `<Lang code="dv">`.

## Requested changes before this becomes the admin baseline

1. **Two sources of truth for students.** `Students` and the dashboard use hard-coded literals ("24", "3", and three named people) instead of `students` from `@gaabe/demo-data` (4 records, named `Demo Student 0N`). Please derive from demo-data. The three names read as realistic Maldivian names; even labelled fictional they risk being mistaken for real students, so use the neutral demo names.
2. **Undefined CSS classes.** `grid-2`, `grid-3` and `eyebrow` do not exist in `packages/ui/src/styles.css`. Either add them to the design system or use `.grid`.
3. **English content inside an RTL page.** In Dhivehi mode the shell flips to RTL but the page bodies are plain English with no `lang`/`dir`, so punctuation reorders (this exact bug was found and fixed on the student app with `<Lang>`). Either wrap bodies in `<Lang>`/`lang="en" dir="ltr"`, or keep admin English-only and say so.
4. **Duplicate notices.** `DemoBanner` (student wording: "sample courses or fees") plus `DemoWarning` on every page. Use `<DemoBanner messageKey="admin.mockNotice" />` once.
5. **Table accessibility.** Add `scope="col"` to `<th>` and a visually hidden `<caption>`.
6. **Scope vs. the brief.** The brief asks for interfaces for lesson editor, worksheet builder, document upload, presentation management and content publishing. This PR covers dashboard, students, courses, worksheets (read-only), a document *notice* and subscriptions. That is acceptable as an honest first slice; the rest is tracked below.

## Overlap to resolve

I had started a richer admin on `claude/admin-wip` (`7d617be`, **incomplete, does not typecheck**): sidebar shell, students with invite/suspend, mock stores, and a tested publishing gate (`canPublish`: title, content reviewed, Dhivehi verified, religious content approved). Proposal: use PR #1 as the baseline, then port from `claude/admin-wip` on top of it — lesson editor, worksheet builder with live preview, publishing gate, presentation editor — rather than maintaining two admin apps.

## Decision needed from the project owner

Merging PR #1 into `claude/initial-platform` (not `main`) once items 1–5 are addressed.
