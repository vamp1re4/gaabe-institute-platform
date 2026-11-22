# App flow

## Student journey

```text
Public landing → course catalogue → course detail → register/sign in
       ↓                                      ↓
  FAQ / contact                         enrolment decision
                                              ↓
                                  free access | payment pending | entitled
                                              ↓
                     dashboard → lesson → worksheet/document/presentation
                                              ↓
                              save progress → review/feedback → next lesson
```

1. Keep primary navigation short: Home, Courses, Learn, Account.
2. Course detail presents one primary action based on entitlement; additional options remain secondary.
3. Multi-step actions (enrolment, payment confirmation, worksheet submission) display the current and next step together.
4. Lesson progress is saved by the server in production; local demo storage is never the authority.

## Staff journey

```text
Sign in + MFA → dashboard → select operational area
                          ├─ students / enrolments
                          ├─ courses / lessons / documents
                          ├─ worksheets / grading
                          ├─ subscriptions / reconciliation
                          └─ publishing review → audit event
```

1. Staff dashboards surface only the highest-priority actions first.
2. High-risk actions require confirmation with connected step indicators and generate immutable audit events.
3. Publishing requires a review gate; draft, reviewed, approved, published, and archived states are explicit.
4. The admin interface remains English-only until Dhivehi administration copy is authored and reviewed; the shell can still respect locale direction.

## Email flow (Resend)

```text
domain event → notification job → template + locale → Resend API → provider event webhook → delivery audit
```

Do not send email from the client. Retries use an idempotency key; bounced/complained recipients are suppressed according to an approved policy.
