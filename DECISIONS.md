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
- **D13.3** — The Wi-Fi pod field opens empty, with `192.168.1.42, 192.168.1.43` as a hint. It used
  to open with one address already filled in, which looks exactly like a pod somebody has set up —
  so the honest first move, pressing Connect, failed against an address that was never real. Two
  addresses in the hint, because that is how a teacher discovers that more than one pod is possible,
  and typing the second is what reveals the choice between chain and mirror.
- **D13.4** — Connect is disabled when nothing is typed. A button that reports a failure the moment
  it is pressed has taught nobody anything.
- **D13.5** — The Device screen shows the cells. `DisplayDock` has said in its own header comment
  since arc 5 that anywhere driving the cells must also show them, and this screen — which changes
  the cell count, raises a test dot and sends frames down a wire — was the one place still ignoring
  it. A teacher pressed "raise dot 3" and got a cam number.
- **D13.6** — Teach mode shows the verdict only when it is not "agrees". A lesson is not a settings
  screen, and the Board is where trust in the translation gets built — but this is the last moment
  before a line goes under a child's fingers, and braille that does not say what the question says
  is the one thing worth interrupting a lesson for. Silent when right, loud when wrong.
- **D13.7** — Both screens ask `useReadback()`; neither computes the verdict itself. Two copies of
  a rule are a fork of its future bugs, and a lesson disagreeing with the Board about whether a
  question is safe would be the worst possible version of that.
- **D13.8** — Pasting several lines into the worksheet field makes several questions. An exercise in
  a textbook is a numbered list, and adding it a question at a time was twelve fields and twelve
  clicks for one evening's homework — while pasting the list made one long question out of the lot
  of it. The numbering is stripped, because Braillix numbers items itself and a braille reader would
  otherwise meet "1. 1." at the top of every question; the pattern requires a space after the
  number, so 1.5 keeps its decimal point.
- **D14.1** — The reader's rules come from a sweep, not from memory. A scratch harness printed the
  Nemeth for every symbol the printer knows and every one it could not read back became a rule:
  ⊂ ⊆ ⊃ ∉ ≈ ≡ ∝ ∴ ∵ ⊥, the punctuation colon, the factorial, the raised dot, a bar over a letter
  or a run, a binomial coefficient, and every capital Greek letter. Guessing a cell would have been
  faster and would have been guessing.
- **D14.2** — `⠰⠆` is "is proportional to" and also the subscript indicator followed by a 2. A subscript
  never follows a space — it attaches to the thing before it — so a space is what tells them apart,
  exactly as it does for a reader.
- **D14.3** — A lone prefix cell is reported, not swallowed. `SINGLES` had `⠈: ''`, which turned
  "approximately equal to" into two bars and said nothing about it. Silence was the bug; the wrong
  reading was only the symptom. Nothing in the reader may map to the empty string.
- **D14.4** — Gurmukhi's addak is translated after all. It is not a letter: it doubles the consonant
  that follows it, which Devanagari writes by actually doubling — ਪੱਕਾ is पक्का. That needs a look
  at the next character, so it lives in `transliterate` rather than in the exceptions table. What
  stays a reported gap is Oriya's ୱ and Gurmukhi's ੲ, which have no equivalent at all.
- **D14.5** — A raised dot and a cross are different symbols and Nemeth writes them differently, so
  the canonical printer stopped calling both of them ×.
- **D14.6** — The "nothing vanished" invariant measures against the LaTeX, not against what was
  typed. `Delta ABC` is Δ ABC — the D of "Delta" was never meant to survive as a letter, and
  demanding that it did made the guard reject a perfectly good line. Two-sided honesty: a guard that
  rejects the true is as broken as one that accepts the false.
- **D14.7** — `bar(x)` and `mean(x)` are input words, because that is how a statistics teacher writes
  the mean, and the braille for it is now something the checker can vouch for.
- **D14.8** — The opening example loads once, not whenever the box is empty. It depended on
  `source`, so Clear put the example straight back and deleting the last character refilled the
  field under the teacher's cursor. A greeting is not a rule about what the box may contain.
- **D14.9** — A fraction's nesting level is a number, not a two-valued kind. Nemeth writes one ⠠ per
  level on all three of a fraction's cells, and the reader knew only about one — so `1/2/3/4/5` came
  out right by luck while reporting nine cells it had no rule for. Found by a hostile pass, not by a
  test that already existed.
