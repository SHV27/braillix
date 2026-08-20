# RESEARCH — Braillix (software half) — 20 August 2026

Recon run before any design or code. Everything marked `[VERIFIED]` was executed on this
machine, not read about. Everything marked `[VOLATILE — 2026-08-20]` can rot and must be
re-checked at the start of any later arc.

---

## Verdicts — the ten findings that changed the design

1. **LaTeX → Nemeth braille works, offline, in pure JavaScript, today.** `temml` (LaTeX→MathML)
   piped into `speech-rule-engine` (MathML→Nemeth, `modality:'braille'`) produced correct Nemeth
   for fractions, radicals, superscripts, summations, limits, trig and matrices on this laptop.
   `[VERIFIED]` — this removes the need for liblouis, for a native DLL, and for Python.
2. **Handwritten-math OCR also works offline in pure JavaScript.** `@huggingface/transformers` v4
   running `alephpi/FormulaNet` (VisionEncoderDecoder ONNX, ~80 MB) executed end-to-end in Node in
   **0.7 s** after a 29 s first-time load. `[VERIFIED]` — this removes the need for a Python/PyTorch
   sidecar, which was the single biggest install-friction risk in the project.
3. **Therefore: no backend at all.** The entire product can be a static web app. `npm install &&
   npm run dev` on any teammate's laptop, works with the Wi-Fi unplugged. This is the strongest
   possible answer to the brief's #1 requirement ("software complete in itself").
