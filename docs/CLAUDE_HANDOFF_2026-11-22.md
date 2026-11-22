# Claude → Codex handoff — 2026-11-22 (post-offline re-verification)

**Branch reviewed:** `claude/initial-platform` @ `4d9a8c4` (was `7c917ec` when Codex's
`CODEX_HANDOFF_AFTER_CLAUDE_OFFLINE.md` was written; I have since fast-forwarded
through your merged PRs #1–#4 and pushed two commits of my own on top: `9d2a932`,
`4d9a8c4`).
**Owner approval rule unchanged:** `main` untouched. No production release, DNS
change, Resend key, or live email approved by me in this session.

## What I did this session

1. Read your `CODEX_HANDOFF_AFTER_CLAUDE_OFFLINE.md` in full. I have **not**
   independently re-verified most of what it claims (the Worker probe results,
   the Resend/Cloudflare table, PR #1–#4 content) — I'm treating those as your
   claims until I check them myself. What I *did* re-verify this session is
   listed below.
2. Reviewed Animate UI / Skiper UI / Vengeance UI as design references at the
   owner's request. Wrote `docs/reviews/2026-11-22-claude-ui-inspiration-review.md`
   (pushed at `9d2a932`). Recommendation: don't install them (Tailwind +
   Framer Motion stack mismatch, RTL risk, phone-performance risk); borrow a
   short list of patterns and rebuild in our own CSS/GSAP. See that doc for
   the full list and the do/don't split.
3. Ran a full verification pass on the merged branch:
   - `npm ci` — clean
   - `npm run typecheck` — clean
   - `npx vitest run` — **5 files, 34 tests pass**
   - `npm run build` (student + admin) — both pass
   - `npm audit` — 6 findings, all in `wrangler`/`miniflare`'s dev-only
     dependency tree (`esbuild`, `sharp`, `undici`, `ws`); `npm audit --omit=dev`
     is clean. Not a runtime/production concern as shipped.
4. Reviewed your open PR #5 (`codex/email-deployment-parity`, `f8e91ec`) by
   diff only (3 files, `+37/-4`): `workers_dev: false → true` with a comment,
   an `AI_COLLABORATION.md` log entry, and a README section documenting the
   demo-deployment boundary and required production rotation. Diff is
   small, matches what the log entry says, and doesn't touch secrets. **I have
   not merged it** — it needs the owner's go-ahead like anything touching the
   email Worker's deployment surface, per the handoff doc's own flag ("must
   not be merged automatically").
5. Ran an accessibility sweep your handoff didn't cover: axe-core 4.14.1
   across **light and dark color scheme × English and Dhivehi locale**, not
   just light/English, on both apps' preview builds.
   - **Admin app** (`/`, `/students`, `/courses`, `/worksheets`, `/content`,
     `/subscriptions` × 2 schemes × 2 locales = 24 loads): **0 violations.**
     Some `color-contrast` "incomplete" flags (axe can't auto-resolve them,
     usually because of the gradient/blur backgrounds on `.glass-liquid`) —
     not confirmed failures, but worth a manual check before you consider the
     liquid-glass surfaces fully clear. Counts: `/` 16, `/courses` 19,
     `/content` 8, `/subscriptions` 6, `/students` 3, `/worksheets` 2 per
     scheme.
   - **Student app:** found and fixed a real bug — see below.

## Bug found and fixed: dark-mode contrast on `.glass-frosted` cards

**What:** `--glass-frost` (`rgb(255 255 255 / 0.62)`) and `--glass-border`
were defined once in `:root` and never overridden inside the
`prefers-color-scheme: dark` block you added in `codex/product-polish`
(merged as PR #2). In dark mode, `.glass-frosted` therefore composited a
light backdrop (axe measured the effective background as `#909193`) under
dark-theme text colors (`#f5f7fb` title, `#b7c1cc` meta).

**Evidence:** axe-core reported 14 `color-contrast` violations on the student
home page in dark mode only (light mode and admin were clean): course card
titles at 2.94:1 and meta text at 1.72:1, both against the 4.5:1 requirement.
Confirmed with a direct `getComputedStyle` probe (`background-color:
color(srgb 1 1 1 / 0.53)` under the dark card) before writing the fix.

**Fix (`packages/ui/src/styles.css`, 2 lines added inside the existing dark
media block):**
```css
--glass-frost: rgb(23 38 79 / 0.62);
--glass-border: rgb(59 77 117 / 0.6);
```
These reuse the existing `--cobalt-900`/`--border`-family colors rather than
inventing new hex values, so the frosted look stays dark-navy-tinted instead
of switching to a light fog in dark mode.

**Re-tested after the fix:** same 5 student routes × light/dark × en/dv
(20 loads) — **0 violations.** Full re-run of all 13 student routes is still
worth doing; I only re-scanned the routes that showed the failure plus a
sample of others for regression.

**Commit:** `4d9a8c4` on `claude/initial-platform`, pushed. Full rationale,
test list and known risk are in the commit message — please read it before
touching `.glass-frosted`/`.glass-liquid` again, since the two-line change is
small but the reasoning behind the exact color choice matters (I picked
colors to preserve the "frosted over dark surface" visual intent, not to hit
one specific contrast number — recheck if you tune these further).

**What I didn't do:** I didn't touch `.glass-liquid` (admin) even though its
`color-contrast` "incomplete" count is the largest of any page (`/courses`
19) — those are axe's "can't be sure" bucket, not confirmed failures, and I
ran out of session time to do the manual check (sampling text colors against
the actual rendered gradient background by hand, at a few scroll positions,
in both themes). Flagging this as the top open item below.

## Branch/PR state (current, from my own `git fetch`)

| Branch / PR | State | Action |
| --- | --- | --- |
| `main` | unchanged | no action |
| `claude/initial-platform` | `4d9a8c4`, includes your PR #1–#4 merges plus my two pushes | current integration target |
| PR #5 / `codex/email-deployment-parity` | open, reviewed by diff, not merged | needs owner approval before merge (per your own note) |
| `claude/admin-wip` | unmerged, incomplete | still do not merge |
| `integration/resend-demo-email` | unmerged, superseded | still do not merge |

## Open items for you

1. **Manual contrast check on `.glass-liquid` (admin).** Sample actual
   rendered text/background pairs on `/courses` and `/` in both color
   schemes — axe flagged these as "incomplete," not failing, but that's the
   same pattern that turned out to be a real bug on the student side.
2. **PR #5** — small, well-documented, I see no defect in the diff; merge
   decision is the owner's, not a technical blocker from me.
3. From my design-reference review doc (`2026-11-22-claude-ui-inspiration-review.md`):
   a proposed build order (mobile glass dock → FAQ accordion → sliding-indicator
   lesson tabs → admin command palette/accessible confirm dialog → optional
   dashboard count-up). None of this is started; all of it needs the owner's
   sign-off on scope before you pick it up, and the FAQ needs the owner's own
   wording, not invented copy.
4. Everything your own handoff listed as pending (PR #5 merge decision, the
   one controlled email test, Phase 3 backend design, production blockers) is
   still pending — I have not advanced any of it.

## Non-claims

I did not deploy anything, change DNS, touch Resend/Cloudflare credentials,
or send any email this session. I did not merge PR #5, `claude/admin-wip`, or
`integration/resend-demo-email`. The only code change I made is the two-line
CSS fix above, pushed to `claude/initial-platform`, not `main`.
