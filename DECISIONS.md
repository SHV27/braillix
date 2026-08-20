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

## D5 · Cuts made on audit (20 Aug 2026, after Arc 6)

An audit of our own documents against the code — the "documented but unbuilt" check — found two
claims that were not behaviours. Both are now resolved rather than left standing.

- **D5.1** — **The cloud recognition provider is CUT.** D2.7 described it as an optional provider;
  it appeared in five documents and existed in the code only as a dead member of a type union,
  which is the quietest kind of lie. It is cut rather than built, because: the on-device path
  already works and is genuinely offline; a network provider would add an API key, a privacy
  surface over children's work, and a dependency on a free tier that visibly moves (our own
  RESEARCH.md records Groq deprecating a vision model in February 2026); and the brief's primary
  requirement is self-sufficiency, which a cloud call pulls against. The design is parked in
  NOTES.md in case it is ever wanted. Braillix now has **no API key anywhere**, which is a simpler
  and stronger promise than "a key handled carefully".
- **D5.2** — **The literal-braille fallback is BUILT**, because that claim was worth keeping.
  ARCHITECTURE.md promised the display would never blank if the maths engine failed; nothing
  implemented it. It is now core/literal.ts, wired in, and tested — including the test that pins
  down that literary digits and Nemeth digits are different, so the fallback can never quietly
  switch braille codes without saying so.

## D6 · Security audit (20 Aug 2026, pre-ship)

Run before calling this shipped. Result: **nothing to rotate, nothing to hide, nothing leaking.**

- **D6.1** — No secret exists anywhere in the project. There is no API key, no token, no account and
  no server. `git grep` for key/secret/password/token patterns returns only the ML *tokenizer* and
  prose. `.env`, `*.key` and `*.pem` are gitignored and none are tracked.
- **D6.2** — The app can make exactly three kinds of network request, and all three are enumerable:
  (a) same-origin fetches of its own model files under `public/models/`, (b) same-origin fetches of
  the SRE locale data under `public/sre/`, and (c) requests to a pod address the user typed in, on
  their own LAN. There is no fourth. `e2e/offline.spec.ts` blocks every external request and asserts
  none is attempted.
- **D6.3** — Zero analytics or telemetry dependencies. The full runtime dependency list is seven
  packages, all of them doing visible work.
- **D6.4** — Student data (photographs, drawings, answers, progress) never leaves the machine.
  Progress lives in one namespaced `localStorage` key with a working erase control; images are
  processed in-page and never uploaded. This is the resolution of the brief's unanswered "data
  sensitivity tier": the safe answer was to build a product with nowhere for the data to go.
- **D6.5** — The two `npm audit` findings (`sharp`, `onnxruntime-node`) are **Node-only optional
  dependencies of `@huggingface/transformers`** and never reach the browser bundle. They are
  externalised in `vite.config.ts` and a unit test fails the build if either is ever imported.

---

## Part two — the classroom (20 Aug 2026)

- **D7.1** — The owner of this product is a **teacher**, not a developer. Every arc-7-to-10 feature is
  judged by one question: can a person who does not read braille, does not write LaTeX, and has not
  been trained on this software do it on their first try? Anything failing that is a defect, not a
  learning curve.
- **D7.2** — LaTeX stays as the internal representation, but stops being an input requirement.
  `core/mathinput.ts` accepts what a maths teacher actually writes (`1/2`, `sqrt(9)`, `x^2`, `<=`,
  `pi`, `45 degrees`) and produces LaTeX. Rejected: building a WYSIWYG equation editor — a week of
  work, and the keypad plus natural text covers the school syllabus.
- **D7.3** — Bharati Braille (Devanagari) is built for the **words**, Nemeth stays for the **maths**,
  and every run of cells is labelled with the code it is written in. Rejected: guessing at an
  unpublished Indian maths code (see RESEARCH part two, verdict 6) — a wrong maths table taught
  confidently is the worst outcome this project could produce.
- **D7.4** — The interface speaks **Hindi and English**, switchable, persisted, with the language
  affecting UI text and speech but never the braille standard in use.
- **D7.5** — Information architecture rebuilt in teacher words: **Board · Practice · Class · Device ·
  Help**. "Read handwriting" was a *technology* tab; photographing maths is an *input method*, so it
  now lives inside the Board. The Cell Atlas is reference material for the hardware team, so it
  lives inside Device.
- **D7.6** — Class data (students, worksheets, records) lives in `localStorage` and moves between
  machines as an exported file. Rejected: any account, server or sync — D6.4 says student data has
  nowhere to go, and that is a feature. A school laptop with no Wi-Fi must be a first-class citizen.
