# PROGRESS — Braillix (software)

**Resume line: “read PROGRESS.md and continue.”**

Repo: **github.com/SHV27/braillix** · Live: **https://braillix.vercel.app**

---

## Where we are

**Ten arcs built and closed.** Arcs 1–6 built the instrument; arcs 7–10 built the classroom around
it and shipped it.

| Arc | State |
|---|---|
| 1 · Walking skeleton + verification chassis | ✅ closed |
| 2 · The Reader (semantic navigation) | ✅ closed |
| 3 · The Seam (transports, firmware, calibration) | ✅ closed |
| 4 · The Eye (on-device recognition) | ✅ closed |
| 5 · The Practice Loop (braille-first drills) | ✅ closed |
| 6 · Certification | ✅ closed |
| 7 · The Teacher's Hands (natural input, print, Hindi, word problems) | ✅ closed |
| 8 · The Classroom (worksheets, teaching, students, records, mirror mode) | ✅ closed |
| 9 · Trust (syllabus accuracy, self-check, embosser file, printed sheet) | ✅ closed |
| 10 · Ship (installable offline app, deployed and verified) | ✅ closed |

## The one next action

Nothing is blocking. Read `docs/DEMO.md` and rehearse the nine-minute run once — it is written in
the order the product should be shown, with what to say. If more building is wanted, promote a
parked idea from `NOTES.md` into a new arc rather than starting anything ad hoc.

## Gate status

| Gate | Result |
|---|---|
| Unit tests | **506 passing** |
| Journey tests | **110 passing** across board / reader / hardware / recognition / practice / class / offline / screens / a11y |
| Syllabus accuracy | **69 of 69** lines translate cleanly — `npm run accuracy`, evidence in `docs/ACCURACY.md` |
| Lighthouse accessibility | **100** (deployed build) |
| Lighthouse SEO / best practices | **100 / 96→100** after the console 404 was removed |
| Console errors | **zero**, asserted in the journey tests |
| Offline | passes with every external request blocked, **and** with the network genuinely switched off |
| Installable | service worker precaches 39 files including the Nemeth tables; 3.5 MB deploy |
| Horizontal overflow | none, asserted at 390 / 834 / 1440 on every screen |
| Keyboard only | every screen tabbable, no traps, reader and teach mode fully operable |
| Translation completeness | every string exists in both languages, none unused, none left in English |
| Dead code | zero unused exports (`npm run lint:dead`) |

## What exists

- **Five screens**: Board · Practice · Class · Device · Help.
- **The core engine** (`app/src/core/`): natural maths → LaTeX → MathML → Nemeth → dots → cam →
  frame, plus Bharati Braille for Devanagari, the mixed words-and-maths splitter, the semantic
  tree, folding, and the motion-minimising scheduler. Pure: no React, no I/O.
- **The transports** (`app/src/transport/`): simulator, USB (Web Serial), Wi-Fi pods — chained or
  mirrored — one interface, one protocol, tested against a real emulator.
- **The classroom** (`app/src/class/`): worksheets, students, records; localStorage with a file for
  moving between laptops.
- **Recognition** (`app/src/recognise/`): FormulaNet ONNX in a Web Worker, entirely on-device.
- **Lessons** (`app/src/learn/`): 10 lessons, 34 items, bilingual, six-key braille entry, plus any
  worksheet the teacher wrote, playable as a drill.
- **Docs**: `DEMO.md` (the runbook), `ACCURACY.md` (the evidence), `PROTOCOL.md` (the wire
  contract), `HARDWARE_HANDOFF.md` (three settings, no code).

## Left on the table (in NOTES.md, deliberately unbuilt)

Bharati **maths** table (no open source exists) · Grade-2 contractions · whole-page OCR ·
mDNS discovery · online stroke recognition · native mobile app · cell status read.

## For whoever picks this up cold

1. Read `CLAUDE.md`, then `ARC_PLAN.md`. Acceptance lists are frozen; new ideas go to `NOTES.md`.
2. `npm install` at the repo root does everything, including copying SRE locale data and the ONNX
   Runtime WASM into `app/public/`, and writing `public/models/status.json`.
3. `npm run fetch:model` (76 MB, once) enables handwriting recognition. Everything else works
   without it, and the app says so.
4. **Gotcha that has cost time four times:** this environment's Bash heredoc strips backslashes.
   Any file containing LaTeX or a regular expression must be written with the Write tool.
5. `npm run pod` starts a protocol-accurate emulator so the hardware path can be exercised with
   nothing plugged in.
6. `BRAILLIX_DEPLOY=1 npm run build` produces the 3.5 MB public build (no model, no ONNX runtime).
   `npx vercel deploy --prod --scope god-shaurya` publishes it; the token lives in the shell only.
