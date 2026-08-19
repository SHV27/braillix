# PROGRESS — Braillix (software)

**Resume line: “read PROGRESS.md and continue.”**

---

## Where we are

**Arc 1 — Walking Skeleton + verification chassis.** In progress.

Pipeline stages 0–5 are complete and written down:
`RESEARCH.md` → `DECISIONS.md` (boardroom minutes) → `ARCHITECTURE.md` (stack locked) →
`CLAUDE.md` (project constitution) → `ARC_PLAN.md` (6 arcs, frozen acceptance lists).

## The one next action

Finish Arc 1: get `npm run verify` green end-to-end (lint + typecheck + unit + Playwright e2e),
then create the private GitHub repo and make the first real commit.

## Done so far

- **Recon** — proved on this laptop, before promising anything:
  - LaTeX → Nemeth braille works offline in pure JS (`temml` + `speech-rule-engine`).
  - Handwritten-maths OCR works offline in pure JS (`@huggingface/transformers` + FormulaNet ONNX,
    0.7 s per formula).
  - Therefore **no backend, no Python** — the whole product is a static web app.
  - Bonus: SRE also speaks maths in **Hindi**, offline, at no extra cost.
- **Core engine** (`app/src/core/`) — all pure, all tested:
  - `braille.ts` dot masks ↔ Unicode ↔ dot lists
  - `profile.ts` the single authority for cell count and cam bit order
  - `sre-service.ts` serialised owner of SRE's global engine state, pinned to local locale files
  - `translate.ts` LaTeX → MathML → Nemeth cells, never throws
  - `frame.ts` windowing/paging for any cell count
  - `scheduler.ts` motion-minimising refresh (frame diff + shortest-arc cam rotation)
  - `nemeth-meanings.ts` the 64-pattern meaning table, cross-checked against the engine
- **UI** — Read screen (type → dots, live), Cell Atlas (all 64 cam positions), status strip with
  honest capability badges, "machined instrument" art direction with physically-modelled dots.
- **Tests** — 149 unit tests passing, including 10 golden Nemeth expressions, all 26 letters and
  10 digits verified against the engine, and structural invariants that fail the build if anyone
  hardcodes a cell count or does hardware bit arithmetic outside `profile.ts`.

## Gate status

| Gate | State |
|---|---|
| `typecheck` | green |
| `test` (Vitest) | green — 149 passing |
| `lint` | fixing one dead assignment → re-running |
| `e2e` (Playwright) | written, browser installing |
| build | running |

## Notes for whoever picks this up cold

- Read `CLAUDE.md` first, then `ARC_PLAN.md`. Acceptance lists are frozen; new ideas go to
  `NOTES.md` unbuilt.
- The Bash tool's heredoc eats backslashes — write any file containing LaTeX with the Write tool.
- `npm install` at the repo root installs the workspace and copies SRE locale data + ONNX Runtime
  wasm into `app/public/`. Without that copy the app would reach for a CDN, which breaks the
  offline promise.
