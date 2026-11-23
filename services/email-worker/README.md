# Gaabe Institute email Worker

This internal Worker delivers approved transactional messages through Resend.
It is intentionally not deployed, has no public route, and never accepts calls
from the student or admin browser.

## What is implemented

- `POST /internal/email/send` with constant-time service-token comparison.
- Four job types: `welcome`, `verification` (requires an `https://` link),
  `enrollment`, `class_reminder`.
- Bounded JSON bodies, schema validation, safe HTML/plain-text rendering, and
  mandatory Resend idempotency keys.
- Ten-second provider timeout and safe, structured logs without recipient data.
- English and draft Dhivehi copy for all four job types. Dhivehi must be
  reviewed by a fluent speaker before real sending.
- `POST /internal/email/webhook`: verifies Resend's Svix-format signature
  (`svix-id`/`svix-timestamp`/`svix-signature` against `RESEND_WEBHOOK_SECRET`,
  with a 5-minute timestamp tolerance against replay) before touching the
  body. On `email.bounced` or `email.complained`, the recipient is written to
  the `SUPPRESSIONS` KV namespace.
- `POST /internal/email/send` now checks `SUPPRESSIONS` first and returns
  `403 recipient_suppressed` without ever calling Resend for a suppressed
  address. If `SUPPRESSIONS` is not bound, this check is skipped (fails open
  to "no suppression list", not "worker broken") — do not deploy the webhook
  in production without also binding the namespace.

## Required approval before deployment

The owner must explicitly approve creation of a domain-restricted Resend API
key, Worker secrets, an authenticated caller/service binding, and deployment.
Do not place `RESEND_API_KEY`, `EMAIL_JOB_TOKEN`, or `RESEND_WEBHOOK_SECRET` in
source, a frontend environment variable, GitHub, logs, or chat.

## Steps still required before this is a complete production path

These are each a deliberate, owner-approved action — none of them are done by
this commit:

1. **Create the KV namespace** the webhook/suppression feature needs:
   `wrangler kv namespace create SUPPRESSIONS`, then put the returned id in
   `wrangler.jsonc` (currently a placeholder) before deploying.
2. **Register the Resend webhook** once the Worker is deployed and has a
   stable URL: create it for `email.bounced`, `email.complained`, and
   `email.delivered` pointed at `<worker-url>/internal/email/webhook`. Resend
   returns a `whsec_...` signing secret on creation — store it only as the
   Worker's `RESEND_WEBHOOK_SECRET` secret (`wrangler secret put`), never in
   source or chat.
3. **Connect real events to this Worker.** The Worker is intentionally not a
   browser API, so the browser must never hold `EMAIL_JOB_TOKEN`. The
   consistent choice for this project (it already avoids Firebase Cloud
   Functions elsewhere, for the same reason) is a Postgres trigger using the
   `pg_net` extension — or Supabase's Database Webhooks feature, which is the
   same mechanism with a UI — firing server-side on the relevant table
   change (e.g. `after insert on public.profiles` for `welcome`, `after
   insert on public.enrollments` for `enrollment`) and calling this Worker's
   `/internal/email/send` with the job token kept in Supabase's own secret
   store, never in a migration file or the repository. `verification` should
   come from whichever system actually issues the verification link
   (currently nothing does — Firebase's own built-in verification email is
   the simpler alternative if owner doesn't want a second Dhivehi copy to
   maintain for this one case; flagging as an open decision, not resolved
   here).
4. Durable rate limiting, a database-backed send ledger, a retry queue, and
   audited authorization are still open — the webhook/suppression addition
   above covers "stop sending to addresses that already bounced," not those.
5. **The one controlled Resend delivery test** the owner's checklist asks
   for still needs an explicit recipient and sender to be confirmed before
   anything is sent — see `docs/reviews/2026-11-23-claude-email-production-review.md`.

Password-reset, verification, and payment emails must be emitted only by
their respective server-authoritative systems.

## Local checks

```sh
npm run typecheck:email
npm test
```
