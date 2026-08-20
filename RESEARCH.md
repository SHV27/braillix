# RESEARCH.md — Braillix v2 recon (21 Aug 2026)

Four parallel recon lanes + main-thread browser verification. This file replaces the v1 research
notes (in git history). Every volatile fact was verified live on 21 Aug 2026.

## Lane A — The real user and the real classroom (India)

- ~400+ dedicated blind schools, ~2,000 teachers, **~60% of the teachers are themselves visually
  impaired**; most VI students **stop maths/science after class 7–8** — supply-side collapse, not
  prohibition (Vision Empower Trust research; visionempowertrust.org).
- CBSE: maths is *optional* for CWSN candidates at secondary level — a blind student can legally
  finish class X without maths, and given the teaching gap most do (CBSE CWSN circulars).
- The dominant classroom tools are **Taylor frame + abacus + shared braille textbooks** (often no
  individual copies). Documented cases of untrained teachers assigned to maths.
- Devices: Orbit Reader 20 ₹33k subsidised / OR-40 ₹1.55L; BrailleMe ₹25–45k (2026 status
  unverified); Annie (Thinkerbell, ₹70–95k) is a *literacy tutor* with 500+ devices in 16 states —
  the one India-scale success, and it teaches rather than displays. Multi-line devices (Canute
  $2.5k, Orbit Slate $3.7k) are absent from Indian schools.
- **Nobody addresses maths teaching on a refreshable line.** Single-line spatial maths (fractions,
  long division, matrices, worked steps) is the unsolved failure mode across every incumbent.
- NCERT digital maths content is the *least* accessible subject (~80% of activities unreadable by
  screen reader on DIKSHA). Offline-first is mandatory (residential schools).

## Lane B — Standards (the accuracy backbone)

- **India prescribes a Nemeth-derived code** (NIEPVD "Braille Mathematics Code for India";
  Nemeth-1972-compatible working assumption). No evidence of UEB Technical in Indian schools.
  Verdict: **emit pure Nemeth**, keep any Indian-manual delta as configuration.
- The **official Nemeth 2022 PDF (BANA, 498pp) was downloaded and text-extracted**; the recon
  report contains a verified symbol→dots table (digits, operators, comparisons w/ spacing rule,
  fractions, super/subscripts, radicals, Greek, functions, calculus, grouping, arrows/modifiers,
  matrices, punctuation indicators) — golden-vector-grade. Extracted text kept in scratchpad
  (`nemeth_text.txt`) for edge-case lookups.
- **liblouis `nemeth.ctb` is untested/undocumented upstream (issue #815 open) — do not trust it
  for math.** liblouisutdml is server-only. MathCAT (MIT, gold standard, NVDA 2026.1) has no
  published WASM package — own-build only.
- **speech-rule-engine (SRE, Apache-2.0, npm, runs in browser)** outputs BOTH MathSpeak/ClearSpeak
  speech AND Nemeth braille from MathML — one library gives the speech channel and an independent
  Nemeth cross-check. Known wart: braille spaces garbled in browser build (README caveat).
  `latex2nemeth` (Java, GPL) is a good offline differential oracle for golden vectors.
- **Bharati Braille 2.1** (NIEPVD, Jan 2025, Unicode-mapped, official GoI PDF) verified: vowels as
  full letters written AFTER the consonant regardless of print order, inherent 'a' omitted,
  virama = dot-4 prefix, digits = number-sign + upper a–j (**clashes with Nemeth dropped digits —
  literary-vs-math context switch must be explicit**).
- **₹ has no Nemeth 2022 symbol** — needs a logged design decision.

## Lane C — Recognition technology (the make-or-break)

- **Texo (alephpi, Feb 2026, AGPL-3.0)**: 20M-param math OCR **designed for in-browser
  Transformers.js/ONNX**, ~20–40MB. CDM: 0.958 simple printed, 0.825 complex, **0.902
  handwritten**. Reference web app exists (Texo-web). The headline candidate.
- pix2text-mfr-1.5 (MIT, 120MB ONNX): proven Python sidecar option; browser port unverified.
- surya/texify: license poisoned (nc weights) — skip. MyScript paid; ML Kit no web; seshat dead.
- **Tesseract.js (Apache-2.0)**: eng+hin traineddata, in-browser WASM, 95–99% on clean print,
  weaker on Hindi (~90% clean) — covers the *worded-problem text*; preprocessing (deskew,
  binarise) matters more than the engine. Handwritten text: hopeless (by design).
- Proven free-tool pattern: **recognize → render → human confirms**; nothing enters the pipeline
  without teacher sign-off. Model delivery via Cache API/OPFS with a progress bar is standard UX.

## Main-thread verification (real browser, Chrome DevTools MCP)

- The existing app's recognition **works locally**: built-in handwritten sample → `x^{2}+5x=6` in
  2.3s on-device; **my own unseen synthesized stacked-fraction image** → `\frac{x^2+1}{2}=5`,
  structurally perfect, 2.5s. The founder's dead button = the 76MB model is gitignored and never
  fetched at deploy — **a shipping defect, not a code defect**. Output contains stray `~` spacing
  tokens (cleanup needed). No text-OCR exists (worded problems currently have no scan path).

## Lane D — Cold audit of the existing codebase (salvage assessment)

Actually ran: `vitest` → **750/750 pass**; `tsc --noEmit` → clean.

| Component | Verdict | Evidence |
|---|---|---|
| `app/src/core` (latex→temml MathML→SRE Nemeth→dots→cam→frame; readback round-trip; Bharati) | **SALVAGE** | 750 tests green; library-based Nemeth + hand-rolled reverse readback proof; 175/175 round-trip corpus; pure TS |
| `app/src/transport` (sim/webserial/httppod + shared conformance suite) | **SALVAGE** | implements full pod protocol incl. multi-pod layout; cell count always discovered |
| `tools/virtual-pod` | **SALVAGE** | 309 LOC, zero deps, protocol-complete |
| `app/src/recognise` | **SALVAGE w/ fixes** | verified working in browser (above); fix model shipping + `~` noise; add text OCR |
| `app/src/ui` display machinery (BrailleCell, DisplayStrip, calibration) | **MAYBE** | components reusable; screens embody the rejected product |
| `app/src/learn` + `src/class` (lessons, drills, worksheets, students) | **SCRAP** | exactly what the founder cut; cleanly severable |

## Implications locked for the boardroom

1. The product is a **live teaching surface** (blackboard), not a reading device UI. Teacher-first.
2. Accuracy chain: emitter validated against Nemeth 2022 golden vectors + SRE differential +
   readback round-trip = three independent proofs per expression.
3. Scan must cover **full questions** (words + math): Texo/existing model for formulas +
   Tesseract.js eng+hin for text, teacher-confirm gate on everything.
4. Single-line spatial maths needs a real UX answer (chunked navigation / step-by-step) — this is
   the core product problem no incumbent solves.
5. Hindi lessons = Bharati literary + Nemeth math on one line, explicit context switching.
6. Free-only holds: every component above is Apache/MIT/LGPL/AGPL, self-hosted, no API keys.
