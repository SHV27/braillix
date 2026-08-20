# ARC PLAN — Braillix v2 "The Blackboard" (honest count: 4 arcs, ~6h clock)

Replaces the v1 arc plan (git history). One continuous session; arc boundaries = commit +
PROGRESS.md checkpoint + gates green + real-browser verification (Chrome DevTools MCP).
Anything not on an acceptance list → NOTES.md, unbuilt.

## Arc V2-1 — Demolition + Walking Skeleton (~60–75 min)
The thinnest teacher loop on the new product shape, with the old product gone.
Acceptance (frozen):
- [ ] `src/learn`, `src/class`, Practice/Class screens and their routes deleted; suite still green
- [ ] `useBoard` store exists: lesson lines, cursor, mode; ONE `selectFrame` selector
- [ ] New one-screen App shell: type a line (natural shorthand) → line appears on the board
      stack → cells render on-screen dots → sim display updates; en/hi toggle survives
- [ ] Confirm-gate type constraint present (recognised lines unrepresentable unconfirmed)
- [ ] `npm run verify` core gates green (typecheck, lint, unit); e2e pruned to compile
- [ ] Real-browser check: type `1/2 + 1/6`, see dots; zero console errors
- [ ] checkpoint(V2-1) committed

## Arc V2-2 — The Blackboard, whole (~90 min)
Acceptance (frozen):
- [ ] Lesson stack UI: lines added/edited/removed; current line obvious at a glance
- [ ] Pager: lines→panes→cells sized by discovered profile; Prev/Select/Next semantics
      (follow/explore/rejoin, pending marker) wired to keyboard + on-screen + pod buttons
- [ ] Worked-example flow: multi-line question + steps read in order on 1 cell and on 40
- [ ] Speech channel: line spoken as it lands (SRE text, Web Speech), per-cell on explore
- [ ] Hindi: Bharati words + Nemeth maths in one line; en/hi UI complete
- [ ] First-run: 60-second taste (preloaded lesson, "now write yours"), dismissible forever
- [ ] Device drawer: transport pick, discovered cell count visible, calibration reachable
- [ ] verify green + real-browser journey + screenshots 390/834/1440 + zero console errors
- [ ] checkpoint(V2-2) committed

## Arc V2-3 — Scan & Draw, honestly accurate (~90 min)
Acceptance (frozen):
- [ ] Photo/file scan of a FULL question: teacher rubber-bands regions (words / maths);
      words → tesseract.js eng+hin (self-hosted), maths → formulanet; per-region confidence
- [ ] Confirm gate UI: print render + spoken readback; low confidence flagged "check this";
      edit box prefilled; symbol palette fallback; nothing lands unconfirmed
- [ ] Draw pad → same recognition path; `~` noise stripped from model output
- [ ] Model shipping structurally fixed: build/verify FAILS if model or traineddata absent
      from dist; download-with-progress badge for fresh installs
- [ ] Real-browser proof on ≥3 unseen images (printed formula, worded question w/ Hindi,
      handwritten) — recognised, confirmed, on the cells; evidence screenshots saved
- [ ] verify green; checkpoint(V2-3) committed

## Arc V2-4 — Certification & Ship (~60–75 min)
Acceptance (frozen):
- [ ] Symbol sweep: class 9–12 exam-shaped expressions (trig, calculus, matrices, sets,
      vectors, log/ln, Greek) each translate, round-trip, and read back; failures fixed or
      honestly flagged in-product
- [ ] Hostile pass: dead-button hunt on every visible control; empty states teach; keyboard-
      only journey; reduced-motion; WCAG AA spot checks
- [ ] Full verify green; e2e journeys re-recorded; screenshots at 3 widths committed
- [ ] Virtual-pod end-to-end: lesson → httppod → emulator shows correct cams incl. buttons
- [ ] README + PROGRESS.md final (panel-ready evidence: what's proven, how, where)
- [ ] Redeploy to existing Vercel project; live URL serves the models; live smoke test
- [ ] checkpoint(V2-4) committed + pushed

Parked (NOTES.md): Texo model swap · Grade-2 contractions · auto page-layout detection ·
multi-student per-pod addressing UI · MathCAT WASM · SRE 5 upgrade.
