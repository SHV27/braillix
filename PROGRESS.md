# PROGRESS — Braillix v2 "The Blackboard"

Resume line: **read PROGRESS.md and continue.**

## Current state (21 Aug 2026)
Pipeline stages 0–5 complete on the v2 brief: recon (4 lanes, RESEARCH.md rewritten),
boardroom (pillars/cuts in DECISIONS.md "V2 BOARDROOM MINUTES"), architecture
(ARCHITECTURE.md rewritten, stack locked), constitution (CLAUDE.md updated),
arc plan (ARC_PLAN.md, 4 arcs).

Verified facts to trust without re-deriving:
- Old suite: 750/750 vitest green, tsc clean (run 21 Aug). Core/transport/virtual-pod SALVAGE.
- Recognition works locally in real browser (handwritten sample 2.3s; unseen stacked fraction
  correct 2.5s). v1 dead button = model gitignored + never fetched at deploy.
- Dev server: `cd app && npm run dev` → localhost:5173. Chrome DevTools MCP working.

## Workstream: Arc V2-1 (Demolition + Walking Skeleton) — BUILT, e2e re-run in progress

Done: learn/ + class/ + Practice/Class/TeachMode/PrintSheet/AddToWorksheet deleted (117 orphan
i18n keys stripped; the i18n suite enforces zero orphans). New `src/lesson.ts` (useLesson store:
lines, currentIndex, add/select/edit/remove/step; confirm gate is a TYPE — recognised lines
require literal `confirmed: true`, with @ts-expect-error tests). New LessonRail UI (blackboard
stack, amber chalk marker). BoardScreen: draft/display decoupled (box empties on commit, display
holds the line — the first real bug, caught in the real browser, fixed); Enter commits like
WhatsApp; recognise tab feeds the gate. Nav reduced to Board/Device/Help.

Verified in real browser: type → commit → line lands on rail + 9 Nemeth cells; select earlier
line works; removal keeps selection sane; zero console errors. Unit gates: 661/661, tsc 0, lint 0.
Screenshot: docs/shots/v2-arc1-skeleton.jpeg.

## ONE next action
Read e2e results (background task), fix or honestly prune failures, commit checkpoint(V2-1).

## Gate status
| Gate | Status |
|---|---|
| typecheck/lint/unit | green 661/661 (21 Aug, post-skeleton) |
| e2e + screenshots | running (pruned practice/class specs) |
| real-browser verify | skeleton journey verified by hand via Chrome MCP |
