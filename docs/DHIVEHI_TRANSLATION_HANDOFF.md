# Dhivehi translation handoff

## How to return translations

Return a UTF-8 `.txt` or `.docx` file. Keep every message key exactly as
written and replace only the English value. Preserve placeholders such as
`{name}`, `{n}`, `{total}`, `{answered}`, `{score}`, and `{max}` exactly.
Do not translate URLs, e-mail addresses, IDs, code, numbers used as answers,
or the brand name **Gaabe Institute** unless the owner supplies an approved
Dhivehi brand form.

Example:

```text
nav.home = ހޯމް
worksheet.question = {n} ވަނަ ސުވާލު {total} ސުވާލުގެ ތެރެއިން
```

## Required: student-facing interface

Translate **every value** in the `en` object in
[`packages/i18n/src/messages.ts`](../packages/i18n/src/messages.ts). This is
the complete source for the reusable student-interface text, including:

- header and menu labels;
- buttons, form labels, filters and validation-visible interface labels;
- error, empty and confirmation states;
- course, worksheet, lesson, pricing, dashboard and authentication UI;
- Read Aloud controls and honest availability messages;
- demonstration-data, privacy and capability notices.

The existing `dv` object in that same file is only an **unreviewed partial
draft**. Replace it with reviewed translations for all English keys; do not
mark a translation approved until it has been checked by a fluent reviewer.

## Required: admin interface currently outside the catalogue

Translate the following strings from
[`apps/admin-web/src/App.tsx`](../apps/admin-web/src/App.tsx). These must be
moved into the shared catalogue during implementation.

```text
Administration screens are English-only for now. Dhivehi admin text has not been written or reviewed.
Demonstration overview
Sample students
Fictional records
Published courses
sample lessons
Teacher-graded prompts
Demo worksheet items
Production readiness
What this demonstration can and cannot do is deliberately visible to staff.
Course, worksheet, and document records below are fictional browser data.
There is no real staff login, role check, audit log, file upload, payment verification, or publishing API.
Do not use this screen to handle student records, payment evidence, or original learning materials.
Search sample students
Fictional learner records for the administration demonstration
Name
Course
Unknown sample course
No sample student matches that search.
Show unpublished sample courses
published
draft
modules
lessons
Edit (not connected)
Editing needs a server-backed, authorised content API.
Question authoring, answer keys, version publishing, and grading must be server-authorized. This list is read-only demo data.
Fictional worksheets in the administration demonstration
Worksheet
Questions
Review state
Demo only
Secure document processing
No source document is uploaded through this prototype. A production pipeline must validate file type and size, malware-scan, store originals privately, queue conversion, preserve language metadata, and authorize every rendered page and audio segment.
Upload document (not connected)
Uploading needs private storage and server-side file validation.
Read Aloud review
English browser speech is a browser capability; Dhivehi speech remains unavailable until a verified provider and native-speaker review are complete. Quranic Arabic must use approved recordings, not generic synthesis.
Payment and entitlement decisions are not implemented. Never grant paid access from browser state or this demonstration screen.
Required production controls
Server-verified payment state machine with idempotency and audit events.
Manual-transfer review that remains pending until authorized staff verify evidence.
Short-lived, entitlement-checked access for premium lessons, media, documents, and audio.
```

## Required: remaining hard-coded client labels and metadata

Translate these source locations as well:

- [`apps/student-web/src/App.tsx`](../apps/student-web/src/App.tsx): all page
  titles and descriptions in `PAGE_META` and `pageMeta` (browser title and
  search/share description text).
- [`apps/student-web/src/pages/Documents.tsx`](../apps/student-web/src/pages/Documents.tsx):
  `PDF`, `Sample PDF`, and `Open PDF in a new tab`.
- [`apps/student-web/src/pages/Lesson.tsx`](../apps/student-web/src/pages/Lesson.tsx):
  `unverified` and `Lesson navigation`.
- [`packages/ui/src/components.tsx`](../packages/ui/src/components.tsx): the
  theme state words `light`, `dark`, and `system`, plus navigation labels
  `Primary` and `Mobile` used by assistive technology.

## Content translation: optional until real course material exists

The following is fictional placeholder content—not approved Gaabe Institute
teaching material. Translate it only if the demo must be fully Dhivehi before
real content is loaded:

- all visible strings in
  [`packages/demo-data/src/index.ts`](../packages/demo-data/src/index.ts):
  sample course/module/lesson names, summaries, lesson paragraphs, worksheet
  prompts/options/explanations, revision checklist, presentation slides,
  document sample, plans/features and fictional learner names;
- generated PDF wording in
  [`packages/demo-data/src/demoPdf.ts`](../packages/demo-data/src/demoPdf.ts).

Do **not** translate or publish answer-key-only values as content (for example
worksheet `correct`, `accepted`, `pairs`, and `order` fields). If a question is
translated, its options and answer-key matching values must be updated together
by engineering and re-tested.
