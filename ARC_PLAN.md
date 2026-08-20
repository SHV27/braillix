# ARC PLAN — Braillix (software) · honest count: **6 arcs**

Deadline: **11:00, 21 August 2026**. Panel: early 22 August. Acceptance lists are frozen at arc
start. Anything not on a list goes to `NOTES.md` unbuilt.

---

## Arc 1 — Walking Skeleton + the whole verification chassis
*The thinnest real slice: type a quadratic → correct Nemeth → correct dots → correct cam numbers →
cells move on screen. Plus every gate that will police the next five arcs.*

Acceptance (frozen):
- [ ] Vite + React + TS app runs; `npm install && npm run dev` is the only setup step
- [ ] `src/core` pure engine: `latex → mathml → nemeth cells → dots → camIdx → Frame`
- [ ] SRE runs **offline** from `public/sre/mathmaps` (no CDN reachable, verified by blocking network)
- [ ] `DisplayProfile` authority; **zero** literal cell counts (enforced by a test that greps source)
- [ ] Simulated display renders N cells with physically-modelled dots; N is user-settable, default 1
- [ ] Golden Nemeth vectors test (≥20 expressions) + profile/cam mapping tests, separately
- [ ] Capability badge system live, with at least one real degraded state visible
- [ ] `npm run verify` = typecheck + lint + unit + e2e, all green
- [ ] Playwright journey test + screenshots at 390 / 834 / 1440
- [ ] `PROGRESS.md`, `DECISIONS.md`, `NOTES.md`, `THIRD_PARTY.md` in place; GitHub repo (private) live with real commits

## Arc 2 — THE READER (pillar 2)
*Make one cell enough.*

Acceptance (frozen):
- [ ] Semantic tree from SRE with stable node ids; every node carries its own braille + speech
- [ ] Cursor navigation: sibling ←/→, drill in ↓, out ↑, home
- [ ] **Fold**: a sub-expression collapses to a single ⠿ cell; unfold on drill-in
- [ ] Breadcrumb orientation line ("Fraction ▸ Numerator ▸ cell 3 of 7") + ARIA live announcement
- [ ] Speech synchronised with the cursor; locale **en + hi**; toggle + rate; graceful absence
- [ ] Windowing/paging for N cells: auto-scroll mode, manual page mode, and follow-cursor mode
- [ ] Motion-minimising scheduler: frame diff + shortest-arc cam rotation, with a visible readout of
      steps saved
- [ ] Works identically at N = 1, 2, 4, 20 (parameterised tests)

## Arc 3 — THE SEAM (pillar 5)
*Turn "will integration work?" into a passing test.*

Acceptance (frozen):
- [ ] One `Transport` interface; `SimTransport`, `WebSerialTransport`, `HttpPodTransport`
- [ ] Wire protocol documented in `docs/PROTOCOL.md`, matching handoff §7 (`/chain`, `/show`,
      `/layout`, `/buttons`, `/home`) + multi-pod layout packet from §4B
