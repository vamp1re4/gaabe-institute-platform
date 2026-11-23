# Production backend status

## Provisioned

- Supabase project: `gaabe-institute-production` (`ap-southeast-1`)
- Firebase project: `gaabe-institute-auth`
- Firebase web application: `Gaabe Institute Web`
- Firebase email/password authentication: enabled
- Resend sending domain and dedicated Worker: provisioned previously
- Private R2 bucket: `gaabe-institute-assets` (no public access configured)
- Student authentication/profile integration: deployed to `clientdemo.techtasks.store` and verified with a disposable create/read/delete test

## Database contract

`supabase/migrations/20261123000842_initial_production_schema.sql` is the empty, production data model. It contains profiles, consent records, courses and bilingual content, enrollments, progress, worksheets, entitlements, R2 asset metadata, notifications, audit events, RLS, and targeted Realtime tables.

No sample users, courses, payments, credentials, or content are seeded.

## Required before connecting either public demo to production data

1. Add Firebase as a **Third-Party Auth** provider in the Supabase dashboard for Firebase project `gaabe-institute-auth`.
2. Add Firebase as a third-party provider before applying the migration. The migration verifies Firebase issuer/audience and safely supports Firebase's default `anon` database role, so Cloud Functions and a billable custom-claim setter are not required.
3. Configure the same public environment values from `.env.example` in the repeatable deployment pipeline. The current manual demo deployment is configured; do not place private keys there.
4. Generate and commit TypeScript database types when the data repository layer is introduced.
5. Implement the server-side, authenticated R2 upload/download gateway. The `gaabe-institute-assets` bucket is private and ready; the browser must never receive R2 credentials.
6. Add server-side Stripe test-mode webhooks before granting any paid entitlement.
7. Replace individual demo-data readers with queried repositories, route by route, and remove their demo fallback only after each live path passes tests.

## Current safety posture

The deployed client/admin sites remain demonstrations until those steps are complete. Their existing demo records are not production student records, and no browser has access to privileged database, email, payment, or R2 credentials.
## Stripe test-mode payment boundary

The Stripe test catalog, webhook, and `gaabe-payments` Worker were provisioned
outside the repository before the Worker source was synchronized here. The
repository now contains the Worker implementation and the database migration
for its isolated Stripe test ledger.

- Price selection is server allowlisted: Standard and Premium only.
- Checkout requires a Firebase identity validated by Supabase.
- The Worker only accepts signed Stripe test-mode webhooks and processes the
  ledger atomically with event-ID deduplication.
- Browser redirects never grant access.
- Test subscriptions are kept separate from `public.entitlements`.

The service is not deployable until `SUPABASE_SERVICE_ROLE_KEY` is stored as an
encrypted `gaabe-payments` Worker secret. It remains test-only; no live-mode
payments or real access grants are implemented.

