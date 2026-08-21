# PROGRESS — Braillix v2 "The Blackboard"

Resume line: **read PROGRESS.md and continue.**

## STATE: ALL FOUR ARCS CLOSED · LIVE IN PRODUCTION (21 Aug 2026)

https://braillix.vercel.app — deployed, verified live, models included.
(Users of the old version get the tested update banner and are one reload away.)

## What shipped (v2 — the blackboard pivot)
One Board screen. The teacher types a line the way she says it (Enter commits, like
WhatsApp), or scans it — an equation photo, a drawing, or a full textbook question read part
by part (words: tesseract eng+hin; maths: on-device formula model; a keyboard-only
whole-photo path exists). Recognised content passes a STRUCTURAL confirm gate (a TypeScript
type; unconfirmed recognised lines cannot compile). Lines stack into the lesson; the pod's
own Prev/Select/Next, the on-screen arrows and PageUp/PageDown all walk one pager:
panes of a line, then across lines, backwards entries landing on last panes. Lines are
spoken as they land. English/Hindi complete; Bharati + Nemeth mixed lines proven.

## Evidence (all re-runnable)
- Unit 666/666 · tsc 0 · lint 0 · e2e **97/97** (certify with `--workers=2` on this laptop)
- `npm run accuracy` → 175/175 curriculum round-trips, 23 topics (docs/ACCURACY.md)
- Virtual-pod loop live: chain discovery → cam 60 (⠼) on wire → pod button paged the app
- Live production (Chrome DevTools MCP, braillix.vercel.app): worked example taught line by
  line (x = 4 → ⠭⠀⠨⠅⠀⠼⠲); handwritten sample recognised in 676 ms on-device; unseen scan
  read "The sum of 7 and 5 is 12" via the keyboard path and landed on the board; zero
  console errors. `node tools/check-deployed.mjs` → 21/21 including model+langs served.
- Screenshots: docs/shots/v2-arc1-skeleton.jpeg · v2-arc3-question-scan.jpeg ·
  v2-live-production.jpeg · app/screenshots (390/834/1440, via e2e)

## The v1 death, closed structurally
vite.config's slimForDeploy STRIPPED the model from deploys; removed. `npm run build` now
FAILS if any of 11 on-device assets is missing from dist (assert-assets.mjs);
check-deployed.mjs asserts they are served live; vercel.json fetches everything at build.

## If anything needs doing next (nothing is required)
- NOTES.md holds the parked list (Texo swap, pending markers, tessdata_best, line-number
  announcements). None block the panel.

## ONE next action
None — ship complete. For the panel: open https://braillix.vercel.app, teach a lesson.
