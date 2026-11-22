# Codex handoff — work completed after Claude became unavailable

**Date:** 22 November 2026  
**Repository:** `vamp1re4/gaabe-institute-platform`  
**Integration branch:** `claude/initial-platform`  
**Owner approval rule:** `main` is unchanged. No production release has been approved.

## Executive status

The integrated demo is substantially complete as a **front-end demonstration**.
Student and admin applications build successfully, automated checks are green,
and the dedicated Resend sending domain plus demo email Worker are provisioned.

The platform is **not production-ready**: it has no real identity system,
database, payment integration, protected media/document backend, or
server-authoritative learning records. The email Worker has not completed its
one controlled authenticated end-to-end delivery test.

## Work Codex completed

### 1. Admin demonstration remediation and integration — merged PR #1

Codex reviewed the available peer feedback and fixed the evidence-backed
findings in the demonstration admin application:

- removed conflicting hard-coded dashboard counts and derived the displayed
  student information from one fictional data source;
- removed the duplicate student list;
- added `noindex, nofollow` to the admin document;
- corrected missing utility styling, visible unavailable-action explanations,
  table captions/header scopes, duplicate notices, and Dhivehi bidi isolation;
- retained explicit fictional/demo labelling and did not claim a backend.

The resulting reviewed work was merged into `claude/initial-platform` through
PR #1 (`9178b20`). `claude/admin-wip` remains unmerged because it is
incomplete and does not typecheck.

### 2. Product polish, requirements, and QA — merged PR #2

Codex implemented the agreed visual direction while keeping accessibility and
motion safeguards:

- Cobalt Noir tokens: `#B7C1CC`, `#315BCE`, `#17264F`, `#111318`;
- frosted, minimal student interface and liquid-glass admin surfaces with
  opaque fallbacks for reduced transparency;
- Lenis as an optional smooth-scroll enhancement and GSAP only for purposeful,
  reduced-motion-safe motion;
- unique page metadata, a clearer worksheet completion state, and contrast
  corrections;
- requested product documents: PRD, TRD, app flow, UI/UX brief, backend schema,
  implementation plan, deployment/API guide, and the supplied launch/security
  checklist archive.

PR #2 was merged into `claude/initial-platform` (`cab24fa`). The branch does
not deploy either demo host; host names alone are not deployment evidence.

### 3. Contact API foundation — merged PR #3

Codex added a framework-neutral, server-side contact endpoint foundation:

- `GET /api/health` and `POST /api/contact`;
- strict request validation, exact CORS configuration, rate limiting, and
  server-side Resend HTTPS delivery;
- no client-side Resend credential exposure.

This is an implementation foundation, not a complete user-facing contact
deployment. It was merged through PR #3 (`0e64fe5`).

### 4. Hardened internal Resend Worker — merged PR #4

Codex implemented and tested `services/email-worker`:

- internal-only `POST /internal/email/send` endpoint;
- bearer-token verification, bounded JSON bodies, strict job validation, and
  mandatory idempotency-key validation;
- English and Dhivehi welcome/class-reminder rendering with escaping and RTL
  markup;
- ten-second Resend timeout, safe errors, and logs that avoid recipient data;
- Worker-specific tests, type generation, dry-run validation, and documented
  production gaps.

PR #4 was merged into `claude/initial-platform` (`7c917ec`). No Resend key,
service token, or sender secret has ever been committed.

### 5. Resend and Cloudflare review after the external Phase 2 deployment

The project-authorized external deployment handoff reports the following live
resources. Codex inspected them read-only and did not create or rotate any
credentials.

| Resource | Verified state |
| --- | --- |
| Resend sending domain | `mail.techtasks.store` reported verified |
| DNS authentication | DKIM, SPF/MX, return-path CNAME, and DMARC resolve publicly |
| Worker | `gaabe-demo-email` deployed at `https://gaabe-demo-email.shahulaan8.workers.dev` |
| Latest reported Worker version | `28c15aa1-8d51-47d4-95c2-35101b807b73` |
| Worker bindings | `RESEND_API_KEY` and `EMAIL_JOB_TOKEN` are secret bindings; `EMAIL_FROM` is configured |
| Reachability probe | `/` returns intentional `404`; unauthenticated send request returns `401` |

