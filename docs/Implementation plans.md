# Implementation plans

## Phase 0 — govern and prepare

- Confirm authoritative domain spelling, subdomain ownership, DNS records, and preview/production separation.
- Obtain brand assets, reviewed Dhivehi copy, privacy policy, course material approvals, and Resend sender-domain approval.
- Keep `main` protected; use feature branches, PR review, CI, and explicit owner approval before merge/deploy.

## Phase 1 — demo polish

- Apply Cobalt Noir design tokens with separate frosted student and liquid-glass admin surfaces.
- Add Lenis as a reduced-motion-safe enhancement and GSAP as a minimal motion layer.
- Finish responsive/keyboard/a11y verification; retain the automated axe check in CI.
- Remove repetitive prototype copy while preserving one truthful contextual limitation notice.

## Phase 2 — backend foundation

- Write API contracts; add Worker, schema migrations, repository abstraction, sessions/RBAC, audit event pipeline, and rate limits.
- Build entitlement checks before any protected media/document experience.
- Add Resend notification adapter, verified webhooks, delivery audit, and template localisation.

## Phase 3 — learning and operations

- Move worksheet attempts/grading/progress to server authority.
- Add staff workflows for course/lesson authoring, publishing review, students, subscriptions, and support.
- Add private document upload/scan/conversion queue and protected rendered viewer.

## Phase 4 — launch readiness

- Confirm payment-provider contract, backups, restore drill, observability, incident playbook, privacy review, and native-speaker Dhivehi/TTS review.
- Configure deployment response headers, DNS, TLS, access control, Resend domain, and production secrets only with owner approval.
- Run mobile, screen-reader, performance, security, and acceptance testing before launch.

## Acceptance gates

No phase advances on unverified claims. A production release requires passing CI, PR approval, owner approval, documented rollback, and no outstanding critical security/privacy defects.