- **D7.7** — Mirror mode is added to the pod transport: several pods, all showing the same cells, for
  a class reading together. The existing chain mode (pods concatenated into one long display) stays.
  The mode is explicit, never inferred.

## Part two, arc 8 — the classroom (20 Aug 2026)

- **D8.1** — Class data (worksheets, students, records) gets its **own store**, next to `src/store.ts`
  rather than inside it. The main store owns *the display and what is on it now*; this owns *what a
  teacher has prepared and what their students have done*. Different lifetimes — a moment versus a
  term — and merging them would put a student's record in the same object as every keystroke.
- **D8.2** — No save button. Every mutation writes through to `localStorage` immediately, because a
  save button is a way to lose a lesson.
- **D8.3** — Sharing is a **file**, and importing **merges** rather than replaces: the common case is
  a teacher carrying one worksheet to another laptop and not wanting to lose the students already on
  it. Same id, newer `updatedAt` wins.
- **D8.4** — An `AttemptRecord` carries a `label` — what was attempted, in words, captured at the
  time. A record is a historical fact and must stay readable after the worksheet it came from has
  been renamed or deleted; looking the text up later would make the past depend on the present.
- **D8.5** — Deleting a student deletes their records. A record naming nobody is a leak, not data.
- **D8.6** — Several pods mean one of two things and Braillix never guesses which: **chain** (one
  long display) or **mirror** (a class reading together). Mirrored, the width is the *smallest* pod
  and wider pods have their spare cells blanked — a frame the small display cannot show would leave
  one child reading a truncated equation with no way to know.
- **D8.7** — A teacher's worksheet is playable as a practice drill through one adapter
  (`learn/worksheet-lesson.ts`). The loop the Class screen exists to close is: written this morning,
  practised this afternoon, recorded against a name.

## Part two, arcs 9 and 10 — trust, and shipping (20 Aug 2026)

- **D9.1** — Accuracy is evidence, not a claim: `src/core/syllabus.ts` holds sixty-nine real
  syllabus lines written the way a teacher writes them, `npm run accuracy` translates all of them
  and writes `docs/ACCURACY.md`. The test runs in the ordinary suite; only the file writing is
  behind a flag, so a normal run never dirties the tree.
- **D9.2** — The self-check does the work rather than reading a flag. It translates known
  expressions and compares the answers, fetches the braille tables from disk, and writes to
  storage. A check that only reports what a setting says is a check that cannot fail when it should.
- **D9.3** — BRF is written by hand (`core/brf.ts`, 40×25, form feeds, Braille ASCII) rather than
  via a library: the table is sixty-four characters, the format is older than the web, and the
  alternative is a dependency we would have to verify anyway.
- **D10.1** — The service worker is generated by a twenty-line Vite plugin in `vite.config.ts`
  rather than by `vite-plugin-pwa`. The whole behaviour is one precache list and one fetch rule,
  both of which we would have had to understand regardless.
- **D10.2** — `caches.match` uses `ignoreVary: true`. A static host sends `Vary: Origin`; module
  scripts are fetched in CORS mode and therefore send an Origin header that the precache fetch did
  not — so index.html came back from the cache and the script beside it did not. Cost an hour;
  the reason is written next to the fix.
- **D10.3** — The public build leaves out the handwriting model (77 MB) and the ONNX runtime
  (74 MB), because they are useless without each other and a school's connection should not be
  asked to carry a feature that cannot run. Recognition reports itself unavailable, with the
  command that enables it. The local build is unchanged.
- **D10.4** — Whether the model is installed is answered by `public/models/status.json`, written by
  `npm install` and rewritten by `npm run fetch:model`, rather than by asking for the model's own
  config and reading a 404. Both answer the question; only one of them logs a console error on
  every load of a build that will never have the model.
- **D10.5** — Font subsets are pinned to latin and devanagari. Fontsource's defaults pull in
  Cyrillic, Greek and Vietnamese — fifty files nobody in this product will read, every one of which
  would be precached for offline use. IBM Plex Sans Devanagari is added because a bilingual
  interface that borrows whatever font the machine happens to have is bilingual by accident.
- **D10.6** — Published at braillix.vercel.app with Shaurya's explicit go-ahead (Charter escalation
  3, granted 20 Aug). The deploy token was given in chat, used from the shell, and written to no
  file — Braillix itself still has no secret of any kind.
- **D7.9** — Halant placement: the published Bharati prose describes the virama as a *prefix* before
  a consonant cluster (क्लिक → ⠈⠅⠇⠊⠅); liblouis's NIEPVD-maintained table maps it in place
  (⠅⠈⠇⠊⠅). Braillix follows **liblouis**, because it is the table driving Indian braille production
  today and because in-place round-trips. One line to change if a school tells us otherwise.
