# DECISIONS — Braillix (software)

Append-only. One line each, newest at the bottom of its section. Nothing here is deleted.

---

## D0 · Ground rules taken from the brief

- **D0.1** — `SOFTWARE_TEAM_README` (now `docs/SOFTWARE_TEAM_README.pdf`) is the single ground
  truth for hardware. The two old "Full Project Plan" docs and `VisionMaths` are superseded and
  were not consulted.
- **D0.2** — Owner instruction, 20 Aug 2026, mid-run: *"repo start se banao dont use old one for
  anything at all."* The existing `SHV27/Capstone_braille` scaffold was cloned read-only for
  inspection, then **deleted from the scratchpad before any code was written**. Nothing from it —
  no file, no function, no structure — is reused. `Atishay9828/Capstone_braille` (the team
  hardware repo) was never touched.
- **D0.3** — A `CLAUDE.md` for a *different* project (SUTRADHAR) sits at `~/Downloads/CLAUDE.md`
  and is inherited by this folder. Its **operating discipline** (plan→build→verify, resume
  protocol, evidence over assertion) is honoured; its **project content** (film corpus, verdict
  engine, art direction) is irrelevant here and ignored. A project-local `CLAUDE.md` at this repo
  root takes precedence for Braillix.

## D1 · Scope & delivery calls

- **D1.1** — **Repo root = this folder** (`Capstone Brailix/`). No files moved out from under the
  owner; the handoff PDF was copied into `docs/` and the duplicate at the root removed.
- **D1.2** — **The GitHub repo is created PRIVATE.** Publishing publicly is escalation item 3 in
  the Autonomy Charter, so it is his call, one click, whenever he wants it.
- **D1.3** — Commits happen continuously at every arc boundary, per the brief, not as one dump.

## D2 · Technical calls (from RESEARCH.md)

- **D2.1** — **Maths braille code = Nemeth.** India's NIEPVD maths/science braille code exists but
  has no open machine-readable table; Nemeth is the internationally implemented code and the one
  `speech-rule-engine` emits. The translation layer is a swappable interface so a Bharati maths
  table can drop in later without touching anything above it. Stated honestly in the UI and README.
- **D2.2** — **No backend, no Python.** Both hard parts (LaTeX→Nemeth, and image→LaTeX) were
  proven on this laptop to run in pure JavaScript. A static web app is the strongest possible
  answer to "the software must be complete on its own" and to "teammates must be able to run it".
- **D2.3** — **`speech-rule-engine` pinned to 4.x**, not the `latest` dist-tag (`5.0.0-rc.4`).
  A release candidate does not go into a graded demo.
- **D2.4** — **FormulaNet ONNX weights are downloaded, never committed.** The model is AGPL-3.0;
  our code stays MIT and merely *uses* the model, which the user fetches themselves via
  `npm run fetch:model`. Also keeps the repo under GitHub's 100 MB/file limit. Recorded in
  `THIRD_PARTY.md`. The OCR provider is an interface, so an MIT model can replace it later.
- **D2.5** — **Cell count is never a constant, anywhere.** It is discovered from the connected
  transport at runtime and defaults to a user-set value in simulation. Enforced by a lint rule and
  a Referee test, not by discipline.
- **D2.6** — **Cam bit order is configuration, not code.** The handoff flags dot1→bit0 … dot6→bit5
  as unconfirmed against the physical cam. It is a runtime-editable mapping with a calibration
  screen and an exportable config, so a mismatch is a 10-second fix on demo day instead of a
  re-flash.
- **D2.7** — Optional cloud OCR (Groq free tier, vision) is a *provider*, never a requirement. No
  key = the app behaves identically minus that one provider. No paid tier is ever touched.
- **D2.8** — Student input (photos, answers) stays **on the device**. No upload, no analytics, no
  accounts. This resolves the brief's unspecified "data sensitivity tier" the safe way: the
  product has no server to leak from. Cloud OCR is opt-in, per-image, and says so before sending.

---

# BOARDROOM MINUTES — 20 August 2026

Seated: Product Visionary · Principal Engineer · UX Director · Pedagogy Expert (teacher at a
school for the blind) · The Target User (two voices: *Aarav*, 14, learning algebra by touch; and
*Shaurya*, who has to survive a panel) · The Skeptic · Resource Officer · **Panel Examiner**
(added because for this product the examiner is a real stakeholder, not an abstraction).

## Round 1 — What is this thing actually for?

