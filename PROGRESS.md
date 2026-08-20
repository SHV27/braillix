# PROGRESS — Braillix (software)

**Resume line: “read PROGRESS.md and continue.”**

Repo: **github.com/SHV27/braillix** (private — going public is Shaurya's call, Charter escalation 3)

---

## Where we are

**All six arcs are built. Arc 6 (Certification) is closing.**

| Arc | State |
|---|---|
| 1 · Walking skeleton + verification chassis | ✅ closed |
| 2 · The Reader (semantic navigation) | ✅ closed |
| 3 · The Seam (transports, firmware, calibration) | ✅ closed |
| 4 · The Eye (on-device recognition) | ✅ closed |
| 5 · The Practice Loop (braille-first drills) | ✅ closed |
| 6 · Certification | in progress — see next action |

## The one next action

Run `npm run verify` end to end, commit, and do the fresh-clone check
(`git clone` into a clean folder → `npm ci` → `npm run dev`) to prove a teammate can run it cold.

## Gate status

| Gate | Result |
|---|---|
| Unit tests | **278+ passing** (golden Nemeth, all 26 letters + 10 digits cross-checked against the engine, XML reader, protocol conformance, six-key entry, feedback) |
| Journey tests | **60+ passing** across read / reader / hardware / recognition / practice / offline / screens |
| Lighthouse accessibility | **100** |
| Lighthouse best practices | **100** |
| LCP | **650 ms** (target < 2.5 s) |
| CLS | **0.05** (was 0.21; fixed by reserving space for late content) |
| Console errors/warnings | **zero**, asserted in the journey tests |
| Offline | **passes with every external request blocked** |
| Horizontal overflow | none, asserted at 390 / 834 / 1440 on every screen |

## What exists

- **Five screens**: Read · Practice · Read handwriting · Hardware · Cell atlas.
- **The core engine** (`app/src/core/`): LaTeX → MathML → Nemeth → dots → cam → frame, plus the
  semantic tree, the folding mechanism, and the motion-minimising scheduler. Pure, no React, no I/O.
- **The transports** (`app/src/transport/`): simulator, USB (Web Serial), Wi-Fi pod — one interface,
  one protocol, tested against a real emulator.
- **Firmware** (`firmware/`): ESP32 pod and muscle cell, written to the same spec.
- **Recognition** (`app/src/recognise/`): FormulaNet ONNX in a Web Worker, entirely on-device.
- **Lessons** (`app/src/learn/`): 10 lessons, 34 items, six-key braille entry, specific feedback.
- **Docs**: `PROTOCOL.md` (the wire contract) and `HARDWARE_HANDOFF.md` (what the hardware team
  needs to do — three things, all settings, no code).

## Left on the table (in NOTES.md, deliberately unbuilt)

Bharati maths braille table · Grade-2 contractions · whole-page OCR · mDNS discovery ·
teacher dashboard · public deploy (Shaurya's call).

## For whoever picks this up cold

1. Read `CLAUDE.md`, then `ARC_PLAN.md`. Acceptance lists are frozen; new ideas go to `NOTES.md`.
2. `npm install` at the repo root does everything, including copying SRE locale data and the ONNX
   Runtime WASM into `app/public/`. Without that copy the app reaches for a CDN — which is a
   silent failure in a room with no Wi-Fi, and is why `e2e/offline.spec.ts` exists.
3. `npm run fetch:model` (76 MB, once) enables handwriting recognition. Everything else works
   without it, and the app says so.
4. **Gotcha that has cost time three times:** this environment's Bash heredoc strips backslashes.
   Any file containing LaTeX must be written with the Write tool, or use `String.raw`.
5. `npm run pod` starts a protocol-accurate emulator so the hardware path can be exercised with
   nothing plugged in.
