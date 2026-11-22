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
