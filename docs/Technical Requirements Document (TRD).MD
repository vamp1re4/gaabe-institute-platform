# Technical Requirements Document (TRD)

## Current baseline

TypeScript npm-workspace monorepo; React/Vite student and admin applications; shared UI, i18n, speech, worksheet, and demo-data packages. It is a front-end prototype today.

## Target deployment topology

| Surface | Proposed host | Visibility |
| --- | --- | --- |
| Student demo | `clientdemo.techtasks.store` | Preview/public demo only |
| Admin demo | `admindemo.techtasks.store` | `noindex`; access-controlled preview |
| API | Separate Worker/API hostname | Never exposed as a generic public data store |

Use isolated Cloudflare resources for this project: Worker, database, R2 bucket, queues, secrets, and CI credentials. Never reuse unrelated Tech.Tasks resources.

## Frontend

- React 19, Vite, TypeScript strict mode, semantic HTML, CSS logical properties.
- `lenis` provides optional smooth scrolling only when motion is allowed. Native scrolling remains available for reduced-motion, keyboard, and assistive technology use.
- GSAP is limited to purposeful route/section entrance and state-transition effects. It must respect `prefers-reduced-motion`, never delay content access, and avoid scroll-jacking.
- Visual tokens use Cobalt Noir: `#B7C1CC`, `#315BCE`, `#17264F`, `#111318`; product-specific glass layers are translucent surfaces over these tokens, not low-contrast decoration.

## Backend (proposed)

- Cloudflare Workers API with versioned REST contracts and Zod validation.
- Relational repository abstraction over D1 initially; PostgreSQL alternative required if reporting/concurrency needs exceed D1 evaluation.
- Private R2 originals and rendered assets; all access uses backend entitlement checks and short-lived scoped URLs.
- Queues for conversion, OCR, notification, and speech-preparation jobs.
- Resend server integration for transactional email. Store `RESEND_API_KEY` only in Worker secrets; use verified sending domain, idempotent notification records, unsubscribe/support policy, and delivery-event logging.

## Security controls

- HttpOnly/Secure session cookies, CSRF handling, rate limits, strict CORS, CSP, input validation, audit events, and server-side RBAC.
- No answer keys, private originals, payment credentials, or service secrets in a client bundle.
- Admin deployment sends `X-Robots-Tag: noindex, nofollow` and has an HTML robots meta tag as defence in depth; this is not access control.
- Resend webhooks require signature verification and replay-safe event handling.

## Observability and release

- Structured request/error logging without credentials or sensitive student data.
- Health endpoint, alerting, schema migration history, backup/restore procedure, and a tested rollback plan before launch.
- CI: typecheck, unit/integration tests, build, accessibility scan, dependency audit, and preview smoke tests.
