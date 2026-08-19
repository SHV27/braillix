# CLAUDE.md — BRAILLIX (software)

Project-local constitution. Overrides any inherited `CLAUDE.md` from a parent folder (that one
belongs to a different project — see `DECISIONS.md` D0.3).

## THE PRODUCT

A refreshable braille display for **mathematics**, for students at Indian schools for the blind.
This repo is the **software half**: everything from "here is a maths expression" through to "the
right dots are raised on the right cells" — plus the app around it.

**THE DESIGN LAW (binding):**
> The software must be complete and genuinely working with **nothing plugged in**. Hardware is an
> output it can drive, never a dependency it needs. Any commit that makes the app require hardware,
> a server, a network, or an API key to do its core job is a defect.

**Taste bar:** an instrument, not a student project. Nothing on screen should invite the criticism
"this looks like a college demo".

## THE SEVEN LAWS

1. **THE CELL COUNT IS DISCOVERED, NEVER KNOWN.** No literal cell count in any layer, ever —
   including laptop-only code. It comes from `useDisplayProfile()` or it doesn't exist.
2. **STANDARDS ABOVE, CONFIGURATION BELOW.** Dot patterns follow Nemeth and are tested against
   published tables. Anything physical — cam bit order, cell direction, home position — is runtime
   config with a calibration screen. Never a constant.
3. **OBSERVABLE DEGRADATION.** Every optional capability (recognition, speech, USB, pod, network)
   publishes `{state, reason, fix}` and renders a badge. A silent fallback is a bug.
4. **THE PREVIOUS FRAME IS SACRED.** Errors never blank the display. Hold the last good frame and
   say what went wrong.
5. **ONE AUTHORITY PER FACT.** Cell profile, frame rendering, SRE engine state, capability state —
   each has exactly one owner (see `ARCHITECTURE.md`). A second computation is a fork of its bugs.
6. **ACCESSIBLE OR IT DOESN'T SHIP.** This is a tool about blind students. Full keyboard operation,
   ARIA live regions on every state change, WCAG AA contrast, `prefers-reduced-motion` honoured.
7. **EVIDENCE, NOT ASSERTION.** "Done" means `npm run verify` is green and, for UI, a screenshot
   exists. A build that compiles has proven nothing about how it looks or whether it works.

## ART DIRECTION — "MACHINED INSTRUMENT"

Deep graphite ground; machined hairline edges (1px `rgba(255,255,255,.06)`, radius ≤ 4px);
**one** signal colour (amber `--signal`) used only for *live / you-are-here*; IBM Plex Sans + IBM
Plex Mono, self-hosted, tabular numerals for anything numeric. **The braille dots are the hero** —
physically modelled with a fixed top-left light source: raised = dome + cast shadow, lowered =
recessed inner shadow. Never flat circles. **Motion is mechanism**: a cell transition animates the
cam rotating through the arc the real motor would take. Banned: purple/blue gradients, glassmorphism,
emoji as a design system, centre-everything layouts, more than two font families.

## STRUCTURE

```
app/            Vite + React + TS — the product
  src/core/     pure engine: latex→mathml→nemeth→dots→cam→frame. No React, no I/O, no globals.
  src/transport/ sim | webserial | httppod — one interface, three implementations
  src/ui/       screens + components + tokens.css (the single token source)
firmware/       ESP32 pod + muscle-cell Arduino sketches (same protocol as the emulator)
tools/          virtual-pod (Node, zero deps) + model fetcher
docs/           handoff PDF, protocol spec, cell atlas
```

## GATES — `npm run verify` (must be green before any commit)

`typecheck` · `lint` · `test` (Vitest, incl. golden Nemeth vectors + invariant tests) ·
`e2e` (Playwright: the full demo journey + screenshots at 390 / 834 / 1440 px) · zero console errors.

## OPERATING RULES

- Plan before multi-file changes. Work in arcs (`ARC_PLAN.md`); acceptance lists are frozen at arc
  start; new ideas go to `NOTES.md` **unbuilt**.
- Update `PROGRESS.md` + commit at every workstream boundary (`checkpoint(ARC-n/WS-m): …`).
  Resume line is always **"read PROGRESS.md and continue."**
- Log every judgment call in `DECISIONS.md`, one line. Never delete a line.
- Verify volatile facts live (versions, model names, APIs) — memory of these is presumed stale.
- **Secrets:** no key is ever written to a file, `.env`, or `import.meta.env`. The optional cloud
  provider takes a key typed at runtime, held in memory only.
- **Escalate only:** spending money · anything irreversible or touching the team's hardware repo ·
  publishing publicly for the first time · a genuine expensive product fork · a missing credential.
  Everything else: decide, log, keep moving.
