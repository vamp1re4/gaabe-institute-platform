# Email (item 6): status and what was built

Reviewer/author: Claude, 2026-11-23, on `claude/initial-platform`. Scope:
owner's checklist item 6 (email), picked up while Codex is on item 5
(payments) and rate-limited.

## Checked against the live Resend account (read-only)

- **Domain:** `mail.techtasks.store` — verified, region `us-east-1`, sending
  enabled, receiving disabled. Matches what Codex's handoff reported.
- **Webhooks:** **zero configured.** Nothing was receiving bounce, complaint,
  or delivery events before this change — the gap the owner's checklist named
  ("add bounce/suppression/webhook handling before production messaging")
  was real and unaddressed.

## What I built (`services/email-worker`, tests included, all passing)

1. **Two more job types.** The Worker previously rendered `welcome` and
   `class_reminder` only. Added `verification` (takes an `https://`-only
   link; rejects anything else, including `http://`) and `enrollment`, each
   with English and draft-Dhivehi copy, matching the existing escaping and
   RTL/`lang` handling.
2. **A webhook endpoint** (`POST /internal/email/webhook`) that verifies
   Resend's Svix-format signature — `svix-id`/`svix-timestamp` bound into the
   HMAC, a 5-minute timestamp tolerance against replay, constant-time
   comparison — before it ever parses the body. On `email.bounced` or
   `email.complained`, it writes the recipient into a `SUPPRESSIONS` KV
   namespace.
3. **A suppression check in the send path.** `POST /internal/email/send` now
   looks the recipient up in `SUPPRESSIONS` first and returns `403
   recipient_suppressed` without calling Resend at all if they're listed. If
   the KV binding isn't configured, this check is a no-op rather than an
   error — deliberately fails open to "no suppression list," not "worker
   broken," but that means **the KV namespace must actually be bound before
   this protection is real** (see the Worker's README).
4. Tests: 4 new cases (verification/enrollment rendering + insecure-link
   rejection, a suppressed recipient blocked before the provider call, an
   invalid/missing webhook signature rejected, a correctly signed bounce
   event recorded). Full suite: 38/38 pass, typecheck clean, both app builds
   pass.

## What I deliberately did not do

- **Did not create the KV namespace or register the Resend webhook.**
  `wrangler.jsonc` has a placeholder KV id with a comment explaining why.
  Registering the real webhook needs the Worker's deployed URL first (so it
  points at something that exists) and hands back a signing secret that must
  go straight into Worker secrets, never into chat or source — that's a
  deliberate, owner-timed action, not something to automate from here.
- **Did not wire any real event to the Worker yet.** The Worker is
  intentionally not a browser API; the browser must never hold
  `EMAIL_JOB_TOKEN`. The README now documents the consistent approach for
  this project (a Postgres `pg_net` trigger / Supabase Database Webhook,
  mirroring how the Firebase role-claim trigger avoided a Cloud Function) as
  the next concrete step, with the job token kept as a Supabase-side secret.
  I did not write that trigger migration this turn — it touches the
  production schema I just patched a security hole in, and I'd rather it get
  its own focused review once the KV/webhook pieces are actually deployed,
  not bundled in.
- **The one controlled test email was sent and confirmed delivered**, after
  the owner explicitly named both the recipient and sender (neither was
  chosen by me — the Resend tool itself requires that):
  - From: `Gaabe Institute <noreply@mail.techtasks.store>`
  - To: `Shahulaan8@gmail.com`
  - Resend status: `delivered`
  - Message ID: `010001a2069b018b-0bbf6b08-3bac-45c6-8866-683effc4c9e6-000000@email.amazonses.com`
  - Sent 2026-11-23 04:12:31 UTC, via `mail.techtasks.store` (the verified
    domain), not through the `services/email-worker` Worker — that Worker
    isn't deployed yet, so this test exercised Resend/DNS/domain
    deliverability directly, not the Worker's auth, idempotency, or
    suppression logic. Those need their own test once the Worker is
    deployed with real secrets.
  - **Inbox placement confirmed by the owner** (2026-11-24): the test email
    was received, not caught in spam. The controlled delivery test the
    owner's checklist asked for is complete.

## Still open from the owner's item 6

- Wiring welcome/verification/enrollment/reminder to real events (next,
  pending KV + webhook deployment).
- A database-backed send ledger, retry queue, and durable rate limiting —
  not started.
- A second delivery test through the actual `services/email-worker` Worker
  once it's deployed, to exercise the token/idempotency/suppression path
  this document's test did not touch.