- **D15.1** — Sentence punctuation is moved out of a maths run and into the words beside it. This was
  the worst thing the splitter did, and it did it quietly: "the difference is 7." put the full stop
  inside the mathematics, where Nemeth writes a dot after a numeral as the DECIMAL POINT. A child
  read "seven point", the sentence never ended, and every cell was faithful Nemeth for an expression
  nobody had written. It is also what BANA asks for — punctuation after a Nemeth passage belongs to
  the surrounding text, in the literary code, after the terminator. The exclamation mark is left
  alone, because `5!` is a factorial.
- **D15.2** — The punctuation hugs what it follows: no blank cell between the Nemeth terminator and
  the full stop. A mark set off by a space is not a mark.
- **D15.3** — A word that stands for a binary operator cannot be the first token of a line. "In
  triangle ABC" was reaching the display as ∈ △ ABC — the sentence began with "is a member of",
  which is not a thing anybody wrote. The rule is about arity, not about a list of exceptions.
- **D15.4** — `in`, `by` and `to` are decided by their neighbours, never by the word. Each is a
  symbol in one place and English in another, and no amount of staring at the word will say which.
- **D15.5** — A wordless run at the START of a line, with words after it, is a phrase. "A shopkeeper
  bought a pen" was opening with a one-letter island of algebra called A. Only at the start: "Find
  angle C" ends in mathematics, and should.
- **D15.6** — A comma does not end the mathematics. The parser took the mark and stopped, so
  everything past the first comma was appended letter by letter — `triangle ABC, angle A` reached
  the display as △ABC and then the LETTERS a-n-g-l-e.
- **D15.7** — `by` carries the division and `divided` introduces it, not the other way round, so
  "twelve by four" and "twelve divided by four" both come out as one division sign.
- **D15.8** — ऋ and ऌ after a consonant are that consonant's matra, like every other vowel in
  Bharati. Without it वृत्त — the radius of a circle — read back as वऋत्त.
- **D15.9** — The "needs a left operand" rule applies inside a bracket too, and lives in the parser
  as well as the splitter. "(in cm)" was reaching the display as (∈ cm): the bracket opened and the
  very next thing said "is a member of". Two short lists, each with its own test, because the two
  decisions happen at different times.
- **D15.10** — A hyphen between two whole words is a hyphen. "A right-angled triangle has sides"
  was read as algebra because of the dash in the middle of an ordinary English adjective. `a-b`
  keeps its minus, because single letters either side of a dash are a subtraction.
- **D15.11** — A comma is read at the baseline. `30°, 60°` writes the comma straight after the
  degree sign with no baseline indicator, because Nemeth does not need one — punctuation is never
  part of a superscript — and the reader was leaving it up there.
- **D15.12** — Every practice drill is round-tripped too. It is the highest-stakes content in the
  product: a wrong cell on the Board is a teacher's problem for a minute, but a wrong cell in a
  *lesson* is a child taught something false and then marked wrong for getting it right. The lessons
  are generated from the same engine that drives the display and so cannot drift from it — but
  "cannot drift" is a claim about the code, and `lessons.roundtrip.test.ts` is the check. All 34
  items agree.
- **D15.13** — A run of underscores is a blank to be filled in, not three subscript operators. Read
  as mathematics, `2x + ___ = 10` produced no braille at all and put a raw JavaScript error message
  on screen. It is written with the same cell as a dash, which is what the printed line is, and
  `foldLiteral()` records that the two cannot be told apart.
- **D15.14** — Sentence punctuation is moved out of a maths run wherever it appears, but only a full
  stop, a question mark or a danda counts in the MIDDLE of one. A comma between the terms of a
  progression — `a, a+d, a+2d` — belongs to the mathematics, and treating every mark alike cut that
  series into five pieces.
- **D15.15** — ⠐⠂ is the ratio colon only when it is spaced. Unspaced, the same two cells are the
  baseline indicator followed by the digit 1, which is how `Q1` is written — and `Q1. Find the area`
  was reading back as `Q:`.
- **D15.16** — No table in any reader may contain an eight-dot braille character, and a test asserts
  it. The same typo was made twice while adding symbols — a braille character is 0x2800 plus the dot
  MASK, and a mask of 56 is 0x2838, not 0x28c8 — and both times the rule looked right, matched
  nothing, and the symbol went on being reported as a gap. A table that cannot be typed wrongly is
  worth more than one that is merely correct today.

---

## V2 BOARDROOM MINUTES (21 Aug 2026 — full pipeline re-run from VISION-BRIEF-Braillix-v2.md)

