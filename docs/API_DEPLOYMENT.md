# API foundation and deployment contract

`@gaabe/api` is a Web-standard request handler designed to be wrapped by the
chosen serverless runtime. It deliberately contains no database, browser
imports, credentials, or assumed hosting vendor.

## Implemented now

- `GET /api/health`, which reports whether transactional mail is configured
  without exposing secrets.
- `POST /api/contact`, with input validation, a five-request-per-minute
  per-instance limit, exact-origin CORS, safe error responses, and Resend's
  HTTPS API used only by the server.
- Conservative response headers: CSP, framing protection, permissions policy,
  referrer policy, and MIME sniffing protection.

## Required server secrets

Set these only in the host's encrypted secret manager, never in a Vite
environment file, browser bundle, commit, issue, or screenshot:

- `RESEND_API_KEY`
- `RESEND_FROM` — verified sender address, for example `Gaabe Institute <noreply@your-domain>`
- `CONTACT_RECIPIENT` — inbox that receives contact requests
- `ALLOWED_ORIGINS` — a comma-separated exact allowlist, initially the approved
  client host only. Do not use `*`.

Resend requires sender-domain verification and the domain's SPF/DKIM DNS
records before mail is enabled. Configure these with the owner; this repository
cannot create DNS records or obtain credentials.

## Still required before production

Choose and provision the runtime, database, private storage, authentication,
RBAC, durable distributed rate limiting, structured logging, alerting, backups,
and a rollback path. The in-memory limiter is intentionally marked as a
single-instance foundation and is not adequate for a scaled production API.
