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

## Workstream: Arc V2-1 (Demolition + Walking Skeleton) — NOT STARTED

## ONE next action
Start Arc V2-1: delete src/learn + src/class + Practice/Class screens, get suite green again.

## Gate status
| Gate | Status |
|---|---|
| typecheck/lint/test | green (pre-demolition baseline) |
| e2e + screenshots | not re-run since v2 pivot |
| real-browser verify | recognition path verified only |
