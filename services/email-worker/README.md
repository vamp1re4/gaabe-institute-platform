# Gaabe Institute demo email service

Standalone Cloudflare Worker scaffold. **Not deployed.** This is intentionally isolated from Tech.Tasks infrastructure and has no auth, student database, or payment integration.

## Setup

1. Wait until `mail.techtasks.store` is verified in Resend.
2. Create a **sending-only**, domain-restricted Resend API key for `mail.techtasks.store`.
3. In this directory, run `npx wrangler secret put RESEND_API_KEY` and paste the key **only into the CLI**, never GitHub, logs, or frontend.
4. Generate a separate high-entropy random token and run `npx wrangler secret put EMAIL_JOB_TOKEN`.
5. Deploy only after reviewing the account, environment, routes, and cost settings: `npx wrangler deploy`.
6. Call `POST /internal/email/send` from a trusted backend with `Authorization: Bearer <EMAIL_JOB_TOKEN>`. Never call from student/admin browsers.

Example JSON body: `{"type":"welcome","to":"student@example.com","language":"en","studentName":"Demo Student"}`.
For reminders, also provide `classTitle` and `classTime`.

## Important security constraints

- This is an internal service; the bearer token is a provisional guard, **not** a complete production authorization model. Restrict network access with Cloudflare Access/service bindings before production.
- Add server-side rate limiting, idempotency, abuse protection, and auditable authorization before connecting any student-driven action.
- The actual authentication provider must own verification and password-reset tokens. Do not invent OTPs in this worker.
- Payment receipts must come from verified payment-provider webhooks, never client-submitted payment status.
- Dhivehi copy is **unreviewed demo text** and requires teacher/language review.
- This worker sends no email until deployed and invoked. Do not use it for bulk mail.
- Configure Resend webhook signature verification and suppression handling before production.