- **D9.4** — When the recogniser is not confident it takes a **second reading** of the same image
  with the greys pushed apart, and shows both. Agreement between two preprocessings is evidence of
  a kind the model cannot give about itself; disagreement is a question for the teacher rather than
  something to hide. Deliberately *not* claimed as an accuracy improvement: all six shipped samples
  are read confidently first time, so the second pass never fires on them, and measuring the gain
  needs genuinely hard photographs (NOTES.md).
- **D9.5** — Lesson items carry a **source**, not LaTeX, and drills translate through the same
  `core/mixed.ts` the Board uses. Without this a worksheet item with Hindi words in it became a
  broken drill — the words were fed to a maths parser that could only throw them away. One pipeline
  from typing to cells, wherever the typing happened.
- **D9.6** — `interpretAnswer` now offers the Board's own reading of what the student typed as one
  more candidate. Marking accepts any candidate that produces the expected braille, so a student is
  never marked wrong for writing their answer the way the app taught them to write the question.
- **D10.7** — Lists are keyed by position, not by their own text. `((((` produces four identical
  complaints, and two identical messages are two real messages. Found by typing rubbish at the real
  thing; now asserted by a test that fails on a single console warning.
- **D10.8** — Long text wraps; wide *mathematics* scrolls inside its own box. A teacher pasting a
  question out of a textbook is not an attack, and 1,762 pixels of horizontal overflow is not a
  layout. Asserted at all three widths with the content that caused it.
- **D10.9** — Teach mode traps focus and returns it. A dialog that lets Tab walk into the page
  behind it is useless to the one person who most needs it to be a dialog.
- **D10.10** — The self-check returns keys, not sentences, like `learn/feedback.ts`. The English
  wall it used to put in front of a Hindi-reading teacher was in the sentences that explain what is
  wrong — precisely the part that has to be understood.
- **D10.11** — The Device screen is a teacher's screen first. Cam wiring, the test dot and the wire
  protocol sit behind one press labelled "Setting up the hardware": needed once, by whoever
  assembled the display, and never again. Offered, not hidden — and a test keeps those two apart.
- **D11.1** — Bharati Braille is implemented for **all nine Indian scripts**, not just Devanagari,
  through one transliteration step: the Unicode Indic blocks are laid out in parallel, so the same
  offset is the same letter, and Bharati's founding purpose is that the same letter is the same
  cell. Nine scripts cost one small file and no second table.
- **D11.2** — Where the parallel lands on a Devanagari code point the braille table does not know —
  Bengali's khanda ta, Gurmukhi's addak, Malayalam's chillu letters — the character is **reported**,
  not rendered as its neighbour. A gap is visible; a wrong letter is not. And it is reported as the
  teacher typed it, not as the Devanagari our arithmetic turned it into.
- **D11.3** — ऩ, ऱ and ऴ get explicit entries (liblouis 5-1345, 5-1235, 5-12356). NFC keeps them
  whole rather than as consonant-plus-nukta, so the nukta rule never sees them — and they are
  Tamil's ன, ற and ழ, which is most of what makes Tamil Tamil.
- **D11.4** — The maths parser is no longer run over a line that contains words. It was, for the
  print preview, and it complained about every letter of every word: a perfectly good Bengali
  question arrived under sixteen warnings. A question's issues come from its segments.
- **D12.1** — The translation is verified by reading it back, not by trusting it. A second engine
  parses the Nemeth cells with its own grammar and says what they mean; agreement with the input is
  the evidence. It shares no code with the forward path, because agreement between one engine and
  itself proves nothing.
- **D12.2** — Three verdicts, not two. `unchecked` fires whenever the reader meets a cell it has no
  rule for or the printer meets a LaTeX command it does not know. Collapsing that into "agrees"
  would turn a hole in the checker into a guarantee about the braille — the exact inversion this
  whole mechanism exists to prevent.
- **D12.3** — The verdict is shown to the teacher, not just to the test suite. Nearly every teacher
  who will use Braillix cannot read braille; without this panel they are asked to trust the most
  important output in the product. On a mixed line it says "the maths matches", not "matches what
  you typed", because only the maths was checked.
- **D12.4** — The maths parser no longer treats a lone spaced `x` between two *numbers* as the only
  cross. Any two operands qualify, which is what makes `1/2 x b x h` the area of a triangle rather
  than four variables. `y = m x + c` still keeps its x, because `+` is not an operand.
