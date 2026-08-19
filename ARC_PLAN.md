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
