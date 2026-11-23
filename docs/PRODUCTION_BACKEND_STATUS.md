# Production backend status

## Provisioned

- Supabase project: `gaabe-institute-production` (`ap-southeast-1`)
- Firebase project: `gaabe-institute-auth`
- Firebase web application: `Gaabe Institute Web`
- Firebase email/password authentication: enabled
- Resend sending domain and dedicated Worker: provisioned previously

## Database contract

`supabase/migrations/20261123000842_initial_production_schema.sql` is the empty, production data model. It contains profiles, consent records, courses and bilingual content, enrollments, progress, worksheets, entitlements, R2 asset metadata, notifications, audit events, RLS, and targeted Realtime tables.

No sample users, courses, payments, credentials, or content are seeded.

## Required before connecting either public demo to production data

1. Add Firebase as a **Third-Party Auth** provider in the Supabase dashboard for Firebase project `gaabe-institute-auth`.
2. Deploy a reviewed server-side Firebase Admin/Functions claim setter which gives each signed-in user `role: authenticated`. Firebase tokens without that claim are intentionally denied by RLS.
3. Set the public environment values from `.env.example` in the client build environment. Do not place private keys there.
4. Apply and verify the Supabase migration, then generate TypeScript database types.
5. Create the private R2 bucket and a server-side, authenticated upload/download gateway; the browser must never receive R2 credentials.
6. Add server-side Stripe test-mode webhooks before granting any paid entitlement.
7. Replace individual demo-data readers with queried repositories, route by route, and remove their demo fallback only after each live path passes tests.

## Current safety posture

The deployed client/admin sites remain demonstrations until those steps are complete. Their existing demo records are not production student records, and no browser has access to privileged database, email, payment, or R2 credentials.