### PILLARS (5)
- P1 **The Blackboard.** One screen. The lesson is a living stack of lines (words, maths, worked
  steps); the teacher writes or scans a line and it lands on the cells. Beat "expression editor
  with tabs" because the founder's dream is the lesson, not the expression. Cost: board state
  model + line navigation. Survived the Skeptic by making the line the unit of sync.
- P2 **Effortless input, three ways.** Type like WhatsApp (natural shorthand + palette), scan like
  Google Lens (full question: Hindi/English words + maths), or draw it. Everything passes one
  confirm gate. Beat "modes per input type" via one shared review path.
- P3 **Every dot provably right.** Nemeth 2022 golden vectors + SRE differential + readback
  round-trip; uncertainty is said out loud, never guessed. This is the founder's #1 law.
- P4 **Cells follow the chalk.** Live follow/explore sync; lines→panes→cells paging on the pod's
  own Prev/Select/Next buttons; any cell count discovered at runtime; mirror mode for many pods.
- P5 **Stands alone, teaches itself.** Zero hardware/network/key dependency; 60-second first-run
  taste of success; English + Hindi throughout.

### THE CUT LIST (died in the room)
- Lessons library, practice drills, worksheets, student records, class management (founder order).
- The 5-screen IA — replaced by Board + a device drawer + inline help.
- Grade-2 contractions, languages beyond en/hi, auto full-page layout analysis (v1 scans a
  cropped question), multi-line braille output (hardware is a line), any server/pairing/auth.

### THE INNOVATION (cross-domain ancestry named)
- **Follow-the-chalk:** the teacher's cursor IS the display state — collaborative-editor live
  cursors + karaoke bouncing-ball, applied to braille cells. Student mode flips to explore
  (pager/scrollback ancestry) and back with one button.
- **Lines→panes→cells pager:** terminal `less` applied to a 1-cell display reading a blackboard.

### PRE-MORTEM OBITUARY (top causes of death + the design that prevents each)
1. "Teacher never got past the first screen" → one screen, 60s scripted first-run, WhatsApp-bar.
2. "A wrong dot reached a child's finger in front of the panel" → triple proof + confirm gate +
   observable uncertainty.
3. "Recognition was dead at the demo (again)" → model ships with the build; proven in the real
   browser as a gate; fallback ladder (edit box, palette) always present.
4. "Clock ran out mid-rebuild" → reuse the verified core/transport/virtual-pod (evidence: 750/750
   tests, tsc clean, protocol-complete); rebuild only the product layer.

### CALLS MADE ON THE OWNER'S BEHALF (veto with one word)
- D-V2.1: Salvage core engine, transport, virtual-pod, recognise worker (all verified by own
  audit + live browser test); scrap learn/class and the old screens. Basis: clock + evidence.
- D-V2.2: Math code = pure Nemeth (India's NIEPVD code is Nemeth-derived; UEB math not used in
  India). Bharati Braille for Hindi words; explicit literary/math context switch.
- D-V2.3: Scan stack = existing verified formula model + Tesseract.js eng+hin for words; Texo
  evaluated as an upgrade only if clock allows. ₹ sign: transcriber-defined symbol, logged.
- D-V2.4: Art direction stays "machined instrument" but tuned for a non-technical teacher:
  bigger type, fewer controls visible, everything nameable in one word.
- D-V2.5: No Claude-Code hooks added tonight — single-builder session under a hard clock; a
  misfiring hook blocks all shell work. Enforcement layer = npm run verify + type constraints.
- D-V2.6: CLAUDE.md updated surgically (blackboard product, confirm-gate law, founder cut list);
  seven laws + gates + structure unchanged. Line count stays ~60.
- D-V2.7: Pending-marker/explore-rejoin from ARCHITECTURE simplified: one shared display state
  (that IS the hardware reality); Prev/Next roam the lesson, a new committed line always takes
  the display (the chalk wins), Select speaks. Multi-actor pending markers cut to NOTES.md.
- D-V2.8: Paging backwards enters a line at its LAST pane (continuous reading, like a book);
  proven by pager.test.ts. One paging path (store.page) serves pod buttons, on-screen arrows,
  and PageUp/PageDown.
- D-V2.9: Committed lines are spoken as they land (sayCurrent after translation) — the chalk
  stroke a sighted class hears narrated. Key caps (Enter/PageUp/PageDown) whitelisted as names
  in the Hindi-purity i18n test.
