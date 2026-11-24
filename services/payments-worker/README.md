# Gaabe test-mode payments Worker

This Worker creates Stripe-hosted **test-mode** subscription Checkout Sessions
and records verified Stripe webhooks in a test-only Supabase ledger. It never
creates live Checkout Sessions, handles card data, or grants a production
entitlement from a browser redirect.

## Routes

| Route | Purpose |
| --- | --- |
| `GET /health` | Reports whether the server-side configuration is complete. |
| `POST /v1/checkout` | Authenticated learner Checkout initiation. CORS is restricted to the learner demo. |
| `POST /webhook/stripe` | Stripe-only signed webhook endpoint. No browser CORS is enabled. |

## Required secrets

The Cloudflare Worker must contain these encrypted secrets before deployment is
considered ready:

- `STRIPE_SECRET_KEY` — existing restricted **test** key (`rk_test_…`).
- `STRIPE_WEBHOOK_SECRET` — existing test webhook signing secret.
- `SUPABASE_SERVICE_ROLE_KEY` — the project server-only secret used solely by
  this Worker to call the protected payment-ledger RPC.

Do not put any of them in `wrangler.jsonc`, Vite variables, browser code,
GitHub, logs, or chat messages. Confirm existing secret bindings remain after a
deployment; the configured public `vars` are not secrets.

## Deployment gate

The source can be deployed only after `SUPABASE_SERVICE_ROLE_KEY` has been
installed as a Cloudflare secret for `gaabe-payments`. Until then `/health`
honestly returns `ready: false`, and no Checkout or webhook requests are
accepted. This avoids an acknowledged webhook that cannot be persisted.

After the secret is present, deploy the dedicated Worker only:

```sh
wrangler deploy --config services/payments-worker/wrangler.jsonc
```

Then run the controlled Stripe test plan. Do not enable live mode or change the
registered event set without the project owner's approval.

## Test boundary

The `gaabe_stripe_test_*` tables are intentionally separate from
`public.entitlements`. The Worker records only test subscriptions and does not
unlock paid course content. A separate, reviewed production entitlement policy
is required before any live payment work.