- [ ] `tools/virtual-pod` (Node, zero deps) implements the protocol incl. a fake I2C scan of M cells
- [ ] Protocol conformance test suite runs the app against the virtual pod, headlessly
- [ ] Multi-pod slicing: total cells = Σ pod cells; each pod gets `full_text` + its `my_slice`
- [ ] Pod buttons Prev/Select/Next drive the Reader's tree navigation
- [ ] **Calibration screen**: live bit-order and cell-order editing, "raise dot N" test, export config
- [ ] `firmware/pod` + `firmware/cell` Arduino sketches written to the same spec (compile-checked by review, flashing is the hardware team's step)
- [ ] Cell Atlas page: all 64 cam positions ↔ dots ↔ Nemeth meaning, printable for the hardware team

## Arc 4 — THE EYE (pillar 3)
*A photo of handwritten maths becomes moving dots.*

Acceptance (frozen):
- [ ] `npm run fetch:model` downloads FormulaNet ONNX to `public/models/` (gitignored)
- [ ] Recognition runs in a **Web Worker**; UI never freezes; progress reported
- [ ] Three inputs: camera capture, file upload, draw-on-canvas
- [ ] Preprocessing per the reference recipe (grey → auto-invert → crop to ink → letterbox 384 → normalise)
- [ ] Result lands in an **editable** LaTeX field with confidence; never auto-commits
- [ ] Provider interface: `on-device` | `cloud (opt-in, key in memory only)` | `manual`
- [ ] Model absent / offline / failed → badge + fix action; the rest of the app is untouched
- [ ] ≥6 sample images committed so the demo never depends on the room's lighting

## Arc 5 — THE PRACTICE LOOP (pillar 4)
*Learn → practise → feedback, braille-first.*

Acceptance (frozen):
- [ ] Lesson data: ≥8 lessons covering digits, operators, fractions, radicals, powers, indicators
- [ ] Drill type A — **read**: dots are shown/driven, student types what it says
- [ ] Drill type B — **write**: six-key Perkins entry (F D S J K L, space = commit) → checked
- [ ] Feedback names the exact cell and the exact indicator missed, never just "wrong"
- [ ] Progress persisted to `localStorage` with a visible erase control; no accounts, no upload
- [ ] Every drill playable on N = 1 cell

## Arc 6 — CERTIFICATION
*Hostile QA before it goes in front of a panel.*

Acceptance (frozen):
- [ ] Keyboard-only pass of every journey; screen-reader pass (NVDA semantics) on the core loop
- [ ] Lighthouse ≥ 90 perf + ≥ 95 a11y; zero console errors/warnings anywhere
- [ ] Screenshots of every screen at 3 widths, committed
- [ ] `README.md` a teammate can follow cold; `docs/PROTOCOL.md` + `docs/HARDWARE_HANDOFF.md` for the hardware team
- [ ] Offline test: Wi-Fi off, full journey completes
- [ ] Fresh-clone test: `git clone && npm ci && npm run dev` on a clean path
- [ ] Final `npm run verify` green; PROGRESS.md left demo-ready

---

## Parked (see `NOTES.md`)
Bharati maths braille table · Grade-2 contractions · PDF/whole-page OCR · mDNS pod discovery ·
teacher dashboard · online (stroke) handwriting recognition · native mobile app · public deploy
(owner's call — Charter escalation #3).

---

# PART TWO — THE CLASSROOM (arcs 7–10, added 20 Aug 2026, 17:00)

*Arcs 1–6 built the instrument: maths in, correct dots out, on any number of cells, with nothing
plugged in. It is a tool for a person who already knows what they want to type.*

*Part two makes it a tool for the person who will actually own it: **a teacher at an Indian school
for the blind**, who is not a programmer, may not read braille, may prefer Hindi, and has forty
minutes and twelve children. Research that changed the design is in `RESEARCH.md` §Part two.*

## Arc 7 — THE TEACHER'S HANDS
*Nobody should have to type a backslash to teach a child a fraction.*

Acceptance (frozen):
- [x] Natural maths input: `1/2`, `sqrt(9)`, `x^2`, `2 <= x`, `pi`, `30 degrees`, `Rs 250` all parse
      without a single LaTeX command, with a test per form
- [x] A maths keypad: every template a school-maths teacher needs, inserted at the caret, keyboard
      reachable, with the caret landing in the first slot
- [x] **Rendered maths preview** — the expression as it appears in the textbook, next to the braille,
      so a sighted teacher can verify accuracy without reading dots or LaTeX
- [x] Bharati Braille (Devanagari) module, verified against the published table, with tests
- [x] Mixed lines: Hindi/English words **and** maths in one run of cells, each segment labelled with
      the code it is written in — no silent code switching
- [x] The whole interface in Hindi as well as English, switchable in one control, persisted
- [x] Information architecture rebuilt in a teacher's words: Board · Practice · Class · Device · Help

## Arc 8 — THE CLASSROOM
*One teacher, one laptop, several displays, twelve children, forty minutes.*

Acceptance (frozen):
- [x] Worksheets: create, name, order, and edit a list of items; items come from typing, the keypad,
      a photo, or the built-in library
- [x] Worksheets and students persist locally; export and import as a plain file so they move
      between laptops with no network and no account
- [x] Teach mode: one item at a time, full screen, print maths + braille + the display in sync,
      driven by keyboard or by the pod buttons
- [x] Students: a roster, per-student practice records, a class progress table
- [x] Records export as CSV and as a printable report
- [x] **Mirror mode**: several pods, every one showing the same content — a class reading together
- [x] Every one of these works with nothing plugged in

## Arc 9 — TRUST
*Accuracy that is measured and shown, not claimed.*

Acceptance (frozen):
- [x] Nemeth golden vectors extended to the full school syllabus surface (trigonometry, logs,
      indices, surds, inequalities, sets, integrals, Greek letters, degrees, currency, percent),
      every one cited to a published table
- [x] A translation accuracy report printed by `npm run accuracy`, committed as evidence
- [x] Self-check screen: the teacher presses one button and sees what works on this machine and
      what does not, with the fix for each
- [x] Recognition: confidence shown, corrections easy, and the correction loop verified end to end
- [x] BRF export so a worksheet can go to an embosser, and a printable print+braille handout

## Arc 10 — SHIP
*It has to survive a school's Wi-Fi, a strange laptop, and a panel.*

Acceptance (frozen):
- [x] Installable offline app (PWA): opened once, works forever with the network off
- [x] First-run guide that teaches the product in under a minute, skippable, never patronising
- [x] Deployed publicly, with the deployed build verified — not just the local one
- [x] `npm run verify` green; screenshots of every screen at three widths; docs current

## Arc 11 — THE PROOF
*The pipeline checks its own work, and a teacher who cannot read braille can check it too.*

Every arc up to here ran the translation one way: maths in, dots out. Which meant that if the dots
were wrong, nothing in the system would ever notice — the tests could only ask whether a
translation *happened*. And it meant a teacher, who almost certainly does not read braille, was
being asked to take the most important thing in the product entirely on trust.

Acceptance (frozen):
- [x] A second engine that reads Nemeth cells and says what they mean, written from the opposite
      end and sharing no code with the forward path
- [x] A canonical printer for the LaTeX that went in, so the two readings can be compared exactly
- [x] Three verdicts, never two: agrees · differs · **cannot be checked**, so a gap in the checker
      can never be mistaken for a clean bill of health
- [x] Mutation tests that break the braille on purpose — a missing baseline indicator, a superscript
      written as a subscript, a dropped numeric indicator — and prove the check catches each
- [x] The round trip asserted over the whole syllabus, and printed in `docs/ACCURACY.md`
- [x] Syllabus corpus doubled, and every line marked as pure maths or as words-and-maths, so a line
      being silently cut in half is a test failure
- [x] The verdict on screen, in both languages, saying plainly what it did and did not check
- [x] A back-reader for **every** braille code Braillix writes — Nemeth, Bharati and Grade-1 English
      — so a whole question is verified, not the convenient half of it
- [x] `fold()`: the distinctions Bharati genuinely cannot carry, written down, applied to both sides
- [x] The self-check screen runs the verifier, AND feeds it deliberately broken braille to prove it
      still catches things on this machine
- [x] Every defect the check found, fixed

What it found, on the first run, in code that had passed every previous gate:
- `25% of 80` reached the display as *o times f* — an English word read as two variables
- `1/2 x b x h` — the area of a triangle — read as four variables, no multiplication anywhere
- `lim_{x -> 0} sin x / x` became (lim sin x)/x, which is a different limit and a wrong one
- `3/4 x 2/5` became a compound fraction instead of two fractions multiplied
- `S_n = n/2 (2a + (n-1)d)` lost its `S_n` to the text half, leaving `=n` as a numerator
- `12.5 cm` was cut in two, with braille-code switch indicators around the unit
- Gurmukhi's tippi, Bengali's khanda ta and Malayalam's chillu letters were reported as gaps in
  ordinary words
- `Ravi के पास 5 सेब` — a Hinglish question — lost every Latin letter, because the Latin word and the
  Hindi one shared a segment and the whole segment went to the Bharati translator


## Arc 12 — DELIVERY
*A fix that never reaches the teacher is not a fix.*

Acceptance (frozen):
- [x] A new version, once cached, announces itself on screen and reloads when asked — never on its
      own, because a page that reloads under a teacher's hands in front of a class is worse than a
      stale one
- [x] Nothing is said on a first visit: an install is not an update
- [x] Proved end to end by changing the deployed worker on disk exactly as a deploy would, and
      watching the browser notice
- [x] The Device screen shows the cells it drives, and stops pretending a pod address is already
      set up
- [x] Teach mode carries the verdict — silent when the braille is right, loud when it is not
- [x] A whole numbered exercise can be pasted into a worksheet in one go


## Arc 13 — THE SWEEP
*Every symbol a senior class needs, verified rather than assumed.*

Arc 11 built the checker. This arc asked it what it could not do, by printing the Nemeth for every
symbol the printer knows and reading each one back.

Acceptance (frozen):
- [x] A sweep of every symbol, with each unreadable one becoming a rule taken from real output
- [x] Set signs, ≈, ≡, ∝, ∴, ∵, ⊥, the punctuation colon, the factorial, the raised dot, bars,
      binomial coefficients and every capital Greek letter — all read back
- [x] A probe of sixty-five realistic classroom expressions: **65 agree, 0 differ, 0 unchecked**
- [x] Gurmukhi's addak translated properly, so Punjabi words with a doubled consonant are right
- [x] Nothing in the reader maps to the empty string — a cell is read or reported, never swallowed
- [x] The corpus grown to 149 lines across 21 topics, all round-tripping
- [x] A hostile pass over every screen: 43 malformed expressions, corrupt class files, a bad pod
      address, walking off both ends of a lesson — **zero console errors**, and two real defects
      found and fixed (Clear did not clear; fractions nested deeper than one level were unreadable)


## Arc 14 — WHOLE QUESTIONS
*Not expressions with words near them — the sentences an exam paper actually prints.*

Twenty-six real exam questions, in five scripts, run through the round trip. Fifteen agreed. The
other eleven found six defects that had been on screen since arc 7 and that nothing had ever asked
about, because every earlier test used an expression rather than a question.

Acceptance (frozen):
- [x] A sentence's full stop can never become a decimal point
- [x] Punctuation sits against the run it follows, in the literary code, after the terminator
- [x] A binary operator cannot open a line; `in`, `by` and `to` are decided by their neighbours
- [x] A line does not open with a one-letter island of algebra
- [x] A comma does not stop the maths parser
- [x] ऋ and ऌ after a consonant read back as matras
- [x] A binary operator cannot open a BRACKET either — "(in cm)" was reaching the display as (∈ cm)
- [x] A hyphen between two whole words is a hyphen, not a minus sign
- [x] A comma is read at the baseline, not up inside a superscript
- [x] Sixteen whole questions added to the corpus permanently — **165 lines, all round-tripping**


## Arc 15 — THE PAPER ITSELF
*Sub-question labels, blanks, marks in brackets, units with exponents.*

Twenty-one of the formats an Indian exam paper is actually printed in. Sixteen agreed; the other
five found four more defects and one honest limitation.

Acceptance (frozen):
- [x] `2x + ___ = 10` no longer produces an empty display and a raw JavaScript error
- [x] `Q1. Find the area` no longer reads back as `Q:`
- [x] A full stop in the MIDDLE of a maths run is sentence punctuation; a comma is not
- [x] Nemeth square brackets read back
- [x] A structural test that no reader table can contain an eight-dot cell
- [x] Ten more formats in the corpus — **175 lines across 23 topics, all round-tripping**
- [x] The one thing that could not be done honestly — the Nemeth omission symbol — written down in
      `NOTES.md` with the reason, rather than guessed at
