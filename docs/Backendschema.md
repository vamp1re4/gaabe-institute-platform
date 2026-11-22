# Backend schema

Status: proposed relational model; no database has been provisioned.

## Identity and authorisation

| Table | Key fields |
| --- | --- |
| `organizations` | `id`, `name`, `status`, timestamps |
| `users` | `id`, `organization_id`, `email`, `email_verified_at`, `status` |
| `profiles` | `user_id`, display name, locale, guardian relationship fields |
| `roles`, `permissions`, `role_permissions`, `user_roles` | granular RBAC assignments |
| `sessions` | hashed token reference, device metadata, expiry, revoked timestamp |
| `audit_events` | actor, action, target type/id, trace id, redacted metadata, timestamp |

## Learning

| Table | Key fields |
| --- | --- |
| `courses`, `course_translations` | owner, lifecycle status, bilingual metadata |
| `modules`, `lessons`, `lesson_translations` | order, publication state, review state |
| `enrollments`, `learning_progress` | student/course relation, entitlement basis, progress checkpoint |
| `worksheets`, `worksheet_versions`, `questions`, `question_options` | immutable published versions; answer keys are protected server data |
| `assignments`, `attempts`, `responses`, `grades`, `feedback` | server attempt id, timing, grading/release state |

## Content and narration

| Table | Key fields |
| --- | --- |
| `content_assets` | private object key, MIME, checksum, scan status, owner |
| `document_jobs`, `document_pages`, `narration_segments` | processing status, extraction confidence, language, reviewer approval |
| `teacher_recordings`, `quranic_recordings` | provenance, licence/attribution, replacement priority |

## Commerce and communication

| Table | Key fields |
| --- | --- |
| `plans`, `subscriptions`, `entitlements` | access interval, state, source, revocation |
| `payment_transactions`, `invoices`, `refunds` | provider reference, verified amount/currency, idempotency key |
| `notification_jobs`, `notification_deliveries` | template, locale, Resend message id, state, retry count |

## Constraints and indexes

- Unique normalized email per organisation; foreign keys on every ownership relation.
- Composite indexes for course publication, enrollment lookup, entitlement validity, attempt/student lookup, payment provider id, and audit target lookup.
- Published worksheet versions immutable; edits create a new version.
- Sensitive keys, tokens, payment payloads, and answers are encrypted/hashed or stored outside normal application logs as appropriate.
- Production migrations define retention/deletion rules and transactional boundaries for entitlement creation, payment verification, and grade release.
