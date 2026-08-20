# Braillix — the demo

A seven-minute run, in order, with what to say. Every step works with **nothing plugged in**; the
hardware steps are additions, not requirements.

## Before you start (2 minutes, the night before)

```bash
npm install          # once
npm run fetch:model  # once, 76 MB, only if you want the handwriting demo
npm run verify       # proves the whole thing still passes — takes about 3 minutes
npm run dev          # leave this running
```

Open it in **Chrome or Edge** (Web Serial and the camera need one of those). Check the status strip
along the bottom: every badge should be green except *Wi-Fi pod*, which is honest — no pod is
connected yet.

> If the Wi-Fi is hostile and you want the hardware part anyway, use **USB**, not Wi-Fi. That is
> what the USB transport is for.

---

## 1 · One cell, a whole equation (2 min) — the heart of it

The app opens on **Read**, with a quadratic already loaded and the display set to **one cell** —
which is what the hardware team will actually have built.

> "This is the display we have: one cell. One braille character at a time. Here is the equation
> x² + 3x + 2 = 0 in Nemeth, the braille code mathematics is actually written in — note the digits
> are *dropped* into the bottom of the cell, which is what makes maths braille different from
> ordinary braille."

Point at **The braille** panel: fifteen cells, each with its dots and the cam position that would
go down the I2C bus.

> "Fifteen cells through one window. When we took the prototype to the blind school, they told us
> reading a whole expression this way is very difficult. They were right — and that is not a
> hardware problem you can solve by adding cells."

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

**Turn on speech.** Switch the voice to **हिन्दी**.

> "Both offline, both free. The research on braille maths is unambiguous: readers want to hear the
> expression while their fingers read it."

---

## 2 · Any number of cells (30 sec)

Drag the **Cells** slider: 1 → 4 → 12.

> "There is no cell count written anywhere in this codebase. It comes from whatever hardware is
> connected, and a test fails the build if anyone hardcodes one. When the team stacks more cells,
> nothing is rewritten."

Point at the status strip.

> "That readout is the refresh scheduler. Only the cells that changed are moved, and each cam takes
> the shorter way round its 64 positions. On a 28BYJ-48 at 64 half-steps per position, that is the
> difference between a display that feels alive and one that grinds."

---

## 3 · A photograph becomes dots (1 min)

**Read handwriting** → pick the **Fraction** sample → **Read this image**.

> "This is a vision model running *in this browser*, on this laptop, with the Wi-Fi off. Nothing is
> uploaded. About a second."

It returns `\frac{22}{7}`.

> "And it lands in an editable box, with a quality judgement — not a made-up confidence percentage,
> because the model does not produce one. It says whether the result parses as valid maths and
> whether the model started repeating itself. Nothing reaches the display until I press the button.
> A recogniser that commits its own output will one day teach a child the wrong equation."

Press **Read this on the display →**.

*(If you have a camera and good light, use **Choose a photo** instead. The samples exist so the demo
never depends on the room.)*

---

## 4 · It teaches braille, braille-first (1 min)

**Practice** → lesson 1 is already open → switch to **Write the braille**.

Type the chord for the numeric indicator: hold **S J K L** together, release. Then **D**.

> "That is Perkins six-key entry, on an ordinary keyboard. The student answers by *writing braille*,
> not by picking from a list."

Press **Check my answer**. Then deliberately get one wrong.

> "And the feedback names the cell and the dot: 'you raised dot 4; you wrote ⠛, the letter g, it
> should be ⠓, the letter h.' Not 'incorrect'."

---

## 5 · The hardware seam (1–2 min) — the part that survives the panel's questions

**Hardware.**

> "The laptop is the brain, the pod relays, the cell goes to a cam position. The pod never sees
> braille — only numbers 0 to 63. That is what lets the maths change without reflashing a board."

**If you have the pod**: Connect over USB. The cell count appears *from the hardware*.

**If you do not** — in another terminal:

```bash
npm run pod
```

then connect to `127.0.0.1:8080`.

> "That is an emulator speaking the real wire protocol. It is how we tested the integration before
> any hardware existed — and the app cannot tell the difference."

Now the answer to the obvious question. Press **dot 1** in Calibration.

> "The hardware handoff flags one thing as unconfirmed: whether dot 1 really drives cam track 0. If
> the physical cell raises the wrong dot, I change it here" — change the dropdown, show the cam
> number move — "and export the config. Ten seconds, no firmware change. That is not a bug I want
> to be debugging in front of you."

Finish on **Cell atlas**.

> "All 64 cam positions, their dots, and what each means in Nemeth. It prints on one sheet, and the
> hardware team holds it against the physical cam."

---

## 6 · If they ask "how do you know it is right?" (30 sec)

```bash
npm run verify
```

> "278 unit tests and 62 browser tests. The braille is checked against the published Nemeth code —
> every letter, every digit, and ten full expressions. There are tests that fail the build if
> anyone hardcodes a cell count or does hardware bit arithmetic outside the one file allowed to.
> And there is a test that blocks every external network request and walks the whole product — it
> caught a real bug where the maths engine was quietly fetching part of itself from a CDN, which
> would have died in a room with no Wi-Fi."

---

## Questions you should expect, and the honest answers

**"Why Nemeth and not the Indian code?"**
India's NIEPVD maths and science braille code exists, but there is no open machine-readable table
for it. Nemeth is the internationally implemented code and the one our engine emits. The
translation layer is an interface, so a Bharati maths table drops in without touching anything
above it. It is written down in `DECISIONS.md` as a decision, not an oversight.

**"What if the recognition is wrong?"**
It often will be, on bad handwriting. That is why it never commits — the result is a suggestion in
an editable box with a quality note. The rest of the product does not depend on it at all.

**"What happens if the hardware is not ready?"**
Nothing changes. Everything you have just seen ran with no hardware attached. That was the
requirement from day one, not a fallback.

**"Is it accessible to blind users itself?"**
Lighthouse accessibility 100. Full keyboard operation, ARIA live regions on every state change,
WCAG AA contrast, and `prefers-reduced-motion` honoured — all asserted by tests, not claimed.

**"How much did it cost to run?"**
Nothing. No server, no API key, no paid service anywhere.
