# Gaabe Institute email Worker

This internal Worker delivers approved transactional messages through Resend.
The isolated demo Worker is deployed at a `workers.dev` URL, but exposes only
its authenticated internal endpoint; it never accepts calls from the student
or admin browser. The public URL is intentionally retained in source
configuration so a later Wrangler deployment does not disable it.

## What is implemented

- `POST /internal/email/send` with constant-time service-token comparison.
- Bounded JSON bodies, schema validation, safe HTML/plain-text rendering, and
  mandatory Resend idempotency keys.
- Ten-second provider timeout and safe, structured logs without recipient data.
- English and draft Dhivehi welcome/class-reminder messages. Dhivehi must be
  reviewed by a fluent speaker before real sending.

## Deployment status and production approval

The project owner approved a demo deployment with domain-restricted Resend and
service-token secrets configured outside this repository. A non-authenticated
probe may verify that the URL responds with `404` at `/` and `401` at this
endpoint; neither probe sends an email.

This is not production approval. Before a production rollout, rotate the demo
credentials and replace the public bearer-token interface with authenticated
Cloudflare service bindings or Cloudflare Access.

## Required approval before changing credentials or deployment

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
