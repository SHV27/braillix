# PROGRESS — Braillix (software)

**Resume line: “read PROGRESS.md and continue.”**

Repo: **github.com/SHV27/braillix** · Live: **https://braillix.vercel.app**

---

## Where we are

**Fourteen arcs built and closed.** Arcs 1–6 built the instrument; arcs 7–10 built the classroom
around it and shipped it; arc 11 made it prove its own work; arc 12 made sure the proof reaches the
teacher rather than sitting in a cache; arc 13 swept every symbol a senior class needs into it; arc 14 ran whole exam questions
through it and fixed the six things they found.

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
| 11 · The Proof (the pipeline reads its own braille back) | ✅ closed |
| 12 · Delivery (a new version announces itself; the Device screen shows its cells) | ✅ closed |
| 13 · The Sweep (every symbol a senior class needs, verified) | ✅ closed |
| 14 · Whole Questions (the sentences an exam paper prints) | ✅ closed |

## The one next action

**Use it, and write down every line where the dots and the reading disagree.**

Nothing is blocking and nothing is half-built. What the product now needs is the one thing no test
can supply: real questions typed by a real teacher. Every round of that so far has found something
— twenty-six exam questions found six defects, and a handful of ordinary phrasings found three more
— and each one was a translation error that had been on screen for days without anybody noticing,
because nobody had typed that sentence yet.

Open the Board, type a page out of whatever textbook is to hand, and watch the **What the dots say**
panel. Anything that is not "matches what you typed" is a finding. So is anything that IS matching
but reads oddly.

Before showing it to anyone: read `docs/DEMO.md` and rehearse the nine-minute run once. It is
written in the order the product should be shown, with what to say.

If more building is wanted, promote a parked idea from `NOTES.md` into a new arc rather than
starting anything ad hoc.

## Gate status

| Gate | Result |
|---|---|
| Unit tests | **738 passing** |
| Journey tests | **134 passing** across board / read-back / reader / hardware / recognition / practice / class / offline / screens / a11y |
| Syllabus accuracy | **165 of 165** lines translate cleanly **and read back correctly** — `npm run accuracy`, evidence in `docs/ACCURACY.md` |
| Round trip | every segment of every syllabus line **and every practice drill**, in all three braille codes, read back by an engine that never saw the input |
| Lighthouse (deployed) | **accessibility 100 · best practices 100 · SEO 100**, zero failed audits |
| Deployed LCP / CLS | **349 ms / 0.00** |
| The deployed site itself | `npm run check:deployed` — 17 checks against the live URL, all green |
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
  frame, plus Bharati Braille for all nine Indian scripts, the mixed words-and-maths splitter, the semantic
  tree, folding, and the motion-minimising scheduler. Pure: no React, no I/O.
- **The proof** (`readback.ts` · `bharatiback.ts` · `literalback.ts` · `canonical.ts` ·
  `roundtrip.ts`): three engines that read braille cells and say what they mean, sharing no code with
  the forward path, plus the one function that compares and returns **agrees · differs · cannot be
  checked**. Used by the tests, by `docs/ACCURACY.md`, by the self-check, and by the Board screen.
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
