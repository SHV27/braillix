# Braillix — the demo

Nine minutes, in order, with what to say. Every step works with **nothing plugged in and no
network**; the hardware steps are additions, not requirements.

The through-line, if you only remember one sentence: **this is not a braille display, it is the
maths lesson around one.**

## Before you start (2 minutes, the night before)

```bash
npm install          # once
npm run fetch:model  # once, 76 MB, only if you want the handwriting demo
npm run verify       # proves the whole thing still passes — about 7 minutes
npm run dev          # leave this running
```

Open it in **Chrome or Edge** (Web Serial and the camera need one of those). Then open
**Help → Is everything working?** and press it. Eight green lamps means the machine in front of you
is ready; anything else tells you what to fix, in words.

The live one is at **https://braillix.vercel.app** — same app, minus the handwriting model, and it
installs. Keep the local one for the demo: it has the model.

> If the Wi-Fi is hostile and you want the hardware part anyway, use **USB**, not Wi-Fi. That is
> what the USB transport is for.

---

## 1 · A teacher writes a question (1 min)

The app opens on the **Board**, with a quadratic already loaded and the display set to **one cell**
— which is what the hardware team will actually have built.

On a machine that has never run Braillix there is a **"New here? Sixty seconds"** panel with three
things to press. Press the first one and let it do the talking:

> "That is the whole onboarding. Three things a teacher can press, each of which does what it says.
> No tour, no arrows, no 'next'. It disappears when they dismiss it and never comes back."

*(To get it back for a rehearsal: open the console and run
`localStorage.removeItem('braillix.firstrun.done')`, then reload. Or just skip it — the panel says
"I know it already".)*

Clear the box and type, slowly, in front of them: `2/3 + 1/6`

> "That is how a maths teacher writes. Not `\frac{2}{3}`. The person who will own this device is a
> teacher at a school for the blind — not a programmer, often not a braille reader either. If the
> box demands LaTeX, the product has failed before the braille is reached."

Point at **How it reads in print** as the fraction appears.

> "That is the check they can actually make. They read neither LaTeX nor braille — so we show them
> the maths, in print, from the same parse that drives the dots."

Press a few keypad keys — `√`, `x²`, `π`.

> "Every symbol a school syllabus needs, labelled with what it makes rather than what it emits."

---

## 2 · One cell, a whole equation (2 min) — the heart of it

Click the **Quadratic** example, and point at **The braille**: fifteen cells, each with its dots,
what it means in Nemeth, and the cam position that would go down the I2C bus.

> "x² + 3x + 2 = 0 in Nemeth, the braille code mathematics is actually written in — the digits are
> *dropped* into the bottom of the cell, which is what makes maths braille different from ordinary
> braille. Fifteen cells through one window. When we took the prototype to the blind school they
> told us reading a whole expression this way is very difficult. They were right — and that is not
> a hardware problem you can solve by adding cells."

**Now switch to `Explore structure`.**

> "Mathematics is a tree. Print draws it in two dimensions, braille flattens it to one, and a
> single cell flattens it again into time. So instead of streaming characters, Braillix lets you
> walk the structure."

Click the **Quadratic formula** example. It collapses to **five cells**: `⠹ ⠿ ⠌ ⠿ ⠼`.

> "Nineteen cells became five. Open-fraction, *something*, over, *something*, close-fraction — with
> the real Nemeth indicators, not an approximation. The two ⠿ cells are parts I can step into."

Press **↓ In**, then **→ Next**. Watch the breadcrumb: *Fraction ▸ Numerator*, then *Denominator*.

> "It always tells me where I am. And each part is re-translated in its own right — the denominator
> 2a picks up its numeric indicator because, read alone, it starts a new number."

**Turn on speech.** Switch the whole interface to **हिन्दी** in the masthead.

> "The entire interface, the lessons, and the speech — one control. The braille does not change:
> Nemeth is Nemeth in every language, and a language switch that quietly changed the braille code
> would be the most dangerous feature in this product."

The **Spoken** line shows the transcript either way — so even on a laptop with no Hindi voice
installed, you can point at *एक्स वर्ग धन 1* and show that the Hindi maths engine is real.

> **To actually HEAR Hindi on Windows** (do this the night before, two minutes):
> Settings → Time & language → Language & region → **Add a language** → search **हिन्दी / Hindi** →
> Next → tick **Text-to-speech** → Install. Then restart the browser.

---

## 3 · Words and mathematics on one line (1 min) — the part nobody else does

Click the **A question in Hindi** example: `दो संख्याओं का योग 12 है`

> "This is what a maths textbook in a Hindi-medium school actually looks like: Hindi with maths
> inside it. And the two halves are written in *different braille codes* — Bharati for the words,
> Nemeth for the number. A tool that can only do the maths half cannot carry a single question from
> a real classroom."

Point at the three chips under the box.

> "Braillix cuts the line and shows you its guess, with the code each part will be written in. It
> is a guess — 'sum' is both an operator and an English noun — so it is never hidden: one click
> flips any part. And in the braille you can see where the code changes: ⠸⠩ opens the mathematics
> and ⠸⠱ closes it, which is exactly what a braille reader is taught to expect."

