# Gaabe Institute email Worker

This internal Worker delivers approved transactional messages through Resend.
It is intentionally not deployed, has no public route, and never accepts calls
from the student or admin browser.

## What is implemented

- `POST /internal/email/send` with constant-time service-token comparison.
- Bounded JSON bodies, schema validation, safe HTML/plain-text rendering, and
  mandatory Resend idempotency keys.
- Ten-second provider timeout and safe, structured logs without recipient data.
- English and draft Dhivehi welcome/class-reminder messages. Dhivehi must be
  reviewed by a fluent speaker before real sending.

## Required approval before deployment

The owner must explicitly approve creation of a domain-restricted Resend API
key, Worker secrets, an authenticated caller/service binding, and deployment.
Do not place `RESEND_API_KEY` or `EMAIL_JOB_TOKEN` in source, a frontend
environment variable, GitHub, logs, or chat.

Before a production rollout, add durable rate limiting, a database-backed send
ledger, retry queue, webhook signature verification, bounce/complaint
suppression, and audited authorization. Password-reset, verification, and
payment emails must be emitted only by their respective server-authoritative
systems.

## Local checks

```sh
npm run typecheck:email
npm test
```