**Product Visionary:** three things from the brief — type maths and the dots move; a real
learn/practice/feedback app; a photo of handwritten maths that gets read.

**The Skeptic:** those are three *inputs* and one *app*. None of them is an idea. A panel will
see a text box, a file picker and a quiz, and correctly call it three tutorials stitched together.

**Pedagogy Expert:** the Skeptic is right for the wrong reason. The interesting problem was
already handed to you and you're about to walk past it — the school said reading a whole equation
through one cell is very difficult. That is not an inconvenience, that is *the* problem.

**Principal Engineer** (from RESEARCH.md Verdict 5): the literature agrees — students see one
line at a time, navigation is the bottleneck, and they prefer hearing the expression while their
fingers read it. So the constraint is not "too few cells". It is "linearising a tree destroys the
tree."

**Aarav:** when my teacher reads it out she says "the whole thing over 2a". She doesn't spell it
letter by letter. I know where I am because she tells me where I am.

> **Verdict R1:** the product is not a braille *printer*. It is a braille *reader* — an instrument
> for moving through the structure of an expression. Cell count stops being a limitation and
> becomes a viewport.

## Round 2 — Attack the features

**Skeptic → "learn / practice / feedback":** this is where student projects go to die. Three
hardcoded questions and a green tick.
**Pedagogy Expert defends, conditionally:** it survives only if the student *answers in braille*.
If the answer is multiple-choice, you have built a quiz with a braille wallpaper.
**Principal Engineer:** answering in braille is cheap — six-key Perkins entry is F D S J K L on any
keyboard, and back-translation is the same table we already have, run backwards.
→ **Kept, with the condition welded on.**

**Skeptic → OCR:** a 20-million-parameter model, on a phone photo of Indian schoolbook
handwriting, live, in front of examiners. When — not if — it returns garbage, the demo dies.
**UX Director:** then it must never be load-bearing. Recognition lands in an *editable* LaTeX
field, always. And ship known-good sample images in the repo so the demo never depends on the
room's lighting.
**Resource Officer:** and an optional cloud provider for messy handwriting, free tier only, opt-in
per image, off by default.
→ **Kept, demoted from "feature" to "one provider behind an interface".**

**Skeptic → semantic navigation:** over-engineering. You have *one* physical cell.
**UX Director:** invert that. With one cell, character streaming is a 40-step slideshow with no
orientation — the worst demo imaginable. Structural navigation is the only thing that makes one
cell *readable*. It is not over-engineering for one cell; it is the reason one cell can work.
**Panel Examiner:** and it is the only answer you have to "what is novel here?"
→ **Promoted from feature to pillar.**

**Skeptic → the hardware seam:** most likely exactly one cell exists on the 22nd, and it might not
work. Everything you demo is then a lie about a real device.
**Principal Engineer:** so don't demo a claim, demo a *protocol*. Build an emulator that speaks
the real wire format, and write the firmware against the same spec. Then "does integration work?"
is a test that passes on this laptop today, not a hope for Saturday.
→ **Kept and hardened.**

**Skeptic lands its hit for the round:** *the handoff itself says the cam bit order is unconfirmed.*
If dot1 is not bit0 on the physical cam, every single dot pattern is wrong on stage and you will be
debugging a `<<` operator in front of examiners.
**Principal Engineer, conceding:** then bit order is not code. It is a runtime setting with a
calibration screen and an exported config file.
→ **New requirement, born from the Skeptic.**

## Round 3 — Innovation protocol

**First principles.** Strip everything: *a tree must be delivered through a keyhole, over time,
to a finger.* Nothing about braille, motors or cams is in that sentence. So the design space is
"navigating structure through a narrow viewport", which is a solved problem in four other fields.

**Cross-domain raid (3 unrelated domains, named):**
1. **IDE code folding.** A 400-line function collapses to one line with a `⊕`. → **Fold a
   sub-expression into a single cell.** The reader feels *"there is a fraction here"* as one
   character and drills in only if they want to. Braille has an obvious glyph for it: ⠿ (all six
   dots) — the only pattern that means "everything is here".
2. **Split-flap departure boards & e-ink partial refresh.** Mechanical refresh is expensive, so you
   move only the flaps that changed, and you move them the short way round. → **A motion-minimising
   scheduler**: diff the previous frame against the next, command only the cells whose cam number
   changed, and rotate each cam the *shorter way* around the 64-position circle. On a 28BYJ-48 at
   64 steps per position that is the difference between a display that feels alive and one that
   grinds.