**Then type the same word in another script.** `গণিত`, and watch the chip say বাংলা.

> "Bharati Braille was built in the 1950s to unify the Indian scripts, and it means it: क and ক and
> ಗಣಿತ's ಕ are the same cell. A blind child in Kolkata and a blind child in Chennai read the same
> dots; only the print differs. So this is all nine scripts — Devanagari, Bengali, Gurmukhi,
> Gujarati, Oriya, Tamil, Telugu, Kannada, Malayalam — from one table. And where a script has a
> letter the others do not, it says so rather than rendering something near it."

---

## The one to slow down for: **What the dots say**

Scroll to the panel under the print preview and put a finger on it.

> "Here is the thing I would most want a head teacher to see. Almost nobody teaching maths at a
> school for the blind reads braille — they are maths teachers. So when a row of dots appears, they
> have no way to tell a correct cell from a plausible one, and every tool in this space asks them to
> take that on trust.
>
> This panel does not. The dots on the display go to a **second engine that reads braille** — it has
> never seen what was typed, it does not know the LaTeX, it shares no code with the translator. All
> it does is say what a braille reader would say those dots mean. And then we put the two side by
> side."

Type `(-b +- sqrt(b^2 - 4ac))/(2a)` and let them read `(-b±√(b^(2)-4ac))/(2a)` off the panel.

> "There are three verdicts, not two. Agrees, differs, and **cannot be checked** — that third one
> fires whenever the checker meets something it does not know, because a hole in the checker must
> never look like a clean bill of health."

Then type `\binom{n}{k}` to show it happening.

Then the Hindi question again.

> "And it is not just the maths. There is a reader for every braille code on the line — Nemeth for
> the mathematics, Bharati for the words, Grade-1 for English. The whole question is checked, or it
> is not a verdict."

**If they ask what happens when a lesson is running:** open Teach mode and say nothing about it.
The verdict is silent there — a lesson is not a settings screen — and it speaks up only when the
dots cannot be vouched for, in the last moment before a line goes under a child's fingers.

**If somebody asks whether this ever caught anything:** yes, on the first run, in code that had
passed every gate we had. `25% of 80` was reaching the display as *o times f* — an English word read
as two variables. `1/2 x b x h`, the area of a triangle, was arriving as four variables with no
multiplication in it anywhere. Both are in `ARC_PLAN.md` under Arc 11, with five more.

---

## 4 · Any number of cells (30 sec)

Drag the **Cells** slider: 1 → 4 → 12.

> "There is no cell count written anywhere in this codebase. It comes from whatever hardware is
> connected, and a test fails the build if anyone hardcodes one. When the team stacks more cells,
> nothing is rewritten."

Point at the status strip.

> "That readout is the refresh scheduler. Only the cells that changed are moved, and each cam takes
> the shorter way round its 64 positions. On a 28BYJ-48 at 64 half-steps per position, that is the
> difference between a display that feels alive and one that grinds."

---

## 5 · A photograph becomes dots (1 min)

**Board → Photograph it** → pick the **Fraction** sample → **Read this image**.

> "A vision model running *in this browser*, on this laptop, with the Wi-Fi off. Nothing is
> uploaded. About a second."

It returns `\frac{22}{7}`, and the print preview underneath shows it as a fraction.

> "It lands in an editable box with a quality judgement — not a made-up confidence percentage,
> because the model does not produce one. It says whether the result parses as valid maths and
> whether the model started repeating itself. And the teacher checks it *in print*, which is the
> only check they can make. Nothing reaches the display until they press the button."

If the model is *not* confident, Braillix reads the image a second time with the greys pushed
apart, and shows both readings.

> "That is a second opinion, not a retry hoping for a better answer. Two readings of the same
> handwriting through different preprocessing that agree is evidence of a kind the model cannot
> give about itself — and two that disagree is a question for the teacher rather than something to
> hide. It only happens on the images that deserve it."

> **All six samples read correctly** — measured, not assumed, by `e2e/samples.spec.ts`:
>
> | Sample | Reads as |
> |---|---|
> | Quadratic | `x^{2} + 3 x + 2 = 0` |
> | Fraction | `\frac{22}{7}` |
> | Square root | `\sqrt{144} = 12` |
> | Pythagoras | `a^{2} + b^{2} = c^{2}` |
> | Summation | `\sum_{i = 1}^{n} i` |
> | Handwritten | `x^{2} + 5 x = 6` |

---

## 6 · The classroom (2 min) — what makes it a product

Press **Add to worksheet** on the Board, then go to **Class**.

> "That question is now in Tuesday's list. The teacher wrote it once, checked it once, and keeps
> it. Tomorrow it is one button, not retyping."

Add one or two more, then press **Teach this worksheet**.

> "This is the forty minutes the whole thing exists for. One question at a time, arrow keys, and
> each one goes onto the display under the children's fingers. Nothing else on the screen — a
> lesson is not a settings screen."

Escape out. **Students** → add a name → choose them at the display. **Practice** → answer one
question → back to **Class → Records**.

