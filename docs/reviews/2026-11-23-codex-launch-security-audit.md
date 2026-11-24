# Demo launch security audit — 23 November 2026

## Scope and decision

This audit covers the public student and admin demos, the deployed Stripe test
Worker, production dependency advisories, and Supabase security advisors. It is
an evidence-based **demo launch** assessment, not approval for a public
production launch or live payments.

## Evidence collected

| Area | Result |
| --- | --- |
| Production and development dependency audit | `npm audit --json` reports 0 vulnerabilities after updating Wrangler and overriding the affected `@grpc/grpc-js` transitive dependency. |
| Repository verification | `npm run verify` passed: worker type generation, 38 tests, student build, and admin build. |
| Supabase security advisors | No security advisories returned. |
| Student demo headers | HTTPS, HSTS, `nosniff`, DENY framing, strict referrer policy, restrictive permissions policy, COOP, and `noindex, nofollow` were verified live. |
| Admin demo headers | The same baseline headers and `noindex, nofollow` were verified live. |
| Checkout CORS | An untrusted origin received `403`; the approved student origin received CORS headers but an unauthenticated call received `401`. |
| Stripe webhook boundary | An unsigned webhook request received `400`; it was not processed. |

Both static-demo Workers were redeployed with the header configuration after
these checks. Cloudflare keeps versioned deployments, so a rollback remains
available from the Worker dashboard.

## Changes made

- Updated the build tooling and transitive gRPC dependency to clear known
  production and development audit findings.
- Added shared baseline browser-security headers to both demo apps:
  `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`, and
  `Cross-Origin-Opener-Policy`.
- Kept both demonstration domains deliberately non-indexable. They are not
  public marketing/production properties.
- Added immutable caching for versioned static assets, while retaining safe
  revalidation for HTML.

## Remaining blockers before public production launch

1. **Complete an end-to-end Stripe test.** A signed Stripe test webhook must
   create exactly one sandbox entitlement, update the learner UI, and remain
   correct for duplicate and out-of-order delivery. No live payments may be
   enabled.
2. **Add durable rate limiting and abuse controls** at the authenticated
   checkout and authentication boundaries. The present payment Worker rejects
   unauthenticated and cross-origin traffic but does not itself provide a
   durable per-user/IP limiter.
3. **Finish real authentication and authorization coverage** for all protected
   content and admin operations. Frontend state must never authorize paid or
   administrative access.
4. **Publish privacy, terms, and support/contact information** before inviting
   real learners. Analytics remains intentionally absent because the platform
   may serve minors; do not add it without an approved privacy design.
5. **Complete real-device and assistive-technology QA**, especially Android and
   iOS Thaana/RTL rendering, keyboard navigation, and a screen-reader pass.
6. **Configure operational monitoring and alerts** for Worker errors, payment
   failures, Resend bounces/complaints, and database failures. Avoid logging
   secrets or full payment/webhook payloads.
7. **Make an explicit content/SEO decision.** These demos intentionally have
   `noindex`; production needs reviewed titles, descriptions, social previews,
   sitemap/robots policy, a real 404 response, and only verified testimonials.
8. **Review a production CSP.** It requires an explicit allowlist that has been
   tested with Firebase, Stripe Checkout redirects, fonts, and the deployed
   applications. A guessed policy could break sign-in or payments, so one was
   not added blindly during this audit.

## Non-blocking observations

- Both production builds warn that a JavaScript bundle exceeds 500 KB. This is
  a performance follow-up, not a security defect; split route/vendor chunks
  before a broad public launch.
- The demos use a friendly client-side error boundary, but a formal HTTP 404
  response should be validated once the production routing policy is final.
- A controlled Resend delivery was previously confirmed by the recipient. The
  Resend event-webhook/suppression operational loop should still be deployed
  and tested before high-volume messaging.

## Conclusion

The two domains are suitable for continued private demo evaluation with the
security baseline above. They are **not yet approved for a public production
launch** or live billing. The blockers are deliberate next implementation and
operations work, not an indication that secrets were exposed or that a payment
was processed.
