# UI/UX design brief

## Direction

The platform should feel calm, scholarly, contemporary, and trustworthy—not decorative or generic. Avoid neon gradients, excessive blur, oversized headings, and motion that competes with study.

## Palette: Cobalt Noir

| Token | Hex | Use |
| --- | --- | --- |
| Mist | `#B7C1CC` | restrained text, frosted border, muted surfaces |
| Cobalt | `#315BCE` | primary action and focus accents |
| Midnight | `#17264F` | depth, navigation, admin layers |
| Noir | `#111318` | dark canvas and high-contrast text context |

Contrast must be measured for every foreground/background pair; glass opacity is adjusted for readability, not aesthetic consistency alone.

## Student demo — frosted glass / spatial minimalism

- Airy reading canvas, one principal task per screen, generous but not wasteful spacing.
- Frosted panels use a subtle translucent fill, fine border, and soft depth—not large opaque cards.
- Course continuity uses small spatial transitions and a partial next-card cue only for horizontal browsing.
- Persistent progress, playback, and key actions stay near the learning material.

## Admin demo — liquid glass

- Dark Cobalt Noir base with restrained transparent panels, layered elevation, and crisp data typography.
- High density is acceptable only when hierarchy, filters, and row actions are explicit.
- Glass never obscures tables, form controls, status badges, or destructive-action warnings.

## Interaction standards

- Lenis is enhancement-only; respect reduced motion and preserve native scroll semantics.
- GSAP animations use short, interruptible transforms/opacity changes. No animation is required to read, navigate, submit, or recover from an error.
- Include dark mode, keyboard-visible focus, skip link, mobile navigation, loading/error/empty states, back-to-top only after meaningful scroll depth, and a compact consent banner only if analytics/cookies are actually added.
- Do not add site search, analytics, cookie consent, UTM processing, or marketing claims until the corresponding backend/privacy work is approved.

## Content discipline

Use clear labels, brief supporting copy, and one action per decision point. Remove prototype disclaimers from repetitive card content; use one contextual, honest notice instead. Preserve substantive limitations around security, payments, translations, and narration.