> "Their answer is against their name. Choose nobody and nothing is recorded, and the practice
> screen says so rather than quietly filing it under no one. There is no account and no server —
> a worksheet moves to another laptop as a file, which is a synchronisation protocol that works in
> a room with no Wi-Fi and needs no password."

Show **Print this worksheet** and **Save for an embosser (BRF)**.

> "Print above, braille below, a line to answer on — for the sighted teacher. And a `.brf` file,
> which is what an embosser has understood since the 1970s, if the school has one."

---

## 7 · The hardware seam (1–2 min) — the part that survives the panel's questions

**Device.**

> "The laptop is the brain, the pod relays, the cell goes to a cam position. The pod never sees
> braille — only numbers 0 to 63. That is what lets the maths change without reflashing a board."

**If you have the pod**: Connect over USB. The cell count appears *from the hardware*.

**If you do not** — in another terminal:

```bash
npm run pod          # and, for the mirror demo, a second one:
node tools/virtual-pod/virtual-pod.mjs --port 8081 --cells 3 --pod 1
```

then connect to `127.0.0.1:8080` — or to both, with **All showing the same** selected.

> "That is an emulator speaking the real wire protocol; the app cannot tell the difference. And
> with more than one pod it asks a question rather than guessing: are these one long display, or a
> class reading together? Mirrored, every child gets the same expression under their own fingers —
> at the width of the smallest display, so nobody is left reading a truncated equation."

Now the answer to the obvious question. Open **Setting up the hardware** and press **dot 1**.

> "Notice that was behind one press. A teacher opening this screen sees what is plugged in and how
> to plug something in. Cam bit order is needed once, by whoever assembled the display, and never
> again — so it is one press away rather than in front of them."


> "The hardware handoff flags one thing as unconfirmed: whether dot 1 really drives cam track 0. If
> the physical cell raises the wrong dot, I change it here" — change the dropdown, show the cam
> number move — "and export the config. Ten seconds, no firmware change. That is not a bug I want
> to be debugging in front of you."

Finish on **Cell atlas**.

> "All 64 cam positions, their dots, and what each means in Nemeth. It prints on one sheet, and the
> hardware team holds it against the physical cam."

---

## 8 · "How do you know it is right?" (1 min)

**Help → Is everything working? → Run the check.**

> "That is not reading a setting. It translates one half and compares the answer with ⠹⠂⠌⠆⠼ — five
> cells anyone with the published table can check. It translates a quadratic, because superscripts
> and the return to the baseline are where a broken build would show. It writes गणित in Bharati. It
> fetches the braille tables from this machine, which is the check that matters in a school hall.
> Eight rows, and a fix next to anything that is not right."

Then open [`docs/ACCURACY.md`](ACCURACY.md).

> "Sixty-nine lines of real syllabus — class 1 arithmetic to class 12 calculus, plus word problems
> in both languages — written the way a teacher writes them, with the braille each one produces.
> Regenerated by `npm run accuracy`. Check any row against a published Nemeth table; that is what
> it is there for."

And if they want the build itself:

```bash
npm run verify
```

> "Five hundred unit tests and a hundred and ten browser tests. There are tests that fail the build
> if anyone hardcodes a cell count, or leaves a sentence untranslated in one language, or does
> hardware bit arithmetic outside the one file allowed to. And there is a test that switches the
> network off entirely and reloads the app — it opens, from the copy on the machine."

---

## 9 · It installs (30 sec)

In Chrome, on the live URL, there is an install button in the address bar.

> "Opened once, it works forever with the network off — the app, the fonts and the Nemeth tables
> are all on the machine. A school laptop that has never met the internet is a first-class citizen
> here, not an edge case."

---

## Questions you should expect, and the honest answers

**"Why Nemeth and not the Indian code?"**
India's NIEPVD maths and science notation exists, but there is no open machine-readable table for
it — the *Standard Bharati Braille Codes* published in January 2025 covers the language scripts,
which is why we could implement Bharati for the Hindi words but not for the mathematics. Nemeth is
the internationally implemented code and the one our engine emits. The translation layer is an
interface, so a Bharati maths table drops in without touching anything above it. Written down in
`DECISIONS.md` as a decision, not an oversight.

**"What if the recognition is wrong?"**
It often will be, on bad handwriting. That is why it never commits — the result is a suggestion in
an editable box, shown in print, with a quality note. The rest of the product does not depend on it
at all.

**"What happens if the hardware is not ready?"**
Nothing changes. Everything you have just seen ran with no hardware attached. That was the
requirement from day one, not a fallback.

**"Is it accessible to blind users itself?"**
Lighthouse accessibility 100. Full keyboard operation, ARIA live regions on every state change,
WCAG AA contrast, labels that contain the visible text so voice control works, and
`prefers-reduced-motion` honoured — all asserted by tests, not claimed.

**"Where does the student data go?"**
Nowhere. There is no account, no server and no API key in the product. Records live in this
browser, on this laptop, with a working erase control, and travel as a file the teacher holds.

**"How much did it cost to run?"**
Nothing. No server, no API key, no paid service anywhere.
