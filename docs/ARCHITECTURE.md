# Architecture

Status: front-end prototype only. There is **no backend, database, authentication, payment or file storage**. Sections marked *Proposed* are recommendations, not built.

## Repository layout

```
apps/student-web      Vite + React 19 + React Router; code-split routes
apps/admin-web        internal portal (see PR #1 / claude/admin-wip)
packages/ui           tokens, themes, SiteShell, Lang, ErrorBoundary, useStored
packages/i18n         message catalogue, translate(), I18nProvider, <T>
packages/speech       providers, PlaybackController, ReadAloudToolbar, segmenter
packages/worksheets   question model, grade.ts (pure), WorksheetPlayer
packages/demo-data    fictional content; the only place sample data lives
```

Dependency direction (no cycles): `i18n` ← `speech` ← `ui`/`worksheets` ← `demo-data` ← `apps`. Apps import packages by workspace name; packages never import apps.

## Key design decisions

1. **Plain CSS with logical properties** (`margin-inline-start`, `inset-inline-*`, `text-align: start`). RTL/LTR then needs no per-direction overrides. Only directional glyphs get `.flip-rtl`. Chosen over Tailwind for RTL precision and fewer dependencies; reversible.
2. **Language is data, not inference.** Every content block and speech segment carries an explicit `lang`. Nothing detects language from text. English content in an RTL page is wrapped in `<Lang>` (a `<bdi lang dir>`), otherwise bidi reorders punctuation.
3. **Honest Dhivehi.** Catalogue entries have `draft | reviewed | approved`; a test fails if any is `approved`. Missing keys fall back to English, tagged `lang="en" dir="ltr"`. Default locale is English until review raises coverage (currently 21/166 drafts).
4. **Speech routing** (`resolveProvider`): teacher recording → language provider. Dhivehi provider always reports unavailable; Arabic plays only approved recitation audio; browser synthesis is English-only. A segment that cannot play halts the queue with its real reason; it is never skipped or voiced by another language.
5. **One narration at a time.** `PlaybackController` is a singleton; starting a queue stops the previous one. UI subscribes via `useSyncExternalStore`.
6. **Grading is a pure function** (`gradeWorksheet(ws, answers)`), so it can move server-side unchanged. The browser copy is demo-only because the answer key is in the bundle.
7. **Demo state** (`useStored`) wraps localStorage with an in-memory fallback. It is explicitly non-secure and per-browser.
8. **Controls render once.** `SiteShell` puts language/theme/auth in the header on wide screens and in the menu on narrow ones, so there is a single instance (avoids desynchronised theme state and mobile overflow).

## Data flow (current)

`demo-data` → pages → components. User actions write to localStorage (`gaabe.demo.*`, `gaabe.worksheet.*`, `gaabe.locale`, `gaabe.theme`). Nothing leaves the browser.

## Security posture

Current app handles no real data. Hard rules before any deployment: no public deploy, no live payments, no real student data, admin must not ship without server-side auth. Demo "sign-in" discards the password; "subscription" is a local flag and must never be trusted for access.

## Proposed backend (not built — needs owner approval and a design note)

- Auth with roles (student, guardian, teacher, admin); guardian flow for under-18 students.
- Entitlements checked server-side per lesson, media, document page and audio segment; short-lived signed URLs; private object storage.
- Server-authoritative grading and exam timing; answer keys never sent to clients.
- Payments: provider webhook state machine with idempotency; manual bank-transfer review stays *pending* until staff verify.
- Document pipeline: type/size validation, malware scan, originals private, async conversion, language metadata preserved.
- Audit log for staff actions; content versioning with a publish gate requiring named human review of religious and Dhivehi content.
- Strict isolation from other Tech.Tasks projects: separate repo, database, secrets, domain and deployment.

## Known architectural debts

See `docs/IMPLEMENTATION_STATUS.md` (Known bugs). Highest priority: server-side grading, per-user progress storage, component-level tests, an accessibility audit.