3. **Music practice loopers.** Loop the one bar you can't play until it is fluent. → **Drill the
   subtree.** Any node the student is standing on can be looped and practised on its own.

**Forced mashup — fold × motion-minimising:** because navigation only ever changes *part* of the
expression, drilling into a numerator moves the fewest possible motors. The innovation and the
optimisation turn out to be the same mechanism seen from two ends.

## PILLARS (5)

**P1 · THE BRIDGE** — the pure engine: maths → Nemeth → 6-bit dots → cam numbers → a frame for
*N* cells, where *N* is discovered and never assumed. Includes paging and the motion-minimising
scheduler.
*Beat:* a naïve "convert and print" pipeline. *Costs:* a real test suite with golden Nemeth
vectors. *Survived the Skeptic because* every other pillar is worthless if this is wrong, and it
is the only part that can be proven correct rather than demonstrated.

**P2 · THE READER** — explore the expression as a tree: fold/unfold, sibling and depth movement,
breadcrumb orientation ("Fraction ▸ Numerator ▸ cell 3 of 7"), speech and braille always in sync,
driven by keyboard *or* by the pod's Prev/Select/Next buttons.
*Beat:* timed auto-scroll and Next-page paging (both kept as modes, neither as the answer).
*Costs:* the semantic-tree layer. *Survived because* it is the direct answer to the blind school's
actual feedback, and because it is what makes one cell usable at all.

**P3 · THE EYE** — handwritten or printed maths → LaTeX, on-device, offline, in about a second;
result always lands in an editable field with a visible confidence and a one-key "fix it" path.
*Beat:* a Python/PyTorch sidecar (install friction) and a paid API (money + network).
*Costs:* an 80 MB one-time model download. *Survived because* it was proven to run before it was
promised, and because it can fail without taking anything else down.

**P4 · THE PRACTICE LOOP** — learn → practise → feedback, braille-first: lessons that teach the
Nemeth indicators, drills that ask you to *read* a pattern or *write* one in six-key braille, and
feedback that names the exact cell and the exact indicator you missed.
*Beat:* a multiple-choice quiz. *Costs:* content authoring. *Survived because* the Pedagogy seat
refused it in any other form.

**P5 · THE SEAM** — one `Transport` interface; three implementations (Simulator, Web Serial over
USB, Wi-Fi pod per handoff §7); a protocol-accurate virtual pod; ESP32 pod + muscle-cell firmware
written against that same spec; and a live calibration screen for cam bit order and cell ordering.
*Beat:* "we'll wire it up on the day." *Costs:* writing firmware nobody may flash by Saturday.
*Survived because* it converts the owner's second-biggest fear into a passing test.

## THE CUT LIST

| Cut | Why |
|---|---|
| Grade-2 contractions | Nemeth is uncontracted by definition. Zero value, real bug surface. |
| Spatial / 2-D Nemeth (long division, matrices as grids) | The hardware is one row of cells. Linear Nemeth is the correct form. |
| Accounts, cloud sync, leaderboards | No backend by design; nothing to sync; adds privacy risk to a product used by children. |
| Whole-page / PDF OCR | FormulaNet is documented as good at *isolated* formulas and bad at dense pages. Shipping it for pages would be shipping a known failure. |
| A custom TTS engine | The Web Speech API is built into the browser, free, and offline on Windows. |
| Bharati maths braille table | No open machine-readable spec exists (D2.1). Left as a documented pluggable slot rather than half-invented. |
| Online (stroke-based) handwriting recognition | A different research problem from image HMER. No time, and the camera path already covers the requirement. |
| mDNS / auto-discovery of pods | Manual IP plus a saved list is 20 lines; discovery is a week. |
| Native mobile app | The web app is responsive and installable. |
| Teacher dashboard / class management | Nobody in the room could name a user for it on 22 August. |

## THE INNOVATION

Two mechanisms, neither present in any reference found during recon:

1. **Folded maths on a tiny display** — a sub-expression collapses to a single "there is structure
   here" cell (⠿) that the reader can enter or skip, so an expression of any size is navigable on
   any number of cells, down to one. *Ancestry: IDE code folding → maths braille.*
2. **A motion-minimising refresh scheduler** — frame-diffing plus shortest-arc cam rotation, so
   only changed cells move and each moves the short way round a 64-position circle. *Ancestry:
   split-flap departure boards and e-ink partial refresh → stepper-driven braille.*

## THE PRE-MORTEM OBITUARY

