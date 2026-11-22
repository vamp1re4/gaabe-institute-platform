# Claude notes on the new product/design direction

Source: the owner's instruction to Codex (seen as screenshots, 2026-11-22 ~18:44). Codex is writing the PRD/TRD/flow/UX/schema/plan docs on its own branch; these notes are *inputs and review criteria*, not a competing spec.

## What was asked (as I read it)

Subdomains of the owner's domain for a client demo and an admin demo · Admin = liquid-glass/glassmorphism · Client = frosted-glass, minimalist, spatial UI · fewer, more professional words · Lenis + GSAP · docs: PRD, TRD, App flow, UI/UX brief, Backend schema, Implementation plans · attached palette (Cobalt Noir: `#B7C1CC` `#315BCE` `#17264F` `#111318`) · Resend for email · "six UX laws" (closure, figure-ground, banner blindness, Parkinson's, connectedness, choice overload) · two checklists (polish details; pre-launch).

## Decisions only the owner can make

1. **Palette.** The original brief required an emerald/gold/ivory system; Cobalt Noir is blue. Does it replace emerald/gold for both apps, or only the demos? (Changes brand identity for a faith-based school; worth an explicit yes.)
2. **Hostnames.** The message spells the domain two ways (`techtasks.store` vs `tasktasks.store`). Codex already spotted this. Confirm the real one.
3. **Deployment.** The original brief says no public deploy without explicit approval. "You can use the subdomains" reads as permission to *use the names*, not to deploy. I am treating it as **not yet approved** until you say "deploy the demo". Nothing has been deployed or pointed at DNS by me.
4. **Analytics / UTM / Google Analytics** (from the checklist). Learners may be minors. Recommend: none inside learner or admin areas; marketing pages only, with a privacy policy and consent. A cookie banner is only needed if non-essential cookies exist (today the app uses only localStorage for preferences).

## Acceptance criteria for the visual direction

**Glass UI vs. legibility.** Glass is decorative; reading text is the product.
- Body text contrast ≥ 4.5:1 against the *worst-case* backdrop (measure over the busiest background, light and dark), not the CSS colour alone.
- Reading surfaces (lessons, worksheets, exams, forms) stay near-opaque; glass limited to chrome (nav, cards' edges, overlays).
- `@supports not (backdrop-filter)` and `prefers-reduced-transparency` fall back to solid surfaces.
- Re-run `scripts/axe-check.cjs` (color-contrast included) on every restyled route.

**Lenis + GSAP.**
- Honour `prefers-reduced-motion`: Lenis off (no scroll-jacking), GSAP timelines skipped or instant.
- Keep native keyboard scrolling, anchor links, find-in-page and focus visibility working; test in RTL.
- Load GSAP/Lenis only where used (not on worksheets/exams); check bundle growth and a throttled-CPU mobile run, since many learners will be on mid-range phones.

**Honesty vs. "remove unnecessary text".** Cut repetition, not truthfulness. Keep one compact persistent *demo* marker, the "no payment is taken" checkout statement, the "demo sign-in stores nothing" statement, and the Dhivehi/Arabic speech-unavailable messages. My current full-width gold banner is also the kind of strip users learn to ignore (banner blindness); a small persistent badge near the logo plus contextual inline labels is better.

**Resend.** Server-side only; API key never in the client bundle or repo; domain needs SPF/DKIM DNS records the owner must add; transactional mail only; rate-limit sends; never place user input in headers or unescaped HTML.

**Isolation (original brief).** Host-scoped cookies only (no `Domain=.parent-domain`), exact-origin CORS allowlist, separate Resend domain/key, separate database and secrets from every other Tech.Tasks app.

## Six laws → checks in this app

| Law | Concrete check |
| --- | --- |
| Closure | course/lesson rails show a partial next card; progress rings show remaining work |
| Figure–ground | dialogs dim and inert the page behind them (replace `window.confirm` with an accessible dialog) |
| Banner blindness | important notices look like content (inline, near the action), not like ads |
| Parkinson's | prefill known data; sign-in remembers email; worksheets resume where left |
| Connectedness | checkout, registration and exam flows show steps as one connected path |
| Choice overload | ≤3 plans, filters collapsed by default, one primary action per screen |

Caution: the specific percentages in the source post (e.g. "0% vs 32%") are from a social-media video I could not verify. Use the laws as heuristics, not as cited evidence in the PRD.

## Checklist triage for *this* project

Already present: skip link, sticky header, dark mode, mobile menu, custom 404, hover/focus states, form validation states.
Gaps I know of: **unique `<title>` per route** (single static title today), meta descriptions/OG image, replace `window.confirm`, password visibility toggle, FAQ, last-updated date, print stylesheet, privacy policy (required before any launch), per-route `robots` (admin `noindex`).
Backend-only (not built): access control, expiring reset links, input sanitisation, rate limits, CORS, DB indexes, logs/alerts, rollback.
Do not add: fabricated testimonials or reviews (none exist; keep it that way), third-party trackers in learner areas.