The deployed JavaScript artifact matches the hardened Worker's observable
behavior: route/method restrictions, token validation, idempotency forwarding,
bounded parsing, bilingual rendering, and safe provider-error behavior. The
probes did **not** send email.

### 6. Email deployment-parity PR — open, not merged

Codex found a configuration mismatch: the source `wrangler.jsonc` said
`workers_dev: false`, while the approved demo Worker intentionally has a
dedicated `workers.dev` address. A future normal Wrangler deployment could
therefore remove the demo address.

Commit `f8e91ec` on `codex/email-deployment-parity` changes only that setting
to `true` and records the real demo-deployment boundary in documentation. It
was tested with:

- `npm run verify` — **34 tests passed; both Vite production builds passed**;
- `npx wrangler deploy --dry-run --config services/email-worker/wrangler.jsonc`
  — passed;
- `git diff --check` — passed.

PR #5 is open for review: <https://github.com/vamp1re4/gaabe-institute-platform/pull/5>.
It must not be merged automatically.

## Branch and pull-request state

| Branch / PR | State | Action |
| --- | --- | --- |
| `main` | baseline | Keep unchanged until explicit owner approval |
| `claude/initial-platform` | integrated demo baseline at `7c917ec` | Current review/integration target |
| PR #1–#4 | merged into `claude/initial-platform` | No further action required for the merged scope |
| PR #5 / `codex/email-deployment-parity` | open | Review and merge only with owner approval |
| `claude/admin-wip` | incomplete, fails typecheck | Do not merge or copy until completed and reviewed |
| `integration/resend-demo-email` | older parallel scaffold from `main` | Do not merge; it duplicates/supersedes the hardened Worker path |

## What remains

### Immediate demo completion

1. Review PR #5. If approved, merge it into `claude/initial-platform`; do not
   merge to `main`.
2. Run **exactly one** controlled welcome-email request from a trusted
   server-side environment that already has the Worker service token. Do not
   paste or store the token in chat, source, Git, or a browser.
3. Record HTTP response, Resend message ID, delivery status, and SPF/DKIM/DMARC
   results. Do not resend if the first outcome is uncertain until the
   idempotency key and Resend records are checked.
4. Deploy the student/admin demos only after separate owner approval; configure
   access control and `noindex` for the admin demo.

### Phase 3 — learning and operations

Phase 3 has **not started**. The first required deliverable is a reviewed
backend design before code or infrastructure provisioning. It must cover:

- real accounts, sessions, RBAC, guardian flows, audit events, and abuse
  controls;
- server-authoritative attempts, grades, exam timing, and progress;
- staff authoring/review/publish workflows and subscription/support operations;
- private document storage, malware scanning, conversion queue, and protected
  viewer;
- the isolated Cloudflare Worker + D1 + R2 + Queue resource model and a
  migration/rollback plan.

No database, authentication provider, private storage bucket, queue, payment
provider, or application API has been provisioned for this work. Those choices
need owner approval before implementation.

### Production blockers

- real authentication, authorization, auditing, data retention, and backup /
  restore exercises;
- payment provider contract and verified webhook handling;
- durable email jobs, bounce/complaint suppression, verified Resend webhooks,
  monitoring, alerting, and secret-rotation process;
- server-side protection for answer keys, documents, media, entitlements, and
  grading;
- native-speaker Dhivehi copy and text-to-speech review; real teacher/audio
  assets where required;
- accessibility testing with screen reader, keyboard-only flow, and real mobile
  devices; performance and security testing;
- privacy policy, safeguarding/data-minimisation review, incident playbook,
  rollback drill, and owner acceptance.

## Non-claims and safety boundaries

- No Codex action deployed the Worker, changed DNS, created a Resend key, or
  sent a live email after Claude became unavailable.
- No actual student, payment, course, or private document data has been put in
  the demo.
- The application must remain isolated from unrelated Tech.Tasks systems;
  `mail.techtasks.store` is authorised only as this temporary sending domain.
- The existing admin demo and all fictional records must not be presented as a
  production student-management system.