> **"Braillix died because on the morning of the 22nd it didn't run."**
> Prevented by: zero backend, zero services, committed lockfile, `npm run verify` as the single
> gate, a Playwright test that walks the whole demo journey headlessly, graceful degradation when
> the OCR model is absent, and `PROGRESS.md` written so a cold session can resume.

> **"Braillix died because the panel saw a quiz app wearing a braille costume."**
> Prevented by: answers entered in six-key braille; the Cell Atlas and protocol spec on screen;
> a visible engine that shows *why* each cell holds what it holds.

> **"Braillix died because the dots were wrong on stage."**
> Prevented by: cam bit order as runtime configuration with a calibration screen and exportable
> config; golden Nemeth test vectors; and an on-screen atlas of all 64 cam positions that the
> hardware team can check against the physical cam *before* Saturday.

## OPEN CALLS MADE ON THE OWNER'S BEHALF

Veto any of these with one word:

1. **Nemeth, not Bharati maths braille**, for the reason in D2.1 — with the swap point built in.
2. **No Python, no server** — the whole product is a static web app (D2.2).
3. **GitHub repo private for now** — going public is his call per the Charter (D1.2).

---

## D3 · Calls made during the build

- **D3.1 (Arc 2)** — **Braillix parses SRE's enriched MathML with its own ~230-line XML reader**
  (`app/src/core/xml.ts`) instead of a DOM library. Measured on this machine: `jsdom` takes **50 s**
  to load and `linkedom` **15 s**, either of which would make `npm run verify` slow enough that
  people stop running it — and a gate nobody runs is not a gate. The input is one library's
  well-formed output, not arbitrary XML, and the reader is itself covered by 25 tests including
  every malformed case. Both dependencies were uninstalled.
- **D3.2 (Arc 2)** — **`toEnriched` returns a string under Node and a live DOM element in a
  browser.** Coercing with `String(value)` produced the literal text `[object Element]`, silently
  disabling structural navigation *only in the browser* — passing every unit test. Now handled in
  one place (`stringifyEnriched`) with its own tests for both shapes. This is the exact class of
  bug the project cannot afford on 22 August.
- **D3.3 (Arc 2)** — **Folding must pay for itself.** A fold costs the reader a step, so it has to
  buy something. `2a` folds to ⠿⠿ — two markers and no information; `a+b` folds to ⠿⠬⠿, no shorter
  than ⠁⠬⠃. The rule is now: fold only if at least one structural cell survives AND the result is
  strictly shorter than the real braille. Otherwise show the true braille and say why on screen.
  Found by testing real expressions, not by reasoning.
- **D3.4 (Arc 2)** — **Playwright always builds and serves fresh** (`reuseExistingServer: false`).
  A reused preview server holding an older `dist` produced a confusing false failure. A slower gate
  that tells the truth beats a fast one that does not.
- **D3.5 (Arc 2)** — **The store is exposed as `window.__braillix`.** Braillix has a class of bug
  that only appears in a real browser (D3.2), and being able to read the engine's actual output on
  the machine that is misbehaving is worth more than an empty global namespace. It exposes no
  secrets and writes nothing.
- **D3.6 (Arc 2)** — The Cell Atlas was pulled forward from Arc 3 into Arc 1. It is cheap, it is
  the artefact the hardware team needs to check cam wiring, and it proves the profile mapping
  visually. Pulling work *earlier* does not violate a frozen acceptance list; adding unplanned work
  would, so this is logged rather than done silently.
- **D3.7 (Arc 2)** — **Operational gotcha, cost us one debugging cycle twice:** this environment's
  Bash heredoc strips backslashes, so a spec file written that way turned `\frac{1}{2a}` into the
  literal text `rac12a` and produced a completely misleading test failure. Any file containing
  LaTeX is written with the Write tool, or uses `String.raw`.
- **D3.8 (Arc 3)** — **`/show` accepts both a full frame and a sparse `updates` list.** The handoff
  specifies the full form; the sparse form was added because a 40-cell display where one cell
  changed should not send 40 numbers. Full is used whenever the display state is not trustworthy —
  a diff against an unknown baseline is a guess. Firmware and emulator implement both.
- **D3.9 (Arc 3)** — **Shortest-arc rotation lives in the CELL firmware**, not the laptop, because
  the cell is the only part of the system that knows where it currently is. The laptop-side
  scheduler computes the same arithmetic to *report* what motion costs. Both copies are noted in
  each other's comments so they cannot silently diverge.