- **D12.5** — `/` takes as its numerator everything since the last explicit multiplication sign, not
  everything since the start of the product. `3/4 x 2/5` is two fractions multiplied; `2x/3` is
  still one fraction. Juxtaposition is not an explicit sign, so `n(n+1)/2` is unchanged.
- **D12.6** — `lim` binds the whole product that follows it; the trigonometric functions bind only
  the next factor. `lim_{x to 0} sin x / x` is the limit of the quotient — reading it the other way
  gives 0/x, which is a different and false statement.
- **D12.7** — A short list of English words is never mathematics whatever surrounds it, and a short
  list of unit abbreviations always is. Both lists were written from failures, not from imagination,
  and both exclude every word that IS mathematics in an Indian classroom — "in" is membership, "by"
  is division, "into" is multiplication.
- **D12.8** — The underscore counts as a mathematics character in the splitter. A subscript is not
  a word, and treating `S_n` as one cost the expression its subject.
- **D12.9** — Where the Unicode Indic parallel genuinely breaks — Gurmukhi's tippi, Bengali's khanda
  ta, Malayalam's chillu letters — an explicit table maps the character to what it actually *is*
  (a nasal, a consonant plus halant). Gurmukhi's addak stays a reported gap, because no honest
  single equivalent exists, and a plausible guess is worse than a visible hole.
- **D12.10** — Every syllabus line declares whether it contains words. A line of pure mathematics
  that arrives at the display in more than one piece is now a test failure, not a surprise.
- **D12.11** — There are three back-readers, one per braille code on a line: Nemeth, Bharati and
  Grade-1 English. The verdict covers the whole question or it is not a verdict. `checkSegment()` is
  the one entry point, and it decides which reader runs the same way `mixed.ts` decided which writer
  ran — so the two decisions cannot drift apart.
- **D12.12** — Bharati Braille genuinely cannot express some distinctions: ॅ and ॆ share a cell, so
  do ऽ and ँ, so do ऋ and ऱ, and a matra is written as the whole vowel so को and कओ are the same two
  cells. `fold()` in `bharatiback.ts` collapses exactly those and nothing else, and is applied to
  both sides. It is the written-down statement of what the code loses — not a convenience, and the
  place to look first if a verdict ever seems too generous.
- **D12.13** — A Bharati reading always comes back as Devanagari, whatever script was typed. The
  cells carry no trace of the script — that is the whole point of Bharati — so the comparison is
  against the transliterated source. A Telugu question reading back as Devanagari is the system
  working, not a bug.
- **D12.14** — Inside a word, ⠼ is the letter ण; at the start of one it opens a number. There is no
  other way to read गणित (⠛⠼⠊⠞), and it is the one place the reader uses position to settle a letter.
- **D12.15** — A change of script ends a segment. Two adjacent word-tokens are only merged when
  they are in the same braille code, because "Ravi के पास 5 सेब" is Grade-1 for the Latin and Bharati
  for the Hindi — and merging them sent the whole run to the Bharati translator, which dropped every
  Latin letter. Half a question, gone, with no warning. Found by the 300-character overflow test,
  which is the second time a pathological input has exposed an ordinary-classroom bug.
- **D12.16** — The evidence table reads each cell in the code that cell is actually written in.
  It used to reach for the Nemeth table whatever was on the display, so every cell of a Hindi
  question was annotated as mathematics — ⠛ described as "letter g" when it means ग, ⠼ as "numeric
  indicator" when it means ण. `MixedLine.codes` carries one code per cell from the translator that
  knows, and the count line names the codes present ("31 cells · Bharati + Nemeth") instead of
  asserting Nemeth.
- **D12.17** — Where a single cell means two things, the table shows both (`ओ / ो`, `ण · number
  sign`). Bharati is a six-dot code carrying a script with more distinctions than sixty-four, so
  the ambiguity is real; picking one reading and printing it as fact would teach something false
  half the time.
- **D13.1** — A new version announces itself and waits to be asked. The offline copy is what makes
  Braillix survive a school's Wi-Fi, and it is also what can stop a fix from arriving: a service
  worker serves the page it already has, so the visit after a release still shows the old build.
  Found by deploying and looking — the live site served the previous day's app to a returning
  browser, silently. A strip at the top of the screen and one button; never an automatic reload,
  because somebody may be half way through typing a question in front of a class.
- **D13.2** — The notice watches `navigator.serviceWorker.ready`, not `getRegistration()`. On a
  first visit the component mounts before registration finishes, `getRegistration()` resolves with
  nothing, and the watcher is never attached — so the first update of that session goes unannounced.
  Caught in the browser, not by a test; the test came after.