4. **The same engine that gives us braille gives us speech and a semantic tree, free.** SRE returns
   MathSpeak (`"StartFraction negative b plus or minus StartRoot…"`) and a full semantic tree with
   stable node IDs via `toJson()` / `toEnriched()`. `[VERIFIED]` — its walker returned
   `Numerator …` / `Denominator 2 a` when I drove it. This is the raw material for the product's
   central idea (see #5).
5. **The literature says the small-display problem is a *navigation* problem, not a *capacity*
   problem.** Published work on braille maths reports that students "can only see one line at a
   time", that positioning the cursor by word/line is the slow part, and — critically — that
   students *prefer* hearing the expression read aloud **while** reading the braille with their
   fingers. Shaurya's own blind-school feedback ("reading a whole expression through one cell is
   very difficult") is the same finding. **Conclusion: don't fight the cell count; navigate the
   expression's structure instead, and always speak what the fingers are touching.**
6. **The 3 nav buttons in the handoff map exactly onto tree navigation.** Prev / Select / Next on
   the pod become sibling-left / drill-in / sibling-right. The hardware Shaurya's team is already
   building is, by accident, the perfect controller for the semantic-navigation idea. No hardware
   change requested.
7. **Web Serial (USB) is a more demo-proof transport than Wi-Fi.** Chrome/Edge 89+ on desktop
   support it; the handoff's HTTP-to-pod design needs a cooperating network, which the brief
   explicitly says may not exist in the room. Support **both**, plus a simulator.
8. **liblouis in JS is a dead end for this project.** `liblouis@0.4.0` (npm, last published 2022)
   ships **no tables** and requires a separate `liblouis-build` asm.js blob; and `nemeth.ctb` is a
   *text* table, not a LaTeX/MathML maths translator — the real liblouis maths path is
   liblouisutdml (C++). `[VERIFIED]` by installing it and inspecting the package.
9. **India has its own maths braille standard, and it is not fully public.** NIEPVD/DEPwD published
   *Standard Bharati Braille Codes* (4 Jan 2025) and separately reviewed an "Advance Braille Code
   for Mathematics and Science", but there is no open machine-readable table for it. Nemeth is the
   internationally implemented, tool-supported maths code and is what SRE emits. **Ship Nemeth,
   name the choice honestly, and design the translation layer so a Bharati maths table can be
   added later without touching anything above it.**
10. **A braille tool that is not itself screen-reader accessible is the criticism that would hurt
    most.** Nothing in the domain is more embarrassing at a panel. Accessibility is a build
    requirement here, not a polish item.

---

## Lane 1 — Domain craft

**How maths braille actually works.** Nemeth Code (Abraham Nemeth, 1952; current edition *The
Nemeth Braille Code for Mathematics and Science Notation 2022*, BANA) is a separate code from
literary braille. Key properties that the software must respect:

- **Dropped numbers.** Digits use the lower part of the cell: `1`→⠂, `2`→⠆, `3`→⠒ … so `2+3=5`
  becomes `⠼⠆⠬⠒⠀⠨⠅⠀⠼⠢`, not the literary `⠼⠃⠲⠉…`.
- **No contractions inside Nemeth.** All words are uncontracted within a Nemeth passage.
- **Indicator cells carry the structure**: superscript ⠘, subscript ⠰, baseline ⠐, fraction
  open/close ⠹…⠼ with ⠌ as the fraction line, radical ⠜…⠻. This is why a fraction is *longer* in
  braille than in print — and why a 1-cell display cannot brute-force it.
- **Linear vs spatial.** Nemeth has a linear form (for refreshable displays) and a 2-D spatial form
  (for embossing). SRE emits the **linear** form — correct for our hardware.

**The competing code.** UEB (Unified English Braille) also has a technical/maths code. The US kept
Nemeth alongside UEB; BANA's own guidance is that neither is superior, they are different. India
uses Bharati Braille for languages, with NIEPVD-developed maths notation.

**The craft conclusion the whole product hangs on:** maths is a *tree*, print shows the tree
spatially in 2-D, and braille is forced to linearise it. A one-cell display linearises it *again*
into time. Every linearisation loses structure. So the software's job is not "stream characters
faster" — it is **to give the structure back**: let the reader move through the expression as a
tree (this fraction → its numerator → its radicand), hear what they are on, and feel it under the
finger. That is the product.

## Lane 2 — Audience

Ranked from the sources in Lane 6 plus the blind-school feedback already in the brief.

**Dealbreakers (get these wrong and it is unusable):**
- Reading a long expression through very few cells with no structure — *stated directly by the
  school Shaurya's team visited*, and confirmed by the literature.
- Having to move hands between the display and a keyboard to navigate — kills reading speed.
- Devices that only handle simple expressions.
- Requiring braille proficiency the student does not yet have (relevant: our users are *learning*).

**Delighters:**
- **Speech + braille together.** Repeatedly reported as preferred practice: hear the equation while
  the fingers read it.
- Being able to *input* maths, not only read it.
- Instant refresh — no waiting for a page to re-emboss.

**Dead weight (do not build):**
- Grade-2 contractions for the maths path — Nemeth is uncontracted by definition. (Grade 2 matters
  only for surrounding prose, which is not this product.)
- Multi-line spatial layouts — our hardware is a single row of cells.

## Lane 3 — GitHub / model raid

| Thing | Verdict |
|---|---|
| [`speech-rule-engine`](https://github.com/speech-rule-engine/speech-rule-engine) `4.1.4` | **Adopt.** Nemeth braille + MathSpeak + semantic tree in one package, Apache-2.0, actively released. The single most valuable dependency in the project. |
| [`temml`](https://github.com/ronkok/Temml) `0.13.4` (MIT) | **Adopt.** LaTeX→MathML, pure JS, no dependencies, last published 31 Jul 2026. Also renders the visual maths for sighted users. |
| [`@huggingface/transformers`](https://github.com/huggingface/transformers.js) `4.2.0` | **Adopt.** Runs ONNX vision-encoder-decoder models in-browser over WASM. |
| [`alephpi/FormulaNet`](https://huggingface.co/alephpi/FormulaNet) (**AGPL-3.0**, 20 M params) | **Adopt as a downloaded asset, never vendored.** ONNX encoder 54 MB + merged decoder 26 MB. Licence noted in `DECISIONS.md` and `THIRD_PARTY.md`. |
| [`giacolees/obsidian-math-convert`](https://github.com/giacolees/obsidian-math-convert) (MIT) | **Study, don't fork.** Its `src/inference.ts` is the reference for FormulaNet preprocessing (grayscale → auto-invert → crop-to-ink → letterbox 384×384 → normalise μ=0.7931 σ=0.1738 → replicate to 3 channels). Credited in `THIRD_PARTY.md`. |
| [`breezedeus/pix2text-mfr`](https://huggingface.co/breezedeus/pix2text-mfr) (MIT) | **Keep as fallback provider.** Processor + tokenizer load in transformers.js `[VERIFIED]`, but the repo ships `decoder_model.onnx`, not the `decoder_model_merged.onnx` that transformers.js requires — would need an ONNX merge step. Not worth it now; MIT licence makes it the preferred long-term swap. |
| `liblouis` npm `0.4.0` | **Reject.** See Verdict 8. |
| MathJax v4 / `mathjax-full` | **Reject as a dependency.** Its braille output is SRE anyway; using SRE directly is far lighter. |

## Lane 4 — Practitioner technique

- The Obsidian plugin author's key practical insight: **bypass `AutoProcessor` entirely.**
  FormulaNet has no `preprocessor_config.json`, so build the `pixel_values` tensor by hand. My probe
  reproduced this and it is the reason the model loads at all. `[VERIFIED]`
- **Auto-invert by histogram** (count pixels < 200 vs ≥ 200, invert if the image is mostly dark) —
  makes phone photos of whiteboards and of paper both work without a user toggle.
- **Crop to ink before letterboxing.** A photo with a lot of margin destroys accuracy; cropping to
  the ink bounding box first is what makes phone photos usable.
- Transformers.js in Vite: `.onnx` must be treated as a **static asset**, not bundled; `.wasm`
  needs `asyncWebAssembly`; run inference in a **Web Worker** to avoid freezing the UI during
  the ~0.7 s decode and the ~30 s first load.

## Lane 5 — Toolchain currency

Adopting exactly one new-to-me technique, per the rule: **a protocol-accurate hardware emulator
("virtual pod") as a first-class dev target.** Justification: the brief's #1 requirement is that
the software be complete without hardware, and its #2 fear is a bad integration seam. An emulator
that speaks the *real* wire protocol makes both testable today, on this laptop, with nothing
plugged in — and turns "does integration work?" into a test rather than a hope.

## Lane 6 — References & footguns

**Footguns identified up-front:**
1. `speech-rule-engine` is CommonJS with **no named ESM exports** — `import { toSpeech }` throws.
   Must `import sre from 'speech-rule-engine'`. `[VERIFIED — hit this]`
2. SRE 4.x has **no `toBraille()`**. Braille comes from `toSpeech()` after
   `setupEngine({locale:'nemeth', modality:'braille'})`. `[VERIFIED — hit this]`
3. `setupEngine` is async and **must** be followed by `await engineReady()` before the first call,
   or locale data may not be loaded.
4. SRE keeps **global engine state**. Speech and braille need different `setupEngine` calls, so a
   naive implementation will race. Serialise access behind one queue.
5. Temml emits a `ParseError` **inside the MathML** rather than throwing for some inputs — must be
   detected by inspecting the output, not by `try/catch` alone. `[VERIFIED — hit this]`
6. Web Serial is **Chrome/Edge desktop only** (89+); Firefox is behind a flag, Safari has none.
   Feature-detect and degrade, never assume.
7. `getUserMedia` and Web Serial both require a **secure context** — `localhost` counts, a bare LAN
   IP does not. Affects how teammates run it.
8. GitHub blocks single files > 100 MB — another reason the ONNX weights are fetched, not committed.

**Nemeth spot-check produced on this machine** `[VERIFIED]`:

| LaTeX | Nemeth |
|---|---|
| `x^2 + 3x + 2 = 0` | `⠭⠘⠆⠐⠬⠒⠭⠬⠆⠀⠨⠅⠀⠼⠴` |
| `\frac{a}{b}` | `⠹⠁⠌⠃⠼` |
| `\sqrt{x+1}` | `⠜⠭⠬⠂⠻` |
| `\frac{-b \pm \sqrt{b^2-4ac}}{2a}` | `⠹⠤⠃⠬⠤⠜⠃⠘⠆⠐⠤⠲⠁⠉⠻⠌⠆⠁⠼` |
| `\sum_{i=1}^{n} i = \frac{n(n+1)}{2}` | `⠐⠨⠠⠎⠩⠊⠀⠨⠅⠀⠼⠂⠣⠝⠻⠊⠀⠨⠅⠀⠹⠝⠷⠝⠬⠂⠾⠌⠆⠼` |

## Lane 7 — Volatile facts

All checked on **2026-08-20** on this laptop unless noted.

| Fact | Value | How checked |
|---|---|---|
| Node | 24.15.0 | `node -v` |
| npm | 11.12.1 | `npm -v` |
| git / gh | 2.47.1 / 2.92.0 (authed as `SHV27`) | `--version`, `gh auth status` |
| Python | 3.13.1 (present, **not needed**) | `python --version` |
| `speech-rule-engine` | 4.1.4 (`latest` dist-tag is `5.0.0-rc.4` — **stay on 4.x**, rc is not for a graded demo) | `npm view` |
| `temml` | 0.13.4 (2026-07-31) | `npm view` |
| `@huggingface/transformers` | 4.2.0 (2026-04-22) | `npm view` |
| `vite` / `react` / `typescript` | 8.2.1 / 19.2.8 / 7.0.2 | `npm view` |
| `vitest` / `playwright` | 4.1.11 / 1.62.1 | `npm view` |
| FormulaNet ONNX | encoder 54,168,533 B; decoder_model_merged 25,946,296 B; **AGPL-3.0**; 1,131 downloads | HF API |
| FormulaNet inference | load 29.2 s (cold, incl. download) → **0.7 s** per formula, CPU/WASM | `probe2.mjs` on this laptop |
| Web Serial | Chrome/Edge 89+ desktop; Firefox Nightly 151 behind flag (Apr 2026); Safari none | MDN + vendor docs |
| Groq free tier (optional OCR fallback) | Llama 4 Scout supports vision, ~30 RPM / 1 000 RPD free; Maverick deprecated 20 Feb 2026 in favour of `openai/gpt-oss-120b` | Groq docs |
| Bit order dot1→bit0 … dot6→bit5 | **Per the handoff — must be confirmed against the physical cam.** Treat as configurable, not hardcoded. | `SOFTWARE_TEAM_README` §3 |

---

## Sources

- [Speech Rule Engine](https://speechruleengine.org/) · [repo](https://github.com/speech-rule-engine/speech-rule-engine) · [npm](https://www.npmjs.com/package/speech-rule-engine)
- [MathJax 4.0 — Accessibility Extensions](https://docs.mathjax.org/en/latest/basic/a11y-extensions.html)
- [Temml](https://www.npmjs.com/package/temml)
- [Transformers.js docs](https://huggingface.co/docs/transformers.js/en/index) · [v4 announcement](https://huggingface.co/blog/transformersjs-v4)
- [alephpi/FormulaNet](https://huggingface.co/alephpi/FormulaNet) · [giacolees/obsidian-math-convert](https://github.com/giacolees/obsidian-math-convert)
- [breezedeus/Pix2Text](https://github.com/breezedeus/Pix2Text) · [breezedeus/pix2text-mfr](https://huggingface.co/breezedeus/pix2text-mfr)
- [BANA — *Nemeth Braille Code for Mathematics and Science Notation 2022*](https://www.brailleauthority.org/sites/default/files/2024-02/Nemeth_2022.pdf) · [BANA — UEB Math/Science vs UEB with Nemeth](https://www.brailleauthority.org/terminology-ueb-mathscience-and-ueb-nemeth)
- [DEPwD — Standard Bharati Braille Codes with Unicode Mapping Chart](https://depwd.gov.in/en/draft-of-standard-bharati-braille-codes-with-unicode-mapping-chart/) · [NIEPVD Braille Development](https://niepvd.nic.in/braille-development/)
- [PeerJ CS — Accessible interactive learning of mathematical expressions for school students with visual disabilities](https://peerj.com/articles/cs-2599/)
- [Paths to Literacy — Braille hand movement and refreshable braille displays](https://www.pathstoliteracy.org/braille-brain-best-practices-braille-hand-movement-and-refreshable-braille-displays/)
- [AFB — Refreshable Braille Displays](https://afb.org/blindness-and-low-vision/using-technology/assistive-technology-products/refreshable-braille)
- [arXiv 2501.07736 — Practice, perception and challenges of BLV students in non-inclusive blind colleges](https://arxiv.org/pdf/2501.07736)
- [MDN — Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API)
- [liblouis](https://liblouis.io/) · [npm `liblouis`](https://www.npmjs.com/package/liblouis)
- [Groq model deprecations](https://console.groq.com/docs/deprecations)

---

# PART TWO — THE CLASSROOM (20 Aug 2026, 17:00)

*Second recon, run before arcs 7–10. Question: what does the person who will actually own this
device — a teacher at an Indian school for the blind — need on a Tuesday morning?*

## Verdicts that changed the design

1. **The teacher very often cannot read braille.** The strongest documented value of a refreshable
   display in exactly our market is that it "allows sighted teachers who might not know Braille to
   create a more inclusive educational experience… convert any text into Braille format and push the
   content into the device". Consequence: every braille surface in Braillix must have a *print*
   counterpart the teacher can read, and the app must never require braille literacy to operate.
   → arc 7 rendered-maths preview; → arc 9 print+braille handout.

2. **The teacher very often cannot read LaTeX either.** Nothing in the research suggests a school
   teacher will type `\frac{1}{2}`. They will type `1/2`. → arc 7 natural input + keypad.

3. **Maths is the documented weak point, and the tools are ancient.** Indian schools teach arithmetic
   on the **Taylor frame** and the **abacus**; surveys report visually-impaired students performing
   worse in mathematics than in arts subjects, and name *"lack of trained teachers in teaching the
   maths subject"* and *"inadequate skilled manpower in operating these devices"* as primary causes.
   The gap Braillix fills is not "a braille display" — it is *maths*, for teachers who were never
   trained in maths braille. → arc 9 self-check + accuracy evidence; → practice lessons are for
   teachers as much as students.

4. **The market shape is already proven, in literacy, by an Indian company.** Thinkerbell Labs'
   Annie (80+ centres, 16 states, 5,000+ students) pairs the device with a companion app that lets
   the teacher **create content, set homework, and see class analytics**, works **offline and
   online**, and speaks **regional languages**. That is the shape a school expects. Annie teaches
   *literacy*; nobody is doing this for *mathematics*. → arc 8 is exactly this shape, for maths.

5. **Price is why this matters.** Commercial refreshable displays run $3,500–$15,000 (₹61k–₹155k
   even at the Indian low end), and "in global south countries like India these items are usually
   too expensive". A one-cell device that a school can afford is only useful if the software makes
   one cell readable — which is what the Reader (arc 2) exists to do.

6. **Bharati Braille has a current, official, Unicode-mapped standard.** DEPwD + NIEPVD published
   *Standard Bharati Braille Codes* on 4 Jan 2025 covering 13 languages and 9 scripts, with a 2.1
   draft dated 4 Jan 2026. The **Devanagari letter table is well documented and stable**, so Hindi
   text braille is buildable and verifiable today. The **mathematics** notation is not available as
   an open machine-readable table (the published PDF is a scanned, subset-font document about
   language codes; NIEPVD's maths notation work is not published in extractable form). D2.1 stands:
   Nemeth for the maths, and now **Bharati for the words around it**, each labelled on screen.
   → arc 7 mixed-code lines.

7. **Word problems are the real classroom artefact.** A Hindi-medium maths textbook is Hindi prose
   with maths inside it. A tool that can only do the maths half cannot carry a textbook question.
   This is the recombination arcs 7–8 are built on, and it is absent from every reference product
   found in either recon pass.

## Sources (part two)

- [Microsoft Accessibility — an Indian company breaking barriers with a refreshable Braille device](https://blogs.microsoft.com/accessibility/an-indian-company-is-breaking-down-the-barriers-in-education-through-their-refreshable-braille-device/)
- [Thinkerbell Labs](https://www.thinkerbelllabs.com/) · [NITI Frontier Tech — reimagining braille education](https://frontiertech.niti.gov.in/story/reimagining-braille-education-a-self-learning-braille-tutor-empowers-visually-impaired-learners-through-ai-and-gamification/)
- [JETIR — survey on common difficulties faced by visually impaired students](https://www.jetir.org/papers/JETIR2010118.pdf) · [Application of abacus and Taylor Frame for learning mathematics](https://archive.conscientiabeam.com/index.php/61/article/view/4462)
- [DEPwD — Standard Bharati Braille Codes with Unicode Mapping Chart](https://depwd.gov.in/en/draft-of-standard-bharati-braille-codes-with-unicode-mapping-chart/) · [liblouis braille-specs — Indian languages](http://liblouis.io/braille-specs/indian-languages/) · [Bharati Braille (Wikipedia)](https://en.wikipedia.org/wiki/Bharati_Braille)
- [AssisTech IIT Delhi — TacRead low-cost refreshable braille display](https://assistech.iitd.ac.in/rbd.php) · [Refreshable braille displays, Indian pricing](https://sakshamlife.in/collections/electronic-braille-display)
