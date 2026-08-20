# ARCHITECTURE — Braillix (software)

Locked 20 August 2026, after the five attacks below. Features may change every arc. **Nothing in
this file changes without re-running this review.**

---

## System sketch

```
 INPUT                    CORE (pure, no I/O, no React)                 OUTPUT
 ─────                    ────────────────────────────                  ──────
 type LaTeX ─┐                                                       ┌─ on-screen cells
 photo/draw ─┼─► latex ─► temml ─► MathML ─► SRE ─┬─► Nemeth braille ─┼─ speech (en / hi)
 lesson     ─┘                                    └─► semantic tree   └─ Frame[camIdx…]
                                                            │                    │
                                        Reader (fold/cursor/window)              ▼
                                                                     Transport: sim │ serial │ http
                                                                                    ▼
                                                                     virtual pod │ ESP32 pod ─I2C─► cells
```

Six boxes, one direction. Every arrow is a pure function except the last one.

## The state authority

One Zustand store, four **exclusive owners**. A second computation of any of these is a bug, and
the lint rule `no-restricted-imports` plus a Referee test enforce it.

| State | Sole authority | Everyone else |
|---|---|---|
| How many cells exist, and their bit/cell order | `useDisplayProfile()` | reads it; never assumes |
| What each cell should show right now | `renderFrame(doc, session, profile)` — one pure fn | consumes `Frame` |
| SRE's global engine mode (braille vs speech vs locale) | `sreService` — a single serialised queue | `await` it; never calls `setupEngine` |
| Whether an optional capability is usable | `capabilities` slice | renders a badge from it |

`sreService` exists because SRE keeps **global** engine state: a naïve app that asks for braille and
speech concurrently will race and get braille in the speech slot. One queue, one owner.

## Choke points & enforcers

No money, no accounts, no server — so the choke points are privacy and correctness, not auth.

| Choke point | Enforcer |
|---|---|
| Student work (photos, answers) never leaves the device | There is no backend to send it to, and after D5.1 there is no network-capable provider at all. Recognition runs in this browser. |
| API keys | There are none. Braillix has no key, no account and no server, and D5.1 removed the only feature that would have needed one. |
| Progress data | `localStorage` under one namespaced key, with a visible "erase all my data" control. |
| Cam numbers on the wire | Derived **only** by `profile.toCam(dots)`. Nothing else may do bit arithmetic. |
| Serial / camera access | Browser-enforced user gesture; we never auto-connect. |

## Data model

```
MathDoc      { id, source:'typed'|'ocr'|'lesson', latex, mathml, tree:SemNode, issues[] }
SemNode      { id, type, role, children[], latex, braille:Cell[], speech:{en,hi}, foldable }
Cell         { dots:number /*bitmask 1..6*/, unicode:string }        // standard, profile-free
DisplayProfile { cellCount, source:'sim'|'serial'|'http', bitOrder:[6], reversed, homeIdx }
Frame        { cells:Cell[], camIdx:number[], windowStart, cursorCellIdx, label }
Transport    { kind, status, chain:PodInfo[], send(Frame), onButton(cb), home() }
PodInfo      { index, cellAddrs:number[], cellCount }
Session      { cursorId, folded:Set<id>, windowStart, mode:'read'|'drill' }
Progress     { [lessonId]: { attempts, correct, lastSeen } }          // localStorage only
Settings     { speechOn, speechLocale:'en'|'hi', rate, autoScrollMs, reducedMotion }
```

Note the seam: **`Cell` is standards-defined and profile-free; `camIdx` is profile-dependent.**
That separation is what lets the cam bit order be wrong on Saturday and fixed in ten seconds
without invalidating a single braille test.

## Failure modes & their visible notices

Every optional subsystem is a **capability** with `{state: 'ready'|'unavailable'|'degraded',
reason, fix?}` rendered in a persistent status strip. Nothing degrades silently — ever.

| Failure | What the user sees | What still works |
|---|---|---|
| OCR model not downloaded | `Recognition · not installed` + the exact command to install it (`npm run fetch:model`). Deliberately NOT an in-app download button: fetching 76 MB needs a network, and offering that as the primary path would undercut the offline promise. | everything else |
| OCR model present but fails to start | the error names the missing file and the command that fixes it; the Read screen is untouched | everything else |
| Recognition returns nonsense | Result lands in an **editable** LaTeX field with a quality judgement and its reasons — never a fabricated confidence percentage (D3.12); nothing is auto-committed | everything else |
| Web Serial unsupported (Firefox/Safari) | `USB · not supported in this browser` + name the browsers that do | simulator + Wi-Fi pod |
| Pod unreachable over Wi-Fi | `Pod · unreachable (192.168.x.x)` + retry | simulator |
| Speech synthesis absent | `Speech · unavailable` | braille + on-screen |
| Temml can't parse the LaTeX | Inline error under the input, with the offending position; **the previous frame stays on the cells** | everything else |
| SRE throws on an expression | `Maths engine · fell back to literal` + the literal Grade-1 rendering | everything else |
| Transport reconnects / homes / errors | Frame cache invalidated → **full resend**, not a diff | correctness preserved |

## Design laws for this project

