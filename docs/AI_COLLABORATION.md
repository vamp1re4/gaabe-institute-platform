# AI collaboration ledger

This file is the shared, evidence-based coordination record for work on the Gaabe Institute Platform. It does not replace code review, pull requests, or project-owner approval.

## Working agreement

- `main` remains protected. No agent merges or deploys without the project owner's explicit approval.
- Work is made on named feature branches and proposed through pull requests.
- Before editing, each contributor records the branch, scope, and files they expect to touch below. Do not overwrite unreviewed work from another branch.
- Codex owns implementation, automated tests, and technical verification. Claude owns architecture/design/security/QA review. Either may challenge a proposal with concrete evidence. Material disagreements are escalated to the project owner.
- Demonstration data, draft translations, demo audio, and unavailable external integrations must be labelled honestly in both code and documentation.

## Current branch map

| Branch | Contributor | Purpose | Status |
| --- | --- | --- | --- |
| `main` | Project owner | Protected baseline | No application code |
| `claude/initial-platform` | Claude | Initial monorepo, shared UI/i18n/speech/worksheet work, student app | In progress; do not merge |
| `codex/review-and-hardening` | Codex | Review ledger and technical verification only until Claude completes the interim handoff | Active |

## Review record

### 2026-11-22 — Codex initial inspection

- Inspected commits `5c4ab4c`, `8f7fced`, and `d0ba35b` on `claude/initial-platform` before making changes.
- Read `docs/CODEX_HANDOFF.md`. It explicitly labels the handoff as interim and asks Codex not to edit Claude-owned source files until a full handoff or an agreed scope is recorded here.
- Ran `npm ci` and `npm run verify` on the current branch.
  - Typecheck passed.
  - Vitest passed: 3 files, 26 tests.
  - Student production build passed.
  - Admin production build failed because `apps/admin-web/index.html` does not exist. This is recorded as an in-progress limitation, not a regression fixed by Codex while Claude owns the admin scaffold.
- Initial review agrees with the explicit draft-locale and unavailable-Dhivehi speech safeguards. Production use still requires a backend, authorization, secure storage, real payment integration, a verified Dhivehi provider with native-speaker review, and security/QA sign-off.

## Next coordination checkpoint

Claude should replace the interim handoff with the completed scope, known limitations, tests run, and files no longer being actively edited. Codex will then review the proposed changes, open an implementation branch for an agreed scope, and submit a pull request rather than merging directly.

### 2026-11-22 — Codex: approved public demo deployment

The project owner explicitly approved deployment of the current integrated
demonstration applications to `clientdemo.techtasks.store` and
`admindemo.techtasks.store`. Codex will create only two isolated static-asset
Workers, with SPA fallback and custom-domain bindings. No existing Worker,
DNS record, email Worker, secret, database, payment service, or unrelated
Tech.Tasks system is in scope. The admin application remains a clearly
labelled, unauthenticated demonstration and must not be used with real data.

### 2026-11-22 — Codex: explicit dark-theme glass-token follow-up

Claude's `4d9a8c4` correctly fixes glass-token contrast for system dark mode.
Codex found the explicit application theme path remained uncovered: selecting
the app's `data-theme="dark"` setting while the operating system is light does
not match the `prefers-color-scheme: dark` media query. This narrowly adds the
same approved token values to the explicit dark-theme block. Verification uses
an OS-light browser with the explicit dark attribute and reports the correct
dark values plus zero axe violations. No other styling, motion, or app logic is
changed.

## Implementation record

### 2026-11-22 — Codex: admin demonstration scaffold

With the project owner's instruction to continue and no newer remote changes
from Claude, Codex took the previously unimplemented `apps/admin-web`
frontend scaffold. The scope is limited to an accessible, clearly labelled
demonstration administration interface that consumes existing fictional data,
restores the workspace production-build contract, and does not claim backend
authorization or persistence. Expected files: `apps/admin-web/index.html` and
`apps/admin-web/src/**`.

Completed in `4c31466` (`feat(admin): add demonstration operations portal`).
Verification: `npm run typecheck`, `npm test` (3 files, 26 tests), and
`npm run build` all passed. The previous admin entry-point build failure is
resolved. No deployment, merge, backend integration, or authorization claim
was made.

### 2026-11-22 — Codex response to Claude's PR #1 review

Claude's review was inspected after it was published to
`claude/initial-platform`. Codex accepts the evidence-backed findings about
centralized fictional data, non-existent grid utility classes, duplicate demo
notices, and missing table captions/header scopes. The admin UI will be
corrected on this branch. `claude/admin-wip` remains incomplete and will not
be merged or copied until it typechecks and its scope can be reconciled.

### 2026-11-22 — Codex response to Claude's re-review

Codex accepts the required Q1/Q2/S1/R1 findings and the Q3/A-1 accessibility
recommendations. The correction uses the existing shared `students` records,
derives dashboard values, sets the admin document to `noindex, nofollow`, and
isolates the unfinished admin body as English/LTR while the shell remains
locale-aware. It also adds visible descriptions for unavailable actions and an
`eyebrow` design-token utility. The re-review's S2 finding is documented here:
the demo worksheet metadata still bundles answer keys; production must obtain
authorised worksheet metadata from an API and never ship answer keys to a
student-facing client.

### 2026-11-22 — Codex: integrated demo polish and independent QA

Codex combined the already re-reviewed admin demonstration branch with the
separate product-polish branch only on `codex/integrated-demo-polish`; neither
source branch nor `main` was merged. The integration applies the agreed Cobalt
Noir liquid-glass treatment to admin cards, keeps the student interface
frosted and minimal, and preserves solid fallbacks for browsers or user
preferences that reduce transparency. It also fixes the dashboard's published
lesson total so it excludes a draft course.

Codex independently re-ran `npm run verify` (typecheck, 26 tests, and both
production builds) and the axe WCAG 2 A/AA/best-practice scan. Axe found and
Codex fixed insufficient contrast on muted course badges and table headers;
the final scan was clean on 12 student routes and 6 admin routes. No
screen-reader, real-device, DNS, email-delivery, merge, or deployment claim is
made by this record.
