# UI/UX inspiration review: Animate UI, Skiper UI, Vengeance UI

Requested by the owner after reading `CODEX_HANDOFF_AFTER_CLAUDE_OFFLINE.md`. Reviewer: Claude, 2026-11-22.

**Method and limits.** Desk research from public library pages only. I did not install anything or run any component in this repo. "Animated Labs" matched no single library in search; the closest result was **Animate UI**, so I reviewed that. If you meant a different site, send the link. Licences are not stated on the pages I read; check each GitHub repo before copying code.

## What the three libraries are

| Library | Stack | Delivery |
| --- | --- | --- |
| Animate UI | React, Tailwind, Motion | shadcn registry, source copied into the project |
| Skiper UI | React, Tailwind, Framer Motion, clsx, tailwind-merge | copy and paste |
| Vengeance UI (78 components) | Next.js, Tailwind 4, Radix, Framer Motion; some use GSAP, Three.js or WebGL | shadcn registry |

## Fit problem

Our apps are Vite + React with plain CSS (logical properties) and GSAP + Lenis. All three libraries assume Tailwind plus Framer Motion. Adopting them wholesale would add Tailwind, a second animation engine and a `cn()` layer to two apps, and physical-direction utilities (`ml-*`, `left-*`, `translate-x-*`) would break Dhivehi RTL. Heavy items (Three.js, WebGL backgrounds) also hurt mid-range phones.

**Recommendation: do not install any of them. Use them as pattern references and rebuild the few worth having in our CSS/GSAP with logical properties.** This needs no architecture change.

## Patterns worth borrowing

Student app (frosted, minimal, spatial):
1. **Glass dock / notch navigation** (Vengeance "Glass Dock", "Notch Navbar") for the mobile bottom bar: Home, Courses, Worksheets, Dashboard. Fixes thumb reach and is a clear connectedness cue.
2. **Animated tabs with a sliding indicator** (Animate UI tabs) for lesson sections (Slides, Document, Worksheet). Indicator must follow `inset-inline-start`, not `left`.
3. **Count-up stats** (Vengeance "Stats Counter") only on the dashboard progress summary, once, and instant under reduced motion.
4. **FAQ accordion** on Pricing and Home. We have no FAQ yet (listed gap). Use native `<details>` with a height transition.
5. **Soft hover lift on course cards.** One consistent effect, not on every element.

Admin app (liquid glass):
6. **Liquid button** for the single primary action per screen only.
7. **Command palette / search modal** for jumping between students, courses and worksheets. Also replaces `window.confirm` if the dialog is built to be modal and inert, which was an open gap.

## Patterns to skip

- Aurora, wave-grid and liquid-ocean backgrounds: decoration behind reading surfaces, and they fight the contrast rule (4.5:1 over worst-case backdrop).
- Interactive book, circular gallery, music player, marquees, logo sliders: no content to justify them, and a logo slider would imply customers we do not have.
- Testimonials card: **no fabricated testimonials**. Do not add this.
- Kinetic text loader and flip/morph text on Dhivehi: letter-splitting animations break Thaana joining and reading order.
- Anything WebGL or Three.js.

## Requirements for any new motion or glass

- Honour `prefers-reduced-motion` and `prefers-reduced-transparency`; keep the existing `data-motion` switch.
- Logical properties only. Test every pattern in `dv` (RTL) and `en`.
- Keyboard and focus first: dock and tabs need roles, arrow-key behaviour and visible focus.
- Reading surfaces (lessons, worksheets, exams) stay near-opaque. Glass is chrome only.
- No new runtime dependency without owner approval. Lenis and GSAP stay the only motion libraries.
- Re-run `scripts/smoke-student.cjs` and `scripts/axe-check.cjs` (light and dark) on each restyled route.

## Proposed order of work (Codex implements, Claude reviews)

1. Mobile glass dock for the student app.
2. FAQ accordion + unique FAQ content written by the owner (no invented religious content).
3. Sliding-indicator tabs in the lesson viewer.
4. Admin command palette and accessible confirm dialog.
5. Dashboard count-up (optional, lowest value).

## Status of the Codex handoff (read, not re-verified)

I read the handoff only. I have not re-run the tests, builds or any deployment probe it reports; treat those numbers as Codex's claims until I do. Nothing in it needs action from me except: PR #5 (`workers_dev: true`, one-line config) is open for review, and the controlled email test and any deployment still need your explicit approval. My earlier review of `codex/product-polish` (contrast in dark mode on frosted cards, backdrop-filter fallback, token naming) was superseded by Codex's merge of PR #2; I have not yet re-checked those points on the merged branch.