1. **The cell count is discovered, never known.** No literal cell count exists in any layer,
   including code that only ever runs on a laptop. (Brief's hardest-flagged constraint.)
2. **Standards above, configuration below.** Dot patterns follow Nemeth and are testable against
   published tables; anything physical (bit order, cell direction, home position) is runtime config.
3. **Observable degradation.** Every optional capability declares its state and its fix.
4. **The previous frame is sacred.** An error never blanks the display; it holds the last good frame
   and says why.
5. **Nothing is load-bearing that can fail.** Recognition, speech, hardware and the network are all
   removable without breaking the core journey.
6. **Motion is a cost.** Only changed cells are commanded, and each cam takes the shorter arc.
7. **The tool must be usable by the people it is about.** Full keyboard operation, ARIA live
   regions on every state change, WCAG AA contrast, `prefers-reduced-motion` honoured.

## Contradictions found & resolutions

1. **"Never assume a cell count" × "must run with no hardware."** With nothing plugged in there is
   nothing to discover. → `DisplayProfile.source` is explicit: simulated profiles are *chosen*, not
   *assumed*, and the UI labels them "simulated". **Default simulated cell count = 1**, because that
   is what will physically exist on 22 August — and because one cell is precisely the case the
   Reader pillar exists to solve. The count control sits next to it.
2. **"Degrade gracefully" × "never degrade silently."** → the capability badge system above. A
   fallback that cannot announce itself is not allowed to exist.
3. **"Golden Nemeth tests" × "bit order is configurable."** → tests assert `Cell.dots` (standard,
   fixed) and separately assert `profile.toCam()` (config, parameterised). Changing the profile can
   never break a braille test, and vice versa.
4. **"Motion-minimising diff" × "correctness under uncertainty."** → the frame cache is owned by the
   transport session and invalidated on connect, home, error, or profile change. Uncertainty always
   costs a full resend; it never costs correctness.
5. **"Speech always accompanies braille" × "speech may be unavailable / unwanted."** → speech is a
   capability with a toggle, on by default, announced once when absent, never assumed present.
6. **"Student privacy" × "optional cloud OCR."** → resolved by removing the second half: the cloud
   provider was cut (D5.1). Nothing leaves the device, so there is no notice to get wrong.

## STACK LOCK

Verified live on this laptop, **20 August 2026**. Boring-technology bias applied: the newest
version is chosen only where it is also the proven one.

| Layer | Choice | Version | Why this |
|---|---|---|---|
| Build | Vite | `8.2.1` | Current major; `@vitejs/plugin-react@6.0.5` peers `vite ^8.0.0`, vitest 4 peers `^8`. Aligned. |
| UI | React | `19.2.8` | Current stable. |
| Language | TypeScript | `5.9.3` | **Deliberately not 7.0.2.** TS 7 is the new native compiler; the type-check step is a gate on a graded demo and gets the most-proven compiler, not the newest. Revisit after 22 Aug. |
| State | Zustand | `5.0.15` | Tiny, no provider ceremony, selector-based — fits the "one authority" rule. |
| Maths → MathML | temml | `0.13.4` | MIT, zero dependencies, pure JS, also renders the sighted view. |
| MathML → Nemeth + speech + semantic tree | speech-rule-engine | `4.1.4` | The one dependency that makes the product possible. Pinned to 4.x, **not** the `latest` tag (`5.0.0-rc.4`). |
| Image → LaTeX | @huggingface/transformers | `4.2.0` | Runs ONNX vision-encoder-decoder in a Web Worker over WASM. |
| OCR weights | `alephpi/FormulaNet` (ONNX) | pinned revision | Downloaded by `npm run fetch:model`, never committed (AGPL-3.0 — see `THIRD_PARTY.md`). |
| Unit tests | Vitest | `4.1.11` | Same Vite pipeline, no second config. |
| Journey tests | Playwright | `1.62.1` | Headless proof of the demo path + screenshots at desktop and mobile widths. |
| Styling | Hand-written CSS + design tokens | — | No UI kit. A component library would make it look like every other student project. |
| Routing | none (view state in the store) | — | Five screens. A router would be pure ceremony. |
| Firmware | Arduino C++ (ESP32 pod + muscle cell) | — | Matches `docs/SOFTWARE_TEAM_README.pdf` §5–§7 exactly. |
| Emulator | Node (no dependencies) | — | Speaks the same wire protocol as the real pod. |

**Offline guarantees baked into the build:**
- SRE's locale data (`base.json`, `nemeth.json`, `en.json`, `hi.json` — ~1.2 MB) is **copied into
  `public/sre/mathmaps/` at install time** and loaded from there. SRE must never reach a CDN.
- ONNX runtime `.wasm` files are copied to `public/`, not fetched.
- The only network request the app can ever make is the optional one-time model download, run from
  the command line by choice. `e2e/offline.spec.ts` blocks every external request and asserts that
  not one is attempted.

**Rejected, with reasons:** liblouis (no tables shipped, wrong tool for maths — RESEARCH Verdict 8) ·
MathJax full (heavier route to the same SRE) · FastAPI/Python backend (install friction, and both
hard parts were proven in JS) · react-router, Tailwind, any component kit (ceremony or sameness) ·
TypeScript 7 (see above).