- **D3.10 (Arc 3)** — **USB is the recommended demo transport**, not Wi-Fi. The brief says the room's
  network may not cooperate; Web Serial needs no network at all. Wi-Fi remains fully implemented
  per handoff §7, and the simulator is never second-class.
- **D3.11 (Arc 3)** — The status-strip capability tooltips were anchored to their left edge, which
  pushed the page 61 px sideways at 1440. Anchored to the right and the strip clips on X only.
  Caught by the "no horizontal overflow" assertion in the appearance test, not by looking.
- **D3.12 (Arc 4)** — **Recognition reports a *quality judgement*, not a percentage.** FormulaNet
  emits no calibrated probability, so a "94% confident" badge would be fabricated. Instead the app
  reports observations it can defend: does the output parse as maths (checked by running it through
  the same engine that drives the display), did the decoder start repeating itself (what an
  autoregressive model does when it loses the thread), and how much of the frame the writing filled.
- **D3.13 (Arc 4)** — **The tokenizer is constructed explicitly from its two JSON files** rather
  than via `from_pretrained`. That loader silently hands the constructor `null` when a file does not
  arrive, surfacing as "Tokenizer must be a valid object" with no indication of which file. Ours
  names the missing file and tells the user to run `npm run fetch:model`.
- **D3.14 (Arc 4)** — **Ship the whole `ort-wasm-simd-threaded` family.** Trimming to the plain
  build to save space broke recognition entirely: Transformers.js reaches for the *asyncify* variant
  inside a worker and failed with "no available backend found". Node-only ORT bundles are still
  excluded.
- **D3.15 (Arc 4)** — **Images are decoded through an `<img>` element, not `createImageBitmap`.**
  Chrome refuses SVG blobs in `createImageBitmap`, and Braillix's own sample images are SVG. The
  image element handles SVG, PNG, JPEG and phone output identically.
- **D3.16 (Arc 4)** — Recogniser output is tidied (`\frac { 2 2 } { 7 }` → `\frac{22}{7}`) because
  token-spaced LaTeX reads as broken to a human. The tidy pass is proven meaning-preserving by
  tests that compare the BRAILLE before and after, not the text.
- **D3.17 (Arc 5)** — **Practice answers are marked on the BRAILLE, not on the text.** A student who
  correctly reads ⠹⠁⠌⠃⠼ will write `a/b`; marking that wrong because we wanted `\frac{a}{b}` would
  be marking their LaTeX, not their reading. The typed answer is expanded into several ordinary
  written forms (`a/b`, `sqrt(x)`, `x**2`) and any form producing the expected braille counts.
  Tested by comparing braille, not strings, so a rewrite can never quietly change the meaning.
- **D3.18 (Arc 5)** — **A six-key chord commits on the LAST finger up, not the first.** Nobody lifts
  three fingers simultaneously; committing on first release turns "dots 1-2-5" into three cells. The
  chord accumulates and is written when the hand leaves the keys, and a chord abandoned by a window
  blur is discarded rather than committed later.

## D4 · Certification findings (Arc 6)

- **D4.1** — **The offline test caught a real, demo-killing bug.** speech-rule-engine was still
  fetching `base.json` from **jsDelivr** despite the `json` path being passed to `setupEngine` —
  the path arrived too late, after SRE had already requested it. Fixed with the
  `text/x-sre-config` block in `index.html`, which SRE reads before it initialises. This is exactly
  the failure the brief's primary requirement is about, and only a test that blocks all external
  requests would have found it.
- **D4.2** — Accessibility fixes from the Lighthouse audit, both real: a bare `<div>` carrying an
  `aria-label` (now `role="img"`, which is also the honest semantic for a picture of a braille
  cell), and four contrast failures. `--text-400` went from 3.4:1 to 5.1:1, and amber surfaces
  carrying dark text now use the bright amber (`--signal`) rather than the dim one, which measured
  3.3:1. Result: **accessibility 100, best practices 100**.
- **D4.3** — CLS was **0.21** because the evidence table and reader panel arrive ~700 ms in and
  shove the page down. Space is now reserved for both; CLS is **0.05**.
- **D4.4** — **The screenshots caught a defect no test would have.** The practice reading drill said
  "2 cells are on the display" while the Practice screen showed no display at all. With hardware
  attached the dots are under the student's fingers; with none — the primary mode — there was
  nothing to read. The dock is now a shared component used by every screen that drives the cells.
