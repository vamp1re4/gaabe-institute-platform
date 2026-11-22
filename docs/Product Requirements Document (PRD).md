# Product Requirements Document (PRD)

## Product

Gaabe Institute is a Dhivehi-first Islamic education platform for students and authorised staff. It provides protected courses, interactive assessments, guided study materials, and bilingual reading support.

## Demonstration routes

Proposed routes, subject to domain-owner/DNS confirmation:

- Student demonstration: `clientdemo.techtasks.store`
- Staff demonstration: `admindemo.techtasks.store`

The requested `clientdemo.tasktasks.store` has an apparent spelling difference from the stated parent domain `techtasks.store`; no DNS record or deployment is authorised by this document.

## Audiences and outcomes

| Audience | Outcome |
| --- | --- |
| Student | Discover courses, enrol, learn, complete worksheets, and resume safely. |
| Guardian | Understand enrolment and receive approved, privacy-safe updates. |
| Teacher | Create and review lessons, assessments, documents, and narration. |
| Staff | Manage students, access, payments, publishing, and support with auditability. |

## Functional requirements

1. The public/student experience supports English and Dhivehi with genuine RTL rendering. Unreviewed Dhivehi is labelled and must not be represented as approved.
2. Premium access, document delivery, audio delivery, worksheet submissions, grades, and payment states are enforced by the backend—not browser state.
3. Students can resume learning, work through accessible in-browser worksheets, and use Read Aloud where a verified provider/recording exists.
4. Staff can author, review, publish, unpublish, and audit content. Publishing requires explicit review state for sensitive educational and religious content.
5. Email notifications use Resend only through server-side jobs. No Resend API key is exposed to a browser.
6. The student demo has a frosted-glass, minimal spatial visual language. The admin demo uses restrained liquid-glass layering and higher information density.

## Quality requirements

- WCAG 2.2 AA target; keyboard-first flows; touch targets at least 44px where practical.
- No autoplay audio, deceptive download controls, real testimonials without approval, or invented teacher credentials.
- Public routes have unique titles/descriptions, meaningful heading order, explicit loading/error/empty states, and real or clearly labelled demo content.
- Admin routes are `noindex` and require deployment-level `X-Robots-Tag: noindex` plus authentication before production use.

## UX laws applied

The following are product heuristics supplied by the owner, not validated conversion claims for this product:

1. **Closure:** show the next course card partially on compact carousels only when swipe affordance is clear.
2. **Figure-ground:** dim background content behind dialogs; retain a minimum 4.5:1 text contrast in the active layer.
3. **Banner blindness:** reserve banner styles for non-actionable demo/legal notices; actions use clear controls near their context.
4. **Parkinson's law:** prefill known, consented profile details and never ask again for information already stored.
5. **Connectedness:** visually join sequential enrolment, checkout, submission, and publishing steps.
6. **Choice overload:** present a short recommended set first; reveal additional filters/options on demand.

## Out of scope for the demo

Live payments, real student data, production Dhivehi TTS, voice cloning, deployed email, DNS changes, and production document conversion are not implemented until separate approval and credentials are supplied.
