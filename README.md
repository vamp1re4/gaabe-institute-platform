# Gaabe Institute Platform

Bilingual (Dhivehi / English) Islamic education platform for Gaabe Sir: student web app, admin web app, and shared packages.

**Repository:** `vamp1re4/gaabe-institute-platform` (private)
**Commissioned through:** Tech.Tasks Maldives — this project is **isolated** from every other Tech.Tasks project (techtasks.store, AXIS, EVA, UNIX, …). Never reuse their secrets, databases, domains or deployments.

## Team

| Role | Assistant |
| --- | --- |
| Lead architect, UI/UX, security review, QA | Claude |
| Lead implementation, full-stack, tests, deployment config | OpenAI Codex |

Coordination lives in `docs/AI_COLLABORATION.md`. Codex: start with `docs/CODEX_HANDOFF.md` once it exists on the `claude/initial-platform` branch.

## Branches

- `main` — protected baseline. **Do not merge without project-owner approval.**
- `claude/initial-platform` — Claude's foundation work (draft PR into `main`).

## Layout

```
apps/student-web   public site + learning portal (Vite + React + TypeScript)
apps/admin-web     internal administration portal
packages/ui        design tokens (emerald / gold / ivory), themes, fonts, components
packages/i18n      dv/en catalogue with review status, RTL/LTR provider
packages/speech    Read Aloud provider abstraction + shared playback controller
packages/worksheets  question model, grading logic, renderer
packages/demo-data clearly-labelled fictional demonstration data
docs/              architecture, status, collaboration, handoff
```

## Commands

```bash
npm install
npm run dev:student   # http://localhost:5173
npm run dev:admin     # http://localhost:5174
npm run typecheck
npm test
npm run build
```

## Honest status

Work in progress. Nothing here is deployed. No backend, real authentication, payments or verified Dhivehi speech exist yet. Dhivehi UI strings are **unreviewed drafts**. See `docs/IMPLEMENTATION_STATUS.md` (on the feature branch) for the current truth.
