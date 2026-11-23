# Claude review: production backend (`codex/demo-deployment`)

Reviewed: `codex/demo-deployment` in a throwaway worktree, not merged into
`claude/initial-platform` or `main`. Reviewer: Claude, 2026-11-23. Owner
confirmed both demo hosts (`admindemo.techtasks.store`,
`clientdemo.techtasks.store`) are already live on Cloudflare, which is why
this review prioritized the live database's authorization rules over the
rest of the owner's production checklist.

**Scope and limits.** Read-only desk review of the SQL migrations, the
Firebase↔Supabase auth bridge (`production-auth.ts`, `packages/api/src/client.ts`),
and the R2 asset-upload Worker. Confirmed `npm run verify` (typecheck, 34
tests, both builds) passes on this branch unmodified. I did not connect to
the live Supabase project, did not run the migrations anywhere, and did not
touch Stripe/payments code — Codex is actively on that (item 5 on the
owner's list) and I didn't want two of us editing payment logic at once.

## Finding (fixed): worksheet questions could leak past course visibility

**Severity:** high — the exposed data is the worksheet's `configuration`
jsonb, which is where answer keys live (this is the same risk the demo
admin's answer-key-bundling finding flagged months ago, now at the database
layer instead of the client bundle).

**What was wrong.** `"Visible worksheet questions are readable"` in
`20261123000842_initial_production_schema.sql` only checked
`worksheets.published`:
```sql
using (exists (select 1 from public.worksheets w where w.id = worksheet_id and w.published))
```
Every sibling policy that reaches worksheet content through a lesson
(`"Visible worksheets are readable"`, `"Users create attempts in visible
worksheets"`) also checks `is_course_visible(course_id)` — whether the
course is published or the requester is enrolled. This one didn't. A
worksheet can be set `published = true` while its course is still `draft`
or `archived`, or while the requester isn't enrolled in a premium course.
Any signed-in Firebase account (the schema's own design note: Firebase
tokens without a custom role claim run as Supabase's `anon` role, so this
means any valid Firebase account, not just enrolled ones) could call
`GET /worksheet_questions?worksheet_id=eq.<uuid>` directly and get full
question content and configuration for content they have no right to see
yet — pre-launch courses, unpublished revisions, or premium-only material.

**Fix.** New migration
`20261123090000_fix_worksheet_question_visibility.sql` drops and recreates
the policy with the same join chain the other policies use:
```sql
using (exists (
  select 1 from public.worksheets w
  join public.lessons l on l.id = w.lesson_id
  join public.course_modules m on m.id = l.module_id
  where w.id = worksheet_id and w.published and public.is_course_visible(m.course_id)
))
```
This only narrows access to match what every other policy already enforces;
it adds no schema, no column, and no new capability for staff or students.

**Not yet done:** this migration is written and committed but **not applied**
to the live Supabase project. Since the demo hosts are reportedly already
pointed at it, this should be run promptly:
```
supabase db push   # or the project's usual migration-apply step
```
Please confirm who runs this and that no other in-flight migration depends
on the old policy before applying.

## Everything else read, no defect found

- **RLS design pattern** (Firebase JWTs run as Supabase's `anon` role,
  compensated by a `restrictive` issuer/audience check plus per-row
  `firebase_uid = current_firebase_uid()` policies, promoted to `anon` by the
  `DO` block in the initial migration): consistent and correctly reasoned —
  an anonymous request with no JWT, or a JWT from a different Firebase
  project, is still blocked by the restrictive policy regardless of what the
  permissive policies would otherwise allow.
- **Staff/organization helpers** (`is_staff_for_organization` →
  `is_staff_for_course` → `…_module` → `…_lesson` → `…_worksheet`,
  `SECURITY DEFINER`, moved to the non-PostgREST-exposed `private` schema):
  correctly scoped, search_path pinned, not directly callable as an RPC.
- **Staff invitations**: owner-only invite/revoke, `lower(email) = email`
  and a bounded `expires_at` enforced in the insert check, acceptance trigger
  matches on lowercased email and only inserts a membership (never elevates
  an existing one) — no privilege-escalation path I could find.
- **`payment_transactions` / `stripe_webhook_events`**: client gets `select`
  only, and only its own rows (`learner_uid = current_firebase_uid()`); no
  `insert`/`update` grant to `anon`/`authenticated`, so a browser cannot
  fabricate a `paid` status — that has to come from the (not-yet-reviewed-by-me)
  server-side webhook handler Codex owns.
- **`services/asset-worker`**: bearer-token passthrough to Supabase
  PostgREST rather than a second auth system (good — one source of truth);
  `canUpload` relies on RLS limiting the `organization_members` read to the
  caller's own row unless they're an org owner, so the "do they have an
  eligible role" check can't be spoofed by querying another org; upload size
  capped at 25 MB; filename sanitized against path traversal and control
  characters; object deleted on either metadata-write failure or missing
  profile. `ALLOWED_ORIGINS` is scoped to exactly the two demo hosts.
- **`production-auth.ts` / `packages/api/src/client.ts`**: only `VITE_`
  (public) values reach the browser bundle; Supabase client authenticates
  via a short-lived Firebase ID token fetched per-request
  (`accessToken: () => auth.currentUser?.getIdToken(false)`), not a stored
  Supabase session — consistent with the third-party-auth design.

## Still open (from `PRODUCTION_BACKEND_STATUS.md`, unchanged by me)

Firebase registered as a Supabase third-party auth provider, TypeScript DB
types, the R2 gateway (now written — see above), Stripe webhooks (Codex, in
progress), and the route-by-route migration off `@gaabe/demo-data` are all
still pending as that doc describes. I did not re-verify the "deployed to
clientdemo.techtasks.store and verified with a disposable create/read/delete
test" claim in that doc — that's Codex's claim, not mine.

## Recommendation

Apply the worksheet-questions migration before any real premium or
pre-launch course content is authored, since that's exactly the content this
gap would have exposed. Everything else reviewed here looks sound to ship
toward the rest of the owner's checklist.
